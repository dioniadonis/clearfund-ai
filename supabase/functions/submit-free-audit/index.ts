import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { serviceClientConfig } from "../_shared/util.ts";
import { computeResults, optionLabel, type Answers, type Results } from "../_shared/freeAuditScoring.ts";

// Server is the source of truth for consent wording (same approved text as the audit intake).
const FORM_VERSION = "free-audit-v1-placeholders";
const TERMS_TEXT = "I agree to the [Audit Terms of Service] and [Privacy Policy].";
const PHONE_TEXT =
  "I agree that [LEGAL NAME] (ClearFund) may contact me at the phone number I provided, including by automated calls, AI voice assistant, prerecorded messages and text messages, about my automation audit, related services, and business funding options. Consent is not a condition of purchase. Message frequency varies. Msg & data rates may apply. Reply STOP to opt out, HELP for help. See our [Privacy Policy].";

const MODEL = "openai/gpt-6-astra";
const PRE_EVENTS = ["audit_started", "step_viewed", "step_completed", "step_back"];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const s = (max: number) => z.string().trim().max(max);
const arr = z.array(s(80)).max(12);
const Schema = z.object({
  first_name: s(80).min(1),
  business_name: s(160).min(2),
  email: s(255).email(),
  phone: s(30).optional().nullable(),
  answers: z.object({
    industry: s(80), team_size: s(20), years_in_business: s(20),
    drains: arr, admin_hours: z.number().min(0).max(80),
    lead_sources: arr, response_time: s(20), follow_up: s(20), missed_calls: z.number().min(0).max(50),
    monthly_leads: z.number().min(0).max(500), avg_customer_value: z.number().min(50).max(25000), close_rate: s(5),
    current_tools: arr, main_goal: s(20),
  }).strict(),
  terms_accepted: z.literal(true),
  phone_consent: z.boolean(),
  events: z.array(z.object({ event_name: s(40), step_id: s(40).optional().nullable(), at: z.number() })).max(200).optional(),
  page_url: s(500).optional().nullable(), referrer: s(500).optional().nullable(),
  utm_source: s(120).optional().nullable(), utm_medium: s(120).optional().nullable(), utm_campaign: s(120).optional().nullable(),
  company_website: z.string().max(200).optional().nullable(),
  elapsed_ms: z.number().int().min(0).max(86400000),
});

const hits = new Map<string, number[]>();
function throttled(ip: string, limit = 5, windowMs = 600000) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((x) => now - x < windowMs);
  list.push(now);
  hits.set(ip, list);
  return list.length > limit;
}

function token() {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
}

const SYSTEM = `You are a business operations analyst for ClearFundAI. You review how small and mid-sized businesses run day to day, and you identify which of their manual tasks could be handled by AI and automation instead.

You will receive a business owner's audit answers and a set of pre-calculated figures. Write the personalized analysis that goes on their results page.

Rules:
- Never calculate, estimate, restate, or alter any number. All figures are provided to you and are final. Refer to them only as given.
- Write to the owner directly, second person, plain spoken. No corporate filler, no hype, no exclamation points.
- Be concrete and specific to their industry and their stated answers. "Your intake process" beats "your operations." If they said they are a dental practice that misses 8 calls a week, talk about missed patient calls, not "lead capture inefficiencies."
- Never promise results, guarantee revenue, or imply approval for financing. Say "could", "typically", "often" — not "will."
- Give no financial, legal, tax, or investment advice. You describe operational opportunities only.
- If their answers suggest they are already well automated, say so honestly rather than manufacturing problems. Credibility is worth more than an upsell.
- No jargon the owner would not use themselves. If you would not say it out loud to a contractor in a truck, do not write it.

Return only valid JSON matching the requested schema.`;

const usd = (n: number) => "$" + n.toLocaleString("en-US");

function userPrompt(a: Answers, r: Results) {
  const list = (x?: string[]) => (x && x.length ? x.join(", ") : "none selected");
  return `BUSINESS PROFILE
Industry: ${a.industry}
Team size: ${a.team_size}
Years in business: ${a.years_in_business}
Main goal this year: ${optionLabel("main_goal", a.main_goal ?? "")}
Current tools: ${list(a.current_tools)}

HOW THEY OPERATE
Time drains they selected: ${list(a.drains)}
Hours per week on repetitive work: ${a.admin_hours}
Lead sources: ${list(a.lead_sources)}
Speed of first response to a new lead: ${optionLabel("response_time", a.response_time ?? "")}
What happens to leads that do not buy right away: ${optionLabel("follow_up", a.follow_up ?? "")}
Unanswered calls per week: ${a.missed_calls}
Monthly leads: ${a.monthly_leads}
Typical customer value: ${usd(a.avg_customer_value ?? 0)}
Close rate: ${optionLabel("close_rate", a.close_rate ?? "")} out of 10

PRE-CALCULATED RESULTS — USE THESE EXACTLY, DO NOT RECALCULATE
Automation Score: ${r.score} out of 100 (${r.score_label})
Total estimated monthly opportunity: ${usd(r.total_monthly_impact)}
Top opportunities, in order:
${r.opportunities.map((o) => `- ${o.opportunity_id}, ${o.title}, ${usd(o.monthly_impact)}, ${o.impact_label}, ${usd(o.investment_range_low)}, ${usd(o.investment_range_high)}`).join("\n")}

Write their personalized analysis.`;
}

const OUT_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["headline_summary", "score_explanation", "opportunities", "today_vs_automated", "funding_context", "closing_note"],
  properties: {
    headline_summary: { type: "string" },
    score_explanation: { type: "string" },
    opportunities: { type: "array", items: { type: "object", additionalProperties: false,
      required: ["opportunity_id", "personalized_problem", "personalized_fix", "first_step"],
      properties: { opportunity_id: { type: "string" }, personalized_problem: { type: "string" }, personalized_fix: { type: "string" }, first_step: { type: "string" } } } },
    today_vs_automated: { type: "object", additionalProperties: false, required: ["today", "automated"],
      properties: { today: { type: "array", items: { type: "string" } }, automated: { type: "array", items: { type: "string" } } } },
    funding_context: { type: "string" },
    closing_note: { type: "string" },
  },
};

type AiResult = { ok: true; parsed: unknown; raw: string } | { ok: false; reason: string; raw: string | null; retryable: boolean };

async function callAi(a: Answers, r: Results): Promise<AiResult> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return { ok: false, reason: "no_api_key", raw: null, retryable: false };
  const ctrl = new AbortController();
  // Spec's 20s timeout is applied as "20s with no progress" so a streaming answer isn't thrown away mid-write; hard cap 60s.
  let timer = setTimeout(() => ctrl.abort(), 20000);
  const hard = setTimeout(() => ctrl.abort(), 60000);
  let raw = "";
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST", signal: ctrl.signal,
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: MODEL, stream: true, store: false,
        reasoning: { effort: "low" },
        instructions: SYSTEM,
        input: userPrompt(a, r),
        text: { format: { type: "json_schema", name: "audit_analysis", strict: true, schema: OUT_SCHEMA } },
      }),
    });
    if (!res.ok || !res.body) {
      const t = await res.text().catch(() => "");
      return { ok: false, reason: `http_${res.status}`, raw: t.slice(0, 2000), retryable: res.status === 429 || res.status >= 500 };
    }
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buf = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      clearTimeout(timer); timer = setTimeout(() => ctrl.abort(), 20000);
      buf += value;
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const d = line.slice(5).trim();
        if (!d || d === "[DONE]") continue;
        try {
          const ev = JSON.parse(d);
          if (ev.type === "response.output_text.delta") raw += ev.delta ?? "";
          if (ev.type === "error" || ev.type === "response.failed") return { ok: false, reason: "stream_error", raw: d.slice(0, 2000), retryable: false };
        } catch { /* ignore partial */ }
      }
    }
    try { return { ok: true, parsed: JSON.parse(raw), raw }; }
    catch { return { ok: false, reason: "malformed_json", raw, retryable: true }; }
  } catch (e) {
    return { ok: false, reason: ctrl.signal.aborted ? "timeout" : `error:${(e as Error).message}`, raw: raw || null, retryable: false };
  } finally { clearTimeout(timer); clearTimeout(hard); }
}

// Keep only well-formed fields, and only opportunity ids we actually computed.
function sanitize(p: unknown, r: Results) {
  const x = p as Record<string, any>;
  const str = (v: unknown, max = 1200) => (typeof v === "string" ? v.slice(0, max) : "");
  const ids = new Set(r.opportunities.map((o) => o.opportunity_id));
  const list = (v: unknown) => (Array.isArray(v) ? v.filter((s) => typeof s === "string").slice(0, 6).map((s) => s.slice(0, 160)) : []);
  const out = {
    headline_summary: str(x?.headline_summary), score_explanation: str(x?.score_explanation),
    opportunities: (Array.isArray(x?.opportunities) ? x.opportunities : [])
      .filter((o: any) => ids.has(o?.opportunity_id))
      .map((o: any) => ({ opportunity_id: o.opportunity_id, personalized_problem: str(o.personalized_problem), personalized_fix: str(o.personalized_fix), first_step: str(o.first_step, 300) })),
    today_vs_automated: { today: list(x?.today_vs_automated?.today), automated: list(x?.today_vs_automated?.automated) },
    funding_context: str(x?.funding_context, 600), closing_note: str(x?.closing_note, 400),
  };
  if (!out.headline_summary || !out.opportunities.length) return null;
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: unknown;
  try { body = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return json({ error: "invalid_request", details: parsed.error.flatten().fieldErrors }, 400);
  const b = parsed.data;

  if (b.company_website?.trim()) return json({ error: "rejected" }, 400);
  if (b.elapsed_ms < 5000) return json({ error: "too_fast" }, 400);
  const phone = b.phone?.trim() || null;
  if (b.phone_consent && !phone) return json({ error: "phone_required_for_phone_consent" }, 400);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("cf-connecting-ip") ?? null;
  if (throttled(ip ?? "unknown")) return json({ error: "rate_limited" }, 429);

  const { url, key } = serviceClientConfig();
  const db = createClient(url, key, { auth: { persistSession: false } });

  const answers = b.answers as Answers;
  const results = computeResults(answers);
  const share = token();
  const utm = { utm_source: b.utm_source ?? null, utm_medium: b.utm_medium ?? null, utm_campaign: b.utm_campaign ?? null };

  const { data: row, error } = await db.from("free_audits").insert({
    share_token: share, first_name: b.first_name, business_name: b.business_name, email: b.email, phone,
    phone_contact_allowed: b.phone_consent, answers, results, form_version: FORM_VERSION,
    referrer: b.referrer ?? null, landing_page: b.page_url ?? null, ...utm,
  }).select("id").single();
  if (error || !row) { console.error("free audit insert failed:", error?.message); return json({ error: "save_failed" }, 500); }

  const common = { audit_id: row.id, form_version: FORM_VERSION, ip, page_url: b.page_url ?? null, phone_entered: phone };
  const consents = await db.from("free_audit_consents").insert([
    { ...common, consent_type: "audit_terms_privacy", displayed_text: TERMS_TEXT, checked: true },
    { ...common, consent_type: "phone_contact", displayed_text: PHONE_TEXT, checked: b.phone_consent },
  ]);
  if (consents.error) {
    console.error("free audit consent failed:", consents.error.message);
    await db.from("free_audits").delete().eq("id", row.id); // never keep an audit without its consent record
    return json({ error: "save_failed" }, 500);
  }

  const events = (b.events ?? []).filter((e) => PRE_EVENTS.includes(e.event_name)).map((e) => ({
    audit_id: row.id, event_name: e.event_name, step_id: e.step_id ?? null,
    occurred_at: new Date(Math.min(e.at, Date.now())).toISOString(), ...utm,
  }));
  events.push({ audit_id: row.id, event_name: "contact_submitted", step_id: "contact", occurred_at: new Date().toISOString(), ...utm });
  await db.from("free_audit_events").insert(events);

  // AI writes the words; numbers are already final. Retry once only for transient/malformed.
  let ai = await callAi(answers, results);
  if (!ai.ok && ai.retryable) { await new Promise((r) => setTimeout(r, 800)); ai = await callAi(answers, results); }
  const clean = ai.ok ? sanitize(ai.parsed, results) : null;
  if (clean) {
    await db.from("free_audits").update({ ai_analysis: clean, ai_raw: ai.raw, ai_status: "ok" }).eq("id", row.id);
  } else {
    const reason = ai.ok ? "invalid_shape" : ai.reason;
    console.error("ai_analysis_failed:", reason);
    await db.from("free_audits").update({ ai_raw: ai.raw, ai_status: "fallback" }).eq("id", row.id);
    await db.from("free_audit_events").insert({ audit_id: row.id, event_name: "ai_analysis_failed", metadata: { reason }, ...utm });
  }

  return json({ ok: true, token: share });
});

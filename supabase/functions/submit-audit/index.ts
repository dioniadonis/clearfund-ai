import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { serviceClientConfig } from "../_shared/util.ts";

// Server is the source of truth for consent wording. Bracketed placeholders are
// intentional and must be replaced with approved legal identity/documents before publishing.
const FORM_VERSION = "audit-intake-v1-placeholders";
const TERMS_TEXT = "I agree to the [Audit Terms of Service] and [Privacy Policy].";
const PHONE_TEXT =
  "I agree that [LEGAL NAME] (ClearFund) may contact me at the phone number I provided, including by automated calls, AI voice assistant, prerecorded messages and text messages, about my automation audit, related services, and business funding options. Consent is not a condition of purchase. Message frequency varies. Msg & data rates may apply. Reply STOP to opt out, HELP for help. See our [Privacy Policy].";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const t = (max: number) => z.string().trim().max(max).optional().nullable();

const Schema = z.object({
  full_name: z.string().trim().min(2).max(120),
  business_name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(30).optional().nullable(),
  answers: z.object({
    business_model: t(1000), industry: t(80), tools_software: t(1000), crm: t(200),
    lead_sources: t(1000), customer_journey: t(1500), sales_workflow: t(1500),
    communication_channels: t(500), repetitive_admin_work: t(1500), bottlenecks: t(1500),
    desired_improvements: t(1500), known_costs: t(1000), growth_capital_constraints: t(1000),
    insurance_claim_revenue_share: t(40), carrier_pay_delay: t(40),
  }),
  terms_accepted: z.literal(true),
  phone_consent: z.boolean(),
  page_url: z.string().trim().max(500).optional().nullable(),
  utm_source: t(120), utm_medium: t(120), utm_campaign: t(120), referrer: t(500),
  company_website: z.string().max(200).optional().nullable(), // honeypot
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

function refCode() {
  const b = new Uint8Array(5);
  crypto.getRandomValues(b);
  return "AUD-" + Array.from(b).map((x) => x.toString(36).padStart(2, "0")).join("").slice(0, 8).toUpperCase();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let raw: unknown;
  try { raw = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }

  const parsed = Schema.safeParse(raw);
  if (!parsed.success) return json({ error: "invalid_request", details: parsed.error.flatten().fieldErrors }, 400);
  const b = parsed.data;

  if (b.company_website?.trim()) return json({ error: "rejected" }, 400);
  if (b.elapsed_ms < 3000) return json({ error: "too_fast" }, 400);
  const phone = b.phone?.trim() || null;
  if (b.phone_consent && !phone) return json({ error: "phone_required_for_phone_consent" }, 400);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("cf-connecting-ip") ?? null;
  if (throttled(ip ?? "unknown")) return json({ error: "rate_limited" }, 429);

  const { url, key } = serviceClientConfig();
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const ref = refCode();
  const { data: row, error } = await supabase.from("audit_requests").insert({
    ref_code: ref,
    full_name: b.full_name,
    business_name: b.business_name,
    email: b.email,
    phone,
    answers: b.answers,
    phone_contact_allowed: b.phone_consent,
    form_version: FORM_VERSION,
    utm_source: b.utm_source ?? null, utm_medium: b.utm_medium ?? null, utm_campaign: b.utm_campaign ?? null,
    referrer: b.referrer ?? null, landing_page: b.page_url ?? null,
  }).select("id").single();

  if (error || !row) {
    console.error("audit insert failed:", error?.message);
    return json({ error: "save_failed" }, 500);
  }

  const common = { request_id: row.id, form_version: FORM_VERSION, ip, page_url: b.page_url ?? null, phone_entered: phone };
  const consents = await supabase.from("audit_consents").insert([
    { ...common, consent_type: "audit_terms_privacy", displayed_text: TERMS_TEXT, checked: true },
    { ...common, consent_type: "phone_contact", displayed_text: PHONE_TEXT, checked: b.phone_consent },
  ]);
  const ev = await supabase.from("audit_events").insert({ request_id: row.id, event_type: "submitted", description: "Intake submitted" });

  if (consents.error || ev.error) {
    console.error("audit consent/event failed:", consents.error?.message, ev.error?.message);
    // Never keep an intake without its consent record.
    await supabase.from("audit_events").delete().eq("request_id", row.id);
    await supabase.from("audit_consents").delete().eq("request_id", row.id);
    await supabase.from("audit_requests").delete().eq("id", row.id);
    return json({ error: "save_failed" }, 500);
  }

  return json({ ok: true, ref_code: ref });
});

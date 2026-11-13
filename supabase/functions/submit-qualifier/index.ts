import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { APP_PUBLIC_URL, newToken, phoneKey, serviceClientConfig, sha256Hex } from "../_shared/util.ts";
import { AMOUNT, BLOCKED_STATES, CREDIT, MONTHS, REVENUE, route, type Product } from "../_shared/fundingRoute.ts";
import { VA_CONSENT_VERSION, VA_MERCHANT_CONSENT } from "../_shared/vaProgram.ts";

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const keys = <T extends object>(o: T) => Object.keys(o) as [string, ...string[]];
const STATES = "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" ");
export const QUALIFIER_CONSENT_TEXT = "I understand ClearFund AI is a broker, not a lender, and may share my information with funding providers to find a fit. ClearFund AI may receive compensation for referrals.";

const Schema = z.object({
  months: z.enum(keys(MONTHS)), revenue: z.enum(keys(REVENUE)), credit: z.enum(keys(CREDIT)),
  state: z.string().trim().toUpperCase().refine((s) => STATES.includes(s)), amount: z.enum(keys(AMOUNT)),
  use_of_funds: z.string().trim().min(2).max(120), business_checking: z.boolean(),
  full_name: z.string().trim().min(2).max(120), business_name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(255), phone: z.string().trim().min(7).max(30),
  broker_acknowledged: z.literal(true), cta: z.string().trim().max(60).optional().nullable(),
  src: z.string().trim().regex(/^[a-z0-9_-]{1,60}$/).optional().nullable(),
  company_website: z.string().max(200).optional().nullable(), elapsed_ms: z.number().int().min(0).max(86400000),
  agent_code: z.string().trim().regex(/^CF[A-Z0-9]{8}$/).optional().nullable(),
  va_code: z.string().trim().regex(/^VA[A-Z0-9]{8}$/).optional().nullable(),
  current_positions: z.number().int().min(0).max(100).optional().nullable(),
  current_payment: z.number().min(0).max(100000000).optional().nullable(),
  industry: z.string().trim().min(2).max(120).optional().nullable(),
});

const hits = new Map<string, number[]>();
const throttled = (ip: string) => { const n = Date.now(); const l = (hits.get(ip) ?? []).filter((t) => n - t < 600000); l.push(n); hits.set(ip, l); return l.length > 5; };
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

async function sendResumeEmail(to: string, business: string, resumeUrl: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY"); const from = Deno.env.get("APPLICATION_FROM_EMAIL");
  if (!apiKey || !from) return { ok: false, reason: "email_provider_not_connected" };
  const res = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({
    from, to: [to], subject: "Your private ClearFund application link",
    html: `<p>Hello ${escapeHtml(business)},</p><p>Use your private link to finish your signed application and required documents:</p><p><a href="${resumeUrl}">Continue your secure application</a></p><p>This link is only for your business. Do not forward it.</p>`,
  }) });
  if (!res.ok) return { ok: false, reason: `email_send_failed_${res.status}` };
  return { ok: true, reason: null };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  let raw: unknown; try { raw = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const parsed = Schema.safeParse(raw);
  if (!parsed.success) return json({ error: "invalid_input" }, 400);
  const a = parsed.data;
  if (a.company_website || a.elapsed_ms < 3000) return json({ next: "review" });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (throttled(ip)) return json({ error: "rate_limited" }, 429);

  const { url, key } = serviceClientConfig();
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data: products, error: pe } = await db.from("funder_products").select("*").eq("active", true);
  if (pe) return json({ error: "server_error" }, 500);
  const answers = { months: a.months, revenue: a.revenue, credit: a.credit, state: a.state, amount: a.amount, use_of_funds: a.use_of_funds, business_checking: a.business_checking } as Parameters<typeof route>[0];
  const r = route(answers, (products ?? []) as Product[]);

  if (a.va_code) {
    const { data: va } = await db.from("agents").select("user_id,referral_code").eq("referral_code", a.va_code).eq("program_type", "va").eq("active", true).maybeSingle();
    const { data: unlocked } = await db.rpc("va_link_valid", { _code: a.va_code });
    const { data: settings } = await db.from("va_settings").select("*").eq("singleton", true).single();
    if (!va || !unlocked || !settings) return json({ error: "va_link_unavailable" }, 403);
    if (a.current_positions == null || a.current_payment == null || !a.industry) return json({ error: "invalid_input" }, 400);

    const since = new Date(Date.now() - 90 * 86400000).toISOString();
    const companyKey = (await db.rpc("crm_norm_company", { _t: a.business_name })).data as string | null;
    const [byEmail, byPhone, byCompany] = await Promise.all([
      db.from("crm_leads").select("id,firm,contact_name,email,phone,company_key,created_at,va_code,stage").ilike("email", a.email).gte("created_at", since),
      db.from("crm_leads").select("id,firm,contact_name,email,phone,company_key,created_at,va_code,stage").ilike("phone", `%${phoneKey(a.phone)}`).gte("created_at", since),
      companyKey ? db.from("crm_leads").select("id,firm,contact_name,email,phone,company_key,created_at,va_code,stage").eq("company_key", companyKey).gte("created_at", since) : Promise.resolve({ data: [] }),
    ]);
    const duplicates = [...(byEmail.data ?? []), ...(byPhone.data ?? []), ...(byCompany.data ?? [])];
    const duplicate = duplicates.sort((x, y) => x.created_at.localeCompare(y.created_at))[0];
    if (duplicate && duplicate.va_code !== a.va_code) {
      await db.from("crm_activities").insert({ lead_id: duplicate.id, type: "note", body: "Duplicate VA merchant submission recorded; first valid submission retained." });
      return json({ next: "duplicate" });
    }

    let leadId = duplicate?.id as string | undefined;
    if (!leadId) {
      const ins = await db.rpc("crm_insert_lead", { _lead: { email: a.email, firm: a.business_name, contact_name: a.full_name, phone: a.phone, state: a.state, lead_type: "va_merchant" }, _found_by: "va_call", _source_id: null, _mode: "fill" });
      leadId = (ins.data as { id?: string } | null)?.id;
      if (ins.error || !leadId) return json({ error: "save_failed" }, 500);
    }
    const revLo = REVENUE[a.revenue][0];
    const pass = MONTHS[a.months] >= settings.min_months && revLo >= Number(settings.min_monthly_deposits)
      && (!settings.require_business_bank || a.business_checking) && !BLOCKED_STATES.includes(a.state)
      && !(settings.blocked_states ?? []).includes(a.state)
      && (settings.max_current_positions == null || a.current_positions <= settings.max_current_positions)
      && !(settings.excluded_industries ?? []).some((x: string) => x.toLowerCase() === a.industry!.toLowerCase());
    const qualifier = { ...answers, current_positions: a.current_positions, current_payment: a.current_payment, industry: a.industry, cta: a.cta ?? null, consent: { text: VA_MERCHANT_CONSENT, version: VA_CONSENT_VERSION, at: new Date().toISOString(), ip } };
    const { error: updateError } = await db.from("crm_leads").update({
      qualifier, routed_product_id: r.product?.id ?? null, route_next: r.next, route_reasons: r.evaluations, routed_at: new Date().toISOString(),
      va_code: a.va_code, assigned_to: va.user_id, va_auto_passed: pass, source: "va_call", lead_type: "va_merchant",
      stage: pass ? "Qualified" : "Not yet, follow up later.",
    }).eq("id", leadId);
    if (updateError) return json({ error: "save_failed" }, 500);
    await db.from("va_consents").insert({ lead_id: leadId, consent_type: "merchant_contact_and_share", displayed_text: VA_MERCHANT_CONSENT, version: VA_CONSENT_VERSION, ip });
    await db.from("crm_activities").insert({ lead_id: leadId, type: "note", body: pass ? "VA merchant passed automatic rules" : "VA merchant did not pass automatic rules" });
    if (!pass) return json({ next: "not_yet" });

    const token = newToken();
    const resumeUrl = `${APP_PUBLIC_URL}/merchant-resume?token=${token}`;
    const { error: tokenError } = await db.from("va_resume_tokens").insert({ lead_id: leadId, token_hash: await sha256Hex(token), expires_at: new Date(Date.now() + 30 * 86400000).toISOString() });
    if (tokenError) return json({ error: "resume_failed" }, 500);
    const sent = await sendResumeEmail(a.email, a.business_name, resumeUrl);
    return json({ next: "va_documents", resume_url: resumeUrl, email_sent: sent.ok, email_reason: sent.reason });
  }

  const ins = await db.rpc("crm_insert_lead", { _lead: { email: a.email, firm: a.business_name, contact_name: a.full_name, phone: a.phone, state: a.state, lead_type: "borrower" }, _found_by: "qualifier", _source_id: null, _mode: "fill" });
  const leadId = (ins.data as { id?: string } | null)?.id;
  if (ins.error || !leadId) return json({ error: "save_failed" }, 500);
  const { data: cur } = await db.from("crm_leads").select("stage, lead_type").eq("id", leadId).single();
  const early = ["New", "Contacted", "Replied"].includes(cur?.stage ?? "");
  const stage = r.next === "state_blocked" ? (early ? "Lost" : cur?.stage) : (early ? "Interested" : cur?.stage);
  const qualifier = { ...answers, cta: a.cta ?? null, consent: { text: QUALIFIER_CONSENT_TEXT, version: "qualifier-v1", at: new Date().toISOString() } };
  let agentId: string | null = null;
  if (a.agent_code) {
    const { data: agent } = await db.from("agents").select("user_id").eq("referral_code", a.agent_code.toUpperCase()).eq("active", true).eq("program_type", "agent").maybeSingle();
    agentId = agent?.user_id ?? null;
  }
  const { error: ue } = await db.from("crm_leads").update({
    qualifier, routed_product_id: r.product?.id ?? null, route_next: r.next, routed_at: new Date().toISOString(),
    route_reasons: r.evaluations, ...(cur?.lead_type === "partner" || cur?.lead_type === "recruit" ? {} : { stage }),
    ...(agentId ? { agent_id: agentId, assigned_to: agentId } : {}),
    ...((ins.data as { status?: string }).status === "inserted" ? { source: a.src ?? (agentId ? "referral" : "qualifier") } : {}),
  }).eq("id", leadId);
  if (ue) return json({ error: "save_failed" }, 500);
  await db.from("crm_activities").insert({ lead_id: leadId, type: "note", body: r.next === "state_blocked" ? `Qualifier: state ${a.state} not served` : `Qualifier completed → ${r.product ? r.product.funder + " · " + r.product.product : "needs review"}` });
  const next = r.next === "dac_link" ? "our_form" : r.next;
  return json({ next, url: next === "our_form" ? "/apply?cta=qualifier" : null });
});

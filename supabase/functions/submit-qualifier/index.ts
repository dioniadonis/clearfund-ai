import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { serviceClientConfig } from "../_shared/util.ts";
import { AMOUNT, CREDIT, MONTHS, REVENUE, route, type Product } from "../_shared/fundingRoute.ts";

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
  company_website: z.string().max(200).optional().nullable(), elapsed_ms: z.number().int().min(0).max(86400000),
});

const hits = new Map<string, number[]>();
const throttled = (ip: string) => { const n = Date.now(); const l = (hits.get(ip) ?? []).filter((t) => n - t < 600000); l.push(n); hits.set(ip, l); return l.length > 5; };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  let raw: unknown; try { raw = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const parsed = Schema.safeParse(raw);
  if (!parsed.success) return json({ error: "invalid_input" }, 400);
  const a = parsed.data;
  if (a.company_website || a.elapsed_ms < 3000) return json({ next: "review" }); // spam: silent
  if (throttled(req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown")) return json({ error: "rate_limited" }, 429);

  const { url, key } = serviceClientConfig();
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data: products, error: pe } = await db.from("funder_products").select("*").eq("active", true);
  if (pe) return json({ error: "server_error" }, 500);
  const answers = { months: a.months, revenue: a.revenue, credit: a.credit, state: a.state, amount: a.amount, use_of_funds: a.use_of_funds, business_checking: a.business_checking } as Parameters<typeof route>[0];
  const r = route(answers, (products ?? []) as Product[]);

  const ins = await db.rpc("crm_insert_lead", { _lead: { email: a.email, firm: a.business_name, contact_name: a.full_name, phone: a.phone, state: a.state, lead_type: "borrower" }, _found_by: "qualifier", _source_id: null, _mode: "fill" });
  const leadId = (ins.data as { id?: string } | null)?.id;
  if (ins.error || !leadId) return json({ error: "save_failed" }, 500);
  const { data: cur } = await db.from("crm_leads").select("stage, lead_type").eq("id", leadId).single();
  const early = ["New", "Contacted", "Replied"].includes(cur?.stage ?? "");
  const stage = r.next === "state_blocked" ? (early ? "Lost" : cur?.stage) : (early ? "Interested" : cur?.stage);
  const qualifier = { ...answers, cta: a.cta ?? null, consent: { text: QUALIFIER_CONSENT_TEXT, version: "qualifier-v1", at: new Date().toISOString() } };
  const { error: ue } = await db.from("crm_leads").update({
    qualifier, routed_product_id: r.product?.id ?? null, route_next: r.next, routed_at: new Date().toISOString(),
    route_reasons: r.evaluations, ...(cur?.lead_type === "partner" ? {} : { stage }), ...((ins.data as { status?: string }).status === "inserted" ? { source: "qualifier" } : {}),
  }).eq("id", leadId);
  if (ue) return json({ error: "save_failed" }, 500);
  await db.from("crm_activities").insert({ lead_id: leadId, type: "note", body: r.next === "state_blocked" ? `Qualifier: state ${a.state} not served` : `Qualifier completed → ${r.product ? r.product.funder + " · " + r.product.product : "needs review"}` });

  // Public responses stay on ClearFund; private CRM records retain the selected provider route.
  const next = r.next === "dac_link" ? "our_form" : r.next;
  return json({ next, url: next === "our_form" ? "/apply?cta=qualifier" : null });
});

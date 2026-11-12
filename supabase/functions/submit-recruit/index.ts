import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { serviceClientConfig } from "../_shared/util.ts";
import { evaluateRecruit } from "../_shared/recruitScoring.ts";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json" },
});
const STATES = "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" ");
const Schema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(30).optional().nullable(),
  state: z.string().trim().toUpperCase().refine((s) => STATES.includes(s)),
  over_18: z.enum(["yes", "no"]),
  commission_experience: z.enum(["none", "under_1", "1_to_3", "3_plus"]),
  current_work: z.enum(["insurance", "loan", "merchant", "consultant", "bookkeeper", "other_b2b", "retail_b2c", "none"]),
  owner_contact: z.enum(["every_week", "sometimes", "rarely_never"]),
  owner_network: z.enum(["0_5", "6_20", "21_50", "50_plus"]),
  hours_per_week: z.enum(["under_5", "5_10", "10_20", "20_plus"]),
  outside_work_limit: z.enum(["no", "yes", "not_sure"]),
  commission_only_ok: z.enum(["yes", "no"]),
  written_answer: z.string().trim().min(1).max(500),
  source: z.enum(["indeed", "linkedin", "facebook", "referral", "other"]),
  company_website: z.string().max(200).optional().nullable(),
});

const hits = new Map<string, number[]>();
function throttled(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 600000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  let raw: unknown;
  try { raw = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const parsed = Schema.safeParse(raw);
  if (!parsed.success) return json({ error: "invalid_input" }, 400);
  const a = parsed.data;
  if (a.company_website) return json({ ok: true });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (throttled(ip)) return json({ error: "rate_limited" }, 429);

  const evaluation = evaluateRecruit(a);
  const { url, key } = serviceClientConfig();
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await db.from("recruits").insert({
    full_name: a.full_name, email: a.email, phone: a.phone || null, state: a.state,
    over_18: a.over_18 === "yes", commission_experience: a.commission_experience,
    current_work: a.current_work, owner_contact: a.owner_contact, owner_network: a.owner_network,
    hours_per_week: a.hours_per_week, outside_work_limit: a.outside_work_limit,
    commission_only_ok: a.commission_only_ok === "yes", written_answer: a.written_answer,
    source: a.source, ...evaluation,
  });
  if (error) return json({ error: "save_failed" }, 500);
  return json({ ok: true });
});

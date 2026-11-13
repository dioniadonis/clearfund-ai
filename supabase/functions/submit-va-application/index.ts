import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { serviceClientConfig } from "../_shared/util.ts";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json" },
});
const shareableUrl = z.string().trim().url().max(2048).refine((value) => {
  const url = new URL(value);
  return (url.protocol === "https:" || url.protocol === "http:") && url.hostname.includes(".");
});
const Schema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(7).max(40),
  country: z.string().trim().min(2).max(100),
  city: z.string().trim().min(1).max(120),
  calling_experience_years: z.number().finite().min(0).max(80),
  experience_areas: z.array(z.enum(["appointment_setting", "business_funding_mca", "solar", "insurance", "other"])).min(1).max(5),
  experience_other: z.string().trim().max(200).nullable().optional(),
  eastern_availability: z.enum(["yes", "partly", "no"]),
  hours_per_week: z.number().finite().positive().max(168),
  internet_speed_mbps: z.number().finite().min(0).max(100000),
  headset: z.boolean(),
  quiet_workspace: z.boolean(),
  voice_intro_url: shareableUrl,
  voice_contractor_url: shareableUrl,
  voice_objection_url: shareableUrl,
  why_good_fit: z.string().trim().min(10).max(500),
  contact_consent: z.literal(true),
  consent_text: z.literal("I agree to be contacted by email or WhatsApp about this application."),
  consent_version: z.literal("va-careers-v1"),
  source: z.string().regex(/^[a-z0-9_-]{1,40}$/),
  company_website: z.string().max(200).optional().nullable(),
  elapsed_ms: z.number().int().min(0).max(86400000),
}).strict().superRefine((input, context) => {
  if (input.experience_areas.includes("other") && !input.experience_other) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "other_experience_required" });
  }
});
const hits = new Map<string, number[]>();
const throttled = (ip: string) => {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((time) => now - time < 600000);
  recent.push(now); hits.set(ip, recent);
  return recent.length > 5;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  let raw: unknown;
  try { raw = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const parsed = Schema.safeParse(raw);
  if (!parsed.success) return json({ error: "invalid_input" }, 400);
  const input = parsed.data;
  if (input.company_website || input.elapsed_ms < 3000) return json({ status: "received" });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (throttled(ip)) return json({ error: "rate_limited" }, 429);

  const { url, key } = serviceClientConfig();
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await db.from("va_applications").insert({
    full_name: input.full_name,
    email: input.email,
    phone: input.phone,
    country: input.country,
    city: input.city,
    calling_experience_years: input.calling_experience_years,
    experience_areas: input.experience_areas,
    experience_other: input.experience_areas.includes("other") ? input.experience_other : null,
    eastern_availability: input.eastern_availability,
    hours_per_week: input.hours_per_week,
    internet_speed_mbps: input.internet_speed_mbps,
    headset: input.headset,
    quiet_workspace: input.quiet_workspace,
    voice_intro_url: input.voice_intro_url,
    voice_contractor_url: input.voice_contractor_url,
    voice_objection_url: input.voice_objection_url,
    why_good_fit: input.why_good_fit,
    contact_consent: input.contact_consent,
    consent_text: input.consent_text,
    consent_version: input.consent_version,
    source: input.source,
  });
  if (error) { console.error("VA application save failed", error.message); return json({ error: "save_failed" }, 500); }
  return json({ status: "received" });
});

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { CONSENT_TEXT_VERSION, serviceClientConfig, sha256Hex } from "../_shared/util.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const SubmitSchema = z.object({
  action: z.literal("submit"),
  token: z.string().trim().max(120).optional().nullable(),
  owner_name: z.string().trim().min(2).max(120),
  business_name: z.string().trim().min(2).max(160),
  business_address: z.string().trim().max(300).optional().nullable(),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(7).max(30),
  business_start_date: z.string().trim().max(20).optional().nullable(),
  monthly_revenue: z.number().min(0).max(100000000).optional().nullable(),
  funding_need: z.number().min(0).max(100000000).optional().nullable(),
  funding_purpose: z.string().trim().max(1000).optional().nullable(),
  consent_email: z.boolean(),
  consent_sms: z.boolean(),
  consent_call: z.boolean(),
  broker_acknowledged: z.literal(true),
  utm_source: z.string().trim().max(120).optional().nullable(),
  utm_medium: z.string().trim().max(120).optional().nullable(),
  utm_campaign: z.string().trim().max(120).optional().nullable(),
  landing_page: z.string().trim().max(500).optional().nullable(),
  referrer: z.string().trim().max(500).optional().nullable(),
  // Spam controls
  company_website: z.string().max(200).optional().nullable(), // honeypot, must stay empty
  elapsed_ms: z.number().int().min(0).max(86400000),
});

const PrefillSchema = z.object({
  action: z.literal("prefill"),
  token: z.string().trim().min(8).max(120),
});

// Simple per-instance throttle. Not a full rate limiter; enough to blunt bursts.
const hits = new Map<string, number[]>();
function throttled(ip: string, limit = 5, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(ip, list);
  return list.length > limit;
}

function monthsSince(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const d = Date.parse(dateStr);
  if (Number.isNaN(d)) return null;
  const start = new Date(d);
  const now = new Date();
  const months =
    (now.getUTCFullYear() - start.getUTCFullYear()) * 12 + (now.getUTCMonth() - start.getUTCMonth());
  return months < 0 ? 0 : months;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const { url, key } = serviceClientConfig();
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // ---- Prefill from a concierge-issued link ----
  const prefill = PrefillSchema.safeParse(raw);
  if (prefill.success) {
    const tokenHash = await sha256Hex(prefill.data.token);
    const { data } = await supabase
      .from("application_sends")
      .select("id, owner_name, business_name, destination, delivery_method, expires_at, used_at, leads(full_name, business_name, email, phone)")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (!data) return json({ valid: false, reason: "not_found" });
    if (data.used_at) return json({ valid: false, reason: "already_used" });
    if (new Date(data.expires_at).getTime() < Date.now()) {
      return json({ valid: false, reason: "expired" });
    }

    const lead = (data as unknown as { leads?: { full_name?: string; business_name?: string; email?: string; phone?: string } }).leads;
    return json({
      valid: true,
      prefill: {
        owner_name: data.owner_name ?? lead?.full_name ?? "",
        business_name: data.business_name ?? lead?.business_name ?? "",
        email: data.delivery_method === "sms_link" ? lead?.email ?? "" : data.destination,
        phone: data.delivery_method === "sms_link" ? data.destination : lead?.phone ?? "",
      },
    });
  }

  // ---- Submit ----
  const parsed = SubmitSchema.safeParse(raw);
  if (!parsed.success) {
    return json({ error: "invalid_request", details: parsed.error.flatten().fieldErrors }, 400);
  }
  const b = parsed.data;

  if (b.company_website && b.company_website.trim().length > 0) {
    return json({ error: "rejected" }, 400);
  }
  if (b.elapsed_ms < 3000) {
    return json({ error: "too_fast" }, 400);
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("cf-connecting-ip") ??
    "unknown";
  if (throttled(ip)) {
    return json({ error: "rate_limited" }, 429);
  }

  const now = new Date().toISOString();
  let leadId: string | null = null;
  let sendRowId: string | null = null;

  if (b.token) {
    const tokenHash = await sha256Hex(b.token);
    const { data } = await supabase
      .from("application_sends")
      .select("id, lead_id, expires_at, used_at")
      .eq("token_hash", tokenHash)
      .maybeSingle();
    if (data && !data.used_at && new Date(data.expires_at).getTime() > Date.now()) {
      leadId = data.lead_id;
      sendRowId = data.id;
    }
  }

  const payload = {
    full_name: b.owner_name,
    business_name: b.business_name,
    email: b.email,
    phone: b.phone,
    monthly_revenue: b.monthly_revenue ?? null,
    time_in_business_months: monthsSince(b.business_start_date),
    funding_need: b.funding_need ?? null,
    funding_purpose: b.funding_purpose ?? null,
    application_status: "completed" as const,
    consent_email: b.consent_email,
    consent_sms: b.consent_sms,
    consent_call: b.consent_call,
    consent_text_version: CONSENT_TEXT_VERSION,
    consent_at: now,
    notes: b.business_address ? `Business address: ${b.business_address}` : null,
    utm_source: b.utm_source ?? null,
    utm_medium: b.utm_medium ?? null,
    utm_campaign: b.utm_campaign ?? null,
    landing_page: b.landing_page ?? null,
    referrer: b.referrer ?? null,
  };

  if (leadId) {
    const upd = await supabase
      .from("leads")
      .update({ ...payload, stage: "application" })
      .eq("id", leadId);
    if (upd.error) {
      console.error("Lead update failed:", upd.error.message);
      return json({ error: "save_failed" }, 500);
    }
  } else {
    const ins = await supabase
      .from("leads")
      .insert({ ...payload, stage: "application", source: "apply_form" })
      .select("id")
      .single();
    if (ins.error) {
      console.error("Lead insert failed:", ins.error.message);
      return json({ error: "save_failed" }, 500);
    }
    leadId = ins.data.id;
  }

  if (sendRowId) {
    await supabase
      .from("application_sends")
      .update({ used_at: now, completed_at: now, lead_id: leadId })
      .eq("id", sendRowId);
  }

  await supabase.from("lead_events").insert({
    lead_id: leadId,
    event_type: "application_submitted",
    description: "Application submitted through the online form.",
  });

  return json({ status: "received" });
});

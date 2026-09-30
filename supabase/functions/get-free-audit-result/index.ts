import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { serviceClientConfig } from "../_shared/util.ts";

// Public, token-gated. Returns results only — never email, phone, or consent data.
const POST_EVENTS = ["results_viewed", "opportunity_card_viewed", "funding_cta_clicked", "setup_cta_clicked", "pdf_downloaded", "results_link_copied"];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const Schema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/),
  event: z.object({ event_name: z.string().max(40), step_id: z.string().max(40).optional().nullable() }).optional(),
});

const hits = new Map<string, number[]>();
function throttled(ip: string, limit = 120, windowMs = 600000) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((x) => now - x < windowMs);
  list.push(now);
  hits.set(ip, list);
  return list.length > limit;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  let body: unknown;
  try { body = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const p = Schema.safeParse(body);
  if (!p.success) return json({ error: "invalid_request" }, 400);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (throttled(ip)) return json({ error: "rate_limited" }, 429);

  const { url, key } = serviceClientConfig();
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data } = await db.from("free_audits")
    .select("id, first_name, business_name, answers, results, ai_analysis, utm_source, utm_medium, utm_campaign")
    .eq("share_token", p.data.token).maybeSingle();
  if (!data) return json({ error: "not_found" }, 404);

  if (p.data.event) {
    if (!POST_EVENTS.includes(p.data.event.event_name)) return json({ error: "invalid_event" }, 400);
    await db.from("free_audit_events").insert({
      audit_id: data.id, event_name: p.data.event.event_name, step_id: p.data.event.step_id ?? null,
      utm_source: data.utm_source, utm_medium: data.utm_medium, utm_campaign: data.utm_campaign,
    });
    return json({ ok: true });
  }

  const a = data.answers as { drains?: string[] };
  return json({
    ok: true,
    first_name: data.first_name, business_name: data.business_name,
    drains: a?.drains ?? [], results: data.results, ai_analysis: data.ai_analysis,
  });
});

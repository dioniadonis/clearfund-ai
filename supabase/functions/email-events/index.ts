import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";

// Generic inbound webhook for any email-sending tool. Secured by a shared secret header.
const EventSchema = z.object({
  provider: z.string().trim().max(40).optional(),
  event: z.enum(["sent", "delivered", "opened", "clicked", "replied", "bounced", "unsubscribed"]),
  lead_id: z.string().trim().max(100).optional(),
  lead_ref: z.string().trim().max(100).optional(),
  email: z.string().trim().max(320).optional(),
  campaign: z.string().trim().max(200).optional(),
  step: z.union([z.string(), z.number()]).transform(String).optional(),
  occurred_at: z.string().datetime({ offset: true }).optional(),
  message_id: z.string().trim().max(200).optional(),
  snippet: z.string().max(5000).optional(),
});
const BodySchema = z.union([EventSchema, z.object({ events: z.array(EventSchema).min(1).max(100) })]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const safeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const expected = Deno.env.get("EMAIL_WEBHOOK_SECRET");
  const got = req.headers.get("x-clearfund-secret") ?? "";
  if (!expected || !safeEqual(got, expected)) return json({ error: "unauthorized" }, 401);

  let raw: unknown;
  try { raw = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) return json({ error: "invalid_request", details: parsed.error.flatten() }, 400);
  const events = "events" in parsed.data ? parsed.data.events : [parsed.data];

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const results: string[] = [];
  for (const e of events) {
    const { data, error } = await db.rpc("ingest_email_event", {
      _provider: e.provider ?? "generic", _event: e.event, _lead_id: e.lead_id ?? null, _lead_ref: e.lead_ref ?? null,
      _email: e.email ?? null, _campaign: e.campaign ?? null, _step: e.step?.slice(0, 60) ?? null,
      _occurred_at: e.occurred_at ?? null, _message_id: e.message_id ?? null, _snippet: e.snippet ?? null,
    });
    if (error) { console.error("ingest failed", error.message); results.push("error"); } else results.push(data as string);
  }
  return json({ ok: !results.includes("error"), results });
});

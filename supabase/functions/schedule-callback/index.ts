import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { parsePreferredAt, phoneKey, serviceClientConfig } from "../_shared/util.ts";

const BodySchema = z.object({
  preferred_datetime: z.string().trim().min(1).max(200),
  reason: z.enum(["application_unfinished", "thinking_it_over"]),
  phone_number: z.string().trim().min(7).max(30),
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const expected = Deno.env.get("RETELL_TOOL_SECRET");
  if (!expected || req.headers.get("x-clearfund-secret") !== expected) {
    return json({ status: "failed", reason: "unauthorized" }, 401);
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ status: "failed", reason: "invalid_json" }, 400);
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return json(
      { status: "failed", reason: "invalid_request", details: parsed.error.flatten().fieldErrors },
      400,
    );
  }
  const b = parsed.data;

  const { url, key } = serviceClientConfig();
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  let leadId: string | null = null;
  const candidates = await supabase
    .from("leads")
    .select("id, phone")
    .order("created_at", { ascending: false })
    .limit(500);
  if (candidates.data) {
    const pk = phoneKey(b.phone_number);
    leadId = candidates.data.find((l) => l.phone && phoneKey(l.phone) === pk)?.id ?? null;
  }

  const inserted = await supabase
    .from("callback_requests")
    .insert({
      lead_id: leadId,
      phone: b.phone_number,
      preferred_datetime_raw: b.preferred_datetime,
      preferred_at: parsePreferredAt(b.preferred_datetime),
      reason: b.reason,
      status: "pending",
    })
    .select("id")
    .single();

  if (inserted.error) {
    console.error("Callback insert failed:", inserted.error.message);
    return json({ status: "failed", reason: "record_save_failed" }, 500);
  }

  if (leadId) {
    await supabase.from("lead_events").insert({
      lead_id: leadId,
      event_type: "callback_requested",
      description: `Callback requested (${b.reason}) for: ${b.preferred_datetime}`,
    });
  }

  return json({ status: "scheduled" });
});

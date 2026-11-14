import { createClient } from "npm:@supabase/supabase-js@2";
import { serviceClientConfig } from "../_shared/util.ts";

// Retell posts call_started / call_ended / call_analyzed here.
// Webhook URL: .../functions/v1/retell-webhook?token=<RETELL_TOOL_SECRET>
const sameSecret = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method_not_allowed", { status: 405 });
  const expected = Deno.env.get("RETELL_TOOL_SECRET");
  const token = new URL(req.url).searchParams.get("token") ?? req.headers.get("x-clearfund-secret") ?? "";
  if (!expected || !sameSecret(token, expected)) return new Response("unauthorized", { status: 401 });

  let body: { event?: string; call?: Record<string, unknown> };
  try { body = await req.json(); } catch { return new Response("invalid_json", { status: 400 }); }
  const event = body?.event;
  const call = body?.call;
  if (!call || typeof call !== "object" || typeof call.call_id !== "string") return new Response("invalid_call", { status: 400 });
  if (event !== "call_ended" && event !== "call_analyzed") return new Response(null, { status: 204 });

  // Only the fields the CRM uses. Transcripts and recordings are not stored.
  const slim = {
    call_id: call.call_id,
    direction: call.direction,
    from_number: call.from_number,
    to_number: call.to_number,
    call_status: call.call_status,
    start_timestamp: call.start_timestamp,
    end_timestamp: call.end_timestamp,
    duration_ms: call.duration_ms,
    call_analysis: call.call_analysis,
    collected_dynamic_variables: call.collected_dynamic_variables,
  };
  const { url, key } = serviceClientConfig();
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await db.rpc("crm_record_ai_call", { _call: slim });
  if (error) {
    console.error("crm_record_ai_call failed:", error.message);
    return new Response("save_failed", { status: 500 });
  }
  return new Response(null, { status: 204 });
});

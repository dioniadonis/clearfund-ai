import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { serviceClientConfig } from "../_shared/util.ts";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json" },
});
const Body = z.object({ action: z.literal("accept_agreement"), version: z.literal("agent-agreement-v1") });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "unauthorized" }, 401);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid_input" }, 400);
  const { url, key } = serviceClientConfig();
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) return json({ error: "unauthorized" }, 401);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { error: saveError } = await db.rpc("agent_record_agreement", {
    _user_id: data.user.id, _version: parsed.data.version, _ip: ip,
  });
  if (saveError) return json({ error: "save_failed" }, 500);
  return json({ status: "accepted", version: parsed.data.version });
});

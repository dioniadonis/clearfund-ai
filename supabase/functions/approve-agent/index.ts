import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { APP_PUBLIC_URL, serviceClientConfig } from "../_shared/util.ts";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json" },
});
const Body = z.object({ application_id: z.string().uuid() });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "unauthorized" }, 401);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid_input" }, 400);

  const { url, key } = serviceClientConfig();
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data: authData, error: authError } = await db.auth.getUser(token);
  if (authError || !authData.user) return json({ error: "unauthorized" }, 401);
  const { data: isAdmin } = await db.rpc("has_role", { _user_id: authData.user.id, _role: "admin" });
  if (!isAdmin) return json({ error: "forbidden" }, 403);

  const { data: application, error: appError } = await db.from("agent_applications")
    .select("id,email,status,passed").eq("id", parsed.data.application_id).maybeSingle();
  if (appError || !application) return json({ error: "not_found" }, 404);
  if (application.status !== "new" || !application.passed) return json({ error: "not_eligible" }, 409);

  let userId: string | null = null;
  const invited = await db.auth.admin.inviteUserByEmail(application.email, { redirectTo: `${APP_PUBLIC_URL}/agent` });
  userId = invited.data.user?.id ?? null;
  if (invited.error) {
    // Retry-safe: an existing Auth user can still be linked to the approved agent record.
    for (let page = 1; page <= 10 && !userId; page++) {
      const listed = await db.auth.admin.listUsers({ page, perPage: 1000 });
      if (listed.error) break;
      userId = listed.data.users.find((user) => user.email?.toLowerCase() === application.email.toLowerCase())?.id ?? null;
      if (listed.data.users.length < 1000) break;
    }
  }
  if (!userId) { console.error("agent invite failed", invited.error?.message); return json({ error: "invite_failed" }, 502); }

  const { data: code, error: approveError } = await db.rpc("agent_approve_application", {
    _application_id: application.id, _user_id: userId, _reviewer: authData.user.id,
  });
  if (approveError) { console.error("agent approval failed", approveError.message); return json({ error: "approval_failed" }, 500); }
  return json({ status: "approved", referral_code: code, invite: invited.error ? "existing_account" : "invited" });
});

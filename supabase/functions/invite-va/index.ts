import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { APP_PUBLIC_URL, serviceClientConfig } from "../_shared/util.ts";
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const parsed = z.object({ application_id: z.string().uuid() }).safeParse(await req.json().catch(() => null));
  if (!token || !parsed.success) return json({ error: "invalid_input" }, 400);
  const { url, key } = serviceClientConfig(); const db = createClient(url, key, { auth: { persistSession: false } });
  const { data: auth } = await db.auth.getUser(token);
  const { data: admin } = auth.user ? await db.rpc("has_role", { _user_id: auth.user.id, _role: "admin" }) : { data: false };
  if (!admin) return json({ error: "forbidden" }, 403);
  const { data: application } = await db.from("va_applications").select("id,full_name,email,status").eq("id", parsed.data.application_id).maybeSingle();
  if (!application) return json({ error: "not_found" }, 404);
  if (application.status === "Invited" || application.status === "Hired") return json({ error: "already_invited" }, 409);
  let userId: string | null = null;
  const invited = await db.auth.admin.inviteUserByEmail(application.email, { redirectTo: `${APP_PUBLIC_URL}/agent` });
  userId = invited.data.user?.id ?? null;
  if (invited.error) {
    for (let page = 1; page <= 10 && !userId; page++) {
      const listed = await db.auth.admin.listUsers({ page, perPage: 1000 }); if (listed.error) break;
      userId = listed.data.users.find((u) => u.email?.toLowerCase() === application.email.toLowerCase())?.id ?? null;
      if (listed.data.users.length < 1000) break;
    }
  }
  if (!userId) return json({ error: "invite_failed" }, 502);
  const code = `VA${Array.from(crypto.getRandomValues(new Uint8Array(6))).map((b) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32]).join("")}`;
  const { error: profileError } = await db.from("agents").upsert({ user_id: userId, full_name: application.full_name, email: application.email, referral_code: code, program_type: "va", active: true, va_started_at: new Date().toISOString().slice(0, 10) }, { onConflict: "user_id" });
  if (profileError) return json({ error: "profile_failed" }, 500);
  const { error: roleError } = await db.from("user_roles").insert({ user_id: userId, role: "agent" });
  if (roleError && roleError.code !== "23505") return json({ error: "role_failed" }, 500);
  await db.from("va_applications").update({ status: "Invited" }).eq("id", application.id);
  return json({ status: "invited", invite: invited.error ? "existing_account" : "invited" });
});

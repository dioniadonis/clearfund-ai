import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { APP_PUBLIC_URL, serviceClientConfig } from "../_shared/util.ts";
import { scoreVaQuiz } from "../_shared/vaProgram.ts";
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "unauthorized" }, 401);
  const { url, key } = serviceClientConfig();
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data: auth, error: authError } = await db.auth.getUser(token);
  if (authError || !auth.user) return json({ error: "unauthorized" }, 401);
  const { data: va } = await db.from("agents").select("user_id,referral_code,program_type,active").eq("user_id", auth.user.id).eq("program_type", "va").eq("active", true).maybeSingle();
  if (!va) return json({ error: "forbidden" }, 403);
  const userDb = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    if (form.get("action") !== "log_dials") return json({ error: "invalid_action" }, 400);
    const week = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).safeParse(form.get("week_start"));
    const count = z.coerce.number().int().min(0).max(10000).safeParse(form.get("dial_count"));
    const file = form.get("file");
    if (!week.success || !count.success || !(file instanceof File) || !["image/png", "image/jpeg"].includes(file.type) || file.size > 5 * 1024 * 1024) return json({ error: "invalid_input" }, 400);
    const path = `${auth.user.id}/${week.data}/${crypto.randomUUID()}.${file.type === "image/png" ? "png" : "jpg"}`;
    const upload = await db.storage.from("va-dial-evidence").upload(path, file, { contentType: file.type });
    if (upload.error) return json({ error: "upload_failed" }, 500);
    const { data: old } = await db.from("va_dials").select("screenshot_path").eq("va_id", auth.user.id).eq("week_start", week.data).maybeSingle();
    const { error } = await db.from("va_dials").upsert({ va_id: auth.user.id, week_start: week.data, dial_count: count.data, screenshot_path: path }, { onConflict: "va_id,week_start" });
    if (error) { await db.storage.from("va-dial-evidence").remove([path]); return json({ error: "save_failed" }, 500); }
    if (old?.screenshot_path) await db.storage.from("va-dial-evidence").remove([old.screenshot_path]);
    return json({ status: "saved" });
  }

  const parsed = z.object({ action: z.enum(["quiz", "send_intake_email"]), answers: z.record(z.string().max(40)).optional(), lead_id: z.string().uuid().optional() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid_input" }, 400);
  if (parsed.data.action === "quiz") {
    const answers = parsed.data.answers ?? {};
    const result = scoreVaQuiz(answers);
    const { error } = await db.from("va_quiz_attempts").insert({ va_id: auth.user.id, score: result.score, passed: result.passed, answers });
    if (error) return json({ error: "save_failed" }, 500);
    return json(result);
  }
  if (!parsed.data.lead_id) return json({ error: "invalid_input" }, 400);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { error: consentError } = await userDb.rpc("va_log_email_consent", { _lead_id: parsed.data.lead_id, _ip: ip });
  if (consentError) return json({ error: "lead_not_available" }, 403);
  const { data: lead } = await db.from("crm_leads").select("email,firm").eq("id", parsed.data.lead_id).eq("assigned_to", auth.user.id).single();
  if (!lead?.email) return json({ error: "email_unavailable" }, 409);
  const apiKey = Deno.env.get("RESEND_API_KEY"); const from = Deno.env.get("APPLICATION_FROM_EMAIL");
  if (!apiKey || !from) return json({ status: "consent_logged", email_sent: false, reason: "email_provider_not_connected" });
  const link = `${APP_PUBLIC_URL}/get-started?va=${va.referral_code}`;
  const sent = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [lead.email], subject: "Your ClearFund business intake link", html: `<p>Hello ${escapeHtml(lead.firm ?? "")},</p><p>As you agreed on the call, here is your short business intake link:</p><p><a href="${link}">Start the questionnaire</a></p>` }) });
  if (!sent.ok) return json({ status: "consent_logged", email_sent: false, reason: `email_send_failed_${sent.status}` });
  return json({ status: "sent", email_sent: true });
});

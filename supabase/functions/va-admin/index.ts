import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { serviceClientConfig } from "../_shared/util.ts";
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "unauthorized" }, 401);
  const parsed = z.object({ action: z.enum(["document_url", "purge_expired"]), document_id: z.string().uuid().optional() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid_input" }, 400);
  const { url, key } = serviceClientConfig();
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data: auth, error: authError } = await db.auth.getUser(token);
  if (authError || !auth.user) return json({ error: "unauthorized" }, 401);
  const { data: admin } = await db.rpc("has_role", { _user_id: auth.user.id, _role: "admin" });
  if (!admin) return json({ error: "forbidden" }, 403);
  if (parsed.data.action === "purge_expired") {
    const { data: expired } = await db.from("va_documents").select("id,file_path").lte("delete_after", new Date().toISOString()).limit(500);
    if (expired?.length) {
      const removed = await db.storage.from("va-documents").remove(expired.map((d) => d.file_path));
      if (removed.error) return json({ error: "storage_cleanup_failed" }, 500);
      await db.from("va_documents").delete().in("id", expired.map((d) => d.id));
    }
    return json({ deleted: expired?.length ?? 0 });
  }
  if (!parsed.data.document_id) return json({ error: "invalid_input" }, 400);
  const { data: doc } = await db.from("va_documents").select("id,file_path").eq("id", parsed.data.document_id).maybeSingle();
  if (!doc) return json({ error: "not_found" }, 404);
  const signed = await db.storage.from("va-documents").createSignedUrl(doc.file_path, 60);
  if (signed.error || !signed.data.signedUrl) return json({ error: "signing_failed" }, 500);
  await db.from("va_document_views").insert({ document_id: doc.id, viewed_by: auth.user.id, ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown" });
  return json({ url: signed.data.signedUrl, expires_in: 60 });
});

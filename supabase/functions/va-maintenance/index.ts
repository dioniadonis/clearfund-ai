import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { serviceClientConfig } from "../_shared/util.ts";
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const { url, key } = serviceClientConfig(); const db = createClient(url, key, { auth: { persistSession: false } });
  const { data: state } = await db.from("va_maintenance_state").select("access_key").eq("singleton", true).maybeSingle();
  if (!state || req.headers.get("x-maintenance-key") !== state.access_key) return json({ error: "unauthorized" }, 401);
  const { data: expired, error } = await db.from("va_documents").select("id,file_path").lte("delete_after", new Date().toISOString()).limit(1000);
  if (error) return json({ error: "lookup_failed" }, 500);
  if (expired?.length) {
    const removed = await db.storage.from("va-documents").remove(expired.map((d) => d.file_path));
    if (removed.error) return json({ error: "storage_cleanup_failed" }, 500);
    const { error: deleteError } = await db.from("va_documents").delete().in("id", expired.map((d) => d.id));
    if (deleteError) return json({ error: "metadata_cleanup_failed" }, 500);
  }
  return json({ deleted: expired?.length ?? 0 });
});

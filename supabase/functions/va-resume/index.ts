import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { serviceClientConfig, sha256Hex } from "../_shared/util.ts";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const Token = z.string().regex(/^[a-f0-9]{48}$/);
const hits = new Map<string, number[]>();
const limited = (ip: string) => { const now = Date.now(); const list = (hits.get(ip) ?? []).filter((t) => now - t < 600000); list.push(now); hits.set(ip, list); return list.length > 40; };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(ip)) return json({ error: "rate_limited" }, 429);
  const { url, key } = serviceClientConfig();
  const db = createClient(url, key, { auth: { persistSession: false } });

  // Reconcile expired document retention whenever the document system is used.
  const { data: expired } = await db.from("va_documents").select("id,file_path").lte("delete_after", new Date().toISOString()).limit(100);
  if (expired?.length) {
    await db.storage.from("va-documents").remove(expired.map((d) => d.file_path));
    await db.from("va_documents").delete().in("id", expired.map((d) => d.id));
  }

  let form: FormData;
  try { form = await req.formData(); } catch { return json({ error: "invalid_form" }, 400); }
  const action = z.enum(["load", "sign", "upload", "complete"]).safeParse(form.get("action"));
  const token = Token.safeParse(form.get("token"));
  if (!action.success || !token.success) return json({ error: "invalid_input" }, 400);
  const { data: tokenRow } = await db.from("va_resume_tokens").select("lead_id").eq("token_hash", await sha256Hex(token.data)).gt("expires_at", new Date().toISOString()).maybeSingle();
  if (!tokenRow) return json({ error: "invalid_or_expired" }, 403);
  const { data: lead } = await db.from("crm_leads").select("id,business_name:firm,stage,va_auto_passed,routed_product_id").eq("id", tokenRow.lead_id).single();
  if (!lead || !lead.va_auto_passed) return json({ error: "not_available" }, 403);

  const payload = async () => {
    const [{ data: documents }, { data: product }] = await Promise.all([
      db.from("va_documents").select("id,doc_type,original_name,uploaded_at").eq("lead_id", lead.id).order("uploaded_at"),
      lead.routed_product_id ? db.from("funder_products").select("requires_photo_id").eq("id", lead.routed_product_id).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    return { business_name: lead.business_name, stage: lead.stage, requires_photo_id: !!product?.requires_photo_id, documents: documents ?? [] };
  };
  if (action.data === "load") return json(await payload());

  if (action.data === "complete") {
    const { data: ready } = await db.rpc("va_documents_ready", { _lead_id: lead.id });
    if (!ready) return json({ error: "documents_missing" }, 409);
    const { error } = await db.from("crm_leads").update({ stage: "Complete" }).eq("id", lead.id);
    if (error) return json({ error: "save_failed" }, 500);
    await db.from("crm_activities").insert({ lead_id: lead.id, type: "note", body: "Merchant completed signature and required documents" });
    return json({ status: "complete" });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0 || file.size > 10 * 1024 * 1024) return json({ error: "invalid_file" }, 400);
  let docType: "signed_application" | "bank_statement" | "photo_id";
  let signatureName: string | null = null;
  if (action.data === "sign") {
    docType = "signed_application";
    signatureName = z.string().trim().min(2).max(120).safeParse(form.get("signature_name")).success ? String(form.get("signature_name")).trim() : null;
    if (!signatureName || file.type !== "image/png") return json({ error: "invalid_signature" }, 400);
  } else {
    const parsedType = z.enum(["bank_statement", "photo_id"]).safeParse(form.get("doc_type"));
    if (!parsedType.success) return json({ error: "invalid_document_type" }, 400);
    docType = parsedType.data;
    const allowed = docType === "bank_statement" ? ["application/pdf"] : ["application/pdf", "image/jpeg", "image/png"];
    if (!allowed.includes(file.type)) return json({ error: "invalid_file_type" }, 400);
    if (file.type === "application/pdf") {
      const head = new TextDecoder().decode((await file.arrayBuffer()).slice(0, 5));
      if (head !== "%PDF-") return json({ error: "invalid_pdf" }, 400);
    }
  }
  const ext = docType === "signed_application" ? "png" : file.name.toLowerCase().endsWith(".pdf") ? "pdf" : file.type === "image/png" ? "png" : "jpg";
  const path = `${lead.id}/${crypto.randomUUID()}.${ext}`;
  const uploaded = await db.storage.from("va-documents").upload(path, file, { contentType: file.type, upsert: false });
  if (uploaded.error) { console.error("VA document upload failed", uploaded.error.message); return json({ error: "upload_failed" }, 500); }
  const { error: metadataError } = await db.from("va_documents").insert({ lead_id: lead.id, doc_type: docType, file_path: path, original_name: (docType === "signed_application" ? "Signed application.png" : file.name).slice(0, 255), byte_size: file.size });
  if (metadataError) { await db.storage.from("va-documents").remove([path]); return json({ error: "save_failed" }, 500); }
  if (docType === "signed_application") {
    await db.from("va_consents").insert({ lead_id: lead.id, consent_type: "electronic_signature", displayed_text: `Electronic signature by ${signatureName}: I agree that this electronic signature represents my signature on this application.`, version: "va-signature-v1", ip });
  }
  if (lead.stage === "Qualified" || lead.stage === "Started") await db.from("crm_leads").update({ stage: "Docs Pending" }).eq("id", lead.id);
  return json({ status: "saved" });
});

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import {
  APP_PUBLIC_URL,
  CONSENT_TEXT_VERSION,
  newToken,
  phoneKey,
  serviceClientConfig,
  sha256Hex,
  toE164,
} from "../_shared/util.ts";
import { notifyNewLead } from "../_shared/notify.ts";

const BodySchema = z.object({
  delivery_method: z.enum(["sms_link", "email_link", "email_pdf"]),
  phone_number: z.string().trim().min(7).max(30).optional().nullable(),
  email: z.string().trim().email().max(255).optional().nullable(),
  business_name: z.string().trim().max(200).optional().nullable(),
  owner_name: z.string().trim().max(200).optional().nullable(),
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function sendSms(to: string, message: string) {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const twilioKey = Deno.env.get("TWILIO_API_KEY");
  const from = Deno.env.get("TWILIO_FROM_NUMBER");
  if (!lovableKey || !twilioKey || !from) {
    return { ok: false as const, reason: "sms_provider_not_connected" };
  }
  const res = await fetch("https://connector-gateway.lovable.dev/twilio/Messages.json", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": twilioKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: from, Body: message }),
  });
  if (!res.ok) {
    const detail = await res.text();
    console.error(`Twilio send failed [${res.status}]: ${detail}`);
    return { ok: false as const, reason: `sms_send_failed_${res.status}` };
  }
  const data = await res.json();
  return { ok: true as const, providerId: data?.sid ?? null };
}

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("APPLICATION_FROM_EMAIL");
  if (!apiKey || !from) {
    return { ok: false as const, reason: "email_provider_not_connected" };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!res.ok) {
    const detail = await res.text();
    console.error(`Email send failed [${res.status}]: ${detail}`);
    return { ok: false as const, reason: `email_send_failed_${res.status}` };
  }
  const data = await res.json();
  return { ok: true as const, providerId: data?.id ?? null };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const expected = Deno.env.get("RETELL_TOOL_SECRET");
  const provided = req.headers.get("x-clearfund-secret");
  if (!expected || provided !== expected) {
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
    return json({ status: "failed", reason: "invalid_request", details: parsed.error.flatten().fieldErrors }, 400);
  }
  const b = parsed.data;

  if (b.delivery_method === "sms_link" && !b.phone_number) {
    return json({ status: "failed", reason: "phone_number_required" }, 400);
  }
  if (b.delivery_method !== "sms_link" && !b.email) {
    return json({ status: "failed", reason: "email_required" }, 400);
  }

  const { url, key } = serviceClientConfig();
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // Match an existing lead by phone (last 10 digits) or email, otherwise create one.
  let leadId: string | null = null;
  const candidates = await supabase
    .from("leads")
    .select("id, phone, email")
    .order("created_at", { ascending: false })
    .limit(500);

  if (candidates.data) {
    const pk = b.phone_number ? phoneKey(b.phone_number) : null;
    const match = candidates.data.find(
      (l) =>
        (pk && l.phone && phoneKey(l.phone) === pk) ||
        (b.email && l.email && l.email.toLowerCase() === b.email.toLowerCase()),
    );
    leadId = match?.id ?? null;
  }

  if (!leadId) {
    const inserted = await supabase
      .from("leads")
      .insert({
        full_name: b.owner_name || "Unknown caller",
        business_name: b.business_name || "Unknown business",
        email: b.email ?? null,
        phone: b.phone_number ?? "unknown",
        stage: "qualification",
        source: "voice_concierge",
        application_status: "not_started",
        consent_call: true,
        consent_sms: b.delivery_method === "sms_link",
        consent_email: b.delivery_method !== "sms_link",
        consent_text_version: CONSENT_TEXT_VERSION,
        consent_at: new Date().toISOString(),
        notes: "Created by the phone concierge when sending the application.",
      })
      .select("id")
      .single();
    if (inserted.error) {
      console.error("Lead insert failed:", inserted.error.message);
      return json({ status: "failed", reason: "lead_save_failed" }, 500);
    }
    leadId = inserted.data.id;
    try {
      await notifyNewLead(supabase, {
        id: leadId!,
        full_name: b.owner_name || "Unknown caller",
        business_name: b.business_name || "Unknown business",
        phone: b.phone_number ?? "unknown",
        service_interest: "other",
        entry_cta: "voice_concierge",
      });
    } catch (e) {
      console.error("Notify failed:", e);
    }
  }

  const token = newToken();
  const tokenHash = await sha256Hex(token);
  const destination = b.delivery_method === "sms_link" ? b.phone_number! : b.email!;

  const sendRow = await supabase
    .from("application_sends")
    .insert({
      lead_id: leadId,
      delivery_method: b.delivery_method,
      destination,
      owner_name: b.owner_name ?? null,
      business_name: b.business_name ?? null,
      token_hash: tokenHash,
      status: "pending",
    })
    .select("id")
    .single();

  if (sendRow.error) {
    console.error("Send record insert failed:", sendRow.error.message);
    return json({ status: "failed", reason: "record_save_failed" }, 500);
  }

  const link = `${APP_PUBLIC_URL}/apply?t=${token}`;
  let result: { ok: boolean; reason?: string; providerId?: string | null };

  if (b.delivery_method === "email_pdf") {
    result = { ok: false, reason: "pdf_not_available" };
  } else if (b.delivery_method === "sms_link") {
    const to = toE164(b.phone_number!);
    if (!to) {
      result = { ok: false, reason: "invalid_phone_number" };
    } else {
      result = await sendSms(
        to,
        `ClearFund AI: here is your funding application - ${link}. Reply STOP to opt out.`,
      );
    }
  } else {
    result = await sendEmail(
      b.email!,
      "Your ClearFund AI funding application",
      `<p>Hi ${b.owner_name ?? "there"},</p><p>Here is your funding application link:</p>
       <p><a href="${link}">${link}</a></p>
       <p>ClearFund AI is a broker and works with third-party funding providers. It is not a direct lender.</p>`,
    );
  }

  await supabase
    .from("application_sends")
    .update({
      status: result.ok ? "sent" : "failed",
      failure_reason: result.ok ? null : result.reason,
      provider_message_id: result.ok ? result.providerId ?? null : null,
      sent_at: result.ok ? new Date().toISOString() : null,
    })
    .eq("id", sendRow.data.id);

  await supabase.from("lead_events").insert({
    lead_id: leadId,
    event_type: result.ok ? "application_sent" : "application_send_failed",
    description: result.ok
      ? `Application link sent by ${b.delivery_method}.`
      : `Could not send application by ${b.delivery_method}: ${result.reason}.`,
  });

  if (!result.ok) return json({ status: "failed", reason: result.reason }, 200);
  return json({ status: "sent" });
});

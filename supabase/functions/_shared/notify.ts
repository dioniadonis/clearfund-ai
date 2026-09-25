// Single place that sends new-lead alerts. Never throws: a failed alert must not
// affect the saved lead. Each channel runs independently and logs its result.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { APP_PUBLIC_URL } from "./util.ts";

export interface LeadAlert {
  id: string;
  full_name: string;
  business_name: string;
  phone: string;
  service_interest: string;
  entry_cta: string | null;
}

type Result = { status: "sent" | "failed" | "not_configured"; detail?: string };

const OWNER_ALERT_EMAIL = Deno.env.get("OWNER_ALERT_EMAIL") ?? "mark@clearfundai.com";

async function sendTelegram(payload: Record<string, unknown>): Promise<Result> {
  const url = Deno.env.get("TOD_TELEGRAM_WEBHOOK_URL");
  if (!url) return { status: "not_configured" };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = (await res.text()).slice(0, 300);
      console.error(`Telegram alert failed [${res.status}]: ${body}`);
      return { status: "failed", detail: `http_${res.status}` };
    }
    return { status: "sent" };
  } catch (e) {
    console.error("Telegram alert error:", e);
    return { status: "failed", detail: "network_error" };
  }
}

// Email sending is an owner-approved prerequisite (no paid provider, no new
// account). Until a sender is approved and configured, this reports not_configured.
async function sendEmail(_to: string, _subject: string, _text: string): Promise<Result> {
  return { status: "not_configured" };
}

export async function notifyNewLead(supabase: SupabaseClient, lead: LeadAlert) {
  const link = `${APP_PUBLIC_URL}/operator/leads?lead=${lead.id}`;
  const service = lead.service_interest.replace(/_/g, " ");
  const text =
    `New ClearFund lead\n` +
    `Name: ${lead.full_name}\nBusiness: ${lead.business_name}\nPhone: ${lead.phone}\n` +
    `Service: ${service}\nEntry CTA: ${lead.entry_cta ?? "-"}\nOpen: ${link}`;

  const [tg, em] = await Promise.all([
    sendTelegram({
      type: "new_lead",
      urgency: "normal",
      text,
      lead: {
        id: lead.id,
        name: lead.full_name,
        business: lead.business_name,
        phone: lead.phone,
        service_interest: lead.service_interest,
        entry_cta: lead.entry_cta,
        link,
      },
    }),
    sendEmail(OWNER_ALERT_EMAIL, `New lead: ${lead.business_name}`, text),
  ]);

  const rows = [
    { channel: "telegram", r: tg },
    { channel: "email", r: em },
  ].map(({ channel, r }) => ({
    lead_id: lead.id,
    event_type: `alert_${channel}_${r.status}`,
    description: `New-lead alert by ${channel}: ${r.status.replace("_", " ")}${r.detail ? ` (${r.detail})` : ""}.`,
    metadata: { channel, status: r.status },
  }));
  const { error } = await supabase.from("lead_events").insert(rows);
  if (error) console.error("Alert log insert failed:", error.message);

  // Urgent problem: email failed outright -> tell Telegram (only if Telegram works).
  if (em.status === "failed" && tg.status === "sent") {
    await sendTelegram({ type: "error", urgency: "urgent", text: `Email alert failed for lead ${lead.id}. ${link}` });
  }
}

export async function notifyError(message: string) {
  await sendTelegram({ type: "error", urgency: "urgent", text: `ClearFund error: ${message}` });
}

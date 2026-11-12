import type { Database } from "@/integrations/supabase/types";

export type CrmLead = Database["public"]["Tables"]["crm_leads"]["Row"];
export type CrmActivity = Database["public"]["Tables"]["crm_activities"]["Row"];
export type EmailEvent = Database["public"]["Tables"]["email_events"]["Row"];
export type CrmAgent = { id: string; email: string | null; role: string };

export const CRM_STAGES = ["New", "Contacted", "Replied", "Interested", "Applied", "Submitted to funder", "Funded", "Lost"] as const;
export type CrmStage = (typeof CRM_STAGES)[number];
export const CRM_SOURCES = ["apply", "calculator", "outreach", "import", "worker", "manual"] as const;

export const IMPORT_FIELDS = [
  "lead_ref", "lead_type", "firm", "contact_name", "email", "phone", "state", "sector", "website", "agency",
  "email_source", "need_score", "first_line", "notes",
] as const;
export const IMPORT_LABELS: Record<string, string> = { lead_ref: "lead id", firm: "company", lead_type: "type (borrower/partner)" };
export type ImportField = (typeof IMPORT_FIELDS)[number];

export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const leadLabel = (l: Pick<CrmLead, "firm" | "contact_name" | "email">) => l.firm || l.contact_name || l.email || "Unnamed lead";

export const fmtMoney = (n: number | null) =>
  n == null ? "" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const norm = (s: string | null | undefined) => (s ?? "").trim().toLowerCase();

/** Same rules as the database's crm_norm_domain / crm_norm_company. */
export const normDomain = (t: string | null | undefined) =>
  (t ?? "").trim().toLowerCase().replace(/^[a-z]+:\/\//, "").replace(/^www\.|[/?#:].*$/g, "") || null;
export const normCompany = (t: string | null | undefined) =>
  (t ?? "").toLowerCase().replace(/[^a-z0-9 ]/g, " ")
    .replace(/\b(llc|inc|incorporated|corp|corporation|co|company|ltd|pllc|llp|lp)\b/g, " ")
    .replace(/\s+/g, " ").trim() || null;

/** Map CSV rows to lead objects and drop duplicates inside the file (lead id, email, domain, company+state).
 *  Duplicates against existing leads are rejected by the database (crm_import_leads). */
export function buildImportRows(rows: Record<string, string>[], mapping: Partial<Record<ImportField, string>>) {
  const seen = new Set<string>();
  const out: Record<string, string>[] = [];
  let skipped = 0;
  for (const r of rows) {
    const rec: Record<string, string> = {};
    for (const f of IMPORT_FIELDS) {
      const col = mapping[f];
      const v = col ? (r[col] ?? "").trim() : "";
      if (v) rec[f] = v.slice(0, 2000);
    }
    const keys = [
      rec.lead_ref && `r:${rec.lead_ref}`,
      rec.email && `e:${norm(rec.email)}`,
      normDomain(rec.website) && `w:${normDomain(rec.website)}`,
      normCompany(rec.firm) && rec.state && `c:${normCompany(rec.firm)}|${norm(rec.state).slice(0, 2)}`,
    ].filter(Boolean) as string[];
    if (!rec.lead_ref && !rec.email && !rec.website && !rec.firm) { skipped++; continue; }
    if (keys.some((k) => seen.has(k))) { skipped++; continue; }
    keys.forEach((k) => seen.add(k));
    out.push(rec);
  }
  return { rows: out, skipped };
}

/** Monday 00:00 local time of the current week. */
export const weekStart = (now = new Date()) => {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
};
export const dayStart = (now = new Date()) => new Date(now.getFullYear(), now.getMonth(), now.getDate());

/** Counts per event since a time; opens/clicks counted once per email (provider_event_id or lead+campaign+step). */
export function countEvents(events: Pick<EmailEvent, "event" | "occurred_at" | "lead_id" | "campaign" | "step" | "recipient_email">[], since: Date) {
  const seen = new Set<string>();
  const c = { sent: 0, opened: 0, replied: 0, bounced: 0 };
  for (const e of events) {
    if (new Date(e.occurred_at) < since) continue;
    if (e.event === "opened") {
      const k = [e.lead_id ?? e.recipient_email, e.campaign, e.step].join("|");
      if (seen.has(k)) continue;
      seen.add(k); c.opened++;
    } else if (e.event === "sent" || e.event === "replied" || e.event === "bounced") c[e.event]++;
  }
  return c;
}

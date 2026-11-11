import type { Database } from "@/integrations/supabase/types";

export type CrmLead = Database["public"]["Tables"]["crm_leads"]["Row"];
export type CrmActivity = Database["public"]["Tables"]["crm_activities"]["Row"];
export type CrmAgent = { id: string; email: string | null; role: string };

export const CRM_STAGES = ["New", "Contacted", "Interested", "Applied", "Submitted to funder", "Funded", "Lost"] as const;
export type CrmStage = (typeof CRM_STAGES)[number];
export const CRM_SOURCES = ["apply", "calculator", "outreach", "import", "manual"] as const;

export const IMPORT_FIELDS = [
  "firm", "contact_name", "email", "phone", "agency", "award_amount", "award_date", "source", "stage", "next_follow_up", "notes", "lead_ref",
] as const;
export type ImportField = (typeof IMPORT_FIELDS)[number];

export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const leadLabel = (l: Pick<CrmLead, "firm" | "contact_name" | "email">) => l.firm || l.contact_name || l.email || "Unnamed lead";

export const fmtMoney = (n: number | null) =>
  n == null ? "" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const norm = (s: string | null | undefined) => (s ?? "").trim().toLowerCase();

/** Map raw CSV rows into lead inserts, skipping rows that duplicate an existing (or earlier) email or firm name. */
export function buildImportRows(
  rows: Record<string, string>[],
  mapping: Partial<Record<ImportField, string>>,
  existing: { email: string | null; firm: string | null }[],
) {
  const emails = new Set(existing.map((e) => norm(e.email)).filter(Boolean));
  const firms = new Set(existing.map((e) => norm(e.firm)).filter(Boolean));
  const out: Partial<CrmLead>[] = [];
  let skipped = 0;
  for (const r of rows) {
    const rec: Record<string, unknown> = {};
    for (const f of IMPORT_FIELDS) {
      const col = mapping[f];
      if (!col) continue;
      const v = (r[col] ?? "").trim();
      if (!v) continue;
      if (f === "award_amount") {
        const n = Number(v.replace(/[$,\s]/g, ""));
        if (!Number.isNaN(n)) rec[f] = n;
      } else if (f === "award_date" || f === "next_follow_up") {
        const d = new Date(v);
        if (!Number.isNaN(d.getTime())) rec[f] = d.toISOString().slice(0, 10);
      } else if (f === "stage") {
        const s = CRM_STAGES.find((x) => norm(x) === norm(v));
        if (s) rec[f] = s;
      } else rec[f] = v.slice(0, 2000);
    }
    const e = norm(rec.email as string), fi = norm(rec.firm as string);
    if (!e && !fi) { skipped++; continue; }
    if ((e && emails.has(e)) || (fi && firms.has(fi))) { skipped++; continue; }
    if (e) emails.add(e);
    if (fi) firms.add(fi);
    out.push({ source: "import", ...rec } as Partial<CrmLead>);
  }
  return { rows: out, skipped };
}

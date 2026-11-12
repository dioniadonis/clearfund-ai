import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, Mail, MailOpen, Phone, PhoneCall, StickyNote, CalendarClock, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { CRM_STAGES, leadLabel, type CrmActivity, type CrmAgent, type EmailEvent, type CrmLead } from "@/lib/crm";
import { toast } from "sonner";

type Props = { lead: CrmLead | null; onClose: () => void; agents: CrmAgent[]; isAdmin: boolean; userId: string };
const sel = "h-11 w-full rounded-md border border-input bg-background px-3 text-base";

const LeadDrawer: React.FC<Props> = ({ lead, onClose, agents, isAdmin, userId }) => {
  const qc = useQueryClient();
  const [form, setForm] = useState<Partial<CrmLead>>({});
  const [saving, setSaving] = useState(false);
  const [logType, setLogType] = useState<null | "call" | "email" | "note">(null);
  const [logBody, setLogBody] = useState("");

  useEffect(() => { setForm(lead ?? {}); setLogType(null); setLogBody(""); }, [lead]);

  const acts = useQuery({
    queryKey: ["crm_activities", lead?.id],
    enabled: !!lead,
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_activities").select("*").eq("lead_id", lead!.id).order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data as CrmActivity[];
    },
  });

  const emails = useQuery({
    queryKey: ["crm_email_events", lead?.id],
    enabled: !!lead,
    queryFn: async () => {
      const { data, error } = await supabase.from("email_events").select("*").eq("lead_id", lead!.id).order("occurred_at", { ascending: false }).limit(300);
      if (error) throw error;
      return data as EmailEvent[];
    },
  });

  if (!lead) return null;
  const set = (k: keyof CrmLead) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value === "" ? null : e.target.value }));

  const save = async () => {
    setSaving(true);
    const { firm, contact_name, email, phone, agency, award_amount, award_date, source, stage, assigned_to, next_follow_up, notes, lead_ref } = form;
    const dnc = !!form.do_not_contact;
    const patch: Partial<CrmLead> = { do_not_contact: dnc,
      ...(dnc !== lead.do_not_contact ? { dnc_reason: dnc ? "manual" : null, dnc_at: dnc ? new Date().toISOString() : null } : {}), firm, contact_name, email, phone, agency, award_date, source: source || "manual", stage, next_follow_up, notes, lead_ref,
      award_amount: award_amount == null || award_amount === ("" as unknown) ? null : Number(award_amount) };
    if (isAdmin || assigned_to === userId || assigned_to == null) patch.assigned_to = assigned_to ?? null;
    const { error } = await supabase.from("crm_leads").update(patch).eq("id", lead.id);
    setSaving(false);
    if (error) return toast.error(`Couldn't save: ${error.message}`);
    toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["crm_leads"] });
    qc.invalidateQueries({ queryKey: ["crm_activities", lead.id] });
  };

  const log = async () => {
    if (!logType || !logBody.trim()) return;
    const { error } = await supabase.from("crm_activities").insert({ lead_id: lead.id, user_id: userId, type: logType, body: logBody.trim().slice(0, 5000) });
    if (error) return toast.error(`Couldn't log: ${error.message}`);
    setLogType(null); setLogBody("");
    qc.invalidateQueries({ queryKey: ["crm_activities", lead.id] });
  };

  const agentName = (id: string | null) => agents.find((a) => a.id === id)?.email ?? (id ? "Another user" : "System");

  // Merge CRM activity with email events; consecutive opens of the same email collapse into one row.
  type Row = { key: string; at: string; meta: string; body?: string | null; email?: boolean };
  const rows: Row[] = (acts.data ?? []).map((a) => ({ key: a.id, at: a.created_at, meta: `${a.type.replace("_", " ")} · ${agentName(a.user_id)}`, body: a.body }));
  const opens = new Map<string, { row: Row; n: number }>();
  for (const e of emails.data ?? []) {
    const label = [e.campaign, e.step && `step ${e.step}`].filter(Boolean).join(" · ");
    if (e.event === "opened") {
      const k = `${e.campaign}|${e.step}`;
      const o = opens.get(k);
      if (o) { o.n++; o.row.meta = `email opened ${o.n}x${label ? ` · ${label}` : ""}`; continue; }
      const row = { key: e.id, at: e.occurred_at, meta: `email opened${label ? ` · ${label}` : ""}`, email: true };
      opens.set(k, { row, n: 1 }); rows.push(row); continue;
    }
    rows.push({ key: e.id, at: e.occurred_at, meta: `email ${e.event}${label ? ` · ${label}` : ""}`, body: e.snippet, email: true });
  }
  const timeline = rows.sort((a, b) => b.at.localeCompare(a.at));

  return (
    <Sheet open={!!lead} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-4 sm:p-6">
        <SheetHeader className="text-left">
          <SheetTitle className="break-words pr-8">{leadLabel(lead)}</SheetTitle>
          <SheetDescription>Source: {lead.source} · Added {new Date(lead.created_at).toLocaleDateString()}</SheetDescription>
        </SheetHeader>

        {lead.do_not_contact && (
          <p className="mt-3 inline-flex items-center gap-1 rounded-md bg-destructive/10 text-destructive text-sm px-2 py-1">
            <Ban className="h-4 w-4" />Do not contact ({lead.dnc_reason ?? "manual"}{lead.dnc_at ? `, ${new Date(lead.dnc_at).toLocaleDateString()}` : ""})
          </p>
        )}
        <div className="flex flex-wrap gap-2 my-4">
          {!lead.do_not_contact && form.phone && <Button asChild variant="outline" className="h-11"><a href={`tel:${form.phone.replace(/[^\d+]/g, "")}`}><Phone className="h-4 w-4 mr-1" />Call</a></Button>}
          {!lead.do_not_contact && form.email && <Button asChild variant="outline" className="h-11"><a href={`mailto:${form.email}`}><Mail className="h-4 w-4 mr-1" />Email</a></Button>}
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Button variant="secondary" className="h-11" onClick={() => setLogType("call")}><PhoneCall className="h-4 w-4 mr-1" />Log call</Button>
          <Button variant="secondary" className="h-11" onClick={() => setLogType("email")}><Mail className="h-4 w-4 mr-1" />Log email</Button>
          <Button variant="secondary" className="h-11" onClick={() => setLogType("note")}><StickyNote className="h-4 w-4 mr-1" />Add note</Button>
          <Button variant="secondary" className="h-11" onClick={() => document.getElementById("crm-follow")?.focus()}><CalendarClock className="h-4 w-4 mr-1" />Set follow-up</Button>
        </div>
        {logType && (
          <div className="space-y-2 mb-4 border rounded-md p-3">
            <Label htmlFor="crm-log">{logType === "note" ? "Note" : `What happened on the ${logType}?`}</Label>
            <Textarea id="crm-log" value={logBody} onChange={(e) => setLogBody(e.target.value)} autoFocus />
            <div className="flex gap-2"><Button className="h-11" onClick={log}>Save</Button><Button variant="ghost" className="h-11" onClick={() => setLogType(null)}>Cancel</Button></div>
          </div>
        )}

        <div className="space-y-3">
          {([["firm", "Firm"], ["contact_name", "Contact name"], ["email", "Email"], ["phone", "Phone"], ["agency", "Agency"], ["lead_ref", "Lead ref"]] as const).map(([k, l]) => (
            <div key={k} className="space-y-1"><Label htmlFor={`crm-${k}`}>{l}</Label><Input id={`crm-${k}`} className="h-11 text-base" value={(form[k] as string) ?? ""} onChange={set(k)} /></div>
          ))}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 min-w-0"><Label htmlFor="crm-amt">Award amount</Label><Input id="crm-amt" type="number" className="h-11 text-base" value={form.award_amount ?? ""} onChange={set("award_amount")} /></div>
            <div className="space-y-1 min-w-0"><Label htmlFor="crm-adate">Award date</Label><Input id="crm-adate" type="date" className="cg-date h-11 text-base" value={form.award_date ?? ""} onChange={set("award_date")} /></div>
            <div className="space-y-1 min-w-0"><Label htmlFor="crm-stage">Stage</Label>
              <select id="crm-stage" className={sel} value={form.stage ?? "New"} onChange={set("stage")}>{CRM_STAGES.map((s) => <option key={s}>{s}</option>)}</select></div>
            <div className="space-y-1 min-w-0"><Label htmlFor="crm-follow">Next follow-up</Label><Input id="crm-follow" type="date" className="cg-date h-11 text-base" value={form.next_follow_up ?? ""} onChange={set("next_follow_up")} /></div>
            <div className="space-y-1 min-w-0"><Label htmlFor="crm-source">Source</Label><Input id="crm-source" className="h-11 text-base" value={form.source ?? ""} onChange={set("source")} /></div>
            <div className="space-y-1 min-w-0"><Label htmlFor="crm-assigned">Assigned to</Label>
              <select id="crm-assigned" className={sel} value={form.assigned_to ?? ""} onChange={set("assigned_to")}>
                <option value="">Unassigned</option>
                {(isAdmin ? agents : agents.filter((a) => a.id === userId)).map((a) => <option key={a.id} value={a.id}>{a.email ?? a.id}</option>)}
              </select></div>
          </div>
          <label className="flex items-center gap-3 min-h-[44px]">
            <input type="checkbox" className="h-5 w-5" checked={!!form.do_not_contact} onChange={(e) => setForm((f) => ({ ...f, do_not_contact: e.target.checked }))} />
            <span>Do not contact</span>
          </label>
          <div className="space-y-1"><Label htmlFor="crm-notes">Notes</Label><Textarea id="crm-notes" className="text-base" rows={4} value={form.notes ?? ""} onChange={set("notes")} /></div>
          <Button className="h-12 w-full" onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}</Button>
        </div>

        <h3 className="font-semibold mt-6 mb-2">Timeline</h3>
        {acts.isLoading || emails.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : acts.error || emails.error ? <p className="text-sm text-destructive">Couldn't load activity.</p> :
          timeline.length === 0 ? <p className="text-sm text-muted-foreground">No activity yet.</p> : (
          <ol className="space-y-3 pb-8">
            {timeline.map((t) => (
              <li key={t.key} className={`border-l-2 pl-3 ${t.email ? "border-muted-foreground" : "border-primary"}`}>
                <p className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">{t.email && <MailOpen className="h-3 w-3" />}{new Date(t.at).toLocaleString()} · {t.meta}</p>
                {t.body && <p className="text-sm whitespace-pre-wrap break-words">{t.body}</p>}
              </li>
            ))}
          </ol>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default LeadDrawer;

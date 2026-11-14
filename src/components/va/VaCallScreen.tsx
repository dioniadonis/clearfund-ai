import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

type CallRow = {
  id: string;
  business_name: string | null;
  owner_name: string | null;
  phone: string | null;
  email: string | null;
  state: string | null;
  status: string;
  reason: string | null;
  call_attempts: number;
  callback_at: string | null;
  best_time_to_call: string | null;
  last_call_at: string | null;
};

// One color per status so the VA can spot where each merchant stands at a glance.
export const STATUS_STYLE: Record<string, string> = {
  New: "bg-slate-100 text-slate-800",
  Called: "bg-sky-100 text-sky-900",
  "Call later": "bg-amber-100 text-amber-900",
  "Not interested": "bg-zinc-200 text-zinc-700",
  "Not ready yet": "bg-zinc-200 text-zinc-700",
  Qualified: "bg-emerald-100 text-emerald-900",
  "App sent": "bg-indigo-100 text-indigo-900",
  "Docs in": "bg-violet-100 text-violet-900",
  "Docs missing": "bg-orange-100 text-orange-900",
  "Not eligible": "bg-zinc-200 text-zinc-700",
  "File ready": "bg-green-600 text-white",
  Approved: "bg-green-600 text-white",
  Submitted: "bg-green-700 text-white",
  Funded: "bg-green-800 text-white",
  Declined: "bg-zinc-200 text-zinc-700",
  "Do not call": "bg-red-100 text-red-900",
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[status] ?? "bg-muted text-foreground"}`}>{status}</span>
);

const MONTHS: [string, string][] = [["lt4", "Under 4 months"], ["4to11", "4 to 11 months"], ["12to23", "1 to 2 years"], ["24plus", "2+ years"]];
const REVENUE: [string, string][] = [["lt10k", "Under $10k a month"], ["10to25k", "$10k to $25k"], ["25to50k", "$25k to $50k"], ["50kplus", "$50k+"]];

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "");
const localInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

const Choice: React.FC<{ name: string; options: [string, string][]; value: string; onChange: (v: string) => void }> = ({ name, options, value, onChange }) => (
  <div className="grid grid-cols-2 gap-2">
    {options.map(([v, label]) => (
      <label key={v} className={`flex min-h-11 cursor-pointer items-center justify-center rounded-md border px-2 text-center text-sm ${value === v ? "border-primary bg-primary/10 font-semibold" : ""}`}>
        <input type="radio" className="sr-only" name={name} value={v} checked={value === v} onChange={() => onChange(v)} />
        {label}
      </label>
    ))}
  </div>
);

const QualifyDialog: React.FC<{ lead: CallRow | null; onClose: () => void; onDone: () => void }> = ({ lead, onClose, onDone }) => {
  const [months, setMonths] = useState("");
  const [revenue, setRevenue] = useState("");
  const [checking, setChecking] = useState("");
  const [wants, setWants] = useState(false);
  const [email, setEmail] = useState("");
  const [bestTime, setBestTime] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastId, setLastId] = useState<string | null>(null);

  if (lead && lead.id !== lastId) {
    setLastId(lead.id); setMonths(""); setRevenue(""); setChecking(""); setWants(false);
    setEmail(lead.email ?? ""); setBestTime(lead.best_time_to_call ?? ""); setNote("");
  }

  const ready = months && revenue && checking && wants && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const submit = async () => {
    if (!lead || !ready) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("va_qualify_lead", {
      _lead_id: lead.id, _months: months, _revenue: revenue, _business_checking: checking === "yes",
      _owner_wants_funding: wants, _email: email.trim(), _best_time: bestTime.trim() || null, _note: note.trim() || null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    const r = data as { result: string; reasons: string[] };
    if (r.result === "qualified") toast.success("Qualified. The application email goes out to the owner automatically.");
    else toast.message(`Not ready yet: ${r.reasons.join(", ")}. It comes back on your list later.`);
    onDone(); onClose();
  };

  return (
    <Dialog open={!!lead} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="break-words">Qualify {lead?.business_name || "business"}</DialogTitle>
          <DialogDescription>Four quick answers from the call. We email the application and the secure upload link for you.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <fieldset><legend className="mb-2 text-sm font-medium">How long in business?</legend><Choice name="months" options={MONTHS} value={months} onChange={setMonths} /></fieldset>
          <fieldset><legend className="mb-2 text-sm font-medium">Monthly sales (rough)</legend><Choice name="revenue" options={REVENUE} value={revenue} onChange={setRevenue} /></fieldset>
          <fieldset><legend className="mb-2 text-sm font-medium">Business bank account?</legend><Choice name="checking" options={[["yes", "Yes"], ["no", "No"]]} value={checking} onChange={setChecking} /></fieldset>
          <label className="flex min-h-11 items-start gap-3 rounded-md border p-3 text-sm">
            <Checkbox checked={wants} onCheckedChange={(v) => setWants(v === true)} className="mt-0.5" />
            <span>The owner wants funding and agreed to get the application by email.</span>
          </label>
          <div><Label htmlFor="q-email">Owner's email</Label><Input id="q-email" type="email" inputMode="email" autoComplete="off" className="h-11 text-base" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Label htmlFor="q-best">Best time to call back (optional)</Label><Input id="q-best" className="h-11 text-base" placeholder="Weekday mornings" value={bestTime} onChange={(e) => setBestTime(e.target.value)} /></div>
          <div><Label htmlFor="q-note">Note (optional)</Label><Textarea id="q-note" rows={2} className="text-base" value={note} onChange={(e) => setNote(e.target.value)} /></div>
          <Button className="h-12 w-full text-base" disabled={!ready || busy} onClick={submit}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Mark qualified and send application</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const LeadCard: React.FC<{ lead: CallRow; onQualify: () => void; onChanged: () => void }> = ({ lead, onQualify, onChanged }) => {
  const [later, setLater] = useState(false);
  const [laterAt, setLaterAt] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(10, 0, 0, 0); return localInput(d); });
  const [busy, setBusy] = useState(false);

  const log = async (outcome: string, callbackAt?: string) => {
    setBusy(true);
    const { error } = await supabase.rpc("va_log_call", { _lead_id: lead.id, _outcome: outcome, _callback_at: callbackAt ?? null, _note: null });
    setBusy(false);
    if (error) toast.error(error.message); else { toast.success("Saved"); setLater(false); onChanged(); }
  };

  const dnc = async () => {
    if (!window.confirm("Block this owner's phone and email everywhere?")) return;
    const { error } = await supabase.rpc("va_mark_dnc", { _lead_id: lead.id, _reason: "Owner asked not to be called" });
    if (error) toast.error(error.message); else { toast.success("Do not call applied"); onChanged(); }
  };

  const closed = ["Do not call", "Funded", "Declined", "Submitted", "Approved", "File ready", "Not interested"].includes(lead.status);
  const afterQualify = ["Qualified", "App sent", "Docs in", "Docs missing"].includes(lead.status);

  return (
    <article className="min-w-0 rounded-lg border bg-card p-4">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="break-words font-semibold">{lead.business_name || "Business"}</h3>
          <p className="break-words text-sm text-muted-foreground">{[lead.owner_name, lead.state].filter(Boolean).join(" · ")}</p>
        </div>
        <StatusBadge status={lead.status} />
      </div>
      {(lead.reason || lead.callback_at || lead.best_time_to_call || lead.call_attempts > 0) && (
        <p className="mt-2 break-words text-sm">
          {lead.reason && <strong>{lead.reason}. </strong>}
          {lead.callback_at && <>Call back {when(lead.callback_at)}. </>}
          {lead.best_time_to_call && <>Best time: {lead.best_time_to_call}. </>}
          {lead.call_attempts > 0 && <span className="text-muted-foreground">{lead.call_attempts} call{lead.call_attempts === 1 ? "" : "s"} so far.</span>}
        </p>
      )}
      {lead.phone && !closed && (
        <Button asChild className="mt-3 h-12 w-full text-base"><a href={`tel:${lead.phone}`}><Phone className="mr-2 h-4 w-4" />Call {lead.phone}</a></Button>
      )}
      {!closed && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {!afterQualify && <Button className="col-span-2 h-11 bg-emerald-600 text-white hover:bg-emerald-700" disabled={busy} onClick={onQualify}>Qualified</Button>}
          <Button variant="outline" className="h-11" disabled={busy} onClick={() => log("no_answer")}>No answer</Button>
          <Button variant="outline" className="h-11" disabled={busy} onClick={() => setLater((v) => !v)}>Call later</Button>
          {!afterQualify && <Button variant="outline" className="h-11" disabled={busy} onClick={() => log("not_interested")}>Not interested</Button>}
          <Button variant="outline" className="h-11 text-red-700" disabled={busy} onClick={dnc}>Do not call</Button>
        </div>
      )}
      {later && (
        <div className="mt-3 space-y-2 rounded-md border p-3">
          <Label htmlFor={`later-${lead.id}`}>When did they ask you to call back?</Label>
          <Input id={`later-${lead.id}`} type="datetime-local" className="h-11 w-full min-w-0 text-base" value={laterAt} onChange={(e) => setLaterAt(e.target.value)} />
          <Button className="h-11 w-full" disabled={busy || !laterAt} onClick={() => log("call_later", new Date(laterAt).toISOString())}>Save callback</Button>
        </div>
      )}
    </article>
  );
};

const VaCallScreen: React.FC<{ userId: string }> = ({ userId }) => {
  const qc = useQueryClient();
  const [scope, setScope] = useState<"today" | "all">("today");
  const [qualifying, setQualifying] = useState<CallRow | null>(null);
  const list = useQuery({
    queryKey: ["va-call-list", userId, scope],
    queryFn: async () => { const { data, error } = await supabase.rpc("va_call_list", { _scope: scope }); if (error) throw error; return (data ?? []) as CallRow[]; },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["va-call-list"] });

  return (
    <section aria-label="Calls">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-xl font-bold">{scope === "today" ? "Today's calls" : "All my merchants"}</h2>
          <p className="text-sm text-muted-foreground">{scope === "today" ? "Callbacks first, then owners who still owe documents, then new numbers." : "Everyone assigned to you and where they stand."}</p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:w-auto">
          <Button variant={scope === "today" ? "default" : "outline"} className="h-10" onClick={() => setScope("today")}>Today</Button>
          <Button variant={scope === "all" ? "default" : "outline"} className="h-10" onClick={() => setScope("all")}>All</Button>
        </div>
      </div>
      {list.isLoading ? <div className="mt-6 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
        : list.error ? <p className="mt-3 rounded-lg border p-4 text-sm text-red-700">{(list.error as Error).message}</p>
        : (list.data ?? []).length === 0 ? <p className="mt-3 rounded-lg border p-5 text-sm text-muted-foreground">{scope === "today" ? "Nothing due right now. New numbers show up here as they're assigned." : "No merchants assigned yet."}</p>
        : <div className="mt-3 grid gap-3 md:grid-cols-2">{(list.data ?? []).map((lead) => <LeadCard key={lead.id} lead={lead} onQualify={() => setQualifying(lead)} onChanged={refresh} />)}</div>}
      <QualifyDialog lead={qualifying} onClose={() => setQualifying(null)} onDone={refresh} />
    </section>
  );
};

export default VaCallScreen;

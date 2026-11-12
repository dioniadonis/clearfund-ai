import React, { useEffect, useState } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AGENT_RECRUIT_STAGES, leadLabel, type CrmLead } from "@/lib/crm";
import { toast } from "sonner";
import RecruitCsvImport from "./RecruitCsvImport";

const PAGE = 50;
const STATES = "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" ");
const selectClass = "h-11 min-w-0 w-full rounded-md border border-input bg-background px-3 text-base";
type Application = { id: string; crm_lead_id: string | null; quiz_score: number; passed: boolean; status: string; experience: string; find_owners: string; created_at: string };

const RecruitCard: React.FC<{ lead: CrmLead; application?: Application; onSaved: () => void }> = ({ lead, application, onSaved }) => {
  const [stage, setStage] = useState(lead.stage); const [notes, setNotes] = useState(lead.notes ?? ""); const [busy, setBusy] = useState(false);
  useEffect(() => { setStage(lead.stage); setNotes(lead.notes ?? ""); }, [lead.id, lead.stage, lead.notes]);
  const locked = application?.status === "approved";
  const save = async () => {
    setBusy(true);
    if (stage === "rejected" && application?.status === "new") {
      const { error } = await supabase.rpc("agent_reject_application", { _application_id: application.id });
      if (error) { setBusy(false); return toast.error(error.message); }
    }
    const { error } = await supabase.from("crm_leads").update({ stage, notes: notes.trim() || null }).eq("id", lead.id).eq("lead_type", "recruit");
    setBusy(false); if (error) return toast.error(error.message);
    toast.success("Recruit updated"); onSaved();
  };
  const approve = async () => {
    if (!application) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("approve-agent", { body: { application_id: application.id } });
    setBusy(false);
    if (error) return toast.error("Approval could not be confirmed. Check this recruit before retrying.");
    toast.success(data?.invite === "existing_account" ? "Agent approved and existing account linked." : "Agent approved and account invitation sent."); onSaved();
  };
  return <article className="min-w-0 rounded-lg border bg-card p-4 space-y-3"><div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><h3 className="text-lg font-semibold break-words">{leadLabel(lead)}</h3><p className="text-sm text-muted-foreground break-words">{[lead.city,lead.state].filter(Boolean).join(", ") || "No location"} · {lead.source}</p></div><div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full border px-3 py-1">{lead.stage}</span>{application && <span className="rounded-full bg-secondary px-3 py-1">Quiz {application.quiz_score}/5 · {application.passed ? "Passed" : "Rejected"}</span>}</div></div><p className="text-sm break-all">{lead.email || application?.crm_lead_id && "Email stored on application"}{lead.phone ? ` · ${lead.phone}` : ""}</p>{application && <div className="rounded-md bg-secondary/60 p-3 text-sm"><p><strong>Experience:</strong> {application.experience}</p><p className="mt-1 whitespace-pre-wrap break-words"><strong>Finding owners:</strong> {application.find_owners}</p></div>}<div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1"><Label htmlFor={`recruit-stage-${lead.id}`}>Stage</Label><select id={`recruit-stage-${lead.id}`} className={selectClass} value={stage} disabled={locked} onChange={(e) => setStage(e.target.value)}>{AGENT_RECRUIT_STAGES.map((value) => <option key={value} value={value} disabled={value === "approved" && stage !== "approved"}>{value}</option>)}</select></div><div className="space-y-1 sm:col-span-2"><Label htmlFor={`recruit-notes-${lead.id}`}>Notes</Label><Textarea id={`recruit-notes-${lead.id}`} maxLength={2000} className="text-base" value={notes} onChange={(e) => setNotes(e.target.value)} /></div></div><div className="flex flex-col gap-2 sm:flex-row"><Button variant="outline" className="h-11 flex-1" disabled={busy} onClick={save}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save stage and notes"}</Button>{application?.status === "new" && application.passed && <Button className="h-11 flex-1" disabled={busy} onClick={approve}>Approve & create account</Button>}</div></article>;
};

const RecruitsView: React.FC = () => {
  const [search, setSearch] = useState(""); const [debounced, setDebounced] = useState(""); const [state, setState] = useState(""); const [stage, setStage] = useState(""); const [importOpen, setImportOpen] = useState(false);
  const qc = useQueryClient();
  useEffect(() => { const timer = setTimeout(() => setDebounced(search.replace(/[,()*%\\_:"']/g," ").trim().slice(0,100)),300); return () => clearTimeout(timer); }, [search]);
  const recruits = useInfiniteQuery({ queryKey: ["agent_recruits",debounced,state,stage], initialPageParam: 0, queryFn: async ({ pageParam }) => {
    let query = supabase.from("crm_leads").select("*").eq("lead_type","recruit");
    if (debounced) query = query.or(["firm","contact_name","email","phone","city","state","sector"].map((column) => `${column}.ilike.*${debounced}*`).join(","));
    if (state) query = query.eq("state",state); if (stage) query = query.eq("stage",stage);
    const { data, error } = await query.order("created_at",{ascending:false}).order("id").range(pageParam*PAGE,pageParam*PAGE+PAGE-1);
    if (error) throw error; return data as CrmLead[];
  }, getNextPageParam: (last,all) => last.length === PAGE ? all.length : undefined });
  const rows = recruits.data?.pages.flat() ?? [];
  const leadIds = rows.map((row) => row.id);
  const applications = useQuery({ queryKey: ["agent_applications",leadIds], enabled: leadIds.length > 0, queryFn: async () => {
    const { data, error } = await supabase.from("agent_applications").select("id,crm_lead_id,quiz_score,passed,status,experience,find_owners,created_at").in("crm_lead_id",leadIds);
    if (error) throw error; return data as Application[];
  } });
  const byLead = new Map((applications.data ?? []).map((application) => [application.crm_lead_id,application]));
  const refresh = () => { qc.invalidateQueries({ queryKey: ["agent_recruits"] }); qc.invalidateQueries({ queryKey: ["agent_applications"] }); };

  return <div className="space-y-4"><div className="flex flex-col gap-2 sm:flex-row"><div className="flex-1"><Input aria-label="Search recruits" placeholder="Search recruits" className="h-11 text-base" value={search} onChange={(e) => setSearch(e.target.value)} /></div><Button variant="outline" className="h-11 shrink-0" onClick={() => setImportOpen(true)}><Upload className="mr-2 h-4 w-4" />Import CSV</Button></div><div className="grid gap-2 sm:grid-cols-2"><select aria-label="Recruit state" className={selectClass} value={state} onChange={(e) => setState(e.target.value)}><option value="">All states</option>{STATES.map((value) => <option key={value}>{value}</option>)}</select><select aria-label="Recruit stage" className={selectClass} value={stage} onChange={(e) => setStage(e.target.value)}><option value="">All stages</option>{AGENT_RECRUIT_STAGES.map((value) => <option key={value}>{value}</option>)}</select></div>{recruits.error && <p role="alert" className="text-destructive">Couldn't load recruits: {(recruits.error as Error).message}</p>}{recruits.isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : rows.length === 0 ? <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">No recruits match these filters.</div> : <div className="grid gap-3">{rows.map((lead) => <RecruitCard key={lead.id} lead={lead} application={byLead.get(lead.id)} onSaved={refresh} />)}</div>}{recruits.hasNextPage && <Button variant="outline" className="h-11 w-full" disabled={recruits.isFetchingNextPage} onClick={() => recruits.fetchNextPage()}>{recruits.isFetchingNextPage ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load more"}</Button>}<RecruitCsvImport open={importOpen} onOpenChange={setImportOpen} /></div>;
};
export default RecruitsView;

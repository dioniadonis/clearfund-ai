import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const JOB_TYPES = ["find_email", "score", "first_line", "outreach"] as const;
const LABEL: Record<string, string> = { find_email: "Find email", score: "Score", first_line: "First line", outreach: "Outreach" };
type Stat = { remaining: number; in_progress: number; stale: number; done_today: number; stuck: number };
const ago = (t: string | null) => {
  if (!t) return "never";
  const m = Math.round((Date.now() - new Date(t).getTime()) / 60000);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
};
const card = "rounded-lg border p-3 min-w-0 break-words";

const WorkersView: React.FC<{ onOpen: (id: string) => void }> = ({ onOpen }) => {
  const qc = useQueryClient();
  const [srcFilter, setSrcFilter] = useState<string>("");
  const [confirm, setConfirm] = useState<{ title: string; run: () => Promise<unknown> } | null>(null);
  const [newSrc, setNewSrc] = useState(""); const [newParams, setNewParams] = useState("");

  const q = useQuery({
    queryKey: ["crm_workers"],
    queryFn: async () => {
      const since = new Date(Date.now() - 864e5).toISOString();
      const [stats, jobs, sources, calls, rejects] = await Promise.all([
        supabase.rpc("crm_worker_stats"),
        supabase.from("crm_jobs").select("id, lead_id, job_type, status, claimed_by, claimed_at, expires_at, attempts, finished_at").order("claimed_at", { ascending: false }).limit(2000),
        supabase.from("crm_sources").select("*").order("updated_at", { ascending: false }).limit(500),
        supabase.from("crm_worker_calls").select("worker, created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(5000),
        supabase.from("crm_lead_rejects").select("id, found_by, reason, existing_lead_id, payload, created_at").is("dismissed_at", null).order("created_at", { ascending: false }).limit(100),
      ]);
      const err = stats.error ?? jobs.error ?? sources.error ?? calls.error ?? rejects.error;
      if (err) throw err;
      return { stats: stats.data as unknown as Record<string, Stat>, jobs: jobs.data!, sources: sources.data!, calls: calls.data!, rejects: rejects.data! };
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["crm_workers"] });
  const act = async (p: PromiseLike<{ error: { message: string } | null }>) => {
    const { error } = await p; if (error) toast.error(error.message); else toast.success("Saved"); refresh();
  };

  if (q.isLoading) return <Loader2 className="h-6 w-6 animate-spin" />;
  if (q.error) return <p className="text-destructive">Couldn't load workers: {(q.error as Error).message}</p>;
  const { stats, jobs, sources, calls, rejects } = q.data!;
  const now = Date.now(); const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
  const isStale = (j: { status: string; expires_at: string | null }) => j.status === "claimed" && !!j.expires_at && new Date(j.expires_at).getTime() < now;

  const workers = new Map<string, { last: string | null; active: number; doneToday: number }>();
  const w = (n: string) => workers.get(n) ?? (workers.set(n, { last: null, active: 0, doneToday: 0 }), workers.get(n)!);
  for (const c of calls) { const x = w(c.worker); if (!x.last || c.created_at > x.last) x.last = c.created_at; }
  for (const j of jobs) {
    const x = w(j.claimed_by);
    if (j.status === "claimed" && !isStale(j)) x.active++;
    if (j.status === "done" && j.finished_at && new Date(j.finished_at) >= dayStart) x.doneToday++;
  }
  const staleJobs = jobs.filter(isStale);
  const staleSources = sources.filter(isStale);
  const shownSources = srcFilter ? sources.filter((s) => s.status === srcFilter) : sources;

  return (
    <div className="space-y-6">
      <div className="flex justify-end"><Button variant="outline" className="h-11" onClick={refresh}><RefreshCw className="h-4 w-4 mr-1" />Refresh</Button></div>

      <section aria-label="Job progress" className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {JOB_TYPES.map((t) => { const s = stats?.[t]; return (
          <div key={t} className={card}>
            <p className="font-semibold">{LABEL[t]}</p>
            <p className="text-2xl font-bold">{s?.remaining ?? 0}<span className="text-xs font-normal text-muted-foreground"> left</span></p>
            <p className="text-xs text-muted-foreground">{s?.in_progress ?? 0} in progress · {s?.done_today ?? 0} done today</p>
            {(s?.stale || s?.stuck) ? <p className="text-xs text-destructive">{s.stale} stale · {s.stuck} stuck</p> : null}
          </div>); })}
      </section>

      <section aria-label="Workers" className="space-y-2">
        <h2 className="font-semibold">Workers</h2>
        {workers.size === 0 ? <p className="text-sm text-muted-foreground">No worker has connected yet.</p> :
          [...workers].map(([name, x]) => (
            <div key={name} className={card}>
              <p className="font-medium">{name}</p>
              <p className="text-sm text-muted-foreground">Last seen {ago(x.last)} · {x.active} active claims · {x.doneToday} done today</p>
            </div>))}
      </section>

      <section aria-label="Stale claims" className="space-y-2">
        <h2 className="font-semibold">Stale claims</h2>
        {staleJobs.length + staleSources.length === 0 ? <p className="text-sm text-muted-foreground">None. Expired claims also free up on their own.</p> : <>
          {staleJobs.map((j) => (
            <div key={j.id} className={`${card} flex items-center justify-between gap-2`}>
              <button type="button" className="text-left min-w-0" onClick={() => onOpen(j.lead_id)}>
                <p className="text-sm font-medium">{LABEL[j.job_type]} · {j.claimed_by}</p>
                <p className="text-xs text-muted-foreground">Claimed {ago(j.claimed_at)} · attempt {j.attempts}</p>
              </button>
              <Button variant="outline" className="h-11 shrink-0" onClick={() => setConfirm({ title: `Release this ${LABEL[j.job_type]} claim?`, run: () => act(supabase.rpc("crm_admin_release", { _kind: "job", _id: j.id })) })}>Release</Button>
            </div>))}
          {staleSources.map((s) => (
            <div key={s.id} className={`${card} flex items-center justify-between gap-2`}>
              <div className="min-w-0"><p className="text-sm font-medium">{s.source} · {s.claimed_by}</p><p className="text-xs text-muted-foreground">Claimed {ago(s.claimed_at)}</p></div>
              <Button variant="outline" className="h-11 shrink-0" onClick={() => setConfirm({ title: "Release this source slice?", run: () => act(supabase.rpc("crm_admin_release", { _kind: "source", _id: s.id })) })}>Release</Button>
            </div>))}
        </>}
      </section>

      <section aria-label="Sources" className="space-y-2">
        <h2 className="font-semibold">Sources</h2>
        <div role="group" aria-label="Filter sources" className="flex flex-wrap gap-2">
          {["", "open", "claimed", "done", "blocked"].map((st) => (
            <button key={st || "all"} type="button" aria-pressed={srcFilter === st} onClick={() => setSrcFilter(st)}
              className={`h-10 px-3 rounded-full border text-sm ${srcFilter === st ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}>
              {st || "All"} <span className="opacity-70">{st ? sources.filter((s) => s.status === st).length : sources.length}</span>
            </button>))}
        </div>
        <form className="grid grid-cols-1 sm:grid-cols-3 gap-2" onSubmit={(e) => {
          e.preventDefault();
          let params: Record<string, string> = {};
          try { params = Object.fromEntries(newParams.split(",").map((p) => p.split("=").map((x) => x.trim())).filter(([k, v]) => k && v)); } catch { /* ignore */ }
          if (!newSrc.trim() || !Object.keys(params).length) return toast.error("Enter a source and params like state=GA, naics=23");
          act(supabase.rpc("crm_admin_add_source", { _source: newSrc, _params: params, _refresh_days: 30 })); setNewSrc(""); setNewParams("");
        }}>
          <Input aria-label="Source name" placeholder="Source, e.g. sba_search" className="h-11 text-base" value={newSrc} onChange={(e) => setNewSrc(e.target.value)} />
          <Input aria-label="Slice params" placeholder="state=GA, naics=23, years=2017-2025" className="h-11 text-base" value={newParams} onChange={(e) => setNewParams(e.target.value)} />
          <Button type="submit" variant="outline" className="h-11">Add slice</Button>
        </form>
        {shownSources.length === 0 ? <p className="text-sm text-muted-foreground">No slices yet. Add one above or let a worker register them.</p> :
          shownSources.map((s) => {
            const next = s.last_run_at ? new Date(new Date(s.last_run_at).getTime() + s.refresh_days * 864e5).toLocaleDateString() : "now";
            return (
              <div key={s.id} className={`${card} space-y-1`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium min-w-0">{s.source}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${s.status === "blocked" ? "text-destructive border-destructive" : ""}`}>{s.status}</span>
                </div>
                <p className="text-sm">{Object.entries((s.params ?? {}) as Record<string, unknown>).map(([k, v]) => `${k}: ${String(v)}`).join(" · ")}</p>
                <p className="text-xs text-muted-foreground">
                  {s.claimed_by ? `Claimed by ${s.claimed_by} · ` : ""}Last run {ago(s.last_run_at)} · {s.leads_found} found / {s.new_leads} new · next refresh {s.status === "blocked" ? "never" : next}
                </p>
                {s.notes && <p className="text-xs text-muted-foreground">{s.notes}</p>}
                <div className="flex flex-wrap gap-2 pt-1">
                  {s.status !== "blocked"
                    ? <Button variant="outline" className="h-10" onClick={() => setConfirm({ title: "Block this slice? Workers will never get it again until reopened.", run: () => act(supabase.rpc("crm_admin_set_source_status", { _id: s.id, _status: "blocked" })) })}>Block</Button>
                    : <Button variant="outline" className="h-10" onClick={() => setConfirm({ title: "Reopen this slice?", run: () => act(supabase.rpc("crm_admin_set_source_status", { _id: s.id, _status: "open" })) })}>Reopen</Button>}
                </div>
              </div>);
          })}
      </section>

      <section aria-label="Rejected duplicates" className="space-y-2">
        <h2 className="font-semibold">Rejected duplicates</h2>
        <p className="text-xs text-muted-foreground">Leads a worker found that matched an existing lead. If a match is wrong (two different firms), add the lead by hand with a distinguishing name.</p>
        {rejects.length === 0 ? <p className="text-sm text-muted-foreground">None.</p> : rejects.map((r) => {
          const p = r.payload as Record<string, string>;
          return (
            <div key={r.id} className={`${card} flex items-center justify-between gap-2`}>
              <button type="button" className="text-left min-w-0" onClick={() => r.existing_lead_id && onOpen(r.existing_lead_id)}>
                <p className="text-sm font-medium">{p.firm ?? p.company ?? p.email ?? p.website ?? "Lead"}{p.state ? ` (${p.state})` : ""}</p>
                <p className="text-xs text-muted-foreground">Matched on {r.reason?.replace("_", " + ")} · found by {r.found_by} · {ago(r.created_at)}</p>
              </button>
              <Button variant="ghost" className="h-11 shrink-0" onClick={() => act(supabase.rpc("crm_admin_dismiss_reject", { _id: r.id }))}>Dismiss</Button>
            </div>);
        })}
      </section>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{confirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>Your name and the time are recorded.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="h-11">Cancel</AlertDialogCancel>
            <AlertDialogAction className="h-11" onClick={() => { confirm?.run(); setConfirm(null); }}>Confirm</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WorkersView;

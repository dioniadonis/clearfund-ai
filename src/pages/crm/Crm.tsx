import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Papa from "papaparse";
import { Loader2, LogOut, Upload, Download, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useOperatorAuth } from "@/hooks/useOperatorAuth";
import { CRM_STAGES, CRM_SOURCES, todayIso, type CrmAgent, type CrmLead } from "@/lib/crm";
import LeadList from "@/components/crm/LeadList";
import ActivityView from "@/components/crm/ActivityView";
import LeadDrawer from "@/components/crm/LeadDrawer";
import CsvImport from "@/components/crm/CsvImport";
import WorkersView from "@/components/crm/WorkersView";
import LiveView from "@/components/crm/LiveView";
import { toast } from "sonner";

type CrmRole = "loading" | "admin" | "agent" | "none";
const sel = "h-11 rounded-md border border-input bg-background px-3 text-base min-w-0";

function useCrmRole(userId: string | null): CrmRole {
  const [role, setRole] = useState<CrmRole>("loading");
  useEffect(() => {
    let live = true;
    if (!userId) { setRole("none"); return; }
    setRole("loading");
    supabase.from("user_roles").select("role").eq("user_id", userId).then(({ data, error }) => {
      if (!live) return;
      const roles = (data ?? []).map((r) => r.role as string);
      setRole(error ? "none" : roles.includes("admin") ? "admin" : roles.includes("agent") ? "agent" : "none");
    });
    return () => { live = false; };
  }, [userId]);
  return role;
}

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <form className="w-full max-w-sm border rounded-lg p-6 space-y-4" onSubmit={async (e) => {
        e.preventDefault(); setErr(null); setBusy(true);
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        setBusy(false); if (error) setErr("Sign in failed. Check the email and password.");
      }}>
        <h1 className="text-xl font-semibold">ClearFund CRM sign in</h1>
        <div className="space-y-1"><Label htmlFor="crm-email">Email</Label><Input id="crm-email" type="email" autoComplete="email" className="h-11 text-base" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div className="space-y-1"><Label htmlFor="crm-pass">Password</Label><Input id="crm-pass" type="password" autoComplete="current-password" className="h-11 text-base" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <Button type="submit" className="w-full h-12" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}</Button>
        <p className="text-xs text-muted-foreground">Accounts are created by the owner. There is no public sign-up.</p>
      </form>
    </div>
  );
};

const Crm: React.FC = () => {
  useEffect(() => {
    document.title = "CRM | ClearFund";
    const m = document.createElement("meta"); m.name = "robots"; m.content = "noindex, nofollow"; document.head.appendChild(m);
    // The public site chat bubble covers CRM controls; hide it on this private page only.
    const st = document.createElement("style"); st.textContent = "#chat_app{display:none!important}"; document.head.appendChild(st);
    return () => { m.remove(); st.remove(); };
  }, []);
  const { session, sessionLoading, signOut } = useOperatorAuth();
  const userId = session?.user.id ?? null;
  const role = useCrmRole(userId);
  const qc = useQueryClient();
  const enabled = role === "admin" || role === "agent";

  const leadsQ = useQuery({
    queryKey: ["crm_leads", userId], enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_leads").select("*").order("created_at", { ascending: false }).limit(5000);
      if (error) throw error; return data as CrmLead[];
    },
  });
  const agentsQ = useQuery({
    queryKey: ["crm_agents", userId], enabled,
    queryFn: async () => { const { data, error } = await supabase.rpc("crm_list_agents"); if (error) throw error; return data as CrmAgent[]; },
  });

  const [q, setQ] = useState(""); const [stage, setStage] = useState(""); const [source, setSource] = useState("");
  const [agent, setAgent] = useState(""); const [due, setDue] = useState<"" | "today" | "overdue">("");
  const [openId, setOpenId] = useState<string | null>(null); const [importOpen, setImportOpen] = useState(false);

  const leads = leadsQ.data ?? [];
  const today = todayIso();
  const baseFiltered = useMemo(() => leads.filter((l) => {
    const s = q.trim().toLowerCase();
    if (s && ![l.firm, l.contact_name, l.email, l.phone, l.agency, l.notes, l.lead_ref, l.website, l.state, l.sector].some((v) => v?.toLowerCase().includes(s))) return false;
    if (source && l.source !== source) return false;
    if (agent === "unassigned" ? l.assigned_to : agent && l.assigned_to !== agent) return false;
    if (due === "today" && l.next_follow_up !== today) return false;
    if (due === "overdue" && !(l.next_follow_up && l.next_follow_up < today)) return false;
    return true;
  }), [leads, q, source, agent, due, today]);
  const filtered = useMemo(() => (stage ? baseFiltered.filter((l) => l.stage === stage) : baseFiltered), [baseFiltered, stage]);
  const [showFilters, setShowFilters] = useState(false);
  const [tab, setTab] = useState("activity"); const [pulse, setPulse] = useState(false);
  const tabRef = React.useRef(tab); tabRef.current = tab;
  const onLiveNew = React.useCallback(() => { if (tabRef.current !== "live") setPulse(true); }, []);
  const activeFilters = [source, agent, due].filter(Boolean).length;

  const weekAgo = Date.now() - 7 * 864e5;
  const stats = {
    overdue: leads.filter((l) => l.next_follow_up && l.next_follow_up < today).length,
    dueToday: leads.filter((l) => l.next_follow_up === today).length,
    week: leads.filter((l) => new Date(l.created_at).getTime() >= weekAgo).length,
  };

  const move = async (id: string, to: string) => {
    qc.setQueryData<CrmLead[]>(["crm_leads", userId], (old) => old?.map((l) => (l.id === id ? { ...l, stage: to } : l)));
    const { error } = await supabase.from("crm_leads").update({ stage: to }).eq("id", id);
    if (error) toast.error(`Couldn't move lead: ${error.message}`);
    qc.invalidateQueries({ queryKey: ["crm_leads"] });
    qc.invalidateQueries({ queryKey: ["crm_activities", id] });
    qc.invalidateQueries({ queryKey: ["crm_activity_feed"] });
  };

  const exportCsv = () => {
    const csv = Papa.unparse(filtered.map(({ id, firm, contact_name, email, phone, agency, award_amount, award_date, source, stage, assigned_to, next_follow_up, notes, lead_ref, created_at }) =>
      ({ id, firm, contact_name, email, phone, agency, award_amount, award_date, source, stage,
        assigned_to: agentsQ.data?.find((a) => a.id === assigned_to)?.email ?? assigned_to ?? "", next_follow_up, notes, lead_ref, created_at })));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `crm-leads-${today}.csv`; a.click(); URL.revokeObjectURL(a.href);
  };

  if (sessionLoading || (session && role === "loading"))
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /><span className="sr-only">Checking access</span></div>;
  if (!session) return <LoginForm />;
  if (!enabled)
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-sm border rounded-lg p-6 text-center space-y-4">
          <h1 className="text-xl font-semibold">No CRM access</h1>
          <p className="text-sm text-muted-foreground">{session.user.email} is signed in but hasn't been given an admin or agent role.</p>
          <Button variant="outline" className="h-11" onClick={signOut}>Sign out</Button>
        </div>
      </div>
    );

  const openLead = leads.find((l) => l.id === openId) ?? null;
  const agents = agentsQ.data ?? [];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
          <h1 className="font-bold text-lg text-primary">ClearFund CRM</h1>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-sm text-muted-foreground">{session.user.email} · {role}</span>
            <Button variant="ghost" className="h-11" onClick={signOut} aria-label="Sign out"><LogOut className="h-4 w-4" /><span className="hidden sm:inline ml-1">Sign out</span></Button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-4 space-y-4 pb-28">
        {leadsQ.isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : leadsQ.error ? (
          <p className="text-destructive">Couldn't load leads: {(leadsQ.error as Error).message}</p>
        ) : (
          <Tabs value={tab} onValueChange={(v) => { setTab(v); if (v === "live") setPulse(false); }}>
            <TabsList className={`w-full sm:w-auto grid ${role === "admin" ? "grid-cols-4" : "grid-cols-2"}`}><TabsTrigger value="activity" className="h-10">Activity</TabsTrigger><TabsTrigger value="leads" className="h-10">Leads</TabsTrigger>{role === "admin" && <TabsTrigger value="live" className="h-10 relative">Live{pulse && <span aria-label="New leads" className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary animate-pulse" />}</TabsTrigger>}{role === "admin" && <TabsTrigger value="workers" className="h-10">Workers</TabsTrigger>}</TabsList>
            {role === "admin" && <TabsContent value="live" forceMount hidden={tab !== "live"}><LiveView onOpen={setOpenId} onNew={onLiveNew} /></TabsContent>}
            {role === "admin" && <TabsContent value="workers"><WorkersView onOpen={setOpenId} /></TabsContent>}
            <TabsContent value="activity"><ActivityView leads={leads} isAdmin={role === "admin"} onOpen={setOpenId} userId={userId!} /></TabsContent>
            <TabsContent value="leads" className="space-y-3">
              <section aria-label="Lead summary" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {([["Total", leads.length], ["Due today", stats.dueToday], ["Overdue", stats.overdue], ["Added this week", stats.week]] as const).map(([k, v]) => (
                  <div key={k} className="rounded-lg border p-3 min-w-0"><p className="text-xl font-bold">{v}</p><p className="text-xs text-muted-foreground">{k}</p></div>
                ))}
              </section>
              <div className="flex gap-2">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input aria-label="Search leads" placeholder="Search" className="h-11 pl-9 text-base" value={q} onChange={(e) => setQ(e.target.value)} />
                </div>
                <Button variant="outline" className="h-11 shrink-0" aria-expanded={showFilters} onClick={() => setShowFilters((v) => !v)}>
                  <SlidersHorizontal className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Filters</span>{activeFilters > 0 && <span className="ml-1">({activeFilters})</span>}
                </Button>
              </div>
              {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select aria-label="Source" className={sel} value={source} onChange={(e) => setSource(e.target.value)}><option value="">All sources</option>{CRM_SOURCES.map((s) => <option key={s}>{s}</option>)}</select>
                  <select aria-label="Assigned agent" className={sel} value={agent} onChange={(e) => setAgent(e.target.value)}>
                    <option value="">All agents</option><option value="unassigned">Unassigned</option>{agents.map((a) => <option key={a.id} value={a.id}>{a.email ?? a.id}</option>)}
                  </select>
                  <select aria-label="Follow-up" className={sel} value={due} onChange={(e) => setDue(e.target.value as typeof due)}>
                    <option value="">Any follow-up</option><option value="today">Due today</option><option value="overdue">Overdue</option>
                  </select>
                  <div className="flex flex-wrap gap-2 sm:col-span-3">
                    <Button variant="outline" className="h-11" onClick={exportCsv}><Download className="h-4 w-4 mr-1" />Export CSV</Button>
                    {role === "admin" && <Button variant="outline" className="h-11" onClick={() => setImportOpen(true)}><Upload className="h-4 w-4 mr-1" />Import CSV</Button>}
                  </div>
                </div>
              )}
              <div role="group" aria-label="Filter by stage" className="flex flex-wrap gap-2">
                {([["", "All", baseFiltered.length], ...CRM_STAGES.map((st) => [st, st, baseFiltered.filter((l) => l.stage === st).length])] as [string, string, number][]).map(([val, label, n]) => (
                  <button key={label} type="button" aria-pressed={stage === val} onClick={() => setStage(val)}
                    className={`h-10 px-3 rounded-full border text-sm ${stage === val ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}>
                    {label} <span className="opacity-70">{n}</span>
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">{filtered.length} leads</p>
              <LeadList leads={filtered} onOpen={setOpenId} onMove={move} />
            </TabsContent>
          </Tabs>
        )}
      </main>
      <LeadDrawer lead={openLead} onClose={() => setOpenId(null)} agents={agents} isAdmin={role === "admin"} userId={userId!} />
      {role === "admin" && <CsvImport open={importOpen} onOpenChange={setImportOpen} />}
    </div>
  );
};

export default Crm;

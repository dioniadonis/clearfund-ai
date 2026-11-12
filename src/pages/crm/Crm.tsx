import ProductsView from "@/components/crm/ProductsView";
import RecruitsView from "@/components/crm/RecruitsView";
import AgentProgramView from "@/components/crm/AgentProgramView";
import React, { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import Papa from "papaparse";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, LogOut, Upload, Download, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useOperatorAuth } from "@/hooks/useOperatorAuth";
import { RECRUIT_STAGES, CRM_STAGES, CRM_SOURCES, todayIso, type CrmAgent, type CrmLead } from "@/lib/crm";
import LeadList from "@/components/crm/LeadList";
import ActivityView from "@/components/crm/ActivityView";
import LeadDrawer from "@/components/crm/LeadDrawer";
import CsvImport from "@/components/crm/CsvImport";
import WorkersView from "@/components/crm/WorkersView";
import LiveView from "@/components/crm/LiveView";
import CrmWebTools from "@/components/crm/CrmWebTools";
import { oauthReturnPath } from "@/lib/oauth-return-path";
import { toast } from "sonner";

type CrmRole = "loading" | "admin" | "agent" | "none";
const PAGE = 50;
type Filters = { kind: "client" | "partner"; q: string; stage: string; source: string; agent: string; due: "" | "today" | "overdue"; warm: boolean; today: string };
type Counts = { total: number; due_today: number; overdue: number; added_week: number; by_stage: Record<string, number> };
// Strip characters that break PostgREST or() syntax / act as wildcards; RPC receives the same cleaned string.
const cleanQ = (q: string) => q.replace(/[,()*%\\_:"']/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFilters(query: any, f: Filters) {
  if (f.q) query = query.or(["firm", "contact_name", "email", "phone", "agency", "lead_ref", "website", "state", "sector"].map((c) => `${c}.ilike.*${f.q}*`).join(","));
  query = f.kind === "partner" ? query.eq("lead_type", "partner") : query.or("lead_type.is.null,and(lead_type.neq.partner,lead_type.neq.recruit)");
  if (f.warm) query = query.not("warm_reason", "is", null);
  if (f.stage) query = query.eq("stage", f.stage);
  if (f.source) query = query.eq("source", f.source);
  if (f.agent === "unassigned") query = query.is("assigned_to", null); else if (f.agent) query = query.eq("assigned_to", f.agent);
  if (f.due === "today") query = query.eq("next_follow_up", f.today); else if (f.due === "overdue") query = query.lt("next_follow_up", f.today);
  return query;
}
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
  const enabled = role === "admin";
  const nextPath = oauthReturnPath(searchParams.get("next"));

  useEffect(() => {
    if (enabled && searchParams.has("next")) navigate(nextPath, { replace: true });
  }, [enabled, navigate, nextPath, searchParams]);

  const agentsQ = useQuery({
    queryKey: ["crm_agents", userId], enabled,
    queryFn: async () => { const { data, error } = await supabase.rpc("crm_list_agents"); if (error) throw error; return data as CrmAgent[]; },
  });

  const [kind, setKind] = useState<"client" | "partner">("client");
  const [q, setQ] = useState(""); const [stage, setStage] = useState(""); const [source, setSource] = useState("");
  const [agent, setAgent] = useState(""); const [due, setDue] = useState<"" | "today" | "overdue">(""); const [warm, setWarm] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null); const [importOpen, setImportOpen] = useState(false);

  const today = todayIso();
  const [debQ, setDebQ] = useState("");
  useEffect(() => { const t = setTimeout(() => setDebQ(cleanQ(q)), 300); return () => clearTimeout(t); }, [q]);
  const filters: Filters = { kind, q: debQ, stage, source, agent, due, warm, today };
  const leadsQ = useInfiniteQuery({
    queryKey: ["crm_leads", userId, filters], enabled, initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await applyFilters(supabase.from("crm_leads").select("*"), filters)
        .order("created_at", { ascending: false }).order("id").range(pageParam * PAGE, pageParam * PAGE + PAGE - 1);
      if (error) throw error; return data as CrmLead[];
    },
    getNextPageParam: (last, all) => (last.length === PAGE ? all.length : undefined),
  });
  const countsQ = useQuery({
    queryKey: ["crm_lead_counts", userId, kind, debQ, source, agent, due, warm, today], enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("crm_lead_counts_v2", { _today: today, _q: debQ || null, _source: source || null, _agent: agent || null, _due: due || null, _type: kind, _warm: warm });
      if (error) throw error; return data as unknown as Counts;
    },
  });
  const openLeadQ = useQuery({
    queryKey: ["crm_lead", openId], enabled: enabled && !!openId,
    queryFn: async () => { const { data, error } = await supabase.from("crm_leads").select("*").eq("id", openId!).maybeSingle(); if (error) throw error; return data as CrmLead | null; },
  });
  const leads = useMemo(() => leadsQ.data?.pages.flat() ?? [], [leadsQ.data]);
  const counts = countsQ.data;
  const byStage = counts?.by_stage ?? {};
  const allMatching = Object.values(byStage).reduce((a, n) => a + n, 0);
  const matching = stage ? byStage[stage] ?? 0 : allMatching;
  const [showFilters, setShowFilters] = useState(false);
  const [tab, setTab] = useState("activity"); const [pulse, setPulse] = useState(false);
  const tabRef = React.useRef(tab); tabRef.current = tab;
  const onLiveNew = React.useCallback(() => { if (tabRef.current !== "live") setPulse(true); }, []);
  const activeFilters = [source, agent, due, warm].filter(Boolean).length;

  const move = async (id: string, to: string) => {
    qc.setQueriesData<{ pages: CrmLead[][] }>({ queryKey: ["crm_leads", userId] }, (old) => old && { ...old, pages: old.pages.map((pg) => pg.map((l) => (l.id === id ? { ...l, stage: to } : l))) });
    const { error } = await supabase.from("crm_leads").update({ stage: to }).eq("id", id);
    if (error) toast.error(`Couldn't move lead: ${error.message}`);
    qc.invalidateQueries({ queryKey: ["crm_leads"] });
    qc.invalidateQueries({ queryKey: ["crm_lead_counts"] });
    qc.invalidateQueries({ queryKey: ["crm_lead", id] });
    qc.invalidateQueries({ queryKey: ["crm_activities", id] });
    qc.invalidateQueries({ queryKey: ["crm_activity_feed"] });
  };

  const [exporting, setExporting] = useState(false);
  const exportCsv = async () => {
    setExporting(true);
    const rows: CrmLead[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await applyFilters(supabase.from("crm_leads").select("*"), filters)
        .order("created_at", { ascending: false }).order("id").range(from, from + 999);
      if (error) { setExporting(false); toast.error(`Export failed: ${error.message}`); return; }
      rows.push(...(data as CrmLead[])); if (data.length < 1000) break;
    }
    setExporting(false);
    const csv = Papa.unparse(rows.map(({ id, firm, contact_name, email, phone, agency, award_amount, award_date, source, stage, assigned_to, next_follow_up, notes, lead_ref, created_at }) =>
      ({ id, firm, contact_name, email, phone, agency, award_amount, award_date, source, stage,
        assigned_to: agentsQ.data?.find((a) => a.id === assigned_to)?.email ?? assigned_to ?? "", next_follow_up, notes, lead_ref, created_at })));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `crm-leads-${today}.csv`; a.click(); URL.revokeObjectURL(a.href);
  };

  if (sessionLoading || (session && role === "loading"))
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /><span className="sr-only">Checking access</span></div>;
  if (!session) return <LoginForm />;
  if (role === "agent") return <Navigate to="/agent" replace />;
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

  const openLead = leads.find((l) => l.id === openId) ?? openLeadQ.data ?? null;
  const agents = agentsQ.data ?? [];

  return (
    <div className="min-h-screen bg-background">
      <CrmWebTools
        activeTab={tab}
        filteredLeads={leads}
        loading={leadsQ.isLoading}
        onChangeTab={(nextTab) => { setTab(nextTab); if (nextTab === "live") setPulse(false); }}
        onFilterStage={setStage}
      />
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
        {leadsQ.error ? (
          <p className="text-destructive">Couldn't load leads: {(leadsQ.error as Error).message}</p>
        ) : (
          <Tabs value={tab} onValueChange={(v) => { setTab(v); if (v === "live") setPulse(false); }}>
            <TabsList className="grid h-auto w-full grid-cols-3 sm:w-auto sm:grid-cols-7"><TabsTrigger value="activity" className="h-10">Activity</TabsTrigger><TabsTrigger value="leads" className="h-10">Leads</TabsTrigger><TabsTrigger value="recruits" className="h-10">Recruits</TabsTrigger>{role === "admin" && <TabsTrigger value="agents" className="h-10">Agents</TabsTrigger>}{role === "admin" && <TabsTrigger value="live" className="h-10 relative">Live{pulse && <span aria-label="New leads" className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary animate-pulse" />}</TabsTrigger>}{role === "admin" && <TabsTrigger value="workers" className="h-10">Workers</TabsTrigger>}{role === "admin" && <TabsTrigger value="products" className="h-10">Products</TabsTrigger>}</TabsList>
            <TabsContent value="recruits"><RecruitsView /></TabsContent>
            {role === "admin" && <TabsContent value="agents"><AgentProgramView /></TabsContent>}
            {role === "admin" && <TabsContent value="live" forceMount hidden={tab !== "live"}><LiveView onOpen={setOpenId} onNew={onLiveNew} /></TabsContent>}
            {role === "admin" && <TabsContent value="products"><ProductsView /></TabsContent>}
            {role === "admin" && <TabsContent value="workers"><WorkersView onOpen={setOpenId} /></TabsContent>}
            <TabsContent value="activity"><ActivityView isAdmin={role === "admin"} onOpen={setOpenId} userId={userId!} /></TabsContent>
            <TabsContent value="leads" className="space-y-3">
              <div role="group" aria-label="Lead type" className="flex flex-wrap gap-2">
                {([["client", "Clients"], ["partner", "Recruits"]] as const).map(([v, label]) => (
                  <button key={v} type="button" aria-pressed={kind === v} onClick={() => { setKind(v); setStage(""); }}
                    className={`h-10 px-4 rounded-md border text-sm font-medium ${kind === v ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}>{label}</button>
                ))}
              </div>
              <section aria-label="Lead summary" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {([["Total", counts?.total], ["Due today", counts?.due_today], ["Overdue", counts?.overdue], ["Added this week", counts?.added_week]] as const).map(([k, v]) => (
                  <div key={k} className="rounded-lg border p-3 min-w-0"><p className="text-xl font-bold">{v === undefined ? "…" : v.toLocaleString()}</p><p className="text-xs text-muted-foreground">{k}</p></div>
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
                    <Button variant="outline" className="h-11" disabled={exporting} onClick={exportCsv}>{exporting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}Export CSV</Button>
                    {role === "admin" && <Button variant="outline" className="h-11" onClick={() => setImportOpen(true)}><Upload className="h-4 w-4 mr-1" />Import CSV</Button>}
                  </div>
                </div>
              )}
              <div role="group" aria-label="Filter by stage" className="flex flex-wrap gap-2">
                {([["", "All", allMatching], ...(kind === "partner" ? RECRUIT_STAGES : CRM_STAGES).map((st) => [st, st, byStage[st] ?? 0])] as [string, string, number][]).map(([val, label, n]) => (
                  <button key={label} type="button" aria-pressed={stage === val} onClick={() => setStage(val)}
                    className={`h-10 px-3 rounded-full border text-sm ${stage === val ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}>
                    {label} <span className="opacity-70">{countsQ.data ? n.toLocaleString() : "…"}</span>
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">Showing {leads.length.toLocaleString()}{countsQ.data ? ` of ${matching.toLocaleString()}` : ""} leads</p>
              {leadsQ.isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <LeadList leads={leads} onOpen={setOpenId} onMove={move} />}
              {leadsQ.hasNextPage && (
                <Button variant="outline" className="w-full h-11" disabled={leadsQ.isFetchingNextPage} onClick={() => leadsQ.fetchNextPage()}>
                  {leadsQ.isFetchingNextPage ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load more"}
                </Button>
              )}
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

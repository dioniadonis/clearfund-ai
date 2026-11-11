import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Papa from "papaparse";
import { Loader2, LogOut, Upload, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useOperatorAuth } from "@/hooks/useOperatorAuth";
import { CRM_STAGES, CRM_SOURCES, fmtMoney, leadLabel, todayIso, type CrmAgent, type CrmLead } from "@/lib/crm";
import CrmBoard from "@/components/crm/CrmBoard";
import LeadDrawer from "@/components/crm/LeadDrawer";
import CsvImport from "@/components/crm/CsvImport";
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
  const filtered = useMemo(() => leads.filter((l) => {
    const s = q.trim().toLowerCase();
    if (s && ![l.firm, l.contact_name, l.email, l.phone, l.agency, l.notes].some((v) => v?.toLowerCase().includes(s))) return false;
    if (stage && l.stage !== stage) return false;
    if (source && l.source !== source) return false;
    if (agent === "unassigned" ? l.assigned_to : agent && l.assigned_to !== agent) return false;
    if (due === "today" && l.next_follow_up !== today) return false;
    if (due === "overdue" && !(l.next_follow_up && l.next_follow_up < today)) return false;
    return true;
  }), [leads, q, stage, source, agent, due, today]);

  const weekAgo = Date.now() - 7 * 864e5;
  const stats = {
    perStage: CRM_STAGES.map((s) => [s, leads.filter((l) => l.stage === s).length] as const),
    dueToday: leads.filter((l) => l.next_follow_up === today).length,
    week: leads.filter((l) => new Date(l.created_at).getTime() >= weekAgo).length,
  };

  const move = async (id: string, to: string) => {
    qc.setQueryData<CrmLead[]>(["crm_leads", userId], (old) => old?.map((l) => (l.id === id ? { ...l, stage: to } : l)));
    const { error } = await supabase.from("crm_leads").update({ stage: to }).eq("id", id);
    if (error) toast.error(`Couldn't move lead: ${error.message}`);
    qc.invalidateQueries({ queryKey: ["crm_leads"] });
    qc.invalidateQueries({ queryKey: ["crm_activities", id] });
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
        <section aria-label="Dashboard" className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
          {[["Due today", stats.dueToday], ["Added this week", stats.week], ...stats.perStage].map(([k, v]) => (
            <div key={k} className="shrink-0 rounded-lg border px-3 py-2 min-w-[96px]">
              <p className="text-xl font-bold">{v}</p><p className="text-xs text-muted-foreground whitespace-nowrap">{k}</p>
            </div>
          ))}
        </section>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="h-11" onClick={exportCsv}><Download className="h-4 w-4 mr-1" />Export CSV</Button>
          {role === "admin" && <Button variant="outline" className="h-11" onClick={() => setImportOpen(true)}><Upload className="h-4 w-4 mr-1" />Import CSV</Button>}
        </div>

        {leadsQ.isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : leadsQ.error ? (
          <p className="text-destructive">Couldn't load leads: {(leadsQ.error as Error).message}</p>
        ) : (
          <Tabs defaultValue="board">
            <TabsList className="w-full sm:w-auto"><TabsTrigger value="board" className="flex-1 h-10">Pipeline</TabsTrigger><TabsTrigger value="list" className="flex-1 h-10">List</TabsTrigger></TabsList>
            <TabsContent value="board"><CrmBoard leads={leads} onOpen={(l) => setOpenId(l.id)} onMove={move} /></TabsContent>
            <TabsContent value="list" className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                <div className="relative sm:col-span-2 lg:col-span-1">
                  <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input aria-label="Search leads" placeholder="Search" className="h-11 pl-9 text-base" value={q} onChange={(e) => setQ(e.target.value)} />
                </div>
                <select aria-label="Stage" className={sel} value={stage} onChange={(e) => setStage(e.target.value)}><option value="">All stages</option>{CRM_STAGES.map((s) => <option key={s}>{s}</option>)}</select>
                <select aria-label="Source" className={sel} value={source} onChange={(e) => setSource(e.target.value)}><option value="">All sources</option>{CRM_SOURCES.map((s) => <option key={s}>{s}</option>)}</select>
                <select aria-label="Assigned agent" className={sel} value={agent} onChange={(e) => setAgent(e.target.value)}>
                  <option value="">All agents</option><option value="unassigned">Unassigned</option>{agents.map((a) => <option key={a.id} value={a.id}>{a.email ?? a.id}</option>)}
                </select>
                <select aria-label="Follow-up" className={sel} value={due} onChange={(e) => setDue(e.target.value as typeof due)}>
                  <option value="">Any follow-up</option><option value="today">Due today</option><option value="overdue">Overdue</option>
                </select>
              </div>
              <p className="text-sm text-muted-foreground">{filtered.length} leads</p>
              {filtered.length === 0 ? <p className="text-muted-foreground py-8 text-center">No leads match.</p> : (
                <ul className="divide-y border rounded-lg">
                  {filtered.map((l) => (
                    <li key={l.id}>
                      <button type="button" className="w-full text-left p-3 min-h-[64px] hover:bg-muted/50" onClick={() => setOpenId(l.id)}>
                        <div className="flex justify-between gap-2">
                          <span className="font-medium break-words min-w-0">{leadLabel(l)}</span>
                          <span className="text-xs shrink-0 rounded-full border px-2 py-0.5 h-fit">{l.stage}</span>
                        </div>
                        <p className="text-xs text-muted-foreground break-words">
                          {[l.source, l.agency, fmtMoney(l.award_amount), l.next_follow_up && `Follow up ${l.next_follow_up}`].filter(Boolean).join(" · ")}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
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

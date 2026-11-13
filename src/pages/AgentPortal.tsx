import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOperatorAuth } from "@/hooks/useOperatorAuth";
import { AGENT_AGREEMENT, AGENT_AGREEMENT_VERSION, AGENT_TRAINING } from "@/lib/agentProgram";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import VaPortal from "@/components/VaPortal";

const selectClass = "h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base";
const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
type AgentLead = { id: string; contact_name: string | null; firm: string | null; warm_reason: string | null; stage: string; notes: string | null; next_follow_up: string | null };
type Payout = { id: string; agent_amount: number; status: "pending" | "paid" };

const Login: React.FC = () => {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  return <main className="min-h-screen flex items-center justify-center p-4"><form className="w-full max-w-sm space-y-4 rounded-lg border bg-card p-6" onSubmit={async (e) => { e.preventDefault(); setBusy(true); setError(null); const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password }); setBusy(false); if (error) setError("Sign in failed. Check your email and password."); }}><h1 className="text-2xl font-bold">Agent portal sign in</h1><div className="space-y-2"><Label htmlFor="portal-email">Email</Label><Input id="portal-email" type="email" required autoComplete="email" className="h-11 text-base" value={email} onChange={(e) => setEmail(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="portal-password">Password</Label><Input id="portal-password" type="password" required autoComplete="current-password" className="h-11 text-base" value={password} onChange={(e) => setPassword(e.target.value)} /></div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button className="h-11 w-full" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}</Button></form></main>;
};

const SetPassword: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [password, setPassword] = useState(""); const [busy, setBusy] = useState(false);
  return <main className="min-h-screen flex items-center justify-center p-4"><form className="w-full max-w-sm space-y-4 rounded-lg border bg-card p-6" onSubmit={async (e) => { e.preventDefault(); if (password.length < 10) return toast.error("Use at least 10 characters."); setBusy(true); const { error } = await supabase.auth.updateUser({ password }); setBusy(false); if (error) return toast.error(error.message); toast.success("Password saved."); onDone(); }}><h1 className="text-2xl font-bold">Set your agent password</h1><p className="text-sm text-muted-foreground">Use at least 10 characters.</p><Label htmlFor="new-agent-password">New password</Label><Input id="new-agent-password" type="password" minLength={10} required autoComplete="new-password" className="h-11 text-base" value={password} onChange={(e) => setPassword(e.target.value)} /><Button className="h-11 w-full" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save password"}</Button></form></main>;
};

const LeadCard: React.FC<{ lead: AgentLead; onSaved: () => void }> = ({ lead, onSaved }) => {
  const [stage, setStage] = useState(lead.stage); const [note, setNote] = useState(""); const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("agent_update_lead", { _lead_id: lead.id, _stage: stage, _note: note.trim() || null });
    setBusy(false);
    if (error) return toast.error(error.message);
    setNote(""); toast.success("Lead updated"); onSaved();
  };
  return <article className="min-w-0 rounded-lg border bg-card p-4 space-y-3"><div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><h3 className="font-semibold break-words">{lead.contact_name || "Unnamed contact"}</h3><p className="text-sm text-muted-foreground break-words">{lead.firm || "No business name"}</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">Warm · {lead.warm_reason}</span></div>{lead.next_follow_up && <p className="text-sm">Next follow-up: {lead.next_follow_up}</p>}<div className="space-y-1"><Label htmlFor={`stage-${lead.id}`}>Stage</Label><select id={`stage-${lead.id}`} className={selectClass} value={stage} onChange={(e) => setStage(e.target.value)}>{["New","Contacted","Replied","Interested","Applied","Lost"].map((value) => <option key={value}>{value}</option>)}</select></div>{lead.notes && <div><p className="text-xs font-medium text-muted-foreground">Notes</p><p className="whitespace-pre-wrap break-words text-sm">{lead.notes}</p></div>}<div className="space-y-1"><Label htmlFor={`note-${lead.id}`}>Add a note</Label><Textarea id={`note-${lead.id}`} maxLength={2000} className="text-base" value={note} onChange={(e) => setNote(e.target.value)} /></div><Button className="h-11 w-full" disabled={busy} onClick={save}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save stage and note"}</Button></article>;
};

const AgentPortal: React.FC = () => {
  const { session, sessionLoading, signOut } = useOperatorAuth();
  const userId = session?.user.id ?? null;
  const qc = useQueryClient();
  const [needsPassword, setNeedsPassword] = useState(() => /type=(invite|recovery)/.test(window.location.hash));
  const [accepting, setAccepting] = useState(false);
  useEffect(() => { document.title = "Agent portal | ClearFund AI"; const m = document.createElement("meta"); m.name = "robots"; m.content = "noindex, nofollow"; document.head.appendChild(m); return () => { m.remove(); }; }, []);
  const access = useQuery({ queryKey: ["agent_access", userId], enabled: !!userId, queryFn: async () => {
    const [roles, profile] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId!),
      supabase.from("agents").select("user_id,full_name,email,referral_code,active,program_type").eq("user_id", userId!).maybeSingle(),
    ]);
    if (roles.error) throw roles.error; if (profile.error) throw profile.error;
    return { allowed: roles.data.some((r) => r.role === "agent"), profile: profile.data };
  } });
  const allowed = !!userId && !!access.data?.allowed && !!access.data.profile?.active;
  const training = useQuery({ queryKey: ["agent_training", userId], enabled: allowed, queryFn: async () => { const { data, error } = await supabase.from("agent_training_progress").select("section_key,completed_at").eq("agent_id", userId!); if (error) throw error; return data; } });
  const agreement = useQuery({ queryKey: ["agent_agreement", userId], enabled: allowed, queryFn: async () => { const { data, error } = await supabase.from("agent_agreements").select("version,accepted_at").eq("agent_id", userId!).eq("version", AGENT_AGREEMENT_VERSION).maybeSingle(); if (error) throw error; return data; } });
  const accepted = !!agreement.data;
  const leads = useQuery({ queryKey: ["agent_leads", userId], enabled: allowed && accepted, queryFn: async () => { const { data, error } = await supabase.rpc("agent_list_leads"); if (error) throw error; return data as AgentLead[]; } });
  const payouts = useQuery({ queryKey: ["agent_payouts", userId], enabled: allowed, queryFn: async () => { const { data, error } = await supabase.from("agent_payouts").select("id,agent_amount,status").eq("agent_id", userId!); if (error) throw error; return data as Payout[]; } });
  const refreshLeads = () => qc.invalidateQueries({ queryKey: ["agent_leads", userId] });

  if (sessionLoading || (session && access.isLoading)) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!session) return <Login />;
  if (needsPassword) return <SetPassword onDone={() => { window.history.replaceState(null, "", "/agent"); setNeedsPassword(false); }} />;
  if (access.error || !allowed) return <main className="min-h-screen flex items-center justify-center p-4"><div className="max-w-sm space-y-4 rounded-lg border bg-card p-6 text-center"><h1 className="text-xl font-bold">No agent portal access</h1><p className="text-sm text-muted-foreground">This account is not an approved, active agent.</p><Button variant="outline" onClick={signOut}><LogOut className="mr-2 h-4 w-4" />Sign out</Button></div></main>;
  const profile = access.data.profile!;
  if (profile.program_type === "va") return <VaPortal profile={{ user_id: profile.user_id, full_name: profile.full_name, referral_code: profile.referral_code }} onSignOut={signOut} />;
  const referralUrl = `${window.location.origin}/r/${profile.referral_code}`;
  const completed = new Set((training.data ?? []).map((row) => row.section_key));
  const totals = (payouts.data ?? []).reduce((sum, row) => ({ ...sum, [row.status]: sum[row.status] + Number(row.agent_amount) }), { pending: 0, paid: 0 });

  return <div className="min-h-screen bg-background"><header className="border-b bg-card"><div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4"><div className="min-w-0"><h1 className="truncate text-lg font-bold">ClearFund agent portal</h1><p className="truncate text-xs text-muted-foreground">{profile.full_name}</p></div><Button variant="ghost" className="shrink-0" onClick={signOut}><LogOut className="h-4 w-4" /><span className="hidden sm:ml-2 sm:inline">Sign out</span></Button></div></header><main className="mx-auto max-w-5xl space-y-8 px-4 py-6 pb-20">
    <section className="rounded-lg border bg-card p-5"><h2 className="text-xl font-bold">Your referral link</h2><p className="mt-1 text-sm text-muted-foreground">Share this link with owners who ask for funding help.</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><Input readOnly className="h-11 min-w-0 text-base" value={referralUrl} aria-label="Your referral link" /><Button variant="outline" className="h-11 shrink-0" onClick={async () => { await navigator.clipboard.writeText(referralUrl); toast.success("Referral link copied"); }}>Copy referral link</Button></div></section>
    <section aria-label="Your scoreboard"><h2 className="text-xl font-bold">Your scoreboard</h2><div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">{[["Funded deals",(payouts.data ?? []).length],["Pending payouts",money(totals.pending)],["Paid payouts",money(totals.paid)]].map(([label,value]) => <div key={String(label)} className="rounded-lg border bg-card p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold break-words">{value}</p></div>)}</div></section>
    <section><h2 className="text-xl font-bold">ClearFund guide</h2><div className="mt-3 grid gap-3">{AGENT_TRAINING.map((section) => <article key={section.key} className="rounded-lg border bg-card p-4"><h3 className="font-semibold">{section.title}</h3><p className="mt-2 text-sm text-muted-foreground">{section.body}</p><Button variant={completed.has(section.key) ? "secondary" : "outline"} className="mt-3 h-11" disabled={completed.has(section.key)} onClick={async () => { const { error } = await supabase.rpc("agent_mark_training", { _section: section.key }); if (error) return toast.error(error.message); qc.invalidateQueries({ queryKey: ["agent_training", userId] }); }}>{completed.has(section.key) ? "Done" : "Mark done"}</Button></article>)}</div></section>
    <section className="rounded-lg border bg-card p-5"><h2 className="text-xl font-bold">Non-circumvention and confidentiality agreement</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6">{AGENT_AGREEMENT}</p>{accepted ? <p className="mt-4 text-sm text-primary">Accepted {new Date(agreement.data!.accepted_at).toLocaleDateString()} · version {agreement.data!.version}</p> : <Button className="mt-4 h-11 w-full sm:w-auto" disabled={accepting} onClick={async () => { setAccepting(true); const { error } = await supabase.functions.invoke("agent-api", { body: { action: "accept_agreement", version: AGENT_AGREEMENT_VERSION } }); setAccepting(false); if (error) return toast.error("Could not record acceptance. Please try again."); toast.success("Agreement accepted"); qc.invalidateQueries({ queryKey: ["agent_agreement", userId] }); }}>{accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Accept agreement"}</Button>}</section>
    <section><div><h2 className="text-xl font-bold">Warm lead queue</h2><p className="mt-1 text-sm text-muted-foreground">Only leads assigned to you appear here. You can update stage and notes.</p></div>{!accepted ? <div className="mt-3 rounded-lg border bg-card p-6 text-center text-muted-foreground">Accept the current agreement to receive leads.</div> : leads.isLoading ? <Loader2 className="mt-4 h-6 w-6 animate-spin" /> : leads.error ? <p className="mt-3 text-destructive">Couldn't load your queue.</p> : (leads.data ?? []).length === 0 ? <div className="mt-3 rounded-lg border bg-card p-6 text-center text-muted-foreground">No assigned warm leads yet.</div> : <div className="mt-3 grid gap-3 md:grid-cols-2">{(leads.data ?? []).map((lead) => <LeadCard key={lead.id} lead={lead} onSaved={refreshLeads} />)}</div>}</section>
  </main></div>;
};
export default AgentPortal;

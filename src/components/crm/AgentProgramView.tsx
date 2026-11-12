import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
const validPercent = (value: string) => value !== "" && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 100;

type Leader = {
  agent_id: string;
  full_name: string;
  email: string;
  referral_code: string;
  assigned_payout_percent: number | null;
  referral_payout_percent: number | null;
  funded_deals: number;
  warm_leads: number;
  pending_total: number;
  paid_total: number;
};
type Payout = {
  id: string;
  lead_id: string;
  agent_id: string;
  clearfund_commission: number;
  agent_percent: number;
  agent_amount: number;
  payout_basis: "assigned" | "own_referral";
  status: "pending" | "paid";
  paid_at: string | null;
  created_at: string;
};

const AgentRow: React.FC<{ agent: Leader; onSaved: () => void }> = ({ agent, onSaved }) => {
  const [assignedPercent, setAssignedPercent] = useState(agent.assigned_payout_percent == null ? "" : String(agent.assigned_payout_percent));
  const [referralPercent, setReferralPercent] = useState(agent.referral_payout_percent == null ? "" : String(agent.referral_payout_percent));
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if ((assignedPercent !== "" && !validPercent(assignedPercent)) || (referralPercent !== "" && !validPercent(referralPercent))) {
      return toast.error("Enter a percent from 0 to 100, or leave an override blank");
    }
    setBusy(true);
    const { error } = await supabase.from("agents").update({
      assigned_payout_percent: assignedPercent === "" ? null : Number(assignedPercent),
      referral_payout_percent: referralPercent === "" ? null : Number(referralPercent),
    }).eq("user_id", agent.agent_id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Agent overrides saved");
    onSaved();
  };

  return (
    <article className="min-w-0 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap justify-between gap-2">
        <div className="min-w-0">
          <h3 className="break-words font-semibold">{agent.full_name}</h3>
          <p className="break-all text-sm text-muted-foreground">{agent.email} · {agent.referral_code}</p>
        </div>
        <span className="text-sm">{agent.funded_deals} funded deals</span>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 text-center text-sm min-[380px]:grid-cols-3">
        <div><p className="font-bold">{agent.warm_leads}</p><p className="text-xs text-muted-foreground">Warm leads</p></div>
        <div><p className="break-words font-bold">{money(Number(agent.pending_total))}</p><p className="text-xs text-muted-foreground">Pending</p></div>
        <div><p className="break-words font-bold">{money(Number(agent.paid_total))}</p><p className="text-xs text-muted-foreground">Paid</p></div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="min-w-0 space-y-1">
          <Label htmlFor={`assigned-override-${agent.agent_id}`}>Assigned-lead cut override</Label>
          <Input id={`assigned-override-${agent.agent_id}`} type="number" min="0" max="100" step="0.01" className="h-11 min-w-0 text-base" value={assignedPercent} onChange={(e) => setAssignedPercent(e.target.value)} placeholder="Use global default" />
        </div>
        <div className="min-w-0 space-y-1">
          <Label htmlFor={`referral-override-${agent.agent_id}`}>Own-referral cut override</Label>
          <Input id={`referral-override-${agent.agent_id}`} type="number" min="0" max="100" step="0.01" className="h-11 min-w-0 text-base" value={referralPercent} onChange={(e) => setReferralPercent(e.target.value)} placeholder="Use global default" />
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Blank overrides use the global defaults.</p>
      <Button variant="outline" className="mt-3 h-11 w-full sm:w-auto" disabled={busy} onClick={save}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save overrides"}
      </Button>
    </article>
  );
};

const AgentProgramView: React.FC = () => {
  const qc = useQueryClient();
  const settings = useQuery({
    queryKey: ["agent_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agent_settings").select("assigned_payout_percent,referral_payout_percent,auto_assign").eq("singleton", true).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const leaders = useQuery({
    queryKey: ["agent_leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("crm_agent_leaderboard_v2");
      if (error) throw error;
      return data as Leader[];
    },
  });
  const payouts = useQuery({
    queryKey: ["agent_payouts_admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agent_payouts").select("id,lead_id,agent_id,clearfund_commission,agent_percent,agent_amount,payout_basis,status,paid_at,created_at").order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data as Payout[];
    },
  });
  const leadIds = [...new Set((payouts.data ?? []).map((p) => p.lead_id))];
  const leadNames = useQuery({
    queryKey: ["payout_lead_names", leadIds],
    enabled: leadIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_leads").select("id,firm,contact_name").in("id", leadIds);
      if (error) throw error;
      return data;
    },
  });
  const [assignedPercent, setAssignedPercent] = useState("30");
  const [referralPercent, setReferralPercent] = useState("50");
  const [auto, setAuto] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAssignedPercent(String(settings.data?.assigned_payout_percent ?? 30));
    setReferralPercent(String(settings.data?.referral_payout_percent ?? 50));
    setAuto(settings.data?.auto_assign ?? false);
  }, [settings.data]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["agent_leaderboard"] });
    qc.invalidateQueries({ queryKey: ["agent_payouts_admin"] });
  };
  const saveSettings = async () => {
    if (!validPercent(assignedPercent) || !validPercent(referralPercent)) return toast.error("Enter both percentages as values from 0 to 100");
    setSaving(true);
    const { error } = await supabase.rpc("crm_admin_save_agent_settings_v2", {
      _assigned_percent: Number(assignedPercent),
      _referral_percent: Number(referralPercent),
      _auto_assign: auto,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Settings saved");
    qc.invalidateQueries({ queryKey: ["agent_settings"] });
    qc.invalidateQueries({ queryKey: ["crm_leads"] });
  };

  const byAgent = new Map((leaders.data ?? []).map((a) => [a.agent_id, a.full_name]));
  const byLead = new Map((leadNames.data ?? []).map((l) => [l.id, l.firm || l.contact_name || "Unnamed lead"]));

  return (
    <div className="min-w-0 space-y-8">
      <section className="min-w-0 rounded-lg border bg-card p-4">
        <h2 className="text-xl font-bold">Agent assignment and payout settings</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="min-w-0 space-y-2">
            <Label htmlFor="assigned-payout">Agent cut on leads we assign (%)</Label>
            <Input id="assigned-payout" type="number" min="0" max="100" step="0.01" className="h-11 min-w-0 text-base" value={assignedPercent} onChange={(e) => setAssignedPercent(e.target.value)} />
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor="referral-payout">Agent cut on clients the agent brings (referral link) (%)</Label>
            <Input id="referral-payout" type="number" min="0" max="100" step="0.01" className="h-11 min-w-0 text-base" value={referralPercent} onChange={(e) => setReferralPercent(e.target.value)} />
          </div>
        </div>
        <label className="mt-4 flex min-h-11 items-center gap-3 rounded-md border p-3">
          <input type="checkbox" className="h-5 w-5 shrink-0" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
          <span className="text-sm">Auto-assign warm leads round robin after training and agreement</span>
        </label>
        <Button className="mt-4 h-11 w-full sm:w-auto" disabled={saving} onClick={saveSettings}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save settings"}
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">Automatic assignment defaults off. Referral-link leads always remain attributed to their own agent.</p>
      </section>

      <section className="min-w-0">
        <h2 className="text-xl font-bold">Agent leaderboard</h2>
        {leaders.isLoading ? <Loader2 className="mt-3 h-6 w-6 animate-spin" /> : leaders.error ? <p className="mt-3 text-destructive">Couldn't load agents.</p> : (leaders.data ?? []).length === 0 ? <p className="mt-3 rounded-lg border p-6 text-center text-muted-foreground">No approved agents yet.</p> : <div className="mt-3 grid gap-3">{(leaders.data ?? []).map((agent) => <AgentRow key={agent.agent_id} agent={agent} onSaved={refresh} />)}</div>}
      </section>

      <section className="min-w-0">
        <h2 className="text-xl font-bold">Payouts</h2>
        {payouts.isLoading ? <Loader2 className="mt-3 h-6 w-6 animate-spin" /> : payouts.error ? <p className="mt-3 text-destructive">Couldn't load payouts.</p> : (payouts.data ?? []).length === 0 ? <p className="mt-3 rounded-lg border p-6 text-center text-muted-foreground">No funded-deal payouts recorded.</p> : (
          <div className="mt-3 grid gap-3">
            {(payouts.data ?? []).map((payout) => (
              <article key={payout.id} className="min-w-0 rounded-lg border bg-card p-4">
                <div className="flex flex-wrap justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="break-words font-semibold">{byLead.get(payout.lead_id) ?? "Lead"}</h3>
                    <p className="break-words text-sm text-muted-foreground">{byAgent.get(payout.agent_id) ?? "Agent"}</p>
                  </div>
                  <span className="rounded-full border px-3 py-1 text-xs">{payout.status}</span>
                </div>
                <p className="mt-2 text-xs font-medium text-muted-foreground">{payout.payout_basis === "own_referral" ? "Agent's own referral" : "Lead assigned by ClearFund"}</p>
                <div className="mt-3 grid grid-cols-1 gap-3 text-sm min-[380px]:grid-cols-3">
                  <div><p className="text-xs text-muted-foreground">ClearFund commission</p><p className="break-words font-semibold">{money(Number(payout.clearfund_commission))}</p></div>
                  <div><p className="text-xs text-muted-foreground">Agent share</p><p className="font-semibold">{payout.agent_percent}%</p></div>
                  <div><p className="text-xs text-muted-foreground">Agent payout</p><p className="break-words font-semibold">{money(Number(payout.agent_amount))}</p></div>
                </div>
                {payout.paid_at && <p className="mt-2 text-xs text-muted-foreground">Paid {new Date(payout.paid_at).toLocaleDateString()}</p>}
                <Button variant="outline" className="mt-3 h-11" onClick={async () => {
                  const { error } = await supabase.rpc("crm_admin_mark_payout_paid", { _payout_id: payout.id, _paid: payout.status !== "paid" });
                  if (error) return toast.error(error.message);
                  toast.success("Payout updated");
                  refresh();
                }}>{payout.status === "paid" ? "Move to pending" : "Mark paid"}</Button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AgentProgramView;

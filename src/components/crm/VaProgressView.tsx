import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, PhoneIncoming } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/va/VaCallScreen";

type Progress = {
  va_id: string; full_name: string | null; referral_code: string | null; active: boolean; assigned: number; calls: number;
  no_answer: number; call_later: number; not_interested: number; dnc: number; qualified: number; not_qualified: number;
  apps_sent: number; files_in: number; files_ready: number; funded: number; pay_owed: number; last_call_at: string | null;
};
type CallLogRow = { id: string; created_at: string; outcome: string; lead_id: string; business_name: string | null; owner_name: string | null; status: string; note: string | null };
type AiCall = { id: string; created_at: string; lead_id: string | null; business_name: string | null; owner_name: string | null; caller_phone: string | null; duration_s: number | null; summary: string | null; sentiment: string | null; callback_requested: boolean; callback_note: string | null; new_lead: boolean };

const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "never");
const OUTCOME: Record<string, string> = { no_answer: "No answer", call_later: "Call later", not_interested: "Not interested", dnc: "Do not call", qualified: "Qualified", not_qualified: "Not ready yet" };
const PERIODS: [number, string][] = [[1, "Today"], [7, "7 days"], [30, "30 days"]];

const Stat: React.FC<{ label: string; value: React.ReactNode; strong?: boolean }> = ({ label, value, strong }) => (
  <div className="min-w-0 rounded-md bg-muted/50 p-2">
    <p className="truncate text-xs text-muted-foreground">{label}</p>
    <p className={`break-words ${strong ? "text-lg font-bold" : "font-semibold"}`}>{value}</p>
  </div>
);

const CallLog: React.FC<{ vaId: string; onOpen?: (id: string) => void }> = ({ vaId, onOpen }) => {
  const log = useQuery({
    queryKey: ["crm-va-call-log", vaId],
    queryFn: async () => { const { data, error } = await supabase.rpc("crm_va_call_log", { _va_id: vaId, _limit: 50 }); if (error) throw error; return (data ?? []) as CallLogRow[]; },
  });
  if (log.isLoading) return <Loader2 className="mt-3 h-5 w-5 animate-spin" />;
  if (log.error) return <p className="mt-3 text-sm text-red-700">{(log.error as Error).message}</p>;
  if ((log.data ?? []).length === 0) return <p className="mt-3 text-sm text-muted-foreground">No calls logged yet.</p>;
  return (
    <ul className="mt-3 divide-y rounded-md border">
      {(log.data ?? []).map((c) => (
        <li key={c.id} className="min-w-0 p-3 text-sm">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <button type="button" className="min-w-0 break-words text-left font-medium underline-offset-2 hover:underline" onClick={() => onOpen?.(c.lead_id)}>{c.business_name || c.owner_name || "Business"}</button>
            <StatusBadge status={c.status} />
          </div>
          <p className="text-muted-foreground">{OUTCOME[c.outcome] ?? c.outcome} · {when(c.created_at)}</p>
          {c.note && <p className="mt-1 break-words">{c.note}</p>}
        </li>
      ))}
    </ul>
  );
};

const VaProgressView: React.FC<{ onOpen?: (id: string) => void }> = ({ onOpen }) => {
  const [days, setDays] = useState(1);
  const [openVa, setOpenVa] = useState<string | null>(null);
  const progress = useQuery({
    queryKey: ["crm-va-progress", days],
    refetchInterval: 60000,
    queryFn: async () => { const { data, error } = await supabase.rpc("crm_va_progress", { _days: days }); if (error) throw error; return (data ?? []) as Progress[]; },
  });
  const aiCalls = useQuery({
    queryKey: ["crm-ai-calls"],
    refetchInterval: 60000,
    queryFn: async () => { const { data, error } = await supabase.rpc("crm_ai_call_list", { _limit: 20 }); if (error) throw error; return (data ?? []) as AiCall[]; },
  });
  const rows = progress.data ?? [];
  const totals = rows.reduce((t, r) => ({ calls: t.calls + r.calls, qualified: t.qualified + r.qualified, files: t.files + r.files_in, ready: t.ready + r.files_ready, owed: t.owed + Number(r.pay_owed) }), { calls: 0, qualified: 0, files: 0, ready: 0, owed: 0 });

  return (
    <div className="min-w-0 space-y-6">
      <section className="min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h3 className="text-lg font-semibold">VA progress</h3>
          <div className="grid w-full grid-cols-3 gap-2 sm:w-auto">
            {PERIODS.map(([d, label]) => <Button key={d} variant={days === d ? "default" : "outline"} className="h-10" onClick={() => setDays(d)}>{label}</Button>)}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <Stat label="Calls" value={totals.calls} strong />
          <Stat label="Qualified" value={totals.qualified} strong />
          <Stat label="Files in" value={totals.files} strong />
          <Stat label="Files ready" value={totals.ready} strong />
          <Stat label="VA pay owed" value={money(totals.owed)} strong />
        </div>
        {progress.isLoading ? <Loader2 className="mt-4 h-5 w-5 animate-spin" />
          : progress.error ? <p className="mt-3 text-sm text-red-700">{(progress.error as Error).message}</p>
          : rows.length === 0 ? <p className="mt-3 rounded-lg border p-5 text-sm text-muted-foreground">No VAs yet. Once you add one, their calls and files show up here.</p>
          : <div className="mt-3 grid gap-3 lg:grid-cols-2">
              {rows.map((r) => (
                <article key={r.va_id} className="min-w-0 rounded-lg border bg-card p-4">
                  <div className="flex min-w-0 items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="break-words font-semibold">{r.full_name || r.referral_code || "VA"}</h4>
                      <p className="text-xs text-muted-foreground">{r.active ? "Active" : "Paused"} · {r.assigned} open leads · last call {when(r.last_call_at)}</p>
                    </div>
                    <span className="shrink-0 text-right text-sm font-semibold">{money(Number(r.pay_owed))}<span className="block text-xs font-normal text-muted-foreground">owed</span></span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <Stat label="Calls" value={r.calls} />
                    <Stat label="Qualified" value={r.qualified} />
                    <Stat label="Apps sent" value={r.apps_sent} />
                    <Stat label="Files in" value={r.files_in} />
                    <Stat label="Files ready" value={r.files_ready} />
                    <Stat label="Funded" value={r.funded} />
                  </div>
                  <p className="mt-2 break-words text-xs text-muted-foreground">
                    No answer {r.no_answer} · Call later {r.call_later} · Not interested {r.not_interested} · Not ready {r.not_qualified} · Do not call {r.dnc}
                  </p>
                  <Button variant="outline" className="mt-3 h-10 w-full" onClick={() => setOpenVa(openVa === r.va_id ? null : r.va_id)}>{openVa === r.va_id ? "Hide call log" : "Show call log"}</Button>
                  {openVa === r.va_id && <CallLog vaId={r.va_id} onOpen={onOpen} />}
                </article>
              ))}
            </div>}
      </section>

      <section className="min-w-0">
        <h3 className="flex items-center gap-2 text-lg font-semibold"><PhoneIncoming className="h-5 w-5" />AI phone line</h3>
        {aiCalls.isLoading ? <Loader2 className="mt-3 h-5 w-5 animate-spin" />
          : aiCalls.error ? <p className="mt-3 text-sm text-red-700">{(aiCalls.error as Error).message}</p>
          : (aiCalls.data ?? []).length === 0 ? <p className="mt-3 rounded-lg border p-5 text-sm text-muted-foreground">No calls logged yet. Calls show up here once the phone line is connected to the CRM.</p>
          : <ul className="mt-3 divide-y rounded-lg border bg-card">
              {(aiCalls.data ?? []).map((c) => (
                <li key={c.id} className="min-w-0 p-3 text-sm">
                  <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                    <button type="button" disabled={!c.lead_id} className="min-w-0 break-words text-left font-medium underline-offset-2 enabled:hover:underline" onClick={() => c.lead_id && onOpen?.(c.lead_id)}>
                      {c.business_name || c.owner_name || c.caller_phone || "Caller"}
                    </button>
                    <span className="flex shrink-0 gap-1">
                      {c.new_lead && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900">New lead</span>}
                      {c.callback_requested && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">Callback</span>}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{when(c.created_at)}{c.duration_s ? ` · ${Math.round(c.duration_s / 60)} min` : ""}{c.sentiment ? ` · ${c.sentiment}` : ""}</p>
                  {c.summary && <p className="mt-1 break-words">{c.summary}</p>}
                  {c.callback_note && <p className="mt-1 break-words font-medium">Call back: {c.callback_note}</p>}
                </li>
              ))}
            </ul>}
      </section>
    </div>
  );
};

export default VaProgressView;

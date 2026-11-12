import React, { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { CrmLead } from "@/lib/crm";

type LiveLead = Pick<CrmLead, "id" | "firm" | "state" | "sector" | "need_score" | "found_by" | "source_id" | "created_at"> & { fresh?: boolean };
type Src = { id: string; source: string; params: unknown };
const MAX = 200;
const startOfDay = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const sliceLabel = (s?: Src) => s ? [s.source, ...Object.entries((s.params ?? {}) as Record<string, unknown>).map(([k, v]) => `${k} ${String(v)}`)].join(" · ") : null;

/** Admin-only live feed of worker-found leads. Stays mounted so the tab can pulse while hidden. */
const LiveView: React.FC<{ onOpen: (id: string) => void; onNew: (n: number) => void }> = ({ onOpen, onNew }) => {
  const [leads, setLeads] = useState<LiveLead[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<"connecting" | "live" | "reconnecting" | "paused">("connecting");
  const [overflow, setOverflow] = useState(0);
  const [sources, setSources] = useState<Record<string, Src>>({});
  const buffer = useRef<LiveLead[]>([]);
  const onNewRef = useRef(onNew); onNewRef.current = onNew;

  const load = useCallback(async () => {
    const since = startOfDay().toISOString();
    const [list, all] = await Promise.all([
      supabase.from("crm_leads").select("id, firm, state, sector, need_score, found_by, source_id, created_at").eq("source", "worker").gte("created_at", since).order("created_at", { ascending: false }).limit(100),
      supabase.from("crm_leads").select("found_by").eq("source", "worker").gte("created_at", since).limit(10000),
    ]);
    if (!list.error) setLeads(list.data as LiveLead[]);
    if (!all.error) {
      const c: Record<string, number> = {};
      for (const r of all.data) c[r.found_by ?? "unknown"] = (c[r.found_by ?? "unknown"] ?? 0) + 1;
      setCounts(c);
    }
    setOverflow(0);
  }, []);

  // Fetch slice names for any source ids we haven't seen.
  useEffect(() => {
    const missing = [...new Set(leads.map((l) => l.source_id).filter((id): id is string => !!id && !sources[id]))];
    if (!missing.length) return;
    supabase.from("crm_sources").select("id, source, params").in("id", missing).then(({ data }) => {
      if (data?.length) setSources((s) => ({ ...s, ...Object.fromEntries(data.map((d) => [d.id, d as Src])) }));
    });
  }, [leads, sources]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let wasLive = false;
    const subscribe = () => {
      channel = supabase.channel(`crm-live-${Math.random().toString(36).slice(2)}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "crm_leads", filter: "source=eq.worker" },
          (p) => { buffer.current.push({ ...(p.new as LiveLead), fresh: true }); })
        .subscribe((s) => {
          if (s === "SUBSCRIBED") { if (wasLive) load(); wasLive = true; setStatus("live"); }
          else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT" || s === "CLOSED") setStatus((st) => (st === "paused" ? st : "reconnecting"));
        });
    };
    const unsubscribe = () => { if (channel) supabase.removeChannel(channel); channel = null; };
    const onVis = () => {
      if (document.hidden) { unsubscribe(); setStatus("paused"); }
      else { setStatus("connecting"); load(); subscribe(); }
    };
    load(); subscribe();
    document.addEventListener("visibilitychange", onVis);
    // Batch incoming events: redraw at most once per second.
    const tick = setInterval(() => {
      const batch = buffer.current.splice(0);
      if (!batch.length) return;
      const dayStart = startOfDay().getTime();
      const today = batch.filter((l) => new Date(l.created_at).getTime() >= dayStart);
      setCounts((c) => { const n = { ...c }; for (const l of today) n[l.found_by ?? "unknown"] = (n[l.found_by ?? "unknown"] ?? 0) + 1; return n; });
      setLeads((old) => {
        const merged = [...batch.reverse(), ...old.map((l) => ({ ...l, fresh: false }))];
        if (merged.length > MAX) setOverflow((o) => o + merged.length - MAX);
        return merged.slice(0, MAX);
      });
      onNewRef.current(batch.length);
    }, 1000);
    return () => { clearInterval(tick); document.removeEventListener("visibilitychange", onVis); unsubscribe(); };
  }, [load]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const pill = status === "live" ? "Live" : status === "paused" ? "Paused" : status === "connecting" ? "Connecting…" : "Reconnecting…";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">Leads found today</h2>
        <span role="status" className={`text-xs px-2 py-1 rounded-full border inline-flex items-center gap-1 ${status === "live" ? "border-primary text-primary" : "text-muted-foreground"}`}>
          <span className={`h-2 w-2 rounded-full ${status === "live" ? "bg-primary animate-pulse" : "bg-muted-foreground"}`} />{pill}
        </span>
      </div>
      <section aria-label="Today's counts" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="rounded-lg border p-3 min-w-0 border-primary"><p className="text-2xl font-bold">{total}</p><p className="text-xs text-muted-foreground">Added today</p></div>
        {Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([w, n]) => (
          <div key={w} className="rounded-lg border p-3 min-w-0"><p className="text-2xl font-bold">{n}</p><p className="text-xs text-muted-foreground break-words">{w}</p></div>
        ))}
      </section>
      {overflow > 0 && <p className="text-sm text-muted-foreground">+{overflow} more today not shown. See the Leads tab.</p>}
      {leads.length === 0 ? (
        <p className="text-sm text-muted-foreground">Waiting for workers. New leads show here as soon as they're saved.</p>
      ) : (
        <ul className="space-y-2" aria-live="polite">
          {leads.map((l) => (
            <li key={l.id}>
              <button type="button" onClick={() => onOpen(l.id)}
                className={`w-full text-left rounded-lg border p-3 min-w-0 transition-colors duration-1000 ${l.fresh ? "bg-primary/10 border-primary animate-in fade-in slide-in-from-top-2" : "bg-background"}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium min-w-0 break-words">{l.firm || "Unnamed company"}{l.state ? ` · ${l.state}` : ""}</p>
                  <span className="text-xs shrink-0 text-muted-foreground">{new Date(l.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                </div>
                <p className="text-sm text-muted-foreground break-words">{l.sector || "No sector"} · {l.need_score == null ? "not scored" : `need ${l.need_score}`}</p>
                <p className="text-xs text-muted-foreground break-words">Found by {l.found_by ?? "unknown"}{l.source_id && sliceLabel(sources[l.source_id]) ? ` · ${sliceLabel(sources[l.source_id])}` : ""}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LiveView;

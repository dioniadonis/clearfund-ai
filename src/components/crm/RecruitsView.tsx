import React, { useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Recruit = {
  id: string; full_name: string; email: string; phone: string | null; state: string;
  score: number; status: string; hard_stop_reason: string | null; written_answer: string;
  source: string; created_at: string;
};
const PAGE = 50;
const STATUSES = ["new", "review", "call", "sent_link", "certified", "not_now"];
const statusLabel = (s: string) => ({ new: "New", review: "Review", call: "Call", sent_link: "Sent DAC link", certified: "Certified", not_now: "Not now" }[s] ?? s);
const selectClass = "h-11 min-w-0 w-full rounded-md border border-input bg-background px-3 text-base";

const RecruitsView: React.FC = () => {
  const [status, setStatus] = useState("");
  const [minScore, setMinScore] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const qc = useQueryClient();
  const recruitsQ = useInfiniteQuery({
    queryKey: ["crm_recruits", status, minScore], initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      let query = supabase.from("recruits").select("id, full_name, email, phone, state, score, status, hard_stop_reason, written_answer, source, created_at");
      if (status) query = query.eq("status", status);
      if (minScore) query = query.gte("score", Number(minScore));
      const { data, error } = await query.order("created_at", { ascending: false }).order("id").range(pageParam * PAGE, pageParam * PAGE + PAGE - 1);
      if (error) throw error;
      return data as Recruit[];
    },
    getNextPageParam: (last, all) => last.length === PAGE ? all.length : undefined,
  });
  const recruits = recruitsQ.data?.pages.flat() ?? [];

  const setRecruitStatus = async (id: string, next: string) => {
    setBusyId(id);
    const { error } = await supabase.from("recruits").update({ status: next }).eq("id", id);
    setBusyId(null);
    if (error) return toast.error(`Couldn't update recruit: ${error.message}`);
    if (next === "sent_link") toast.success("Status updated. No email was sent.");
    else toast.success("Recruit status updated.");
    await qc.invalidateQueries({ queryKey: ["crm_recruits"] });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <select aria-label="Recruit status" className={selectClass} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
        </select>
        <select aria-label="Minimum recruit score" className={selectClass} value={minScore} onChange={(e) => setMinScore(e.target.value)}>
          <option value="">All scores</option>{[3, 6, 9, 12].map((n) => <option key={n} value={n}>{n}+ score</option>)}
        </select>
      </div>
      {recruitsQ.error && <p role="alert" className="text-destructive">Couldn't load recruits: {(recruitsQ.error as Error).message}</p>}
      {recruitsQ.isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : recruits.length === 0 ? (
        <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">No recruiting applications match these filters.</div>
      ) : (
        <div className="grid gap-3">
          {recruits.map((r) => (
            <article key={r.id} className="min-w-0 rounded-lg border bg-card p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold break-words">{r.full_name} <span className="text-sm font-normal text-muted-foreground">· {r.state}</span></h2>
                  <p className="text-sm text-muted-foreground break-all">{r.email}{r.phone ? ` · ${r.phone}` : ""}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-secondary px-3 py-1 font-medium">Score {r.score}</span>
                  <span className="rounded-full border px-3 py-1">{statusLabel(r.status)}</span>
                </div>
              </div>
              {r.hard_stop_reason && <p className="text-sm text-destructive">Hard stop: {r.hard_stop_reason}</p>}
              <div className="min-w-0"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Written answer</p><p className="mt-1 whitespace-pre-wrap break-words text-sm">{r.written_answer}</p></div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button variant="outline" className="h-11" disabled={busyId === r.id || r.status === "call"} onClick={() => setRecruitStatus(r.id, "call")}>Schedule call</Button>
                <Button variant="outline" className="h-11" disabled={busyId === r.id || r.status === "sent_link"} onClick={() => setRecruitStatus(r.id, "sent_link")}>Send DAC link</Button>
                <Button variant="ghost" className="h-11" disabled={busyId === r.id || r.status === "not_now"} onClick={() => setRecruitStatus(r.id, "not_now")}>Not now</Button>
              </div>
            </article>
          ))}
        </div>
      )}
      {recruitsQ.hasNextPage && <Button variant="outline" className="h-11 w-full" disabled={recruitsQ.isFetchingNextPage} onClick={() => recruitsQ.fetchNextPage()}>{recruitsQ.isFetchingNextPage ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load more"}</Button>}
    </div>
  );
};
export default RecruitsView;

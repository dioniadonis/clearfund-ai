import React, { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { usd } from "@/lib/freeAudit";

type Row = {
  id: string; first_name: string; business_name: string; email: string; phone: string | null;
  phone_contact_allowed: boolean; answers: any; results: any; ai_analysis: any; ai_status: string;
  utm_source: string | null; utm_campaign: string | null; created_at: string;
};

const FreeAudits: React.FC = () => {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Row | null>(null);

  useEffect(() => {
    supabase.from("free_audits").select("*").order("created_at", { ascending: false }).limit(500).then(({ data, error }) => {
      if (error) setError(error.message); else setRows(data as Row[]);
    });
  }, []);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (rows ?? []).filter((r) => !s || [r.first_name, r.business_name, r.email].some((x) => x?.toLowerCase().includes(s)));
  }, [rows, q]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Free audits</h1>
      <p className="text-sm text-muted-foreground">Completed free automation audits. Scores and dollar figures are estimates from self-reported answers.</p>
      <Input placeholder="Search name, business or email" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {!rows && !error && <Loader2 className="h-5 w-5 animate-spin" />}
      {rows && !list.length && <p className="text-sm text-muted-foreground">No free audits yet.</p>}
      {!!list.length && (
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left"><tr><th className="p-2">Date</th><th className="p-2">Name</th><th className="p-2">Business</th><th className="p-2">Email</th><th className="p-2">Score</th><th className="p-2">Monthly opp.</th><th className="p-2">AI</th></tr></thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} className="border-t cursor-pointer hover:bg-muted/50" onClick={() => setOpen(r)}>
                  <td className="p-2 whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="p-2">{r.first_name}</td><td className="p-2">{r.business_name}</td><td className="p-2">{r.email}</td>
                  <td className="p-2">{r.results?.score}</td><td className="p-2">{usd(r.results?.total_monthly_impact ?? 0)}</td><td className="p-2">{r.ai_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Sheet open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          {open && (
            <>
              <SheetHeader><SheetTitle>{open.business_name}</SheetTitle></SheetHeader>
              <div className="space-y-4 text-sm mt-4">
                <p>{open.first_name} · {open.email}{open.phone ? ` · ${open.phone}` : ""}</p>
                <p>Phone contact allowed: <strong>{open.phone_contact_allowed ? "Yes" : "No"}</strong></p>
                <p>Source: {open.utm_source ?? "—"} / {open.utm_campaign ?? "—"}</p>
                <p>Score {open.results?.score} ({open.results?.score_label}) · {usd(open.results?.total_monthly_impact ?? 0)}/mo</p>
                <ul className="list-disc pl-5">{(open.results?.opportunities ?? []).map((o: any) => <li key={o.opportunity_id}>{o.title} — {usd(o.monthly_impact)}</li>)}</ul>
                {open.ai_analysis?.headline_summary && <p className="text-muted-foreground">{open.ai_analysis.headline_summary}</p>}
                <pre className="bg-muted rounded p-2 text-xs whitespace-pre-wrap">{JSON.stringify(open.answers, null, 2)}</pre>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default FreeAudits;

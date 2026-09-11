import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const todayISO = () => new Date().toISOString().slice(0, 10);

const OperatorOverview: React.FC = () => {
  const counts = useQuery({
    queryKey: ["operator", "overview"],
    queryFn: async () => {
      const today = todayISO();

      const [stages, needsAction, docs, calls] = await Promise.all([
        supabase.from("leads").select("stage"),
        supabase
          .from("leads")
          .select("id", { count: "exact", head: true })
          .lte("next_action_due", today)
          .eq("opted_out", false),
        supabase
          .from("lead_documents")
          .select("id", { count: "exact", head: true })
          .neq("status", "received"),
        supabase
          .from("call_tasks")
          .select("id", { count: "exact", head: true })
          .eq("status", "queued"),
      ]);

      if (stages.error) throw stages.error;
      if (needsAction.error) throw needsAction.error;
      if (docs.error) throw docs.error;
      if (calls.error) throw calls.error;

      const byStage: Record<string, number> = {};
      for (const row of stages.data ?? []) {
        byStage[row.stage] = (byStage[row.stage] ?? 0) + 1;
      }

      return {
        totalLeads: stages.data?.length ?? 0,
        byStage,
        needsAction: needsAction.count ?? 0,
        docsOutstanding: docs.count ?? 0,
        callsQueued: calls.count ?? 0,
      };
    },
  });

  const actionable = useQuery({
    queryKey: ["operator", "overview", "actionable"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, full_name, business_name, stage, next_action, next_action_due")
        .lte("next_action_due", todayISO())
        .eq("opted_out", false)
        .order("next_action_due", { ascending: true })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  if (counts.isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading overview…
      </div>
    );
  }

  if (counts.isError) {
    return <p className="text-sm text-destructive">Could not load the overview. Try reloading.</p>;
  }

  const c = counts.data!;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Overview</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Leads", value: c.totalLeads },
          { label: "Needing action", value: c.needsAction },
          { label: "Documents outstanding", value: c.docsOutstanding },
          { label: "Calls queued", value: c.callsQueued },
        ].map((k) => (
          <Card key={k.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{k.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leads by stage</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(c.byStage).length === 0 ? (
            <p className="text-sm text-muted-foreground">No records yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {Object.entries(c.byStage).map(([stage, n]) => (
                <Badge key={stage} variant="secondary">
                  {stage}: {n}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actionable leads</CardTitle>
        </CardHeader>
        <CardContent>
          {actionable.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : actionable.isError ? (
            <p className="text-sm text-destructive">Could not load actionable leads.</p>
          ) : (actionable.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing due. No records yet.</p>
          ) : (
            <ul className="divide-y">
              {actionable.data!.map((l) => (
                <li key={l.id} className="py-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{l.business_name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {l.full_name} · {l.next_action ?? "No next action set"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{l.stage}</Badge>
                    <span className="text-sm text-muted-foreground">{l.next_action_due}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="pt-4">
            <Link to="/operator/leads" className="text-sm underline">
              Open all leads
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OperatorOverview;

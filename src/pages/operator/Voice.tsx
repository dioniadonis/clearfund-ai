import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

const OperatorVoice: React.FC = () => {
  const scripts = useQuery({
    queryKey: ["operator", "voice", "scripts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("call_scripts")
        .select("id, name, script_type, active")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const tasks = useQuery({
    queryKey: ["operator", "voice", "tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("call_tasks")
        .select("id, call_type, status, outcome, attempts, scheduled_for")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Voice</h1>

      <Alert>
        <AlertTitle>Setup required</AlertTitle>
        <AlertDescription>
          No calling provider is connected, so no call can be placed from here. Qualification and
          closing calls arrive in a later milestone. These lists are read-only records.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Call scripts</CardTitle>
        </CardHeader>
        <CardContent>
          {scripts.isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : scripts.isError ? (
            <p className="text-sm text-destructive">Could not load call scripts.</p>
          ) : (scripts.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No records yet.</p>
          ) : (
            <ul className="divide-y">
              {scripts.data!.map((s) => (
                <li key={s.id} className="py-2 flex flex-wrap justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{s.name}</p>
                    <p className="text-sm text-muted-foreground">{s.script_type}</p>
                  </div>
                  <Badge variant="outline">{s.active ? "active" : "inactive"}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Call tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : tasks.isError ? (
            <p className="text-sm text-destructive">Could not load call tasks.</p>
          ) : (tasks.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No records yet.</p>
          ) : (
            <ul className="divide-y">
              {tasks.data!.map((t) => (
                <li key={t.id} className="py-2 flex flex-wrap justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium">{t.call_type}</p>
                    <p className="text-sm text-muted-foreground">
                      {t.attempts} attempt{t.attempts === 1 ? "" : "s"} ·{" "}
                      {t.scheduled_for ? new Date(t.scheduled_for).toLocaleString() : "Not scheduled"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{t.status}</Badge>
                    {t.outcome && <Badge variant="secondary">{t.outcome}</Badge>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OperatorVoice;

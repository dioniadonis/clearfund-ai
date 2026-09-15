import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const OperatorCallbacks: React.FC = () => {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["operator", "callbacks", search],
    queryFn: async () => {
      let q = supabase
        .from("callback_requests")
        .select("id, phone, preferred_datetime_raw, preferred_at, reason, status, created_at, leads(full_name, business_name)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (search.trim()) q = q.ilike("phone", `%${search.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("callback_requests")
        .update({ status, resolved_at: status === "pending" ? null : new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operator", "callbacks"] });
      toast({ title: "Callback updated" });
    },
    onError: () => toast({ title: "Could not update callback", variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Callbacks</h1>

      <Alert>
        <AlertTitle>Manual for now</AlertTitle>
        <AlertDescription>
          These are callback requests captured by the phone concierge. Nothing dials automatically —
          scheduled outbound calling is a later step.
        </AlertDescription>
      </Alert>

      <Input
        placeholder="Search by phone number"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        maxLength={30}
        className="max-w-sm"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : query.isError ? (
            <p className="text-sm text-destructive">Could not load callbacks.</p>
          ) : (query.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No callback requests yet.</p>
          ) : (
            <ul className="divide-y">
              {query.data!.map((c) => {
                const lead = c.leads as { full_name?: string; business_name?: string } | null;
                return (
                  <li key={c.id} className="py-3 flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium">
                        {lead?.full_name ? `${lead.full_name} — ` : ""}
                        {c.phone}
                      </p>
                      {lead?.business_name && (
                        <p className="text-sm text-muted-foreground">{lead.business_name}</p>
                      )}
                      <p className="text-sm">
                        Asked for: <span className="font-medium">{c.preferred_datetime_raw}</span>
                        {c.preferred_at && (
                          <span className="text-muted-foreground">
                            {" "}
                            (read as {new Date(c.preferred_at).toLocaleString()})
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {c.reason.replace(/_/g, " ")} · logged {new Date(c.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={c.status === "pending" ? "default" : "outline"}>{c.status}</Badge>
                      {c.status === "pending" ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setStatus.mutate({ id: c.id, status: "done" })}
                          >
                            Mark done
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setStatus.mutate({ id: c.id, status: "cancelled" })}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setStatus.mutate({ id: c.id, status: "pending" })}
                        >
                          Reopen
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OperatorCallbacks;

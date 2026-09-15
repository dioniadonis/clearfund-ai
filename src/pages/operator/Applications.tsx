import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

const methodLabel: Record<string, string> = {
  sms_link: "Text link",
  email_link: "Email link",
  email_pdf: "Email PDF",
};

const OperatorApplications: React.FC = () => {
  const [search, setSearch] = useState("");

  const query = useQuery({
    queryKey: ["operator", "application-sends", search],
    queryFn: async () => {
      let q = supabase
        .from("application_sends")
        .select("id, delivery_method, destination, owner_name, business_name, status, failure_reason, sent_at, completed_at, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (search.trim()) q = q.ilike("destination", `%${search.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Applications sent</h1>

      <Alert>
        <AlertTitle>Delivery status</AlertTitle>
        <AlertDescription>
          Text sending needs an SMS account connected, and email sending needs an email sender set
          up. Until then a send is recorded and marked failed with the reason — it is never reported
          as sent.
        </AlertDescription>
      </Alert>

      <Input
        placeholder="Search by phone or email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        maxLength={255}
        className="max-w-sm"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sends</CardTitle>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : query.isError ? (
            <p className="text-sm text-destructive">Could not load application sends.</p>
          ) : (query.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No applications sent yet.</p>
          ) : (
            <ul className="divide-y">
              {query.data!.map((s) => (
                <li key={s.id} className="py-3 flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium truncate">
                      {s.owner_name || "Unknown"}
                      {s.business_name ? ` — ${s.business_name}` : ""}
                    </p>
                    <p className="text-sm text-muted-foreground break-all">
                      {methodLabel[s.delivery_method] ?? s.delivery_method} to {s.destination}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.created_at).toLocaleString()}
                      {s.failure_reason ? ` · ${s.failure_reason.replace(/_/g, " ")}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={s.status === "sent" ? "default" : "destructive"}>{s.status}</Badge>
                    {s.completed_at && <Badge variant="secondary">form completed</Badge>}
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

export default OperatorApplications;

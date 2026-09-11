import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

const useList = <T,>(key: string, fn: () => Promise<T>) =>
  useQuery({ queryKey: ["operator", "marketing", key], queryFn: fn });

const Section: React.FC<{
  title: string;
  state: { isLoading: boolean; isError: boolean };
  children: React.ReactNode;
}> = ({ title, state, children }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      {state.isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : state.isError ? (
        <p className="text-sm text-destructive">Could not load this list.</p>
      ) : (
        children
      )}
    </CardContent>
  </Card>
);

const OperatorMarketing: React.FC = () => {
  const campaigns = useList("campaigns", async () => {
    const { data, error } = await supabase
      .from("campaigns")
      .select("id, name, channel, status, offer, start_date, end_date")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data;
  });

  const briefs = useList("briefs", async () => {
    const { data, error } = await supabase
      .from("content_briefs")
      .select("id, title, channel, objective, status")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data;
  });

  const calendar = useList("calendar", async () => {
    const { data, error } = await supabase
      .from("calendar_items")
      .select("id, title, channel, scheduled_for, status")
      .order("scheduled_for", { ascending: true })
      .limit(50);
    if (error) throw error;
    return data;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Marketing</h1>

      <Alert>
        <AlertTitle>Setup required</AlertTitle>
        <AlertDescription>
          Content generation and ad execution are not connected yet. These lists are read-only
          records; nothing here spends money or publishes anything.
        </AlertDescription>
      </Alert>

      <Section title="Campaigns" state={campaigns}>
        {(campaigns.data?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">No records yet.</p>
        ) : (
          <ul className="divide-y">
            {campaigns.data!.map((c) => (
              <li key={c.id} className="py-2 flex flex-wrap justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{c.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {c.channel} · {c.offer ?? "No offer set"}
                  </p>
                </div>
                <Badge variant="outline">{c.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Content briefs" state={briefs}>
        {(briefs.data?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">No records yet.</p>
        ) : (
          <ul className="divide-y">
            {briefs.data!.map((b) => (
              <li key={b.id} className="py-2 flex flex-wrap justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{b.title}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {b.channel ?? "No channel"} · {b.objective ?? "No objective"}
                  </p>
                </div>
                <Badge variant="outline">{b.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Content calendar" state={calendar}>
        {(calendar.data?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">No records yet.</p>
        ) : (
          <ul className="divide-y">
            {calendar.data!.map((i) => (
              <li key={i.id} className="py-2 flex flex-wrap justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{i.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {i.scheduled_for} · {i.channel ?? "No channel"}
                  </p>
                </div>
                <Badge variant="outline">{i.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
};

export default OperatorMarketing;

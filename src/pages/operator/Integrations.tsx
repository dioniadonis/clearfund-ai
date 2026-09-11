import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

const OperatorIntegrations: React.FC = () => {
  const query = useQuery({
    queryKey: ["operator", "integrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integrations")
        .select("id, display_name, provider_key, category, status, required_setup, notes")
        .order("category", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Integrations</h1>

      <Alert>
        <AlertTitle>Read-only</AlertTitle>
        <AlertDescription>
          Status cannot be edited here. A status is only meaningful when a real connection check
          sets it, so hand-typed values are not allowed.
        </AlertDescription>
      </Alert>

      {query.isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading integrations…
        </div>
      ) : query.isError ? (
        <p className="text-sm text-destructive">Could not load integrations. Try reloading.</p>
      ) : (query.data?.length ?? 0) === 0 ? (
        <p className="text-sm text-muted-foreground">No records yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {query.data!.map((i) => (
            <Card key={i.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between gap-2">
                  <span className="truncate">{i.display_name}</span>
                  <Badge variant={i.status === "connected" ? "default" : "outline"}>
                    {i.status.replace(/_/g, " ")}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>{i.category}</p>
                {i.required_setup && <p>Setup needed: {i.required_setup}</p>}
                {i.notes && <p>{i.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OperatorIntegrations;

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["audit_status"];
export const AUDIT_STATUSES: Status[] = ["submitted", "in_review", "blueprint_draft", "owner_approved", "delivered", "cancelled"];

const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

const OperatorAudits: React.FC = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");

  const query = useQuery({
    queryKey: ["operator", "audits", search, status],
    queryFn: async () => {
      let q = supabase
        .from("audit_requests")
        .select("id, ref_code, full_name, business_name, email, status, phone_contact_allowed, payment_status, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (status !== "all") q = q.eq("status", status as Status);
      const s = search.trim().replace(/[,()%]/g, "");
      if (s) q = q.or(`full_name.ilike.%${s}%,business_name.ilike.%${s}%,email.ilike.%${s}%,ref_code.ilike.%${s}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const exportCsv = () => {
    const rows = query.data ?? [];
    const head = ["ref_code", "full_name", "business_name", "email", "status", "phone_contact_allowed", "payment_status", "created_at"];
    const body = rows.map((r) => head.map((h) => csvCell((r as Record<string, unknown>)[h])).join(","));
    const blob = new Blob([[head.join(","), ...body].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "audits.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Automation audits</h1>
      <Alert>
        <AlertTitle>Separate from funding</AlertTitle>
        <AlertDescription>
          Audit records are kept apart from funding leads. Payment is not connected. Audit intake
          retention period is not yet set.
        </AlertDescription>
      </Alert>

      <div className="flex flex-wrap gap-3">
        <Input placeholder="Search name, business, email, reference" value={search} onChange={(e) => setSearch(e.target.value)} maxLength={100} className="max-w-sm" />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {AUDIT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportCsv} disabled={!query.data?.length}>
          <Download className="h-4 w-4 mr-2" />Export CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {query.isLoading ? (
            <div className="p-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : query.error ? (
            <p className="p-6 text-sm text-destructive">Could not load audits: {(query.error as Error).message}</p>
          ) : !query.data?.length ? (
            <p className="p-6 text-sm text-muted-foreground">No records yet.</p>
          ) : (
            <div className="divide-y">
              {query.data.map((r) => (
                <Link key={r.id} to={`/operator/audits/${r.id}`} className="flex flex-wrap items-center justify-between gap-2 p-4 hover:bg-muted/50">
                  <div>
                    <p className="font-medium">{r.business_name} <span className="text-muted-foreground font-normal">· {r.full_name}</span></p>
                    <p className="text-xs text-muted-foreground">{r.ref_code} · {r.email} · {new Date(r.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    {!r.phone_contact_allowed && <Badge variant="outline">Email / human calls only</Badge>}
                    <Badge>{r.status.replace("_", " ")}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OperatorAudits;

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import LeadDetailSheet from "@/components/operator/LeadDetailSheet";
import type { Database } from "@/integrations/supabase/types";

type LeadStage = Database["public"]["Enums"]["lead_stage"];

const STAGES: LeadStage[] = [
  "new",
  "qualification",
  "nurture",
  "application",
  "documents",
  "submitted",
  "conditions",
  "funded",
  "declined",
  "lost",
];

type ServiceInterest = Database["public"]["Enums"]["service_interest"];
const SERVICES: ServiceInterest[] = ["working_capital", "gig_funding", "insurance_restoration", "other"];

const PAGE_SIZE = 25;

const OperatorLeads: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState<string>("all");
  const [service, setService] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string | null>(params.get("lead"));

  const query = useQuery({
    queryKey: ["operator", "leads", search, stage, service, page],
    queryFn: async () => {
      let q = supabase
        .from("leads")
        .select("id, full_name, business_name, email, stage, service_interest, entry_cta, next_action, next_action_due", {
          count: "exact",
        })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (stage !== "all") q = q.eq("stage", stage as LeadStage);
      if (service !== "all") q = q.eq("service_interest", service as ServiceInterest);

      const term = search.trim().replace(/[%,]/g, "");
      if (term) {
        q = q.or(
          `full_name.ilike.%${term}%,business_name.ilike.%${term}%,email.ilike.%${term}%`
        );
      }

      const { data, error, count } = await q;
      if (error) throw error;
      return { rows: data ?? [], count: count ?? 0 };
    },
  });

  const total = query.data?.count ?? 0;
  const maxPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Leads / Deals</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search name, business or email"
          value={search}
          maxLength={100}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="sm:max-w-xs"
        />
        <Select
          value={stage}
          onValueChange={(v) => {
            setStage(v);
            setPage(0);
          }}
        >
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="All stages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {STAGES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={service}
          onValueChange={(v) => {
            setService(v);
            setPage(0);
          }}
        >
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="All services" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All services</SelectItem>
            {SERVICES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {query.isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading leads…
        </div>
      ) : query.isError ? (
        <p className="text-sm text-destructive">Could not load leads. Try reloading.</p>
      ) : query.data!.rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No records yet.</p>
      ) : (
        <>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Next action</TableHead>
                  <TableHead>Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data!.rows.map((l) => (
                  <TableRow
                    key={l.id}
                    className="cursor-pointer"
                    onClick={() => setSelected(l.id)}
                  >
                    <TableCell className="font-medium">{l.business_name}</TableCell>
                    <TableCell>
                      <div>{l.full_name}</div>
                      <div className="text-sm text-muted-foreground">{l.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{l.stage}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>{l.service_interest.replace(/_/g, " ")}</div>
                      {l.entry_cta && <div className="text-xs text-muted-foreground">{l.entry_cta}</div>}
                    </TableCell>
                    <TableCell>{l.next_action ?? "—"}</TableCell>
                    <TableCell>{l.next_action_due ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {total} lead{total === 1 ? "" : "s"} · page {page + 1} of {maxPage + 1}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= maxPage}
                onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      <LeadDetailSheet
        leadId={selected}
        onOpenChange={(open) => {
          if (open) return;
          setSelected(null);
          if (params.has("lead")) {
            params.delete("lead");
            setParams(params, { replace: true });
          }
        }}
      />
    </div>
  );
};

export default OperatorLeads;

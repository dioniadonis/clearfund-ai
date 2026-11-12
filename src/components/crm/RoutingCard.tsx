import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { CrmLead } from "@/lib/crm";
import { toast } from "sonner";

type Ev = { product_id: string; label: string; eligible: boolean; reasons: string[]; fails: string[] };
const sel = "h-11 w-full rounded-md border border-input bg-background px-3 text-base";

export const useFunderProducts = () => useQuery({
  queryKey: ["funder_products"],
  queryFn: async () => {
    const { data, error } = await supabase.from("funder_products").select("*").order("funder").order("product");
    if (error) throw error; return data;
  },
});

const RoutingCard: React.FC<{ lead: CrmLead; isAdmin: boolean }> = ({ lead, isAdmin }) => {
  const qc = useQueryClient();
  const products = useFunderProducts();
  const evs = (Array.isArray(lead.route_reasons) ? lead.route_reasons : []) as unknown as Ev[];
  const routed = products.data?.find((p) => p.id === lead.routed_product_id);
  const q = lead.qualifier as Record<string, unknown> | null;
  if (!q && !lead.routed_product_id && lead.stage !== "Applied") return null;
  const refresh = () => { qc.invalidateQueries({ queryKey: ["crm_leads"] }); qc.invalidateQueries({ queryKey: ["crm_activities", lead.id] }); };

  const override = async (id: string) => {
    const { error } = await supabase.rpc("crm_set_route", { _lead_id: lead.id, _product_id: id || null });
    if (error) return toast.error(error.message); toast.success("Routing updated"); refresh();
  };
  const submitted = async () => {
    if (!routed || !window.confirm(`Mark this lead as submitted to ${routed.funder} · ${routed.product}? This records you and the time.`)) return;
    const { error } = await supabase.rpc("crm_mark_submitted_to_funder", { _lead_id: lead.id });
    if (error) return toast.error(error.message); toast.success("Marked submitted to funder"); refresh();
  };

  return (
    <section aria-label="Routing" className="rounded-md border p-3 mb-4 space-y-2 min-w-0">
      <h3 className="font-semibold">Routing</h3>
      <p className="text-sm break-words">Suggested: <strong>{routed ? `${routed.funder} · ${routed.product}` : lead.route_next === "state_blocked" ? "State not served" : "Needs review"}</strong>{lead.route_override_by ? " (set by admin)" : ""}</p>
      {q && <p className="text-xs text-muted-foreground break-words">Answers: {["months", "revenue", "credit", "state", "amount", "use_of_funds"].map((k) => String(q[k] ?? "–")).join(" · ")} · checking {q.business_checking ? "yes" : "no"}</p>}
      {evs.length > 0 && (
        <ul className="space-y-1 text-sm">
          {evs.map((e) => (
            <li key={e.product_id} className="break-words"><span className={e.eligible ? "text-primary font-medium" : "text-muted-foreground"}>{e.eligible ? "Fits" : "No"}: {e.label}</span>
              <span className="block text-xs text-muted-foreground">{(e.eligible ? e.reasons : e.fails).join("; ")}</span></li>
          ))}
        </ul>
      )}
      {isAdmin && (
        <div className="space-y-2">
          <label className="text-sm" htmlFor="crm-route">Change funder</label>
          <select id="crm-route" className={sel} value={lead.routed_product_id ?? ""} onChange={(e) => override(e.target.value)}>
            <option value="">None</option>{products.data?.map((p) => <option key={p.id} value={p.id}>{p.funder} · {p.product}{p.active ? "" : " (inactive)"}</option>)}
          </select>
          {lead.stage === "Applied" && <Button className="h-11 w-full" onClick={submitted} disabled={!routed}>Approve: mark submitted to funder</Button>}
        </div>
      )}
      {lead.submitted_to_funder_at && <p className="text-xs text-muted-foreground">Submitted {new Date(lead.submitted_to_funder_at).toLocaleString()}</p>}
    </section>
  );
};
export default RoutingCard;

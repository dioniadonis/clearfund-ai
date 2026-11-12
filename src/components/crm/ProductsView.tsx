import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useFunderProducts } from "./RoutingCard";
import { toast } from "sonner";

type Row = Record<string, unknown>;
const NUM = [["min_months", "Min months in business"], ["min_monthly_revenue", "Min monthly revenue ($)"], ["max_monthly_revenue", "Max monthly revenue ($)"], ["min_annual_sales", "Min annual sales ($)"], ["min_credit_score", "Min credit score"], ["amount_min", "Amount min ($)"], ["amount_max", "Amount max ($)"], ["commission_rank", "Commission rank (1 = best)"]] as const;
const sel = "h-11 w-full rounded-md border border-input bg-background px-3 text-base";
const blank: Row = { funder: "", product: "", product_kind: "other", excluded_states: [], needs_business_checking: false, active: true, apply_method: "dac_link", apply_url: "https://www.davidallencapital.com/clearfund" };

const ProductsView: React.FC = () => {
  const qc = useQueryClient(); const q = useFunderProducts();
  const [edit, setEdit] = useState<Row | null>(null); const [saving, setSaving] = useState(false);
  const set = (k: string, v: unknown) => setEdit((e) => ({ ...e!, [k]: v }));
  const save = async () => {
    if (!edit) return; setSaving(true);
    const row: Row = { ...edit }; delete row.created_at; delete row.updated_at;
    for (const [k] of NUM) row[k] = row[k] === "" || row[k] == null ? null : Number(row[k]);
    const { error } = row.id ? await supabase.from("funder_products").update(row as never).eq("id", row.id as string) : await supabase.from("funder_products").insert(row as never);
    setSaving(false); if (error) return toast.error(error.message);
    toast.success("Saved"); setEdit(null); qc.invalidateQueries({ queryKey: ["funder_products"] });
  };
  if (q.isLoading) return <Loader2 className="h-4 w-4 animate-spin" />;
  if (q.error) return <p className="text-destructive">Couldn't load products.</p>;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm text-muted-foreground">Rules used to suggest a funder for each lead.</p><Button className="h-11" onClick={() => setEdit({ ...blank })}>Add product</Button></div>
      <ul className="space-y-2">
        {q.data!.map((p) => (
          <li key={p.id}><button type="button" onClick={() => setEdit(p as unknown as Row)} className="w-full text-left rounded-lg border p-3 hover:bg-muted min-w-0">
            <p className="font-medium break-words">{p.funder} · {p.product} {!p.active && <span className="text-xs text-muted-foreground">(inactive)</span>}</p>
            <p className="text-xs text-muted-foreground break-words">{p.product_kind.toUpperCase()} · {p.apply_method === "dac_link" ? "Partner link" : "Our form"}{p.min_credit_score ? ` · FICO ${p.min_credit_score}+` : ""}{p.excluded_states.length ? ` · not ${p.excluded_states.join(", ")}` : ""}{p.commission_note ? ` · ${p.commission_note}` : ""}</p>
          </button></li>
        ))}
      </ul>
      <Sheet open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-4 sm:p-6">
          <SheetHeader className="text-left"><SheetTitle>{edit?.id ? "Edit product" : "New product"}</SheetTitle></SheetHeader>
          {edit && <div className="space-y-3 mt-4 pb-8">
            {([["funder", "Funder"], ["product", "Product"], ["apply_url", "Apply URL"], ["commission_note", "Commission note"]] as const).map(([k, l]) => (
              <div key={k} className="space-y-1"><Label htmlFor={`fp-${k}`}>{l}</Label><Input id={`fp-${k}`} className="h-11 text-base" value={(edit[k] as string) ?? ""} onChange={(e) => set(k, e.target.value)} /></div>))}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {NUM.map(([k, l]) => <div key={k} className="space-y-1 min-w-0"><Label htmlFor={`fp-${k}`}>{l}</Label><Input id={`fp-${k}`} type="number" className="h-11 text-base" value={(edit[k] as number | null) ?? ""} onChange={(e) => set(k, e.target.value)} /></div>)}
              <div className="space-y-1 min-w-0"><Label htmlFor="fp-kind">Product kind</Label><select id="fp-kind" className={sel} value={edit.product_kind as string} onChange={(e) => set("product_kind", e.target.value)}><option value="mca">MCA</option><option value="loan">Loan</option><option value="loc">Line of credit</option><option value="other">Other</option></select></div>
              <div className="space-y-1 min-w-0"><Label htmlFor="fp-method">Next step</Label><select id="fp-method" className={sel} value={edit.apply_method as string} onChange={(e) => set("apply_method", e.target.value)}><option value="dac_link">Partner link</option><option value="our_form">Our /apply form</option></select></div>
            </div>
            <div className="space-y-1"><Label htmlFor="fp-states">Excluded states (comma separated)</Label><Input id="fp-states" className="h-11 text-base" value={(edit.excluded_states as string[]).join(", ")} onChange={(e) => set("excluded_states", e.target.value.toUpperCase().split(/[^A-Z]+/).filter((s) => s.length === 2))} /></div>
            <label className="flex items-center gap-3 min-h-[44px]"><input type="checkbox" className="h-5 w-5" checked={!!edit.needs_business_checking} onChange={(e) => set("needs_business_checking", e.target.checked)} />Needs business checking</label>
            <label className="flex items-center gap-3 min-h-[44px]"><input type="checkbox" className="h-5 w-5" checked={!!edit.active} onChange={(e) => set("active", e.target.checked)} />Active</label>
            <p className="text-xs text-muted-foreground">State rules always apply: never VA, CT, MO, CA, VT, ND; no MCA in TX; no loans or lines of credit in NC.</p>
            <Button className="h-12 w-full" onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}</Button>
          </div>}
        </SheetContent>
      </Sheet>
    </div>
  );
};
export default ProductsView;

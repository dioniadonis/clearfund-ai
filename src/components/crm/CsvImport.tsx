import React, { useState } from "react";
import Papa from "papaparse";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { buildImportRows, IMPORT_FIELDS, type ImportField } from "@/lib/crm";
import { toast } from "sonner";

const guess = (f: string, headers: string[]) =>
  headers.find((h) => h.toLowerCase().replace(/[^a-z]/g, "") === f.replace(/_/g, "")) ??
  headers.find((h) => h.toLowerCase().includes(f.split("_")[0]));

const CsvImport: React.FC<{ open: boolean; onOpenChange: (o: boolean) => void }> = ({ open, onOpenChange }) => {
  const qc = useQueryClient();
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Partial<Record<ImportField, string>>>({});
  const [busy, setBusy] = useState(false);

  const onFile = (file: File) =>
    Papa.parse<Record<string, string>>(file, {
      header: true, skipEmptyLines: true,
      complete: (r) => {
        const h = r.meta.fields ?? [];
        setHeaders(h); setRows(r.data.slice(0, 5000));
        setMapping(Object.fromEntries(IMPORT_FIELDS.map((f) => [f, guess(f, h)]).filter(([, v]) => v)));
      },
    });

  const run = async () => {
    setBusy(true);
    const { data: existing, error } = await supabase.from("crm_leads").select("email, firm").limit(10000);
    if (error) { setBusy(false); return toast.error(error.message); }
    const { rows: ins, skipped } = buildImportRows(rows, mapping, existing ?? []);
    for (let i = 0; i < ins.length; i += 500) {
      const { error: e } = await supabase.from("crm_leads").insert(ins.slice(i, i + 500) as never);
      if (e) { setBusy(false); return toast.error(`Import stopped: ${e.message}`); }
    }
    setBusy(false);
    toast.success(`Imported ${ins.length}, skipped ${skipped} duplicates or empty rows`);
    qc.invalidateQueries({ queryKey: ["crm_leads"] });
    setRows([]); setHeaders([]); onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Import leads from CSV</DialogTitle>
          <DialogDescription>Rows with an email or firm name already in the CRM are skipped.</DialogDescription></DialogHeader>
        <input type="file" accept=".csv,text/csv" aria-label="CSV file" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} className="text-base" />
        {headers.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm">{rows.length} rows found. Match each field to a column:</p>
            {IMPORT_FIELDS.map((f) => (
              <div key={f} className="grid grid-cols-2 gap-2 items-center">
                <Label htmlFor={`map-${f}`}>{f.replace(/_/g, " ")}</Label>
                <select id={`map-${f}`} className="h-11 rounded-md border px-2 bg-background" value={mapping[f] ?? ""} onChange={(e) => setMapping((m) => ({ ...m, [f]: e.target.value || undefined }))}>
                  <option value="">(skip)</option>{headers.map((h) => <option key={h}>{h}</option>)}
                </select>
              </div>
            ))}
            <Button className="h-12 w-full" disabled={busy || (!mapping.email && !mapping.firm)} onClick={run}>{busy ? "Importing…" : "Import"}</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CsvImport;

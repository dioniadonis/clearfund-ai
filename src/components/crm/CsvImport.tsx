import React, { useState } from "react";
import Papa from "papaparse";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { buildImportRows, IMPORT_FIELDS, IMPORT_LABELS, type ImportField } from "@/lib/crm";
import { toast } from "sonner";

const ALIASES: Partial<Record<ImportField, string[]>> = {
  lead_ref: ["leadid", "leadref", "id"], firm: ["company", "firm", "business", "businessname"], lead_type: ["type", "leadtype"],
  website: ["website", "url", "domain", "site"], need_score: ["needscore", "score"], first_line: ["firstline"],
};
const clean = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
const guess = (f: ImportField, headers: string[]) => {
  const opts = [clean(f), ...(ALIASES[f] ?? [])];
  return headers.find((h) => opts.includes(clean(h)));
};

type Res = { status: string; reason?: string; id?: string };

const CsvImport: React.FC<{ open: boolean; onOpenChange: (o: boolean) => void }> = ({ open, onOpenChange }) => {
  const qc = useQueryClient();
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Partial<Record<ImportField, string>>>({});
  const [mode, setMode] = useState<"skip" | "fill">("skip");
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<{ added: number; skipped: number; rows: Record<string, string>[] } | null>(null);

  const onFile = (file: File) =>
    Papa.parse<Record<string, string>>(file, {
      header: true, skipEmptyLines: true,
      complete: (r) => {
        const h = r.meta.fields ?? [];
        setHeaders(h); setRows(r.data.slice(0, 20000)); setReport(null);
        setMapping(Object.fromEntries(IMPORT_FIELDS.map((f) => [f, guess(f, h)]).filter(([, v]) => v)));
      },
    });

  const run = async () => {
    setBusy(true);
    const { rows: mapped, skipped: inFile } = buildImportRows(rows, mapping);
    const out: Record<string, string>[] = [];
    let added = 0;
    for (let i = 0; i < mapped.length; i += 500) {
      const batch = mapped.slice(i, i + 500);
      const { data, error } = await supabase.rpc("crm_import_leads", { _rows: batch, _mode: mode });
      if (error) { setBusy(false); toast.error(`Import stopped after ${added} added: ${error.message}`); break; }
      (data as Res[]).forEach((r, j) => {
        if (r.status === "inserted") added++;
        out.push({ result: r.status === "inserted" ? "added" : r.status === "duplicate" ? `skipped: duplicate ${r.reason}` : `skipped: ${r.reason ?? r.status}`, ...batch[j] });
      });
    }
    setBusy(false);
    setReport({ added, skipped: inFile + (out.length - added), rows: out });
    qc.invalidateQueries({ queryKey: ["crm_leads"] });
  };

  const download = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([Papa.unparse(report!.rows)], { type: "text/csv" }));
    a.download = "crm-import-results.csv"; a.click(); URL.revokeObjectURL(a.href);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { setRows([]); setHeaders([]); setReport(null); } }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Import leads from CSV</DialogTitle>
          <DialogDescription>Rows matching an existing lead id, email, website domain, or company name in the same state are skipped.</DialogDescription></DialogHeader>
        {report ? (
          <div className="space-y-3">
            <p className="text-base"><strong>{report.added}</strong> added, <strong>{report.skipped}</strong> skipped.</p>
            <Button variant="outline" className="h-11 w-full" onClick={download}>Download results CSV</Button>
            <Button className="h-11 w-full" onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        ) : (
          <>
            <input type="file" accept=".csv,text/csv" aria-label="CSV file" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} className="text-base" />
            {headers.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm">{rows.length} rows found. Match each field to a column:</p>
                {IMPORT_FIELDS.map((f) => (
                  <div key={f} className="grid grid-cols-2 gap-2 items-center">
                    <Label htmlFor={`map-${f}`}>{IMPORT_LABELS[f] ?? f.replace(/_/g, " ")}</Label>
                    <select id={`map-${f}`} className="h-11 rounded-md border px-2 bg-background min-w-0" value={mapping[f] ?? ""} onChange={(e) => setMapping((m) => ({ ...m, [f]: e.target.value || undefined }))}>
                      <option value="">(skip)</option>{headers.map((h) => <option key={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-2 items-center">
                  <Label htmlFor="import-mode">When a lead already exists</Label>
                  <select id="import-mode" className="h-11 rounded-md border px-2 bg-background min-w-0" value={mode} onChange={(e) => setMode(e.target.value as "skip" | "fill")}>
                    <option value="skip">Skip it</option><option value="fill">Fill its blank fields only</option>
                  </select>
                </div>
                <Button className="h-12 w-full" disabled={busy || !(mapping.email || mapping.firm || mapping.lead_ref || mapping.website)} onClick={run}>{busy ? "Importing…" : "Import"}</Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CsvImport;

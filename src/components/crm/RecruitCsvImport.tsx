import React, { useState } from "react";
import Papa from "papaparse";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const REQUIRED = ["firm", "contact", "email", "phone", "website", "city", "state", "sector", "source_url"];
type PreviewItem = { status: "new" | "duplicate" | "invalid"; reason: string | null; row: { firm: string | null; contact: string | null; email: string | null; website: string | null } };

const RecruitCsvImport: React.FC<{ open: boolean; onOpenChange: (open: boolean) => void }> = ({ open, onOpenChange }) => {
  const qc = useQueryClient();
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [preview, setPreview] = useState<PreviewItem[] | null>(null);
  const [result, setResult] = useState<{ added: number; duplicate: number; invalid: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reset = () => { setRows([]); setPreview(null); setResult(null); setError(null); };

  const onFile = (file: File) => {
    setError(null); setPreview(null); setResult(null);
    Papa.parse<Record<string, string>>(file, { header: true, skipEmptyLines: true, complete: (parsed) => {
      const fields = parsed.meta.fields ?? [];
      const missing = REQUIRED.filter((field) => !fields.includes(field));
      if (missing.length) { setRows([]); return setError(`Missing columns: ${missing.join(", ")}`); }
      if (parsed.data.length > 5000) return setError("The maximum is 5,000 rows per file.");
      setRows(parsed.data);
    }, error: () => setError("Could not read this CSV file.") });
  };
  const runPreview = async () => {
    setBusy(true); setError(null);
    const { data, error } = await supabase.rpc("crm_preview_recruit_import", { _rows: rows });
    setBusy(false);
    if (error) return setError(error.message);
    setPreview(data as unknown as PreviewItem[]);
  };
  const runImport = async () => {
    setBusy(true); setError(null);
    const { data, error } = await supabase.rpc("crm_import_recruits", { _rows: rows });
    setBusy(false);
    if (error) return setError(error.message);
    setResult(data as unknown as { added: number; duplicate: number; invalid: number });
    toast.success("Recruit import complete"); qc.invalidateQueries({ queryKey: ["agent_recruits"] });
  };
  const counts = (preview ?? []).reduce((sum, row) => ({ ...sum, [row.status]: sum[row.status] + 1 }), { new: 0, duplicate: 0, invalid: 0 });

  return <Dialog open={open} onOpenChange={(next) => { onOpenChange(next); if (!next) reset(); }}><DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>Import recruit staging CSV</DialogTitle><DialogDescription>Required columns: {REQUIRED.join(", ")}. Email and website domain are checked against every CRM lead.</DialogDescription></DialogHeader>
    {result ? <div className="space-y-4 text-center"><p className="text-xl font-semibold">{result.added} imported</p><p className="text-muted-foreground">{result.duplicate} duplicates · {result.invalid} invalid</p><Button className="h-11 w-full" onClick={() => onOpenChange(false)}>Done</Button></div> : <div className="space-y-4">
      <input type="file" accept=".csv,text/csv" aria-label="Recruit CSV file" className="w-full text-base" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      {rows.length > 0 && <p className="text-sm">{rows.length} rows ready. Preview before importing; nothing has been saved yet.</p>}
      {preview && <><div className="grid grid-cols-3 gap-2">{[["New",counts.new],["Duplicate",counts.duplicate],["Invalid",counts.invalid]].map(([label,value]) => <div key={String(label)} className="rounded-md border p-3 text-center"><p className="text-xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>)}</div><ul className="grid gap-2">{preview.slice(0,50).map((item,index) => <li key={index} className="min-w-0 rounded-md border p-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><span className="break-words font-medium">{item.row.contact || item.row.firm || "Unnamed row"}</span><span className={item.status === "new" ? "text-primary" : item.status === "invalid" ? "text-destructive" : "text-muted-foreground"}>{item.status}</span></div><p className="break-all text-muted-foreground">{item.row.email || item.row.website || "No email or website"}{item.reason ? ` · ${item.reason}` : ""}</p></li>)}</ul>{preview.length > 50 && <p className="text-xs text-muted-foreground">Showing 50 of {preview.length} preview rows.</p>}</>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-col gap-2 sm:flex-row"><Button variant="outline" className="h-11 flex-1" disabled={!rows.length || busy} onClick={runPreview}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Preview import"}</Button>{preview && <Button className="h-11 flex-1" disabled={!counts.new || busy} onClick={runImport}><Upload className="mr-2 h-4 w-4" />Import {counts.new} new recruits</Button>}</div>
    </div>}
  </DialogContent></Dialog>;
};
export default RecruitCsvImport;

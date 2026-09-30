import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Plus, Printer, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  AUDIT_FIELDS, QUAL_SELECTS, BLUEPRINT_SECTIONS, EVIDENCE_LABELS, type BlueprintItem, type BlueprintSections, type EvidenceLabel,
} from "@/lib/auditConsent";
import { AUDIT_STATUSES } from "./Audits";

type Status = Database["public"]["Enums"]["audit_status"];

const AuditDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [sections, setSections] = useState<BlueprintSections>({});
  const [saving, setSaving] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [nextStatus, setNextStatus] = useState<Status | "">("");
  const [statusNote, setStatusNote] = useState("");

  const q = useQuery({
    queryKey: ["operator", "audit", id],
    enabled: !!id,
    queryFn: async () => {
      const [req, consents, blueprints, events] = await Promise.all([
        supabase.from("audit_requests").select("*").eq("id", id!).maybeSingle(),
        supabase.from("audit_consents").select("*").eq("request_id", id!).order("consented_at"),
        supabase.from("audit_blueprints").select("*").eq("request_id", id!).order("version", { ascending: false }),
        supabase.from("audit_events").select("*").eq("request_id", id!).order("created_at", { ascending: false }),
      ]);
      const err = req.error || consents.error || blueprints.error || events.error;
      if (err) throw err;
      return { req: req.data, consents: consents.data, blueprints: blueprints.data, events: events.data };
    },
  });

  const latest = q.data?.blueprints?.[0];
  const locked = latest?.status === "approved";

  useEffect(() => {
    if (latest) setSections((latest.sections as unknown as BlueprintSections) ?? {});
  }, [latest?.id]);

  const refresh = () => qc.invalidateQueries({ queryKey: ["operator", "audit", id] });

  const save = async (approve: boolean) => {
    setSaving(true);
    const { error } = await supabase.rpc("operator_save_blueprint", {
      _request_id: id!, _sections: sections as unknown as Database["public"]["Tables"]["audit_blueprints"]["Row"]["sections"], _approve: approve,
    });
    setSaving(false);
    setConfirmApprove(false);
    if (error) return toast.error(error.message);
    toast.success(approve ? "Blueprint approved" : "Draft saved as new version");
    refresh();
  };

  const changeStatus = async () => {
    if (!nextStatus) return;
    const { error } = await supabase.rpc("operator_set_audit_status", { _request_id: id!, _status: nextStatus, _note: statusNote });
    if (error) return toast.error(error.message);
    toast.success("Status updated");
    setNextStatus(""); setStatusNote("");
    refresh();
  };

  const update = (key: string, items: BlueprintItem[]) => setSections((s) => ({ ...s, [key]: items }));

  if (q.isLoading) return <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (q.error) return <p className="text-destructive">Could not load: {(q.error as Error).message}</p>;
  const r = q.data?.req;
  if (!r) return <p className="text-muted-foreground">Audit not found.</p>;
  const answers = (r.answers ?? {}) as Record<string, string>;

  return (
    <div className="space-y-6">
      <div className="print:hidden flex flex-wrap items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm"><Link to="/operator/audits"><ArrowLeft className="h-4 w-4 mr-1" />Audits</Link></Button>
        <Button variant="outline" size="sm" onClick={() => window.print()} disabled={!locked}>
          <Printer className="h-4 w-4 mr-1" />Print / save PDF{!locked && " (approve first)"}
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold">{r.business_name}</h1>
        <p className="text-sm text-muted-foreground">{r.ref_code} · {r.full_name} · {r.email}{r.phone ? ` · ${r.phone}` : ""}</p>
        <div className="flex gap-2 mt-2 print:hidden">
          <Badge>{r.status.replace("_", " ")}</Badge>
          <Badge variant="outline">Payment: not connected</Badge>
          {!r.phone_contact_allowed && <Badge variant="outline">No phone consent — email and human-dialed calls only</Badge>}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 print:hidden">
        <Card>
          <CardHeader><CardTitle className="text-base">Intake</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded border p-2">
              <p className="font-medium">Audit fit (self-attested): {answers.audit_fit || "—"}</p>
              {answers.audit_fit_missing && <p className="text-muted-foreground whitespace-pre-wrap">Missing / unclear: {answers.audit_fit_missing}</p>}
            </div>
            {[...QUAL_SELECTS, { key: "workflow_areas", label: "Workflow areas" }, ...AUDIT_FIELDS, { key: "insurance_claim_revenue_share", label: "Insurance-claim revenue share" }, { key: "carrier_pay_delay", label: "Carrier pay delay" }].map((f) => (
              <div key={f.key}>
                <p className="font-medium">{f.label}</p>
                <p className="text-muted-foreground whitespace-pre-wrap">{answers[f.key] || "—"}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Status</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Select value={nextStatus} onValueChange={(v) => setNextStatus(v as Status)}>
                <SelectTrigger><SelectValue placeholder="Change status" /></SelectTrigger>
                <SelectContent>{AUDIT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Note (optional)" value={statusNote} maxLength={300} onChange={(e) => setStatusNote(e.target.value)} />
              <Button onClick={changeStatus} disabled={!nextStatus}>Update status</Button>
              <p className="text-xs text-muted-foreground">Delivered requires an owner-approved Blueprint.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Consent records</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-xs">
              {q.data!.consents.map((c) => (
                <div key={c.id} className="border rounded p-2 space-y-1">
                  <p className="font-medium">{c.consent_type} — {c.checked ? "checked" : "not checked"}</p>
                  <p className="text-muted-foreground">{c.displayed_text}</p>
                  <p className="text-muted-foreground">{new Date(c.consented_at).toLocaleString()} · IP {c.ip ?? "—"} · {c.form_version} · phone {c.phone_entered ?? "—"}</p>
                  <p className="text-muted-foreground break-all">{c.page_url}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">History</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-xs">
              {q.data!.events.map((e) => (
                <p key={e.id}><span className="text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span> — {e.description ?? e.event_type}</p>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Blueprint {latest ? `v${latest.version} (${latest.status})` : "(no draft yet)"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {locked && <Alert className="print:hidden"><AlertDescription>This version is approved and locked. Saving creates a new draft version.</AlertDescription></Alert>}
          {BLUEPRINT_SECTIONS.map((s) => {
            const items = sections[s.key] ?? [];
            return (
              <div key={s.key} className="space-y-2">
                <h3 className="font-semibold">{s.label}</h3>
                {items.length === 0 && <p className="text-sm text-muted-foreground print:hidden">No items.</p>}
                {items.map((it, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <Select value={it.label} onValueChange={(v) => update(s.key, items.map((x, j) => j === i ? { ...x, label: v as EvidenceLabel } : x))}>
                      <SelectTrigger className="w-32 shrink-0 print:hidden"><SelectValue /></SelectTrigger>
                      <SelectContent>{EVIDENCE_LABELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                    <span className="hidden print:inline font-medium text-sm">[{it.label}]</span>
                    <Textarea className="print:hidden" maxLength={2000} value={it.text} onChange={(e) => update(s.key, items.map((x, j) => j === i ? { ...x, text: e.target.value } : x))} />
                    <p className="hidden print:block text-sm whitespace-pre-wrap">{it.text}</p>
                    <Button variant="ghost" size="icon" className="print:hidden" aria-label="Remove item" onClick={() => update(s.key, items.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="print:hidden" onClick={() => update(s.key, [...items, { label: "Unknown", text: "" }])}>
                  <Plus className="h-4 w-4 mr-1" />Add item
                </Button>
              </div>
            );
          })}
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button variant="outline" onClick={() => save(false)} disabled={saving}>Save draft version</Button>
            <Button onClick={() => setConfirmApprove(true)} disabled={saving}>Owner approve</Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmApprove} onOpenChange={setConfirmApprove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve this Blueprint?</AlertDialogTitle>
            <AlertDialogDescription>
              This saves a locked, approved version. Only the owner (admin) can approve. Check that every
              item is labeled correctly and contains no funding cross-sell.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => save(true)}>Approve</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AuditDetail;

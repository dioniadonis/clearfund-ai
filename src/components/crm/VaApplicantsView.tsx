import React, { useEffect, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";

type VaApplication = Database["public"]["Tables"]["va_applications"]["Row"];
const STATUSES = ["New", "Shortlisted", "Invited", "Hired", "Rejected"] as const;
const SCORES = [
  ["hours_overlap", "Hours overlap", "20%"],
  ["experience", "Experience", "20%"],
  ["english_clarity", "English clarity", "20%"],
  ["tone_warmth", "Tone warmth", "15%"],
  ["objection_handling", "Objection handling", "15%"],
  ["setup", "Setup", "10%"],
] as const;
type ScoreKey = typeof SCORES[number][0];
const PAGE = 50;
const selectClass = "h-11 min-w-0 w-full rounded-md border border-input bg-background px-3 text-base";
const experienceLabels: Record<string, string> = {
  appointment_setting: "Appointment setting",
  business_funding_mca: "Business funding or MCA",
  solar: "Solar",
  insurance: "Insurance",
  other: "Other",
};

const Detail: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="min-w-0 border-t py-3 first:border-t-0"><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm">{children}</dd></div>
);

const VoiceLink: React.FC<{ href: string }> = ({ href }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 break-all text-primary underline"><span className="break-all">{href}</span><ExternalLink className="h-3 w-3 shrink-0" /></a>
);

const ApplicantPanel: React.FC<{ application: VaApplication | null; onClose: () => void; onSaved: () => void }> = ({ application, onClose, onSaved }) => {
  const [status, setStatus] = useState<string>("New");
  const [notes, setNotes] = useState("");
  const [scores, setScores] = useState<Record<ScoreKey, string>>({ hours_overlap: "", experience: "", english_clarity: "", tone_warmth: "", objection_handling: "", setup: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!application) return;
    setStatus(application.status);
    setNotes(application.admin_notes ?? "");
    setScores(Object.fromEntries(SCORES.map(([key]) => [key, application[key]?.toString() ?? ""])) as Record<ScoreKey, string>);
  }, [application]);

  const save = async () => {
    if (!application) return;
    const parsedScores = Object.fromEntries(Object.entries(scores).map(([key, value]) => [key, value === "" ? null : Number(value)]));
    if (Object.values(parsedScores).some((value) => value !== null && (!Number.isInteger(value) || value < 1 || value > 10))) {
      toast.error("Scores must be whole numbers from 1 to 10."); return;
    }
    setBusy(true);
    const { error } = await supabase.from("va_applications").update({ status, admin_notes: notes.trim() || null, ...parsedScores }).eq("id", application.id);
    setBusy(false);
    if (error) return toast.error(`Couldn't save applicant: ${error.message}`);
    toast.success("VA applicant updated"); onSaved();
  };

  return (
    <Sheet open={!!application} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="z-[60] w-full min-w-0 overflow-y-auto p-4 sm:max-w-2xl sm:p-6">
        {application && <>
          <SheetHeader className="pr-8">
            <SheetTitle className="break-words">{application.full_name}</SheetTitle>
            <SheetDescription>Applied {new Date(application.created_at).toLocaleString()} · Source: {application.source}</SheetDescription>
          </SheetHeader>
          <div className="mt-5 grid gap-5">
            <section className="rounded-lg border bg-card p-4">
              <h3 className="font-semibold">Review and score</h3>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {SCORES.map(([key, label, weight]) => <div key={key} className="min-w-0 space-y-1"><Label htmlFor={`va-score-${key}`}>{label} ({weight})</Label><Input id={`va-score-${key}`} aria-label={`${label} score`} type="number" min="1" max="10" step="1" inputMode="numeric" className="h-11 min-w-0 text-base" value={scores[key]} onChange={(e) => setScores((old) => ({ ...old, [key]: e.target.value }))} /></div>)}
              </div>
              <p className="mt-3 text-sm">Weighted total: <strong>{application.weighted_total ?? "Complete all six scores"}</strong></p>
              <div className="mt-4 space-y-2"><Label htmlFor="va-status">Status</Label><select id="va-status" className={selectClass} value={status} onChange={(e) => setStatus(e.target.value)}>{STATUSES.map((value) => <option key={value}>{value}</option>)}</select></div>
              <div className="mt-4 space-y-2"><Label htmlFor="va-admin-notes">Admin notes</Label><Textarea id="va-admin-notes" rows={4} maxLength={4000} className="text-base" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
              <Button className="mt-4 h-11 w-full" disabled={busy} onClick={save}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save review</Button>
            </section>

            <section className="rounded-lg border bg-card p-4">
              <h3 className="font-semibold">Application answers</h3>
              <dl className="mt-2">
                <Detail label="Contact">{application.email}<br />{application.phone}<br />{application.city}, {application.country}</Detail>
                <Detail label="Calling/sales experience">{application.calling_experience_years} years</Detail>
                <Detail label="Experience areas">{application.experience_areas.map((area) => experienceLabels[area] ?? area).join(", ")}{application.experience_other ? ` — ${application.experience_other}` : ""}</Detail>
                <Detail label="Availability">{application.eastern_availability} for 9 AM–5 PM Eastern · {application.hours_per_week} hours/week</Detail>
                <Detail label="Setup">{application.internet_speed_mbps} Mbps · Headset: {application.headset ? "Yes" : "No"} · Quiet workspace: {application.quiet_workspace ? "Yes" : "No"}</Detail>
                <Detail label="30-second intro"><VoiceLink href={application.voice_intro_url} /></Detail>
                <Detail label="Contractor call opening"><VoiceLink href={application.voice_contractor_url} /></Detail>
                <Detail label="Objection response"><VoiceLink href={application.voice_objection_url} /></Detail>
                <Detail label="Why they'd be good at this">{application.why_good_fit}</Detail>
                <Detail label="Contact consent">{application.consent_text}<br />Version {application.consent_version} · {new Date(application.consented_at).toLocaleString()}</Detail>
              </dl>
            </section>
          </div>
        </>}
      </SheetContent>
    </Sheet>
  );
};

const VaApplicantsView: React.FC = () => {
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const qc = useQueryClient();
  const query = useInfiniteQuery({
    queryKey: ["va_applications", status, source], initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      let request = supabase.from("va_applications").select("*");
      if (status) request = request.eq("status", status);
      if (source.trim()) request = request.eq("source", source.trim().toLowerCase());
      const { data, error } = await request.order("weighted_total", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).range(pageParam * PAGE, pageParam * PAGE + PAGE - 1);
      if (error) throw error;
      return data;
    },
    getNextPageParam: (last, all) => last.length === PAGE ? all.length : undefined,
  });
  const rows = query.data?.pages.flat() ?? [];
  const selected = rows.find((row) => row.id === openId) ?? null;
  const refresh = () => qc.invalidateQueries({ queryKey: ["va_applications"] });

  return <div className="min-w-0 space-y-4">
    <div className="grid gap-2 sm:grid-cols-2">
      <select aria-label="VA applicant status" className={selectClass} value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{STATUSES.map((value) => <option key={value}>{value}</option>)}</select>
      <Input aria-label="VA applicant source" placeholder="Filter by exact source" className="h-11 min-w-0 text-base" value={source} onChange={(e) => setSource(e.target.value.slice(0, 40))} />
    </div>
    {query.error && <p role="alert" className="text-destructive">Couldn't load VA applicants: {(query.error as Error).message}</p>}
    {query.isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : rows.length === 0 ? <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">No VA applications match these filters.</div> : <div className="min-w-0 overflow-hidden rounded-lg border bg-card">
      <table className="w-full table-fixed text-left text-sm">
        <thead className="bg-secondary/60"><tr><th className="w-[38%] p-3 sm:w-auto">Applicant</th><th className="hidden p-3 md:table-cell">Source</th><th className="w-[22%] p-3 sm:w-28">Score</th><th className="w-[40%] p-3 sm:w-36">Status</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.id} className="border-t align-top"><td className="min-w-0 p-3"><button className="w-full min-w-0 text-left font-medium text-primary underline decoration-transparent hover:decoration-current" onClick={() => setOpenId(row.id)}><span className="block break-words">{row.full_name}</span><span className="mt-1 block break-words text-xs font-normal text-muted-foreground">{new Date(row.created_at).toLocaleDateString()}</span></button></td><td className="hidden break-words p-3 md:table-cell">{row.source}</td><td className="p-3 font-semibold">{row.weighted_total ?? "—"}</td><td className="break-words p-3">{row.status}</td></tr>)}</tbody>
      </table>
    </div>}
    {query.hasNextPage && <Button variant="outline" className="h-11 w-full" disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>{query.isFetchingNextPage ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load more"}</Button>}
    <ApplicantPanel application={selected} onClose={() => setOpenId(null)} onSaved={refresh} />
  </div>;
};

export default VaApplicantsView;

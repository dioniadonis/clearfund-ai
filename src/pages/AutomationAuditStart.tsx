import React, { useMemo, useRef, useState } from "react";
import { z } from "zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  AUDIT_FIELDS,
  AUDIT_PHONE_TEXT,
  AUDIT_TERMS_TEXT,
  CARRIER_DELAY_OPTIONS,
  CLAIM_SHARE_OPTIONS,
  QUAL_SELECTS,
  WORKFLOW_AREAS,
  assessFit,
  isContractorContext,
} from "@/lib/auditConsent";

const contactSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(120),
  business_name: z.string().trim().min(2, "Enter your business name").max(160),
  email: z.string().trim().email("Enter a valid email address").max(255),
  phone: z.string().trim().max(30).optional(),
});

const AutomationAuditStart: React.FC = () => {
  const startedAt = useRef(Date.now());
  const [contact, setContact] = useState({ full_name: "", business_name: "", email: "", phone: "" });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [terms, setTerms] = useState(false);
  const [phoneConsent, setPhoneConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [refCode, setRefCode] = useState<string | null>(null);

  const utm = useMemo(() => {
    const p = new URLSearchParams(window.location.search);
    return {
      utm_source: p.get("utm_source"),
      utm_medium: p.get("utm_medium"),
      utm_campaign: p.get("utm_campaign"),
    };
  }, []);
  const contractor = isContractorContext(answers);
  const fit = assessFit(answers);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    const errs: Record<string, string> = {};
    const c = contactSchema.safeParse(contact);
    if (!c.success) {
      for (const [k, v] of Object.entries(c.error.flatten().fieldErrors)) if (v?.[0]) errs[k] = v[0];
    }
    if (!terms) errs.terms = "You must accept to submit.";
    if (phoneConsent && !contact.phone.trim()) errs.phone = "Enter a phone number, or leave the phone box unchecked.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    const sent = { ...answers };
    if (!contractor) { delete sent.insurance_claim_revenue_share; delete sent.carrier_pay_delay; }
    const { data, error } = await supabase.functions.invoke("submit-audit", {
      body: {
        ...contact,
        phone: contact.phone.trim() || null,
        answers: sent,
        terms_accepted: true,
        phone_consent: phoneConsent,
        page_url: window.location.href,
        referrer: document.referrer || null,
        ...utm,
        company_website: honeypot,
        elapsed_ms: Date.now() - startedAt.current,
      },
    });
    setSubmitting(false);
    if (error || !data?.ok) {
      setServerError("Your intake could not be saved. Please try again. Nothing was submitted.");
      return;
    }
    setRefCode(data.ref_code);
    window.scrollTo({ top: 0 });
  };

  const setA = (k: string, v: string) => setAnswers((a) => ({ ...a, [k]: v }));
  const areas = (answers.workflow_areas ?? "").split(", ").filter(Boolean);
  const toggleArea = (w: string, on: boolean) =>
    setA("workflow_areas", (on ? [...areas, w] : areas.filter((x) => x !== w)).join(", "));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-10 max-w-2xl">
        {refCode ? (
          <div className="text-center space-y-4 py-12">
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
            <h1 className="text-2xl font-semibold text-foreground">Intake received</h1>
            <p className="text-muted-foreground">Your reference: <span className="font-mono">{refCode}</span></p>
            <Alert className="text-left">
              <AlertTitle>Payment</AlertTitle>
              <AlertDescription>
                Online payment is not available yet. No payment has been taken.
              </AlertDescription>
            </Alert>
            <Button disabled className="w-full">Pay [PRICE] — not yet available</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-8" noValidate>
            <Alert>
              <AlertTitle>Preview only</AlertTitle>
              <AlertDescription>Not published. Legal name and linked documents are placeholders.</AlertDescription>
            </Alert>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Automation audit intake</h1>
            <Alert variant="default">
              <AlertDescription>
                Please don't include Social Security numbers, bank or card details, passwords, or your
                customers' personal information.
              </AlertDescription>
            </Alert>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Contact</h2>
              {([
                ["full_name", "Full name", "text"],
                ["business_name", "Business name", "text"],
                ["email", "Email", "email"],
                ["phone", "Phone (optional)", "tel"],
              ] as const).map(([k, label, type]) => (
                <div key={k} className="space-y-1">
                  <Label htmlFor={k}>{label}</Label>
                  <Input
                    id={k}
                    type={type}
                    value={contact[k]}
                    maxLength={k === "phone" ? 30 : 255}
                    onChange={(e) => setContact((c) => ({ ...c, [k]: e.target.value }))}
                  />
                  {errors[k] && <p className="text-sm text-destructive">{errors[k]}</p>}
                </div>
              ))}
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Audit fit</h2>
              <p className="text-sm text-muted-foreground">
                These questions check whether a process audit would be useful. They are not a funding or credit check.
              </p>
              {QUAL_SELECTS.map((q) => (
                <div key={q.key} className="space-y-1">
                  <Label>{q.label}</Label>
                  <Select value={answers[q.key]} onValueChange={(v) => setA(q.key, v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{q.options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              ))}
              <div className="space-y-2">
                <Label>Workflow areas to review</Label>
                <div className="grid sm:grid-cols-2 gap-2">
                  {WORKFLOW_AREAS.map((w) => (
                    <label key={w} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={areas.includes(w)} onCheckedChange={(v) => toggleArea(w, v === true)} />
                      {w}
                    </label>
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Your business</h2>
              {AUDIT_FIELDS.map((f) => (
                <div key={f.key} className="space-y-1">
                  <Label htmlFor={f.key}>{f.label}</Label>
                  {f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}
                  {f.long ? (
                    <Textarea id={f.key} maxLength={1500} value={answers[f.key] ?? ""} onChange={(e) => setA(f.key, e.target.value)} />
                  ) : (
                    <Input id={f.key} maxLength={200} value={answers[f.key] ?? ""} onChange={(e) => setA(f.key, e.target.value)} />
                  )}
                </div>
              ))}
              {contractor && (
              <div className="grid sm:grid-cols-2 gap-4">
                <p className="sm:col-span-2 text-sm text-muted-foreground">Contractor questions (shown because of your industry):</p>
                <div className="space-y-1">
                  <Label>Share of revenue from insurance claims</Label>
                  <Select value={answers.insurance_claim_revenue_share} onValueChange={(v) => setA("insurance_claim_revenue_share", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{CLAIM_SHARE_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Typical carrier pay delay</Label>
                  <Select value={answers.carrier_pay_delay} onValueChange={(v) => setA("carrier_pay_delay", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{CARRIER_DELAY_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              )}
            </section>

            <Alert>
              <AlertTitle>Audit-fit check: {fit.label}</AlertTitle>
              <AlertDescription>
                {fit.missing.length ? (
                  <>
                    <p>Missing or unclear (self-reported):</p>
                    <ul className="list-disc pl-5">{fit.missing.map((m) => <li key={m}>{m}</li>)}</ul>
                    <p className="mt-1">You can still submit. A person will review it and may contact you later. This is not a rejection.</p>
                  </>
                ) : (
                  <p>Based on your answers. A person still reviews every intake. No results are promised.</p>
                )}
              </AlertDescription>
            </Alert>

            <div className="hidden" aria-hidden="true">
              <Input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} name="company_website" />
            </div>

            <section className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox id="terms" checked={terms} onCheckedChange={(v) => setTerms(v === true)} />
                <Label htmlFor="terms" className="font-normal leading-snug">{AUDIT_TERMS_TEXT}</Label>
              </div>
              {errors.terms && <p className="text-sm text-destructive">{errors.terms}</p>}
              <div className="flex items-start gap-3">
                <Checkbox id="phone_consent" checked={phoneConsent} onCheckedChange={(v) => setPhoneConsent(v === true)} />
                <Label htmlFor="phone_consent" className="font-normal leading-snug text-sm">{AUDIT_PHONE_TEXT}</Label>
              </div>
            </section>

            {serverError && (
              <Alert variant="destructive"><AlertDescription>{serverError}</AlertDescription></Alert>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Submit intake
            </Button>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AutomationAuditStart;

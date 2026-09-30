import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { ArrowLeft, Check } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { STEPS, AUDIT_TERMS_TEXT, AUDIT_PHONE_TEXT, type Answers, type Question } from "@/lib/freeAudit";

// Only non-personal answers are kept in the browser; contact details never are.
const KEY = "cf_free_audit_v1";
type Ev = { event_name: string; step_id?: string | null; at: number };
type Saved = { step: number; answers: Answers; events: Ev[]; startedAt: number; utm: Record<string, string | null> };

const defaults = (): Answers => {
  const a: Record<string, unknown> = { drains: [], lead_sources: [], current_tools: [] };
  for (const s of STEPS) for (const q of s.questions) if (q.type === "slider") a[q.id] = q.default;
  return a as Answers;
};
const load = (): Saved => {
  try { const v = JSON.parse(localStorage.getItem(KEY) ?? ""); if (v?.answers) return v; } catch { /* fresh */ }
  const p = new URLSearchParams(window.location.search);
  return { step: 0, answers: defaults(), events: [], startedAt: Date.now(),
    utm: { utm_source: p.get("utm_source"), utm_medium: p.get("utm_medium"), utm_campaign: p.get("utm_campaign") } };
};

const LOADING_MSGS = ["Mapping your workflows...", "Finding the leaks...", "Running the numbers...", "Building your report..."];
const contactSchema = z.object({
  first_name: z.string().trim().min(1, "Enter your first name").max(80),
  business_name: z.string().trim().min(2, "Enter your business name").max(160),
  email: z.string().trim().email("Enter a valid email address").max(255),
  phone: z.string().trim().max(30),
});

const FreeAuditFlow: React.FC = () => {
  const nav = useNavigate();
  const [st, setSt] = useState<Saved>(load);
  const [contact, setContact] = useState({ first_name: "", business_name: "", email: "", phone: "" });
  const [terms, setTerms] = useState(false);
  const [phoneConsent, setPhoneConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [msg, setMsg] = useState(0);
  const dir = useRef(1);

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(st)); }, [st]);
  const stepId = st.step === 0 ? "welcome" : st.step <= 5 ? STEPS[st.step - 1].id : st.step === 6 ? "contact" : "processing";
  useEffect(() => { if (st.step > 0) log("step_viewed", stepId); }, [st.step]); // eslint-disable-line react-hooks/exhaustive-deps

  const log = (event_name: string, step_id?: string) =>
    setSt((s) => ({ ...s, events: [...s.events, { event_name, step_id, at: Date.now() }].slice(-200) }));
  const setA = (k: string, v: unknown) => setSt((s) => ({ ...s, answers: { ...s.answers, [k]: v } }));
  const go = (n: number) => { dir.current = n > st.step ? 1 : -1; setSt((s) => ({ ...s, step: n })); window.scrollTo({ top: 0 }); };
  const next = () => { log(st.step === 0 ? "audit_started" : "step_completed", stepId); go(st.step + 1); };
  const back = () => { log("step_back", stepId); go(st.step - 1); };

  const a = st.answers as Record<string, unknown>;
  const stepValid = useMemo(() => {
    if (st.step < 1 || st.step > 5) return true;
    return STEPS[st.step - 1].questions.every((q) => q.type === "slider" || q.type === "multi_chips" || !!a[q.id]);
  }, [st.step, a]);

  useEffect(() => {
    if (st.step !== 7) return;
    const t = setInterval(() => setMsg((m) => (m + 1) % LOADING_MSGS.length), 900);
    return () => clearInterval(t);
  }, [st.step]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    const errs: Record<string, string> = {};
    const c = contactSchema.safeParse(contact);
    if (!c.success) for (const [k, v] of Object.entries(c.error.flatten().fieldErrors)) if (v?.[0]) errs[k] = v[0];
    if (!terms) errs.terms = "You must accept to see your results.";
    if (phoneConsent && !contact.phone.trim()) errs.phone = "Enter a phone number, or leave the phone box unchecked.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    go(7);
    const minWait = new Promise((r) => setTimeout(r, 2500));
    const call = supabase.functions.invoke("submit-free-audit", {
      body: {
        ...contact, phone: contact.phone.trim() || null, answers: st.answers,
        terms_accepted: true, phone_consent: phoneConsent, events: st.events,
        page_url: window.location.href, referrer: document.referrer || null, ...st.utm,
        company_website: honeypot, elapsed_ms: Date.now() - st.startedAt,
      },
    });
    const [{ data, error }] = await Promise.all([call, minWait]);
    if (error || !data?.ok) {
      go(6);
      setServerError("We couldn't save your audit, so no results were created. Please try again.");
      return;
    }
    localStorage.removeItem(KEY);
    nav(`/results/${data.token}`, { replace: true });
  };

  const renderQ = (q: Question) => {
    if (q.type === "slider") {
      const v = Number(a[q.id] ?? q.default);
      return (
        <div className="space-y-4">
          <div className="text-3xl font-semibold text-foreground" aria-live="polite">
            {q.unit === "$" ? `$${v.toLocaleString()}` : v}{q.unit && q.unit !== "$" ? <span className="text-base text-muted-foreground ml-2">{q.unit}</span> : null}
          </div>
          <Slider value={[v]} min={q.min} max={q.max} step={q.step} onValueChange={([x]) => setA(q.id, x)} aria-label={q.label} />
        </div>
      );
    }
    const multi = q.type === "multi_chips";
    const sel = (multi ? (a[q.id] as string[]) ?? [] : [a[q.id]]) as string[];
    const toggle = (val: string) =>
      setA(q.id, multi ? (sel.includes(val) ? sel.filter((x) => x !== val) : [...sel, val]) : val);
    return (
      <div className={cn(q.type === "single_cards" ? "grid sm:grid-cols-2 gap-3" : "flex flex-wrap gap-2")} role={multi ? "group" : "radiogroup"}>
        {q.options.map((opt) => {
          const on = sel.includes(opt.value);
          return (
            <button key={opt.value} type="button" role={multi ? "checkbox" : "radio"} aria-checked={on} onClick={() => toggle(opt.value)}
              className={cn("border rounded-lg text-left transition-colors min-h-12 flex items-center gap-2",
                q.type === "single_cards" ? "px-4 py-3" : "px-4 py-2 rounded-full",
                on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-accent")}>
              {on && <Check className="h-4 w-4 shrink-0" />}<span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const shown = Math.min(Math.max(st.step, 1), 7);
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      {st.step > 0 && (
        <div className="container mx-auto px-4 max-w-2xl pt-6 space-y-2">
          <div className="h-1 w-full bg-muted rounded"><div className="h-1 bg-accent rounded transition-all duration-300" style={{ width: `${(shown / 7) * 100}%` }} /></div>
          <p className="text-xs text-muted-foreground">Step {shown} of 7</p>
        </div>
      )}
      <main className="flex-grow container mx-auto px-4 py-8 max-w-2xl">
        <div key={st.step} className={cn("animate-in fade-in duration-300", dir.current > 0 ? "slide-in-from-right-4" : "slide-in-from-left-4")}>
          {st.step === 0 && (
            <div className="text-center space-y-5 py-10">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Let's map what your business could be automating.</h1>
              <p className="text-muted-foreground text-lg">A few quick questions about how you run things today. At the end you'll see exactly which tasks a machine could take over, what they're costing you now, and what it would cost to hand them off.</p>
              <Button size="lg" className="h-14 px-8 text-base" onClick={next}>Start my audit</Button>
              <p className="text-sm text-muted-foreground">Free while we build our first ten client stories.</p>
            </div>
          )}

          {st.step >= 1 && st.step <= 5 && (() => {
            const s = STEPS[st.step - 1];
            return (
              <div className="space-y-8">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">{s.title}</h1>
                  {s.microcopy && <p className="text-muted-foreground mt-1">{s.microcopy}</p>}
                </div>
                {s.questions.map((q) => (
                  <fieldset key={q.id} className="space-y-3">
                    <legend className="text-lg font-medium text-foreground">{q.label}</legend>
                    {q.microcopy && <p className="text-sm text-muted-foreground -mt-1">{q.microcopy}</p>}
                    {renderQ(q)}
                  </fieldset>
                ))}
              </div>
            );
          })()}

          {st.step === 6 && (
            <form onSubmit={submit} noValidate className="space-y-5">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Where should we send your results?</h1>
                <p className="text-muted-foreground mt-1">Your report is ready.</p>
              </div>
              <Alert><AlertDescription>Please don't include Social Security numbers, bank or card details, or passwords.</AlertDescription></Alert>
              {([["first_name", "First name", "text"], ["business_name", "Business name", "text"], ["email", "Email", "email"], ["phone", "Phone (optional)", "tel"]] as const).map(([k, label, type]) => (
                <div key={k} className="space-y-1">
                  <Label htmlFor={k}>{label}</Label>
                  <Input id={k} type={type} className="h-12" value={contact[k]} maxLength={k === "phone" ? 30 : 160}
                    onChange={(e) => setContact((c) => ({ ...c, [k]: e.target.value }))} />
                  {errors[k] && <p className="text-sm text-destructive">{errors[k]}</p>}
                </div>
              ))}
              <div className="hidden" aria-hidden="true">
                <Input tabIndex={-1} autoComplete="off" name="company_website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
              </div>
              <div className="flex items-start gap-3">
                <Checkbox id="terms" checked={terms} onCheckedChange={(v) => setTerms(v === true)} />
                <Label htmlFor="terms" className="font-normal leading-snug">{AUDIT_TERMS_TEXT}</Label>
              </div>
              {errors.terms && <p className="text-sm text-destructive">{errors.terms}</p>}
              <div className="flex items-start gap-3">
                <Checkbox id="phone_consent" checked={phoneConsent} onCheckedChange={(v) => setPhoneConsent(v === true)} />
                <Label htmlFor="phone_consent" className="font-normal leading-snug text-sm">{AUDIT_PHONE_TEXT}</Label>
              </div>
              {serverError && <Alert variant="destructive"><AlertDescription>{serverError}</AlertDescription></Alert>}
              <Button type="submit" size="lg" className="w-full h-14 text-base">Show my results</Button>
            </form>
          )}

          {st.step === 7 && (
            <div className="text-center py-20 space-y-6" role="status" aria-live="polite">
              <div className="mx-auto h-16 w-16 rounded-full border-4 border-muted border-t-accent animate-spin" />
              <p className="text-lg text-foreground">{LOADING_MSGS[msg]}</p>
            </div>
          )}
        </div>

        {st.step >= 1 && st.step <= 6 && (
          <div className={cn("flex gap-3 mt-10", st.step === 6 ? "" : "justify-between")}>
            <Button type="button" variant="outline" size="lg" onClick={back}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
            {st.step <= 5 && <Button size="lg" onClick={next} disabled={!stepValid}>Continue</Button>}
          </div>
        )}
      </main>
    </div>
  );
};

export default FreeAuditFlow;

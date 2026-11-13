import React, { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { usePageMeta } from "@/lib/usePageMeta";

const inputClass = "h-12 w-full min-w-0 text-base";
const selectClass = "h-12 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base";
const CONSENT_TEXT = "I agree to be contacted by email or WhatsApp about this application.";
const experienceOptions = [
  ["appointment_setting", "Appointment setting"],
  ["business_funding_mca", "Business funding or MCA"],
  ["solar", "Solar"],
  ["insurance", "Insurance"],
  ["other", "Other"],
] as const;

type FormState = {
  full_name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  calling_experience_years: string;
  experience_other: string;
  eastern_availability: string;
  hours_per_week: string;
  internet_speed_mbps: string;
  headset: string;
  quiet_workspace: string;
  voice_intro_url: string;
  voice_contractor_url: string;
  voice_objection_url: string;
  why_good_fit: string;
  company_website: string;
};

const initialForm: FormState = {
  full_name: "", email: "", phone: "", country: "", city: "",
  calling_experience_years: "", experience_other: "", eastern_availability: "",
  hours_per_week: "", internet_speed_mbps: "", headset: "", quiet_workspace: "",
  voice_intro_url: "", voice_contractor_url: "", voice_objection_url: "",
  why_good_fit: "", company_website: "",
};

const validShareableUrl = (value: string) => {
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && url.hostname.includes(".");
  } catch {
    return false;
  }
};

const Field: React.FC<{ label: string; htmlFor: string; children: React.ReactNode; hint?: string }> = ({ label, htmlFor, children, hint }) => (
  <div className="min-w-0 space-y-2">
    <Label htmlFor={htmlFor}>{label}</Label>
    {children}
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
  </div>
);

const Careers: React.FC = () => {
  usePageMeta("Remote Calling VA Careers | ClearFund AI", "Apply for ClearFund AI's remote calling VA role helping small business owners complete business funding intake.", "/careers");
  const started = useRef(Date.now());
  const [form, setForm] = useState<FormState>(initialForm);
  const [areas, setAreas] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof FormState, value: string) => setForm((old) => ({ ...old, [key]: value }));

  const toggleArea = (area: string) => {
    setAreas((old) => old.includes(area) ? old.filter((item) => item !== area) : [...old, area]);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (areas.length === 0) return setError("Select at least one experience area.");
    if (areas.includes("other") && !form.experience_other.trim()) return setError("Describe your other experience.");
    const voiceUrls = [form.voice_intro_url, form.voice_contractor_url, form.voice_objection_url];
    if (voiceUrls.some((url) => !validShareableUrl(url.trim()))) return setError("Enter three valid shareable voice-note links beginning with http:// or https://.");
    if (!consent) return setError("Please agree to be contacted about this application.");

    setBusy(true);
    const source = (new URLSearchParams(window.location.search).get("src") || "direct").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40) || "direct";
    const { error: submitError } = await supabase.functions.invoke("submit-va-application", {
      body: {
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        country: form.country,
        city: form.city,
        calling_experience_years: Number(form.calling_experience_years),
        experience_areas: areas,
        experience_other: areas.includes("other") ? form.experience_other : null,
        eastern_availability: form.eastern_availability,
        hours_per_week: Number(form.hours_per_week),
        internet_speed_mbps: Number(form.internet_speed_mbps),
        headset: form.headset === "yes",
        quiet_workspace: form.quiet_workspace === "yes",
        voice_intro_url: form.voice_intro_url.trim(),
        voice_contractor_url: form.voice_contractor_url.trim(),
        voice_objection_url: form.voice_objection_url.trim(),
        why_good_fit: form.why_good_fit,
        contact_consent: consent,
        consent_text: CONSENT_TEXT,
        consent_version: "va-careers-v1",
        source,
        company_website: form.company_website,
        elapsed_ms: Date.now() - started.current,
      },
    });
    setBusy(false);
    if (submitError) return setError("We couldn't submit your application. Please check your answers and try again.");
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex min-h-screen min-w-0 flex-col bg-background">
      <Header />
      <main className="min-w-0 flex-grow">
        <section className="border-b bg-card">
          <div className="container-custom py-12 text-center sm:py-16">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Remote opportunity</p>
            <h1 className="mx-auto mt-3 max-w-4xl break-words text-3xl font-bold sm:text-5xl">Remote Calling VA: Business Funding Intake</h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">Help business owners take the next step through clear, respectful conversations.</p>
          </div>
        </section>

        <section className="container-custom grid gap-5 py-10 md:grid-cols-3">
          <article className="rounded-lg border bg-card p-5">
            <h2 className="text-xl font-bold">What the job is</h2>
            <p className="mt-3 text-muted-foreground">Call small business owners, many of whom just won government contracts, learn how their cash flow works, and when there's a real need, email them our short intake link while still on the call.</p>
            <p className="mt-3 text-muted-foreground">No selling pressure: if there's no need, you say so and move on. Full training and a quiz are provided before you start.</p>
          </article>
          <article className="rounded-lg border bg-card p-5">
            <h2 className="text-xl font-bold">Hours</h2>
            <p className="mt-3 text-muted-foreground">Your schedule needs to overlap 9 AM to 5 PM US Eastern.</p>
          </article>
          <article className="rounded-lg border bg-card p-5">
            <h2 className="text-xl font-bold">Pay</h2>
            <p className="mt-3 text-muted-foreground">$25 a week for the first two weeks no matter what, plus $20 to $25 for each eligible file, plus the funded bonus. After week two, the base stops and it's per-file and bonuses only.</p>
            <p className="mt-3 text-muted-foreground">An eligible file is a complete, verified application from a business that qualifies.</p>
          </article>
        </section>

        <section className="border-t bg-secondary/40">
          <div className="container-custom py-10 sm:py-14">
            <div className="mx-auto min-w-0 max-w-3xl rounded-lg border bg-card p-4 sm:p-8">
              {submitted ? (
                <div className="py-12 text-center" role="status">
                  <h2 className="text-2xl font-bold">Thanks, we review every application and reply by email if it's a fit.</h2>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold">VA application</h2>
                    <p className="mt-2 text-sm text-muted-foreground">Complete all required fields. Voice-note links must be shared so our review team can open them.</p>
                  </div>

                  <fieldset className="space-y-4">
                    <legend className="mb-3 text-xl font-bold">1. Contact details</legend>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Full name" htmlFor="va-name"><Input id="va-name" autoComplete="name" required maxLength={120} className={inputClass} value={form.full_name} onChange={(e) => set("full_name", e.target.value)} /></Field>
                      <Field label="Email" htmlFor="va-email"><Input id="va-email" type="email" autoComplete="email" required maxLength={255} className={inputClass} value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
                      <Field label="WhatsApp or phone number" htmlFor="va-phone"><Input id="va-phone" type="tel" autoComplete="tel" required maxLength={40} className={inputClass} value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
                      <Field label="Country" htmlFor="va-country"><Input id="va-country" autoComplete="country-name" required maxLength={100} className={inputClass} value={form.country} onChange={(e) => set("country", e.target.value)} /></Field>
                      <Field label="City" htmlFor="va-city"><Input id="va-city" autoComplete="address-level2" required maxLength={120} className={inputClass} value={form.city} onChange={(e) => set("city", e.target.value)} /></Field>
                    </div>
                  </fieldset>

                  <fieldset className="space-y-4 border-t pt-7">
                    <legend className="mb-3 text-xl font-bold">2. Experience</legend>
                    <Field label="Years of calling/sales experience" htmlFor="va-years"><Input id="va-years" type="number" required min="0" max="80" step="0.5" inputMode="decimal" className={inputClass} value={form.calling_experience_years} onChange={(e) => set("calling_experience_years", e.target.value)} /></Field>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {experienceOptions.map(([value, label]) => (
                        <label key={value} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-md border px-3 py-2">
                          <input type="checkbox" className="h-5 w-5 shrink-0" checked={areas.includes(value)} onChange={() => toggleArea(value)} />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                    {areas.includes("other") && <Field label="Other experience" htmlFor="va-other"><Input id="va-other" required maxLength={200} className={inputClass} value={form.experience_other} onChange={(e) => set("experience_other", e.target.value)} /></Field>}
                  </fieldset>

                  <fieldset className="space-y-4 border-t pt-7">
                    <legend className="mb-3 text-xl font-bold">3. Availability</legend>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Can you work 9 AM to 5 PM Eastern?" htmlFor="va-availability"><select id="va-availability" required className={selectClass} value={form.eastern_availability} onChange={(e) => set("eastern_availability", e.target.value)}><option value="">Select one</option><option value="yes">Yes</option><option value="partly">Partly</option><option value="no">No</option></select></Field>
                      <Field label="Hours per week" htmlFor="va-hours"><Input id="va-hours" type="number" required min="1" max="168" step="0.5" inputMode="decimal" className={inputClass} value={form.hours_per_week} onChange={(e) => set("hours_per_week", e.target.value)} /></Field>
                    </div>
                  </fieldset>

                  <fieldset className="space-y-4 border-t pt-7">
                    <legend className="mb-3 text-xl font-bold">4. Setup</legend>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Field label="Internet speed (Mbps)" htmlFor="va-internet"><Input id="va-internet" type="number" required min="0" max="100000" step="0.1" inputMode="decimal" className={inputClass} value={form.internet_speed_mbps} onChange={(e) => set("internet_speed_mbps", e.target.value)} /></Field>
                      <Field label="Headset" htmlFor="va-headset"><select id="va-headset" required className={selectClass} value={form.headset} onChange={(e) => set("headset", e.target.value)}><option value="">Select</option><option value="yes">Yes</option><option value="no">No</option></select></Field>
                      <Field label="Quiet place to work" htmlFor="va-quiet"><select id="va-quiet" required className={selectClass} value={form.quiet_workspace} onChange={(e) => set("quiet_workspace", e.target.value)}><option value="">Select</option><option value="yes">Yes</option><option value="no">No</option></select></Field>
                    </div>
                  </fieldset>

                  <fieldset className="space-y-4 border-t pt-7">
                    <legend className="mb-3 text-xl font-bold">5. Voice notes</legend>
                    <p className="text-sm text-muted-foreground">Add shareable Google Drive, Vocaroo, Loom, or similar links. Test each link in a private browser window before submitting.</p>
                    <Field label="a) 30-second intro about yourself" htmlFor="va-voice-intro"><Input id="va-voice-intro" type="url" required maxLength={2048} placeholder="https://" className={inputClass} value={form.voice_intro_url} onChange={(e) => set("voice_intro_url", e.target.value)} /></Field>
                    <Field label="b) How would you open a call with a busy contractor who just won a county contract?" htmlFor="va-voice-contractor"><Input id="va-voice-contractor" type="url" required maxLength={2048} placeholder="https://" className={inputClass} value={form.voice_contractor_url} onChange={(e) => set("voice_contractor_url", e.target.value)} /></Field>
                    <Field label="c) 60-second reply to: “I'm not interested, I've got money.”" htmlFor="va-voice-objection"><Input id="va-voice-objection" type="url" required maxLength={2048} placeholder="https://" className={inputClass} value={form.voice_objection_url} onChange={(e) => set("voice_objection_url", e.target.value)} /></Field>
                  </fieldset>

                  <fieldset className="space-y-4 border-t pt-7">
                    <legend className="mb-3 text-xl font-bold">6. Why you'd be good at this</legend>
                    <Field label="Your answer" htmlFor="va-why" hint={`${form.why_good_fit.length}/500 characters`}><Textarea id="va-why" required minLength={10} maxLength={500} rows={5} className="min-w-0 text-base" value={form.why_good_fit} onChange={(e) => set("why_good_fit", e.target.value)} /></Field>
                  </fieldset>

                  <fieldset className="space-y-4 border-t pt-7">
                    <legend className="mb-3 text-xl font-bold">7. Contact consent</legend>
                    <label className="flex cursor-pointer items-start gap-3 rounded-md border p-4">
                      <input type="checkbox" required className="mt-0.5 h-5 w-5 shrink-0" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                      <span>{CONSENT_TEXT}</span>
                    </label>
                  </fieldset>

                  <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" value={form.company_website} onChange={(e) => set("company_website", e.target.value)} />
                  {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" size="lg" className="min-h-12 w-full" disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit application</Button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Careers;

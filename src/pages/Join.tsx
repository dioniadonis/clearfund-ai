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

const STATES = "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" ");
type Answers = {
  full_name: string; email: string; phone: string; state: string; over_18: string;
  commission_experience: string; current_work: string; owner_contact: string; owner_network: string;
  hours_per_week: string; outside_work_limit: string; commission_only_ok: string;
  written_answer: string; source: string; company_website: string;
};
const initial: Answers = {
  full_name: "", email: "", phone: "", state: "", over_18: "", commission_experience: "",
  current_work: "", owner_contact: "", owner_network: "", hours_per_week: "",
  outside_work_limit: "", commission_only_ok: "", written_answer: "", source: "", company_website: "",
};
const questions: { key: keyof Answers; title: string; options?: [string, string][] }[] = [
  { key: "state", title: "Which state do you live in?" },
  { key: "over_18", title: "Are you 18 or older?", options: [["yes", "Yes"], ["no", "No"]] },
  { key: "commission_experience", title: "Have you sold on commission before?", options: [["none", "No"], ["under_1", "Under 1 year"], ["1_to_3", "1–3 years"], ["3_plus", "3+ years"]] },
  { key: "current_work", title: "What is your current or most recent work?", options: [["insurance", "Insurance agent"], ["loan", "Loan officer or mortgage"], ["merchant", "Merchant services"], ["consultant", "Business consultant"], ["bookkeeper", "Bookkeeper, CPA or tax pro"], ["other_b2b", "Other B2B sales"], ["retail_b2c", "Retail or B2C sales"], ["none", "No sales background"]] },
  { key: "owner_contact", title: "Do you talk with business owners as part of your work now?", options: [["every_week", "Every week"], ["sometimes", "Sometimes"], ["rarely_never", "Rarely or never"]] },
  { key: "owner_network", title: "How many business owners could you contact in your first month?", options: [["0_5", "0–5"], ["6_20", "6–20"], ["21_50", "21–50"], ["50_plus", "50+"]] },
  { key: "hours_per_week", title: "How many hours per week could you spend on this?", options: [["under_5", "Under 5"], ["5_10", "5–10"], ["10_20", "10–20"], ["20_plus", "20+"]] },
  { key: "outside_work_limit", title: "Does your employer or license limit outside referral work?", options: [["no", "No"], ["yes", "Yes"], ["not_sure", "Not sure"]] },
  { key: "commission_only_ok", title: "This is a 1099, commission-only role with no base pay. You're paid only when a client you referred is funded. Is that OK?", options: [["yes", "Yes"], ["no", "No"]] },
  { key: "written_answer", title: "Who do you know in business, and how would you start the conversation?" },
  { key: "source", title: "How did you hear about us?", options: [["indeed", "Indeed"], ["linkedin", "LinkedIn"], ["facebook", "Facebook"], ["referral", "Referral"], ["other", "Other"]] },
];
const fits = ["Insurance agents", "Loan officers", "Merchant-services reps", "Consultants", "Bookkeepers and CPAs", "B2B sales pros"];
const optionClass = "w-full min-h-12 rounded-md border border-input bg-background px-4 py-3 text-left text-base hover:border-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const Join: React.FC = () => {
  usePageMeta("Become a funding referral rep | ClearFund AI", "Join the David Allen Capital broker program as an independent, commission-only referral rep.", "/join");
  const formRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(initial);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const question = questions[step - 1];
  const set = (key: keyof Answers, value: string) => setAnswers((a) => ({ ...a, [key]: value }));

  const next = (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    if (step > 0 && question && !answers[question.key]) return setError("Choose an answer to continue.");
    setStep((s) => Math.min(s + 1, questions.length));
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answers.source) return setError("Choose an answer to continue.");
    setBusy(true); setError(null);
    const { error: submitError } = await supabase.functions.invoke("submit-recruit", { body: answers });
    setBusy(false);
    if (submitError) return setError("We couldn't submit your application. Please try again.");
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow">
        <section className="bg-clearfund-dark-blue text-primary-foreground">
          <div className="container-custom py-16 sm:py-24 text-center">
            <h1 className="mx-auto max-w-3xl text-4xl sm:text-5xl font-bold leading-tight">Help local business owners find funding.</h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-clearfund-pale-blue">Independent, commission-only reps. Free training. Set your own hours.</p>
            <Button size="lg" className="mt-8 min-h-12 bg-background text-primary hover:bg-secondary" onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>Take the 5-minute screener</Button>
          </div>
        </section>

        <section className="container-custom py-12 sm:py-16 grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold">What you'd do</h2>
            <ol className="mt-5 space-y-4">
              {["Talk with owners you know.", "Send good fits to the application.", "Stay in touch while the funding team works the file."].map((text, i) => (
                <li key={text} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{i + 1}</span><span className="pt-0.5">{text}</span></li>
              ))}
            </ol>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Who it fits</h2>
            <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">{fits.map((fit) => <li key={fit} className="rounded-md border bg-card px-4 py-3">{fit}</li>)}</ul>
          </div>
        </section>

        <section className="container-custom pb-12 sm:pb-16">
          <div className="rounded-lg border-2 border-primary bg-card p-6 sm:p-8">
            <h2 className="text-2xl font-bold">Straight facts</h2>
            <p className="mt-3 text-base leading-7">1099 independent contractor with the David Allen Capital broker program, not ClearFund AI employment. Commission only, no base pay. Paid only when a client you referred is funded. Results vary and some reps earn nothing. No cost to join; David Allen Capital pays commissions and issues 1099s.</p>
          </div>
        </section>

        <section ref={formRef} id="screener" className="scroll-mt-24 border-t bg-secondary/40">
          <div className="container-custom py-12 sm:py-16">
            <div className="mx-auto w-full max-w-xl min-w-0 rounded-lg border bg-card p-5 sm:p-8">
              {submitted ? (
                <div className="py-8 text-center"><h2 className="text-2xl font-bold">Thanks.</h2><p className="mt-3 text-muted-foreground">A teammate reviews every application and will email you.</p></div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">Step {step + 1} of {questions.length + 1}</p>
                  <div className="mt-2 h-1.5 rounded bg-muted" aria-hidden><div className="h-1.5 rounded bg-primary" style={{ width: `${((step + 1) / (questions.length + 1)) * 100}%` }} /></div>
                  <form className="mt-6" onSubmit={step === questions.length ? submit : next}>
                    {step === 0 ? (
                      <div className="space-y-4">
                        <h2 className="text-2xl font-bold">How can we reach you?</h2>
                        <div className="space-y-2"><Label htmlFor="join-name">Name</Label><Input id="join-name" autoComplete="name" required maxLength={120} className="h-12 text-base" value={answers.full_name} onChange={(e) => set("full_name", e.target.value)} /></div>
                        <div className="space-y-2"><Label htmlFor="join-email">Email</Label><Input id="join-email" type="email" autoComplete="email" required maxLength={255} className="h-12 text-base" value={answers.email} onChange={(e) => set("email", e.target.value)} /></div>
                        <div className="space-y-2"><Label htmlFor="join-phone">Phone (optional)</Label><Input id="join-phone" type="tel" autoComplete="tel" maxLength={30} className="h-12 text-base" value={answers.phone} onChange={(e) => set("phone", e.target.value)} /></div>
                      </div>
                    ) : question ? (
                      <fieldset className="min-w-0">
                        <legend className="text-2xl font-bold leading-tight">{question.title}</legend>
                        <div className="mt-5">
                          {question.key === "state" ? (
                            <select aria-label="State" required className="h-12 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base" value={answers.state} onChange={(e) => set("state", e.target.value)}><option value="">Select a state</option>{STATES.map((s) => <option key={s}>{s}</option>)}</select>
                          ) : question.key === "written_answer" ? (
                            <div className="space-y-2"><Label htmlFor="written-answer" className="sr-only">Your answer</Label><Textarea id="written-answer" required maxLength={500} rows={6} className="min-h-36 w-full resize-y text-base" value={answers.written_answer} onChange={(e) => set("written_answer", e.target.value)} /><p className="text-right text-xs text-muted-foreground">{answers.written_answer.length}/500 characters</p></div>
                          ) : (
                            <div className="grid gap-3">{question.options?.map(([value, label]) => <label key={value} className={`${optionClass} flex cursor-pointer items-center gap-3 ${answers[question.key] === value ? "border-primary bg-accent" : ""}`}><input type="radio" name={question.key} value={value} required checked={answers[question.key] === value} onChange={() => set(question.key, value)} className="h-4 w-4 shrink-0" /><span>{label}</span></label>)}</div>
                          )}
                        </div>
                      </fieldset>
                    ) : null}
                    <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" value={answers.company_website} onChange={(e) => set("company_website", e.target.value)} />
                    {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
                    <Button type="submit" size="lg" className="mt-6 min-h-12 w-full" disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{step === questions.length ? "Submit application" : "Continue"}</Button>
                    {step > 0 && <Button type="button" variant="ghost" className="mt-2 w-full" onClick={() => { setError(null); setStep((s) => s - 1); }}>Back</Button>}
                  </form>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};
export default Join;

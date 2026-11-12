import React, { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { AGENT_QUIZ } from "@/lib/agentProgram";
import { usePageMeta } from "@/lib/usePageMeta";

const STATES = "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" ");
const initialQuiz = Object.fromEntries(AGENT_QUIZ.map((q) => [q.key, ""]));
const inputClass = "h-12 w-full min-w-0 text-base";
const selectClass = "h-12 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base";

const Agents: React.FC = () => {
  usePageMeta("ClearFund AI agent program", "Refer business owners who want to explore funding and take part in the ClearFund AI agent program.", "/agents");
  const started = useRef(Date.now());
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", city: "", state: "", experience: "", find_owners: "", company_website: "" });
  const [quiz, setQuiz] = useState<Record<string, string>>(initialQuiz);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof typeof form, value: string) => setForm((old) => ({ ...old, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(null);
    if (Object.values(quiz).some((answer) => !answer)) return setError("Answer all five screening questions.");
    setBusy(true);
    const { error: submitError } = await supabase.functions.invoke("submit-agent", { body: {
      ...form, quiz_answers: quiz, elapsed_ms: Date.now() - started.current,
    } });
    setBusy(false);
    if (submitError) return setError("We couldn't submit your application. Please review your answers and try again.");
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow">
        <section className="border-b bg-card">
          <div className="container-custom py-14 sm:py-20 text-center">
            <h1 className="mx-auto max-w-3xl text-4xl sm:text-5xl font-bold">Help business owners explore funding.</h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">Refer owners who need funding and earn a share when referred deals fund. ClearFund AI manages the funding conversation. Compensation is not guaranteed.</p>
            <Button asChild size="lg" className="mt-8 min-h-12"><a href="#agent-application">Apply to the agent program</a></Button>
          </div>
        </section>
        <section className="container-custom py-12 grid gap-6 md:grid-cols-3">
          {[
            ["Make an introduction", "Share your tracked referral link with owners who ask for funding help."],
            ["Let ClearFund handle the review", "Owners complete the questionnaire and ClearFund manages the next conversation."],
            ["Follow your referrals", "Your private portal shows assigned warm leads, funded deals, and payout totals."],
          ].map(([title, body]) => <article key={title} className="rounded-lg border bg-card p-5"><h2 className="text-xl font-bold">{title}</h2><p className="mt-2 text-muted-foreground">{body}</p></article>)}
        </section>
        <section id="agent-application" className="scroll-mt-24 border-t bg-secondary/40">
          <div className="container-custom py-12 sm:py-16">
            <div className="mx-auto max-w-2xl min-w-0 rounded-lg border bg-card p-5 sm:p-8">
              {submitted ? (
                <div className="py-8 text-center"><h2 className="text-2xl font-bold">Thanks. Your application was received.</h2><p className="mt-3 text-muted-foreground">A teammate reviews every application. If approved, you will receive account instructions by email.</p></div>
              ) : (
                <form onSubmit={submit} className="space-y-6">
                  <div><h2 className="text-2xl font-bold">Agent application</h2><p className="mt-2 text-sm text-muted-foreground">Tell us about yourself, then complete the short compliance screening.</p></div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2"><Label htmlFor="agent-name">Name</Label><Input id="agent-name" autoComplete="name" required maxLength={120} className={inputClass} value={form.full_name} onChange={(e) => set("full_name", e.target.value)} /></div>
                    <div className="space-y-2"><Label htmlFor="agent-email">Email</Label><Input id="agent-email" type="email" autoComplete="email" required maxLength={255} className={inputClass} value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
                    <div className="space-y-2"><Label htmlFor="agent-phone">Phone</Label><Input id="agent-phone" type="tel" autoComplete="tel" required maxLength={30} className={inputClass} value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
                    <div className="space-y-2"><Label htmlFor="agent-city">City</Label><Input id="agent-city" autoComplete="address-level2" required maxLength={120} className={inputClass} value={form.city} onChange={(e) => set("city", e.target.value)} /></div>
                    <div className="space-y-2"><Label htmlFor="agent-state">State</Label><select id="agent-state" required className={selectClass} value={form.state} onChange={(e) => set("state", e.target.value)}><option value="">Select a state</option>{STATES.map((state) => <option key={state}>{state}</option>)}</select></div>
                    <div className="space-y-2"><Label htmlFor="agent-experience">Experience</Label><select id="agent-experience" required className={selectClass} value={form.experience} onChange={(e) => set("experience", e.target.value)}><option value="">Select one</option><option value="sales">Sales</option><option value="finance">Finance</option><option value="insurance">Insurance</option><option value="other">Other</option></select></div>
                  </div>
                  <div className="space-y-2"><Label htmlFor="agent-owners">How would you find business owners?</Label><Textarea id="agent-owners" required minLength={10} maxLength={1500} rows={5} className="text-base" value={form.find_owners} onChange={(e) => set("find_owners", e.target.value)} /></div>
                  <fieldset className="space-y-5"><legend className="text-xl font-bold">Compliance screening</legend>{AGENT_QUIZ.map((question, index) => (
                    <div key={question.key} className="rounded-md border p-4"><p className="font-medium">{index + 1}. {question.question}</p><div className="mt-3 grid gap-2">{question.options.map(([value, label]) => <label key={value} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 py-2"><input type="radio" name={question.key} required value={value} checked={quiz[question.key] === value} onChange={() => setQuiz((old) => ({ ...old, [question.key]: value }))} className="h-4 w-4 shrink-0" /><span>{label}</span></label>)}</div></div>
                  ))}</fieldset>
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
export default Agents;

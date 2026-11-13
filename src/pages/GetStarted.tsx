import React, { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { usePageMeta } from "@/lib/usePageMeta";
import { getAgentReferral } from "@/lib/agentProgram";
import VaMerchantIntake from "@/components/VaMerchantIntake";

const STATES = "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" ");
const CONSENT = "I understand ClearFund AI is a broker, not a lender, and may share my information with funding providers to find a fit. ClearFund AI may receive compensation for referrals.";

type Opt = [string, string];
const Q: { key: string; q: string; opts?: Opt[] }[] = [
  { key: "months", q: "How long has your business been operating?", opts: [["lt4", "Under 4 months"], ["4to11", "4–11 months"], ["12to23", "1–2 years"], ["24plus", "2+ years"]] },
  { key: "revenue", q: "Average monthly revenue?", opts: [["lt5k", "Under $5k"], ["5to15k", "$5k–$15k"], ["15to50k", "$15k–$50k"], ["50kplus", "$50k+"]] },
  { key: "credit", q: "Estimated personal credit score?", opts: [["lt500", "Under 500"], ["500to599", "500–599"], ["600to674", "600–674"], ["675to679", "675–679"], ["680plus", "680+"]] },
  { key: "state", q: "Which state is your business in?" },
  { key: "amount", q: "How much do you need?", opts: [["lt10k", "Under $10k"], ["10to50k", "$10k–$50k"], ["50to100k", "$50k–$100k"], ["100to250k", "$100k–$250k"], ["250kplus", "$250k+"]] },
  { key: "use_of_funds", q: "What will you use it for?", opts: [["working_capital", "Working capital"], ["equipment", "Equipment"], ["inventory", "Inventory"], ["payroll", "Payroll"], ["expansion", "Expansion"], ["other", "Other"]] },
  { key: "business_checking", q: "Do you have a business checking account?", opts: [["yes", "Yes"], ["no", "No"]] },
];

const GetStarted: React.FC = () => {
  usePageMeta("Find your next funding step | ClearFund AI", "Answer a few short questions so we can point you to the right application.", "/get-started");
  const [params] = useSearchParams();
  const cta = (params.get("cta") || "direct").replace(/[^a-z0-9_-]/gi, "").slice(0, 60);
  const src = (params.get("src") || "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 60);
  const started = useRef(Date.now());
  const [step, setStep] = useState(0);
  const [ans, setAns] = useState<Record<string, string>>({});
  const [c, setC] = useState({ full_name: "", business_name: "", email: "", phone: "", company_website: "" });
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<{ next: string; url: string | null } | null>(null);
  const total = Q.length + 1;

  const pick = (k: string, v: string) => { setAns((a) => ({ ...a, [k]: v })); setStep((s) => s + 1); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null);
    if (!ack) return setErr("Please check the acknowledgment to continue.");
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("submit-qualifier", { body: {
      ...ans, business_checking: ans.business_checking === "yes", ...c, broker_acknowledged: true, cta,
      src: src || null, agent_code: getAgentReferral(), elapsed_ms: Date.now() - started.current } });
    setBusy(false);
    if (error || !data?.next) return setErr("We couldn't save your answers. Please try again, or call 866-578-4721.");
    setResult(data);
  };

  const vaCode = (params.get("va") || "").toUpperCase();
  if (/^VA[A-Z0-9]{8}$/.test(vaCode)) return <VaMerchantIntake code={vaCode} />;

  const cur = Q[step];
  const btn = "w-full min-h-12 rounded-md border border-input bg-background px-4 py-3 text-left text-base hover:border-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow px-4 py-10 pb-24">
        <div className="mx-auto w-full max-w-lg min-w-0">
          {result ? (
            <div className="rounded-lg border bg-card p-6 text-center space-y-4">
              {(result.next === "dac_link" || result.next === "our_form") && <>
                <h1 className="text-2xl font-bold text-foreground">Your next step</h1>
                <p className="text-muted-foreground">Complete ClearFund AI's application so we can review possible options with funding providers. Submitting is not an approval.</p>
                <Button asChild size="lg" className="w-full"><Link to={`/apply?cta=qualifier_${cta}`}>Continue to our application</Link></Button>
              </>}
              {result.next === "review" && <>
                <h1 className="text-2xl font-bold text-foreground">Thanks — we'll review your answers</h1>
                <p className="text-muted-foreground">A team member will look at your options and contact you. You can also call <a className="text-primary underline" href="tel:+18665784721">866-578-4721</a>.</p>
              </>}
              {result.next === "state_blocked" && <>
                <h1 className="text-2xl font-bold text-foreground">Not available in your state yet</h1>
                <p className="text-muted-foreground">We're sorry — our funding partners don't currently serve businesses in your state.</p>
              </>}
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-2">Step {step + 1} of {total}</p>
              <div className="h-1.5 w-full rounded bg-muted mb-6" aria-hidden><div className="h-1.5 rounded bg-primary" style={{ width: `${((step + 1) / total) * 100}%` }} /></div>
              {cur ? (
                <div className="space-y-4">
                  <h1 className="text-2xl font-bold text-foreground">{cur.q}</h1>
                  {cur.opts ? (
                    <div className="grid gap-3">{cur.opts.map(([v, l]) => <button key={v} type="button" className={`${btn} ${ans[cur.key] === v ? "border-primary" : ""}`} onClick={() => pick(cur.key, v)}>{l}</button>)}</div>
                  ) : (
                    <select aria-label="State" className="h-12 w-full rounded-md border border-input bg-background px-3 text-base" value={ans.state ?? ""} onChange={(e) => e.target.value && pick("state", e.target.value)}>
                      <option value="">Select a state</option>{STATES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  )}
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-4">
                  <h1 className="text-2xl font-bold text-foreground">Where should we reach you?</h1>
                  {([["full_name", "Your name", "text"], ["business_name", "Business name", "text"], ["email", "Email", "email"], ["phone", "Phone", "tel"]] as const).map(([k, l, t]) => (
                    <div key={k} className="space-y-1"><Label htmlFor={k}>{l}</Label><Input id={k} type={t} required value={c[k]} onChange={(e) => setC({ ...c, [k]: e.target.value })} className="h-12 text-base" /></div>
                  ))}
                  <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={c.company_website} onChange={(e) => setC({ ...c, company_website: e.target.value })} />
                  <label className="flex items-start gap-3 text-sm text-muted-foreground"><Checkbox checked={ack} onCheckedChange={(v) => setAck(v === true)} className="mt-0.5" /><span>{CONSENT}</span></label>
                  {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
                  <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}See my next step</Button>
                </form>
              )}
              {step > 0 && <button type="button" className="mt-4 text-sm text-muted-foreground underline" onClick={() => setStep((s) => s - 1)}>Back</button>}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};
export default GetStarted;

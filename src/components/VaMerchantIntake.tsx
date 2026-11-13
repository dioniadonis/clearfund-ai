import React, { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { VA_MERCHANT_CONSENT } from "@/lib/vaProgram";

const STATES = "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" ");
const input = "h-12 min-w-0 w-full rounded-md border border-input bg-background px-3 text-base";
type Fields = { business_name: string; full_name: string; phone: string; email: string; months: string; revenue: string; business_checking: string; current_positions: string; current_payment: string; amount: string; use_of_funds: string; industry: string; state: string; credit: string; company_website: string };
const blank: Fields = { business_name: "", full_name: "", phone: "", email: "", months: "", revenue: "", business_checking: "", current_positions: "0", current_payment: "0", amount: "", use_of_funds: "", industry: "", state: "", credit: "", company_website: "" };

const VaMerchantIntake: React.FC<{ code: string }> = ({ code }) => {
  const started = useRef(Date.now());
  const [f, setF] = useState(blank); const [ack, setAck] = useState(false); const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ next: string; resume_url?: string; email_sent?: boolean } | null>(null);
  const link = useQuery({ queryKey: ["va-link", code], queryFn: async () => { const { data, error } = await supabase.rpc("va_link_valid", { _code: code }); if (error) throw error; return !!data; } });
  const set = (key: keyof Fields, value: string) => setF((old) => ({ ...old, [key]: value }));
  const field = (key: keyof Fields, label: string, type = "text") => <div className="min-w-0 space-y-1"><Label htmlFor={`va-${key}`}>{label}</Label><Input id={`va-${key}`} type={type} inputMode={type === "number" ? "decimal" : undefined} required className="h-12 min-w-0 text-base" value={f[key]} onChange={(e) => set(key, e.target.value)} /></div>;
  const select = (key: keyof Fields, label: string, options: [string, string][]) => <div className="min-w-0 space-y-1"><Label htmlFor={`va-${key}`}>{label}</Label><select id={`va-${key}`} required className={input} value={f[key]} onChange={(e) => set(key, e.target.value)}><option value="">Select one</option>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    if (!ack) return setError("Please provide consent to continue.");
    setBusy(true);
    const { data, error: invokeError } = await supabase.functions.invoke("submit-qualifier", { body: {
      business_name: f.business_name, full_name: f.full_name, phone: f.phone, email: f.email,
      months: f.months, revenue: f.revenue, business_checking: f.business_checking === "yes",
      current_positions: Number(f.current_positions), current_payment: Number(f.current_payment), amount: f.amount,
      use_of_funds: f.use_of_funds, industry: f.industry, state: f.state, credit: f.credit,
      va_code: code, broker_acknowledged: true, cta: "va_call", company_website: f.company_website, elapsed_ms: Date.now() - started.current,
    } });
    setBusy(false);
    if (invokeError || !data?.next) return setError(data?.error === "va_link_unavailable" ? "This intake link is not available." : "We couldn't save your answers. Please try again.");
    setResult(data);
  };

  return <div className="min-h-screen min-w-0 bg-background"><Header /><main className="px-4 py-10 pb-24"><div className="mx-auto w-full max-w-2xl min-w-0">
    {link.isLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : link.data === false ? <div className="rounded-lg border bg-card p-6 text-center"><h1 className="text-2xl font-bold">This intake link is not available</h1><p className="mt-2 text-muted-foreground">Contact the person who shared it with you.</p></div> : result ? (
      <div className="rounded-lg border bg-card p-6 text-center space-y-4">
        {result.next === "va_documents" ? <><h1 className="text-2xl font-bold">Continue to your secure application</h1><p className="text-muted-foreground">{result.email_sent ? "We emailed you a private resume link so you can finish later." : "We couldn't send the resume email. You can continue on this device now."}</p><Button asChild size="lg" className="w-full"><a href={result.resume_url}>Continue to signature and documents</a></Button></> : <><h1 className="text-2xl font-bold">Thank you</h1><p className="text-muted-foreground">We don't have a fit based on the current rules. We can follow up later if your business needs change.</p></>}
      </div>
    ) : <>
      <p className="text-sm font-medium text-primary">Merchant intake · Step 1 of 2</p><h1 className="mt-2 text-3xl font-bold">A few questions about your business</h1><p className="mt-2 text-sm text-muted-foreground">This short questionnaire does not pull credit. Some programs look at credit, not all require a minimum.</p>
      <form onSubmit={submit} className="mt-6 space-y-6">
        <section className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2 sm:p-5"><h2 className="font-semibold sm:col-span-2">Business and owner</h2>{field("business_name", "Business name")}{field("full_name", "Owner name")}{field("phone", "Cell phone", "tel")}{field("email", "Email", "email")}{select("industry", "Industry", [["construction", "Construction / contracting"], ["retail", "Retail"], ["restaurant", "Restaurant / hospitality"], ["professional", "Professional services"], ["healthcare", "Healthcare"], ["transportation", "Transportation"], ["manufacturing", "Manufacturing"], ["other", "Other"]])}{select("state", "Business state", STATES.map((s) => [s, s]))}</section>
        <section className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2 sm:p-5"><h2 className="font-semibold sm:col-span-2">Business snapshot</h2>{select("months", "Time in business", [["lt4", "Under 4 months"], ["4to11", "4–11 months"], ["12to23", "1–2 years"], ["24plus", "2+ years"]])}{select("revenue", "Average monthly deposits", [["lt10k", "Under $10,000"], ["10to25k", "$10,000–$25,000"], ["25to50k", "$25,000–$50,000"], ["50kplus", "$50,000+"]])}{select("business_checking", "Business bank account?", [["yes", "Yes"], ["no", "No"]])}{select("credit", "Self-reported credit range", [["lt500", "Under 500"], ["500to599", "500–599"], ["600to674", "600–674"], ["675to679", "675–679"], ["680plus", "680+"]])}{field("current_positions", "Current advances or loans (number)", "number")}{field("current_payment", "Rough total payment per month ($)", "number")}{select("amount", "Amount needed", [["lt10k", "Under $10k"], ["10to50k", "$10k–$50k"], ["50to100k", "$50k–$100k"], ["100to250k", "$100k–$250k"], ["250kplus", "$250k+"]])}{select("use_of_funds", "Use of funds", [["working_capital", "Working capital"], ["equipment", "Equipment"], ["inventory", "Inventory"], ["payroll", "Payroll"], ["expansion", "Expansion"], ["contract_costs", "Contract costs"], ["other", "Other"]])}</section>
        <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={f.company_website} onChange={(e) => set("company_website", e.target.value)} />
        <label className="flex items-start gap-3 text-sm text-muted-foreground"><Checkbox checked={ack} onCheckedChange={(v) => setAck(v === true)} className="mt-0.5" /><span>{VA_MERCHANT_CONSENT} ClearFund AI is a broker, not a lender. Providers decide whether to make an offer and set all terms.</span></label>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button type="submit" size="lg" className="h-12 w-full" disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}See my next step</Button>
      </form>
    </>}
  </div></main><Footer /></div>;
};
export default VaMerchantIntake;

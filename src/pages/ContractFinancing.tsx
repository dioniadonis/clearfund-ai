import React, { useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FileText, Receipt, Wallet, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CashGapCalculator from "../components/CashGapCalculator";
import { usePageMeta } from "@/lib/usePageMeta";

type StageKey = "bidding" | "won" | "working" | "invoiced";
const STAGES: { key: StageKey; title: string; pain: string }[] = [
  { key: "bidding", title: "Bidding now", pain: "Line up funding before you win so you can say yes fast." },
  { key: "won", title: "Just won, haven't started", pain: "Bonding, materials and equipment are due before the job starts." },
  { key: "working", title: "Working, waiting on the first payment", pain: "Payroll and suppliers are due, the agency pays in 30 to 90 days." },
  { key: "invoiced", title: "Invoiced the agency, waiting to get paid", pain: "The work is done and approved, but the check is weeks away." },
];
const isStage = (v: string | null): v is StageKey => STAGES.some((s) => s.key === v);

const withStage = (href: string, stage: StageKey | null) => (stage ? `${href}&stage=${stage}` : href);

const primaryBtn = "bg-clearfund-blue hover:bg-clearfund-dark-blue text-white text-lg py-6 px-8 rounded-lg transition-colors";
const outlineBtn = "border-clearfund-blue text-clearfund-blue hover:bg-clearfund-pale-blue text-lg py-6 px-8 rounded-lg transition-colors";

const products = [
  { icon: FileText, title: "Contract & PO Financing", copy: "Pay suppliers for the materials the job needs, based on your award or purchase order." },
  { icon: Receipt, title: "Government Invoice Factoring", copy: "Billed the agency? Get paid on the approved invoice now instead of waiting 30 to 90 days." },
  { icon: Wallet, title: "Working Capital", copy: "Fast capital for firms with steady deposits. Stronger files may qualify for an SBA Express loan or a line of credit instead." },
];

const faqs = [
  ["Can a government contract be used for funding?", "Often, yes. Some contracts limit assigning payments to a third party; the funding partner reviews your contract during underwriting."],
  ["Do I need perfect credit?", "No. Approval depends mostly on your contract, deposits and time in business. Requirements vary by provider."],
  ["How much can I get?", "It depends on the contract size, your deposits and the product. Use the cash-gap calculator to see what your job needs."],
  ["What does it cost?", "Rates and terms are set by the funding partner after review, and are disclosed to you before you accept."],
  ["Is ClearFund AI a lender?", "No. ClearFund AI is a broker. We connect you with funding partners and may receive compensation when you are funded."],
];

const StagePanel: React.FC<{ stage: StageKey }> = ({ stage }) => {
  const recommend = (title: string, copy: string) => (
    <div className="space-y-2">
      <p className="text-sm font-semibold uppercase tracking-wide text-clearfund-blue">We recommend</p>
      <h3 className="text-2xl font-bold text-clearfund-dark-blue">{title}</h3>
      <p className="text-gray-700">{copy}</p>
    </div>
  );
  if (stage === "bidding")
    return (
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-clearfund-dark-blue">Get pre-qualified while you bid</h3>
        <p className="text-gray-700">We can pre-qualify your business now, so funding is lined up and you can say yes fast if you win the award.</p>
        <Button asChild className={primaryBtn}>
          <Link to="/apply?cta=stage_bidding&product=contract&stage=bidding">Get Pre-Qualified</Link>
        </Button>
      </div>
    );
  if (stage === "invoiced")
    return (
      <div className="space-y-4">
        {recommend("Government Invoice Factoring", products[1].copy)}
        <Button asChild className={primaryBtn}>
          <Link to="/apply?cta=stage_invoiced&product=factoring&stage=invoiced">Get Paid on My Invoice</Link>
        </Button>
      </div>
    );
  return (
    <div className="space-y-6">
      {stage === "won" ? recommend("Contract & PO Financing", products[0].copy) : recommend("Working Capital", products[2].copy)}
      <CashGapCalculator key={stage} stage={stage} embedded />
    </div>
  );
};

const ContractFinancing: React.FC = () => {
  usePageMeta(
    "Government Contract Funding for Georgia Contractors | ClearFund AI",
    "Won a city, county or school board contract in Georgia? Get mobilization capital for materials, crew and equipment before the first payment. Apply in minutes.",
    "/contract-financing",
  );
  const [params, setParams] = useSearchParams();
  const raw = params.get("stage");
  const stage: StageKey | null = isStage(raw) ? raw : null;
  const selectorRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pendingScroll = useRef(false);

  useEffect(() => {
    if (stage && pendingScroll.current) {
      pendingScroll.current = false;
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [stage]);

  const choose = (key: StageKey) => {
    pendingScroll.current = true;
    const next = new URLSearchParams(params);
    next.set("stage", key);
    setParams(next, { replace: true });
    if (key === stage) panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        {/* Hero */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-white via-clearfund-pale-blue to-white">
          <div className="container-custom max-w-4xl text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-clearfund-dark-blue">You Won the Contract. We Help You Start It.</h1>
            <p className="text-lg md:text-xl text-gray-700">
              Mobilization capital for small, MBE and DBE firms that just won a city, county, school board or state contract in Georgia. Cover crew, materials and equipment before the first government payment arrives.
            </p>
            <p className="text-sm text-gray-500">*Subject to funding partner approval and verification</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className={primaryBtn}>
                <Link to={withStage("/apply?cta=contract_hero&product=contract", stage)}>Apply Now</Link>
              </Button>
              <Button variant="outline" className={outlineBtn} onClick={() => selectorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>
                Estimate Your Cash Gap
              </Button>
            </div>
          </div>
        </section>

        {/* Stage selector */}
        <section ref={selectorRef} id="stage" className="py-16 bg-white scroll-mt-24">
          <div className="container-custom max-w-5xl space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-clearfund-dark-blue text-center">Where are you with your contract?</h2>
            <div className="grid md:grid-cols-2 gap-6" role="radiogroup" aria-label="Contract stage">
              {STAGES.map((s, i) => {
                const active = s.key === stage;
                return (
                  <button
                    key={s.key}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => choose(s.key)}
                    className={`text-left rounded-xl border-2 p-6 md:p-8 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-clearfund-blue ${
                      active ? "border-clearfund-blue bg-clearfund-pale-blue" : "border-gray-200 bg-white hover:border-clearfund-blue"
                    }`}
                  >
                    <span className="flex items-center gap-3 mb-3">
                      <span className={`h-9 w-9 rounded-full flex items-center justify-center font-bold ${active ? "bg-clearfund-blue text-white" : "bg-clearfund-pale-blue text-clearfund-blue"}`}>
                        {active ? <Check size={18} /> : i + 1}
                      </span>
                      <span className="text-xl font-bold text-clearfund-dark-blue">{s.title}</span>
                    </span>
                    <span className="block text-gray-700">{s.pain}</span>
                  </button>
                );
              })}
            </div>
            <div ref={panelRef} className="scroll-mt-24">
              {stage && (
                <div className="border border-gray-200 rounded-xl p-6 md:p-8 bg-white">
                  <StagePanel stage={stage} />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Gap stats */}
        <section className="py-16 bg-clearfund-pale-blue/40">
          <div className="container-custom max-w-5xl space-y-8">
            <h2 className="text-3xl font-bold text-clearfund-dark-blue text-center">The gap every contract winner hits</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                ["30-90 days", "Typical wait for the first government payment"],
                ["Up front", "Materials, equipment, bonding and payroll come first"],
                ["One application", "Matched to the funding partner that fits your contract"],
              ].map(([stat, label]) => (
                <div key={stat} className="bg-white rounded-xl p-6 text-center shadow-sm">
                  <p className="text-3xl font-bold text-clearfund-blue">{stat}</p>
                  <p className="text-gray-700 mt-2">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Products */}
        <section className="py-16 bg-white">
          <div className="container-custom max-w-6xl space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-clearfund-dark-blue text-center">Three ways to fund the start of the job</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {products.map(({ icon: Icon, title, copy }) => (
                <div key={title} className="rounded-xl border border-gray-200 p-6 shadow-sm space-y-3">
                  <div className="h-12 w-12 rounded-full bg-clearfund-pale-blue flex items-center justify-center">
                    <Icon className="text-clearfund-blue" />
                  </div>
                  <h3 className="text-xl font-bold text-clearfund-dark-blue">{title}</h3>
                  <p className="text-gray-700">{copy}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 text-center">*Funding options and terms vary by product and provider.</p>
          </div>
        </section>

        {/* Who it's for */}
        <section className="py-16 bg-clearfund-pale-blue/40">
          <div className="container-custom max-w-3xl space-y-6">
            <h2 className="text-3xl font-bold text-clearfund-dark-blue text-center">Who it's for</h2>
            <ul className="space-y-4">
              {[
                "Contractors and service firms with a newly approved public contract or change order, often $50,000 to $500,000",
                "City of Atlanta, Fulton, DeKalb, Gwinnett, Cobb and Clayton counties, school boards, MARTA and state agencies",
                "MBE, DBE, WBE and other certified small businesses, plus subcontractors on public jobs",
              ].map((t) => (
                <li key={t} className="flex gap-3 bg-white rounded-xl p-4">
                  <Check className="text-clearfund-blue shrink-0 mt-0.5" />
                  <span className="text-gray-700">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 bg-white">
          <div className="container-custom max-w-6xl space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-clearfund-dark-blue text-center">How it works</h2>
            <ol className="grid md:grid-cols-4 gap-6">
              {[
                ["Apply in minutes", "Short form, last 3-4 months of business bank statements, and the award letter or PO."],
                ["We match your file", "We match your file to the funding partner that fits your contract."],
                ["Get an offer", "You choose whether to accept."],
                ["Stay updated", "A text or email at each step."],
              ].map(([t, c], i) => (
                <li key={t} className="rounded-xl border border-gray-200 p-6 space-y-3">
                  <span className="h-10 w-10 rounded-full bg-clearfund-blue text-white font-bold flex items-center justify-center">{i + 1}</span>
                  <h3 className="text-lg font-bold text-clearfund-dark-blue">{t}</h3>
                  <p className="text-gray-700">{c}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-clearfund-pale-blue/40">
          <div className="container-custom max-w-3xl space-y-6">
            <h2 className="text-3xl font-bold text-clearfund-dark-blue text-center">Frequently asked questions</h2>
            <Accordion type="single" collapsible className="bg-white rounded-xl px-6">
              {faqs.map(([q, a], i) => (
                <AccordionItem key={q} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left text-clearfund-dark-blue font-semibold">{q}</AccordionTrigger>
                  <AccordionContent className="text-gray-700">{a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="py-16 bg-white">
          <div className="container-custom max-w-4xl text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-clearfund-dark-blue">Line up your mobilization capital before the job starts.</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild className={primaryBtn}>
                <Link to={withStage("/apply?cta=contract_footer&product=contract", stage)}>Apply Now</Link>
              </Button>
              <a href="tel:8665784721" className="text-clearfund-blue font-semibold text-lg hover:underline">Call 866-578-4721</a>
            </div>
          </div>
        </section>
      </main>
      <Footer pageDisclaimer="Funding is provided by third-party funding partners, not by any government agency. ClearFund AI is not affiliated with any awarding agency." />
    </div>
  );
};

export default ContractFinancing;

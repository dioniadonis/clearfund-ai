import React, { useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "../components/Header";
import Footer from "../components/Footer";
import StageSelector, { type StageKey } from "../components/StageSelector";
import { supabase } from "@/integrations/supabase/client";
import { usePageMeta } from "@/lib/usePageMeta";
import { parseAmount } from "@/lib/amount";
import ApplyLink from "@/components/ApplyLink";

const primaryBtn = "bg-clearfund-blue hover:bg-clearfund-dark-blue text-white text-lg py-6 px-8 rounded-lg transition-colors";
const outlineBtn = "border-clearfund-blue text-clearfund-blue hover:bg-clearfund-pale-blue text-lg py-6 px-8 rounded-lg transition-colors";

// Plain text only: strip control chars and angle brackets, cap length. React renders as text.
const clean = (v: string | null, max = 120) => (v ?? "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, max);
const usd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const Awarded: React.FC = () => {
  usePageMeta(
    "Congrats on your public contract award | ClearFund AI",
    "Cover crew, materials and bonding until the agency's first payment arrives.",
    "/awarded",
  );
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const firm = clean(params.get("firm"));
  const agency = clean(params.get("agency"));
  const lead = clean(params.get("lead"), 100).replace(/[^A-Za-z0-9_-]/g, "");
  const amount = parseAmount(params.get("amount"));

  useEffect(() => {
    let el = document.head.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    const created = !el;
    if (!el) { el = document.createElement("meta"); el.name = "robots"; document.head.appendChild(el); }
    const prev = el.content;
    el.content = "noindex, nofollow";
    return () => { if (created) el!.remove(); else el!.content = prev; };
  }, []);

  const logged = useRef(false);
  useEffect(() => {
    if (logged.current) return;
    logged.current = true;
    supabase.rpc("log_outreach_visit", { _lead: lead, _firm: firm, _agency: agency }).then(({ error }) => {
      if (error) console.warn("visit log failed", error.message);
    });
  }, [lead, firm, agency]);

  const leadQs = lead ? `&lead=${encodeURIComponent(lead)}` : "";
  const heading = firm && agency ? `Congrats on your ${agency} award, ${firm}.` : "Congrats on your public contract award.";
  const choose = (k: StageKey) => navigate(`/contract-financing?stage=${k}${leadQs}`);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <section className="py-16 md:py-24 bg-clearfund-pale-blue/40">
          <div className="container-custom max-w-4xl text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-clearfund-dark-blue break-words">{heading}</h1>
            <p className="text-lg md:text-xl text-gray-700">
              Agencies generally pay after work starts and invoicing. Explore ways to cover crew, materials and bonding until then.
            </p>
            <p className="text-sm text-gray-500">*Subject to funding partner approval and verification</p>
            <p className="text-sm text-gray-500">Start with our short questionnaire. Providers decide whether to make an offer and set all terms.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className={primaryBtn}>
                <ApplyLink cta="awarded_1">Apply Now</ApplyLink>
              </Button>
              <Button asChild variant="outline" className={outlineBtn}>
                <a href="tel:8665784721"><Phone className="mr-2 h-5 w-5" />Call 866-578-4721</a>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="container-custom max-w-5xl space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-clearfund-dark-blue text-center">Where are you with your contract?</h2>
            <StageSelector stage={null} onChoose={choose} />
            {amount && (
              <p className="text-center text-lg">
                <Link to={`/cash-gap-calculator?amount=${amount}`} className="text-clearfund-blue font-semibold hover:underline">
                  Estimate what a {usd(amount)} job needs up front
                </Link>
              </p>
            )}
          </div>
        </section>

        <section className="py-12 bg-clearfund-pale-blue/40">
          <div className="container-custom max-w-3xl text-center space-y-3">
            <p className="text-gray-700">ClearFund AI is a broker, not a lender or a government agency. We aren't affiliated with any awarding agency.</p>
            <p className="text-sm text-gray-500">Not interested? Reply STOP to the email and we won't contact you again.</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Awarded;

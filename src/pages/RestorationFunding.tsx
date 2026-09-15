import React, { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Phone,
  Users,
  Package,
  Truck,
  CloudLightning,
  Building2,
  Wallet,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "../components/Header";
import Footer from "../components/Footer";
import heroImage from "@/assets/restoration-hero.jpg";

const PHONE = "9545790021";
const PHONE_DISPLAY = "(954) 579-0021";

const useCaseCards = [
  {
    icon: Users,
    title: "Payroll & crews",
    copy:
      "Keep technicians, project managers, subcontractors and field teams moving while receivables are still outstanding.",
  },
  {
    icon: Package,
    title: "Materials & reconstruction",
    copy:
      "Purchase materials and cover upfront project costs without draining the operating account.",
  },
  {
    icon: Truck,
    title: "Vehicles & equipment",
    copy:
      "Vans, trucks, trailers, extraction equipment, air movers, dehumidifiers, generators and tools.",
  },
  {
    icon: CloudLightning,
    title: "CAT & surge capacity",
    copy:
      "Add temporary capacity when storms, freezes, floods or hurricanes create sudden job volume.",
  },
  {
    icon: Building2,
    title: "Expansion & new locations",
    copy:
      "Hiring, new territories, additional crews, marketing, acquisitions or another location.",
  },
  {
    icon: Wallet,
    title: "Working capital",
    copy:
      "Breathing room between operating expenses and collections during periods of rapid growth.",
  },
];

const fundingPaths = [
  "Business lines of credit",
  "Working capital",
  "Equipment financing",
  "Term financing",
  "Receivables or factoring solutions, where appropriate",
  "SBA or longer-term expansion financing for qualifying businesses",
];

const steps = [
  {
    title: "Tell us what's happening",
    copy: "A few questions about your company and what the capital is actually for.",
  },
  {
    title: "Complete the application",
    copy: "The core business information needed to understand possible funding paths.",
  },
  {
    title: "We review with funding partners",
    copy:
      "Your business profile and intended use of funds are reviewed against third-party provider programs.",
  },
  {
    title: "Move forward",
    copy:
      "If there is a suitable path, you complete the remaining application items and documentation for submission.",
  },
];

const RestorationFunding: React.FC = () => {
  useEffect(() => {
    document.title = "Restoration Contractor Business Funding | ClearFund AI";

    const setMeta = (selector: string, attrs: Record<string, string>) => {
      let el = document.head.querySelector(selector) as HTMLElement | null;
      if (!el) {
        el = document.createElement(selector.startsWith("link") ? "link" : "meta");
        document.head.appendChild(el);
      }
      Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
    };

    setMeta('meta[name="description"]', {
      name: "description",
      content:
        "Business funding options for insurance restoration contractors — payroll, materials, equipment and CAT surge capacity while receivables clear. ClearFund AI is a broker, not a lender.",
    });
    setMeta('link[rel="canonical"]', {
      rel: "canonical",
      href: `${window.location.origin}/funding/insurance-restoration`,
    });
  }, []);

  // Carry ad attribution through to the application form.
  const applyHref = useMemo(() => {
    const incoming = new URLSearchParams(window.location.search);
    const params = new URLSearchParams();
    incoming.forEach((value, key) => {
      if (key.startsWith("utm_")) params.set(key, value);
    });
    if (!params.get("utm_source")) params.set("utm_source", "restoration-landing");
    if (!params.get("utm_campaign")) params.set("utm_campaign", "insurance-restoration");
    return `/apply?${params.toString()}`;
  }, []);

  const PrivacyLine = () => (
    <p className="text-sm text-gray-600">
      Straightforward qualification · Responsible data handling · Human support when needed ·{" "}
      <Link to="/privacy-policy" className="text-clearfund-blue underline">
        Privacy Policy
      </Link>{" "}
      ·{" "}
      <Link to="/terms-and-conditions" className="text-clearfund-blue underline">
        Terms
      </Link>
    </p>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-white">
        {/* Hero */}
        <section className="bg-clearfund-pale-blue">
          <div className="container-custom py-14 md:py-20">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-6">
                <span className="inline-block bg-white text-clearfund-blue font-semibold text-xs md:text-sm tracking-wide uppercase px-4 py-2 rounded-full">
                  Business funding for restoration companies
                </span>
                <h1 className="text-3xl md:text-5xl font-bold leading-tight text-clearfund-dark-blue">
                  Keep taking restoration jobs while insurance catches up.
                </h1>
                <p className="text-lg text-gray-700">
                  When payroll, equipment, materials and new losses can't wait for receivables to
                  clear, ClearFund AI helps restoration companies explore business funding options
                  built around the way their businesses actually operate.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild size="lg" className="bg-clearfund-blue hover:bg-clearfund-dark-blue">
                    <Link to={applyHref}>
                      Start my funding review <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-clearfund-blue text-clearfund-blue hover:bg-white"
                  >
                    <a href={`tel:${PHONE}`}>
                      <Phone className="mr-2 h-4 w-4" /> Talk through my funding need
                    </a>
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  Fast initial qualification. Straightforward process. No generic bank runaround.
                </p>
              </div>
              <div>
                <img
                  src={heroImage}
                  alt="Commercial restoration job site with dehumidifiers, air movers and containment in place"
                  width={1600}
                  height={1008}
                  className="w-full h-auto rounded-xl border border-white/60"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Core problem */}
        <section className="container-custom py-14 md:py-20">
          <div className="max-w-3xl space-y-5">
            <h2 className="text-2xl md:text-4xl font-bold text-clearfund-dark-blue">
              The problem isn't getting the work. It's financing the gap between the job and the
              payment.
            </h2>
            <p className="text-lg text-gray-700">
              Restoration companies can have significant revenue moving through the business while
              still facing short-term pressure on available cash.
            </p>
            <p className="text-lg text-gray-700">
              Payroll comes every week. Materials must be purchased. Equipment breaks. New losses
              come in. Large jobs may require mobilization before earlier receivables have cleared.
            </p>
            <p className="text-lg text-gray-700 font-medium">
              Growth shouldn't stop simply because cash and revenue arrive on different schedules.
            </p>
          </div>
        </section>

        {/* Use cases */}
        <section className="bg-gray-50 border-y border-gray-200">
          <div className="container-custom py-14 md:py-20 space-y-8">
            <h2 className="text-2xl md:text-4xl font-bold text-clearfund-dark-blue">
              Capital for the parts of restoration that can't wait.
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {useCaseCards.map((c) => (
                <div key={c.title} className="bg-white border border-gray-200 rounded-xl p-6 space-y-3">
                  <c.icon className="h-6 w-6 text-clearfund-blue" />
                  <h3 className="text-lg font-semibold text-clearfund-dark-blue">{c.title}</h3>
                  <p className="text-gray-700">{c.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Positioning comparison */}
        <section className="container-custom py-14 md:py-20 space-y-8">
          <h2 className="text-2xl md:text-4xl font-bold text-clearfund-dark-blue">
            Funding that understands restoration cash flow.
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="border border-gray-200 rounded-xl p-6 space-y-3 bg-gray-50">
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                A generic funding conversation
              </p>
              <p className="text-xl text-gray-700">"How much money do you need?"</p>
            </div>
            <div className="border border-clearfund-blue rounded-xl p-6 space-y-3 bg-clearfund-pale-blue">
              <p className="text-sm font-semibold uppercase tracking-wide text-clearfund-blue">
                A ClearFund AI conversation
              </p>
              <p className="text-xl text-clearfund-dark-blue">
                "What's creating the cash-flow gap — payroll, equipment, materials, receivables or a
                new contract?"
              </p>
            </div>
          </div>
          <p className="text-lg text-gray-700 max-w-3xl">
            The difference matters. Funding should be matched to the business event creating the
            need, not forced into a one-size-fits-all product.
          </p>
        </section>

        {/* Funding paths */}
        <section className="bg-clearfund-dark-blue text-white">
          <div className="container-custom py-14 md:py-20 space-y-8">
            <h2 className="text-2xl md:text-4xl font-bold">
              Different restoration problems require different capital structures.
            </h2>
            <p className="text-lg text-blue-100 max-w-3xl">
              Depending on the company, qualification profile, cash-flow structure and intended use
              of funds, ClearFund AI may help you evaluate options such as:
            </p>
            <ul className="grid sm:grid-cols-2 gap-3 max-w-3xl">
              {fundingPaths.map((p) => (
                <li key={p} className="flex items-start gap-3 text-blue-50">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-300 shrink-0" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <p className="text-blue-100 max-w-3xl">
              Our job is to help identify the appropriate path — not push every company into the
              same funding product. ClearFund AI is a broker that matches businesses with
              third-party funding providers. We are not a lender, and no option shown here is an
              offer of credit.
            </p>
          </div>
        </section>

        {/* Process */}
        <section className="container-custom py-14 md:py-20 space-y-8">
          <h2 className="text-2xl md:text-4xl font-bold text-clearfund-dark-blue">
            From funding need to next step — without unnecessary friction.
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((s, i) => (
              <div key={s.title} className="border border-gray-200 rounded-xl p-6 space-y-3">
                <div className="h-9 w-9 rounded-full bg-clearfund-pale-blue text-clearfund-blue font-bold flex items-center justify-center">
                  {i + 1}
                </div>
                <h3 className="text-lg font-semibold text-clearfund-dark-blue">{s.title}</h3>
                <p className="text-gray-700">{s.copy}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600 max-w-3xl">
            Approval, funding amounts and timing are decided by third-party providers. Nothing on
            this page is a guarantee of funding, terms or turnaround time.
          </p>
        </section>

        {/* Technology positioning */}
        <section className="bg-gray-50 border-y border-gray-200">
          <div className="container-custom py-14 md:py-20">
            <div className="max-w-3xl space-y-5">
              <h2 className="text-2xl md:text-4xl font-bold text-clearfund-dark-blue">
                Built for operators who value speed.
              </h2>
              <p className="text-lg text-gray-700">
                ClearFund AI uses technology to reduce unnecessary back-and-forth, organize
                qualification information and help move businesses toward the appropriate next step
                faster.
              </p>
              <p className="text-gray-700">
                Our virtual funding assistant can help gather the basic information needed to
                understand your funding request and guide you to the right next step. It is a
                virtual assistant, not a person, and a human is available whenever you want one.
              </p>
              <div className="flex items-start gap-3 border border-gray-200 rounded-xl p-5 bg-white">
                <ShieldCheck className="h-5 w-5 text-clearfund-blue shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="font-semibold text-clearfund-dark-blue">
                    Your information. Your business. Handled responsibly.
                  </p>
                  <p className="text-gray-700 text-sm">
                    We use secure technology to streamline the qualification process and reduce
                    unnecessary back-and-forth. We never ask for a Social Security number or bank
                    account numbers on a call.
                  </p>
                  <PrivacyLine />
                </div>
              </div>
              <Button asChild size="lg" className="bg-clearfund-blue hover:bg-clearfund-dark-blue">
                <Link to={applyHref}>
                  Start my funding check <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="container-custom py-14 md:py-20">
          <div className="border border-gray-200 rounded-2xl p-8 md:p-12 space-y-6 bg-clearfund-pale-blue">
            <h2 className="text-2xl md:text-4xl font-bold text-clearfund-dark-blue">
              You've got jobs to run. Let's figure out the capital.
            </h2>
            <p className="text-lg text-gray-700 max-w-2xl">
              Tell us what you're trying to accomplish and see what funding paths may fit your
              business.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" className="bg-clearfund-blue hover:bg-clearfund-dark-blue">
                <Link to={applyHref}>
                  Start my funding review <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-clearfund-blue text-clearfund-blue hover:bg-white"
              >
                <a href={`tel:${PHONE}`}>
                  <Phone className="mr-2 h-4 w-4" /> Talk to ClearFund AI · {PHONE_DISPLAY}
                </a>
              </Button>
            </div>
            <PrivacyLine />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default RestorationFunding;

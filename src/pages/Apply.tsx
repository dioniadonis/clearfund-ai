import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { z } from "zod";
import { Loader2, CheckCircle2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FundingPartners from "@/components/FundingPartners";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";

const CONSENT_TEXT =
  "I agree that ClearFund AI and its funding partners may contact me using the methods I checked above, including automated or AI-assisted calls and texts. Message and data rates may apply. I can opt out at any time.";

const schema = z.object({
  owner_name: z.string().trim().min(2, "Enter your full name").max(120),
  business_name: z.string().trim().min(2, "Enter your business name").max(160),
  business_address: z.string().trim().max(300).optional(),
  email: z.string().trim().email("Enter a valid email address").max(255),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(30),
  business_start_date: z.string().trim().max(20).optional(),
  monthly_revenue: z.string().trim().max(20).optional(),
  funding_need: z.string().trim().max(20).optional(),
  funding_purpose: z.string().trim().max(1000).optional(),
});

type FormState = z.infer<typeof schema>;

const emptyForm: FormState = {
  owner_name: "",
  business_name: "",
  business_address: "",
  email: "",
  phone: "",
  business_start_date: "",
  monthly_revenue: "",
  funding_need: "",
  funding_purpose: "",
};

const toNumber = (value?: string) => {
  if (!value) return null;
  const n = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
};

const SERVICES = {
  working_capital: { label: "Working capital", headline: "Apply for working capital" },
  gig_funding: { label: "Gig worker funding", headline: "Apply for gig worker funding" },
  insurance_restoration: {
    label: "Roofing / restoration contractor funding",
    headline: "Funding for roofing and restoration contractors",
  },
  other: { label: "Other business funding", headline: "Apply for business funding" },
} as const;
type Service = keyof typeof SERVICES;
const isService = (v: string | null): v is Exclude<Service, "other"> =>
  v === "working_capital" || v === "gig_funding" || v === "insurance_restoration";

const Apply: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get("t");
  const interestParam = params.get("interest");
  const initialInterest = isService(interestParam) ? interestParam : null;
  const ctaParam = params.get("cta");
  const entryCta = ctaParam && /^[a-z0-9_-]{1,60}$/i.test(ctaParam) ? ctaParam : null;
  const headline = initialInterest ? SERVICES[initialInterest].headline : "Apply for business funding";

  const [service, setService] = useState<Service | "">(initialInterest ?? "");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [consentEmail, setConsentEmail] = useState(false);
  const [consentSms, setConsentSms] = useState(false);
  const [consentCall, setConsentCall] = useState(false);
  const [brokerAck, setBrokerAck] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [linkNote, setLinkNote] = useState<string | null>(null);
  const mountedAt = useRef(Date.now());

  const landing = useMemo(() => window.location.href.slice(0, 500), []);

  useEffect(() => {
    document.title = "Funding Application | ClearFund AI";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.setAttribute(
        "content",
        "Apply for business funding through ClearFund AI. Tell us about your business and we match you with third-party funding providers.",
      );
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error: fnError } = await supabase.functions.invoke("submit-application", {
        body: { action: "prefill", token },
      });
      if (fnError || !data) return;
      if (!data.valid) {
        setLinkNote(
          data.reason === "expired"
            ? "That link has expired, but you can still fill in the form below."
            : data.reason === "already_used"
              ? "That link has already been used. You can still fill in the form below."
              : null,
        );
        return;
      }
      setForm((prev) => ({
        ...prev,
        owner_name: data.prefill.owner_name || prev.owner_name,
        business_name: data.prefill.business_name || prev.business_name,
        email: data.prefill.email || prev.email,
        phone: data.prefill.phone || prev.phone,
      }));
    })();
  }, [token]);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    if (!brokerAck) {
      setError("Please confirm you understand ClearFund AI is a broker, not a lender.");
      return;
    }
    if (!consentEmail && !consentSms && !consentCall) {
      setError("Please choose at least one way for us to contact you.");
      return;
    }

    setSubmitting(true);
    const { data, error: fnError } = await supabase.functions.invoke("submit-application", {
      body: {
        action: "submit",
        token,
        owner_name: parsed.data.owner_name,
        business_name: parsed.data.business_name,
        business_address: parsed.data.business_address || null,
        email: parsed.data.email,
        phone: parsed.data.phone,
        business_start_date: parsed.data.business_start_date || null,
        monthly_revenue: toNumber(parsed.data.monthly_revenue),
        funding_need: toNumber(parsed.data.funding_need),
        funding_purpose: parsed.data.funding_purpose || null,
        service_interest: service || "other",
        entry_cta: entryCta,
        consent_email: consentEmail,
        consent_sms: consentSms,
        consent_call: consentCall,
        broker_acknowledged: true,
        landing_page: landing,
        referrer: document.referrer ? document.referrer.slice(0, 500) : null,
        utm_source: params.get("utm_source"),
        utm_medium: params.get("utm_medium"),
        utm_campaign: params.get("utm_campaign"),
        company_website: honeypot,
        elapsed_ms: Date.now() - mountedAt.current,
      },
    });
    setSubmitting(false);

    if (fnError || !data || data.error) {
      setError("We could not submit your application. Please check your details and try again.");
      return;
    }
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-white">
        <section className="container-custom py-12 md:py-16 max-w-3xl">
          {submitted ? (
            <div className="border border-gray-200 rounded-xl p-8 text-center space-y-4">
              <CheckCircle2 className="h-10 w-10 mx-auto text-clearfund-blue" />
              <h1 className="text-3xl font-bold text-clearfund-dark-blue">Application received</h1>
              <p className="text-gray-700">
                Thank you. A ClearFund AI specialist will review your information and reach out using
                the contact methods you approved. If you have questions in the meantime, call us and
                our concierge can help.
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-3xl md:text-4xl font-bold text-clearfund-dark-blue">
                {headline}
              </h1>
              <p className="mt-3 text-gray-700">
                Takes about three minutes. We never ask for your Social Security number or bank
                account numbers on this form — if any documents are needed, we request them
                separately through a secure link.
              </p>
              {linkNote && <p className="mt-3 text-sm text-clearfund-blue">{linkNote}</p>}

              <form onSubmit={onSubmit} className="mt-8 space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="service_interest">What funding are you looking for?</Label>
                    <select
                      id="service_interest"
                      value={service}
                      onChange={(e) => setService(e.target.value as Service | "")}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select a service</option>
                      {(Object.keys(SERVICES) as Service[]).map((k) => (
                        <option key={k} value={k}>
                          {SERVICES[k].label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="owner_name">Owner full name *</Label>
                    <Input id="owner_name" value={form.owner_name} onChange={set("owner_name")} maxLength={120} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="business_name">Business name *</Label>
                    <Input id="business_name" value={form.business_name} onChange={set("business_name")} maxLength={160} required />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="business_address">Business address</Label>
                    <Input id="business_address" value={form.business_address} onChange={set("business_address")} maxLength={300} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" value={form.email} onChange={set("email")} maxLength={255} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input id="phone" type="tel" value={form.phone} onChange={set("phone")} maxLength={30} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="business_start_date">Business start date</Label>
                    <Input id="business_start_date" type="date" value={form.business_start_date} onChange={set("business_start_date")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthly_revenue">Average monthly revenue (USD)</Label>
                    <Input id="monthly_revenue" inputMode="numeric" value={form.monthly_revenue} onChange={set("monthly_revenue")} maxLength={20} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="funding_need">Funding amount needed (USD)</Label>
                    <Input id="funding_need" inputMode="numeric" value={form.funding_need} onChange={set("funding_need")} maxLength={20} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="funding_purpose">What will the funds be used for?</Label>
                    <Textarea id="funding_purpose" value={form.funding_purpose} onChange={set("funding_purpose")} maxLength={1000} rows={4} />
                  </div>
                </div>

                {/* Honeypot: hidden from real users */}
                <div className="hidden" aria-hidden="true">
                  <label htmlFor="company_website">Company website</label>
                  <input
                    id="company_website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                <fieldset className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <legend className="px-1 text-sm font-semibold text-clearfund-dark-blue">
                    How may we contact you?
                  </legend>
                  <label className="flex items-start gap-3 text-sm text-gray-700">
                    <Checkbox checked={consentEmail} onCheckedChange={(v) => setConsentEmail(v === true)} />
                    <span>Email me about my application and funding options.</span>
                  </label>
                  <label className="flex items-start gap-3 text-sm text-gray-700">
                    <Checkbox checked={consentSms} onCheckedChange={(v) => setConsentSms(v === true)} />
                    <span>Text me about my application. Message and data rates may apply.</span>
                  </label>
                  <label className="flex items-start gap-3 text-sm text-gray-700">
                    <Checkbox checked={consentCall} onCheckedChange={(v) => setConsentCall(v === true)} />
                    <span>Call me, including automated or AI-assisted calls.</span>
                  </label>
                  <p className="text-xs text-gray-500">{CONSENT_TEXT}</p>
                </fieldset>

                <label className="flex items-start gap-3 text-sm text-gray-700">
                  <Checkbox checked={brokerAck} onCheckedChange={(v) => setBrokerAck(v === true)} />
                  <span>
                    I understand ClearFund AI is a broker that matches me with third-party funding
                    providers and is not a direct lender. Submitting this form is not an approval or
                    an offer of funding.
                  </span>
                </label>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-clearfund-blue hover:bg-clearfund-dark-blue text-white text-lg py-6 px-8 rounded-lg w-full sm:w-auto"
                >
                  {submitting && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
                  Submit application
                </Button>
              </form>
            </>
          )}
        </section>
        <FundingPartners />
      </main>
      <Footer />
    </div>
  );
};

export default Apply;

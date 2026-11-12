import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { computeCashGap, type CashGapInputs } from "@/lib/cashGap";
import { DAC_APPLY_URL, openDacApply, logDacClick } from "@/lib/partners";
import ApplyLink from "@/components/ApplyLink";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Math.round(n));

const iso = (d: Date) => d.toISOString().slice(0, 10);
const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const addDays = (s: string, n: number) => {
  const d = new Date(`${s}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
};

const emailSchema = z.string().trim().email().max(254);

interface Props {
  stage?: string;
  embedded?: boolean;
  initialAmount?: number;
}

const CashGapCalculator: React.FC<Props> = ({ stage, embedded, initialAmount }) => {
  const [inputs, setInputs] = useState<CashGapInputs>(() => {
    const start = addDays(localToday(), 21);
    return {
      contractAmount: initialAmount && initialAmount > 0 ? Math.round(initialAmount) : 180000,
      contractMonths: 6,
      startDate: start,
      firstPaymentDate: addDays(start, 75),
      upFrontPercent: 15,
      marginPercent: 20,
      cashOnHand: 0,
    };
  });
  const r = useMemo(() => computeCashGap(inputs), [inputs]);

  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const num = (k: keyof CashGapInputs, min: number, max?: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value === "" ? 0 : Number(e.target.value);
    if (Number.isNaN(v)) v = 0;
    v = Math.max(min, max !== undefined ? Math.min(max, v) : v);
    setInputs((p) => ({ ...p, [k]: v }));
  };
  const date = (k: "startDate" | "firstPaymentDate") => (e: React.ChangeEvent<HTMLInputElement>) =>
    setInputs((p) => ({ ...p, [k]: e.target.value }));

  const amount = Math.round(r.cashGap);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError("Please enter a valid email address.");
      return;
    }
    setSaving(true);
    const { error: err } = await supabase.from("cash_gap_leads").insert({
      email: parsed.data,
      stage: stage ?? null,
      inputs: { ...inputs, days: r.days, upFront: Math.round(r.upFront), runningCosts: Math.round(r.runningCosts) },
      cash_gap: amount,
      marketing_consent: consent === true,
    });
    setSaving(false);
    if (err) {
      setError("We couldn't save your estimate. Please try again.");
      return;
    }
    setSaved(true);
  };

  const field = "space-y-2 min-w-0";
  return (
    <div className="space-y-6 pb-24 sm:pb-0">
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className={`bg-white rounded-xl space-y-4 min-w-0 ${embedded ? "p-0 border-0 sm:p-6 sm:border sm:border-gray-200" : "p-4 sm:p-6 border border-gray-200"}`}>
          <div className={field}>
            <Label htmlFor="cg-amount">Contract amount ($)</Label>
            <Input id="cg-amount" type="number" className="w-full min-w-0 max-w-full" min={0} value={inputs.contractAmount} onChange={num("contractAmount", 0)} />
          </div>
          <div className={field}>
            <Label htmlFor="cg-months">Contract length (months)</Label>
            <Input id="cg-months" type="number" className="w-full min-w-0 max-w-full" min={1} value={inputs.contractMonths} onChange={num("contractMonths", 1)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={field}>
              <Label htmlFor="cg-start">Start date</Label>
              <Input id="cg-start" type="date" className="cg-date w-full min-w-0 max-w-full" value={inputs.startDate} onChange={date("startDate")} />
            </div>
            <div className={field}>
              <Label htmlFor="cg-pay">First payment expected</Label>
              <Input id="cg-pay" type="date" className="cg-date w-full min-w-0 max-w-full" value={inputs.firstPaymentDate} onChange={date("firstPaymentDate")} />
            </div>
          </div>
          <div className={field}>
            <Label htmlFor="cg-up">Up-front costs: materials, equipment, bonding (% of contract)</Label>
            <Input id="cg-up" type="number" className="w-full min-w-0 max-w-full" min={0} max={100} value={inputs.upFrontPercent} onChange={num("upFrontPercent", 0, 100)} />
          </div>
          <div className={field}>
            <Label htmlFor="cg-margin">Your gross margin (%)</Label>
            <Input id="cg-margin" type="number" className="w-full min-w-0 max-w-full" min={0} max={90} value={inputs.marginPercent} onChange={num("marginPercent", 0, 90)} />
          </div>
          <div className={field}>
            <Label htmlFor="cg-cash">Cash you can put toward this job now ($)</Label>
            <Input id="cg-cash" type="number" className="w-full min-w-0 max-w-full" min={0} value={inputs.cashOnHand} onChange={num("cashOnHand", 0)} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-clearfund-pale-blue rounded-xl p-6 md:p-8 space-y-4" aria-live="polite">
            <p className="text-clearfund-dark-blue font-medium">Estimated cash needed before your first payment</p>
            <p className="text-5xl md:text-6xl font-bold text-clearfund-blue">{fmt(r.cashGap)}</p>
            <p className="text-gray-700">
              {fmt(r.upFront)} up front, plus about {fmt(r.runningCosts)} in crew and running costs
              {r.datesInverted ? "" : ` over the ${r.days} days until your first payment`}
              {inputs.cashOnHand > 0 ? `, less ${fmt(inputs.cashOnHand)} you have on hand` : ""}.
            </p>
            {r.datesInverted && <p className="text-sm text-destructive">Check your dates: first payment is before the job starts.</p>}
            {amount > 0 ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
                <Button asChild className="bg-clearfund-blue hover:bg-clearfund-dark-blue text-white text-lg py-6 px-8 rounded-lg">
                  <ApplyLink cta="cashgapcalculator_1">Apply with our funding partner</ApplyLink>
                </Button>
                <a href="tel:8665784721" className="text-clearfund-blue font-medium hover:underline whitespace-nowrap">
                  Talk to us: 866-578-4721
                </a>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <p className="text-clearfund-dark-blue font-medium">Looks like you can cover this job's start. Want a backup line in case payment runs late?</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <Button asChild className="bg-clearfund-blue hover:bg-clearfund-dark-blue text-white text-lg py-6 px-8 rounded-lg">
                    <a href="tel:8665784721">Talk to Us</a>
                  </Button>
                  <ApplyLink cta="cashgapcalculator_2" className="text-clearfund-blue font-medium hover:underline">Apply Anyway</ApplyLink>
                </div>
              </div>
            )}
            <p className="text-sm text-gray-700">The up-front part usually fits Contract &amp; PO Financing. Once you invoice the agency, Invoice Factoring can cover the rest.</p>
          </div>

          <div className="border border-gray-200 rounded-xl p-6">
            {saved ? (
              <p className="text-clearfund-dark-blue font-medium">Thanks, your estimate is saved.</p>
            ) : (
              <form onSubmit={save} className="space-y-4">
                <p className="font-semibold text-clearfund-dark-blue">Want to save this estimate?</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input type="email" required aria-label="Email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <Button type="submit" disabled={saving} className="bg-clearfund-blue hover:bg-clearfund-dark-blue text-white">
                    {saving ? "Saving…" : "Save My Estimate"}
                  </Button>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id={`cg-consent-${stage ?? "page"}`} checked={consent} onCheckedChange={(v) => setConsent(v === true)} />
                  <Label htmlFor={`cg-consent-${stage ?? "page"}`} className="text-sm font-normal text-gray-700">
                    Send me occasional tips on funding public contracts
                  </Label>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </form>
            )}
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-500">
        Estimate only, not an offer of financing. Assumes job costs are spent evenly over the contract after up-front costs. Funding is subject to partner approval.
      </p>
    </div>
  );
};

export default CashGapCalculator;

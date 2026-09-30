import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Download, Link2, Loader2, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { COMPLIANCE_TEXT, usd, type Results } from "@/lib/freeAudit";
import { useToast } from "@/hooks/use-toast";

type Ai = {
  headline_summary: string; score_explanation: string; funding_context: string; closing_note: string;
  opportunities: { opportunity_id: string; personalized_problem: string; personalized_fix: string; first_step: string }[];
  today_vs_automated: { today: string[]; automated: string[] };
};
type Data = { first_name: string; business_name: string; drains: string[]; results: Results; ai_analysis: Ai | null };

// Tasks a machine can take over, used only when the AI analysis is unavailable.
const AUTOMATABLE = new Set(["Answering calls & texts", "Scheduling & rescheduling", "Writing quotes / estimates", "Invoicing & chasing payments", "Following up with leads", "Data entry & paperwork", "Customer support questions", "Building reports"]);

const Dial: React.FC<{ score: number }> = ({ score }) => {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => { const p = Math.min(1, (t - t0) / 1400); setV(Math.round(score * p)); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [score]);
  const r = 54, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 120 120" className="w-40 h-40 mx-auto" role="img" aria-label={`Automation Score ${score} out of 100`}>
      <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" className="stroke-muted" />
      <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" strokeLinecap="round" className="stroke-accent"
        strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} transform="rotate(-90 60 60)" />
      <text x="60" y="68" textAnchor="middle" className="fill-foreground text-3xl font-semibold" style={{ fontSize: 30 }}>{v}</text>
    </svg>
  );
};

const FreeAuditResults: React.FC = () => {
  const { token } = useParams();
  const { toast } = useToast();
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState(false);
  const [revealed, setRevealed] = useState(0);
  const seen = useRef(new Set<string>());

  const track = (event_name: string, step_id?: string) =>
    supabase.functions.invoke("get-free-audit-result", { body: { token, event: { event_name, step_id } } }).catch(() => {});

  useEffect(() => {
    supabase.functions.invoke("get-free-audit-result", { body: { token } }).then(({ data, error }) => {
      if (error || !data?.ok) { setErr(true); return; }
      setData(data); track("results_viewed");
    });
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!data || revealed >= data.results.opportunities.length) return;
    const t = setTimeout(() => setRevealed((n) => n + 1), revealed === 0 ? 1600 : 600);
    return () => clearTimeout(t);
  }, [data, revealed]);
  useEffect(() => {
    data?.results.opportunities.slice(0, revealed).forEach((o) => {
      if (!seen.current.has(o.opportunity_id)) { seen.current.add(o.opportunity_id); track("opportunity_card_viewed", o.opportunity_id); }
    });
  }, [revealed]); // eslint-disable-line react-hooks/exhaustive-deps

  if (err) return (
    <div className="min-h-screen flex flex-col"><Header />
      <main className="flex-grow container mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-2xl font-semibold">We couldn't find these results</h1>
        <Button asChild><Link to="/automation-audit">Take the audit</Link></Button>
      </main><Footer /></div>
  );
  if (!data) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;

  const { results: r, ai } = { results: data.results, ai: data.ai_analysis };
  const today = ai?.today_vs_automated.today.length ? ai.today_vs_automated.today : data.drains;
  const automated = ai?.today_vs_automated.automated.length ? ai.today_vs_automated.automated : data.drains.filter((d) => AUTOMATABLE.has(d));
  const copy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copied" }); track("results_link_copied");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="print:hidden"><Header /></div>
      <main className="flex-grow container mx-auto px-4 py-10 max-w-3xl space-y-12">
        <section className="text-center space-y-4">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{data.first_name}, here's what {data.business_name} could be automating.</h1>
          <Dial score={r.score} />
          <p className="text-sm text-muted-foreground">Automation Score (out of 100)</p>
          <p className="text-xl font-semibold text-foreground">{r.score_label}</p>
          <p className="text-muted-foreground">{r.score_blurb}</p>
          {ai?.headline_summary && <p className="text-foreground text-left">{ai.headline_summary}</p>}
          {ai?.score_explanation && <p className="text-sm text-muted-foreground text-left">{ai.score_explanation}</p>}
          <div className="grid grid-cols-2 gap-3 text-left pt-2">
            <div className="rounded-lg border border-border bg-card p-4">
              <h2 className="text-sm font-semibold mb-3">Today</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">{today.length ? today.map((t) => <li key={t} className="rounded bg-muted px-3 py-2">{t}</li>) : <li>No time drains selected</li>}</ul>
            </div>
            <div className="rounded-lg border border-accent bg-card p-4">
              <h2 className="text-sm font-semibold mb-3">Automated</h2>
              <ul className="space-y-2 text-sm">{automated.length ? automated.map((t) => <li key={t} className="rounded bg-secondary px-3 py-2">{t}</li>) : <li className="text-muted-foreground">Nothing obvious to hand off</li>}</ul>
            </div>
          </div>
        </section>

        <section className="text-center rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Estimated monthly opportunity</p>
          <p className="text-4xl font-bold text-foreground">{usd(r.total_monthly_impact)}</p>
          <p className="text-sm text-muted-foreground">About {usd(r.annual_impact)} a year</p>
        </section>

        <section className="space-y-4">
          {r.opportunities.map((o, i) => {
            const p = ai?.opportunities.find((x) => x.opportunity_id === o.opportunity_id);
            return (
              <article key={o.opportunity_id} className={i < revealed ? "rounded-lg border border-border bg-card p-5 space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500" : "hidden print:block"}>
                <h3 className="text-lg font-semibold text-foreground">{o.title}</h3>
                <p className="text-sm text-muted-foreground">{p?.personalized_problem || o.problem}</p>
                <p className="text-sm text-foreground">{p?.personalized_fix || o.fix}</p>
                {p?.first_step && <p className="text-sm"><span className="font-medium">First step:</span> {p.first_step}</p>}
                <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-border">
                  <div><p className="text-xs text-muted-foreground">{o.impact_label}</p><p className="text-xl font-semibold">{usd(o.monthly_impact)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Estimated investment</p><p className="text-xl font-semibold">{usd(o.investment_range_low)}–{usd(o.investment_range_high)}</p></div>
                </div>
              </article>
            );
          })}
          {ai?.closing_note && <p className="text-sm text-muted-foreground">{ai.closing_note}</p>}
        </section>

        <div className="border border-border rounded-lg p-4 text-sm text-muted-foreground bg-card">
          You're one of our first ten audits, which is why this was free. If you want help putting any of this in place, we'd like to build your results into a case study.
        </div>

        <section className="space-y-4 text-center print:hidden">
          <h2 className="text-2xl font-semibold text-foreground">Don't want to pay for this out of pocket?</h2>
          {ai?.funding_context && <p className="text-muted-foreground">{ai.funding_context}</p>}
          <p className="text-muted-foreground">
            Your top fixes would cost roughly {usd(r.min_total)}–{usd(r.max_total)} to implement. ClearFundAI helps businesses explore financing options so upgrades like these can start paying for themselves right away.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" onClick={() => track("funding_cta_clicked")}>
              <Link to="/apply?cta=audit_results">See my funding options <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" onClick={() => track("setup_cta_clicked")}>
              <a href="tel:8665784721">Talk to us about setting this up</a>
            </Button>
          </div>
        </section>

        <div className="flex gap-3 justify-center print:hidden">
          <Button variant="outline" onClick={() => { track("pdf_downloaded"); setRevealed(99); setTimeout(() => window.print(), 50); }}><Download className="h-4 w-4 mr-2" /> Download PDF</Button>
          <Button variant="outline" onClick={copy}><Link2 className="h-4 w-4 mr-2" /> Share results</Button>
        </div>

        <p className="text-xs text-muted-foreground border-t border-border pt-4">{COMPLIANCE_TEXT}</p>
      </main>
      <div className="print:hidden"><Footer /></div>
    </div>
  );
};

export default FreeAuditResults;

import React from "react";
import { Link } from "react-router-dom";
import { LayoutGrid, Bot, DollarSign, Wallet, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const GET = [
  { icon: LayoutGrid, title: "A picture of your current setup", body: "the tasks eating your week, laid out in one view" },
  { icon: Bot, title: "The specific jobs a machine can take over", body: "named plainly (answering calls, following up with leads, sending quotes, chasing invoices), not described as \"solutions\"" },
  { icon: DollarSign, title: "A dollar figure on each one", body: "what it's costing you every month to keep doing it by hand" },
  { icon: Wallet, title: "What it costs to hand it off", body: "the real investment range, and how it can be financed" },
];
const TASKS = [
  ["Answering every call", "AI receptionist answers 24/7"],
  ["Following up with leads", "Automatic text & email follow-up"],
  ["Writing quotes", "Quotes generated from templates"],
  ["Chasing invoices", "Payment reminders sent for you"],
];

const FreeAuditLanding: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <Header />
    <main className="flex-grow container mx-auto px-4 py-12 max-w-3xl space-y-14">
      <section className="text-center space-y-5">
        <p className="text-sm font-medium uppercase tracking-wide text-accent">Free automation audit for business owners</p>
        <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight">
          See exactly which parts of your business a machine could be running.
        </h1>
        <p className="text-lg text-muted-foreground">
          Answer a few questions about how you operate today. In 4 minutes you'll get a clear breakdown of the specific tasks in your business that AI and automation can take over — what each one is costing you now, and what it would cost to hand it off.
        </p>
        <Button asChild size="lg" className="h-14 px-8 text-base">
          <Link to="/automation-audit/start">Show me what I can automate <ArrowRight className="ml-2 h-5 w-5" /></Link>
        </Button>
        <p className="text-sm text-muted-foreground">
          You'll see a personalized map of your operation: which jobs stay human, which ones a machine can take, and the dollars attached to each.
        </p>
        <div className="border border-border rounded-lg p-4 text-sm text-muted-foreground bg-card max-w-xl mx-auto">
          This is free because we're building our first ten client stories. You get the full audit and the numbers behind it. If it's useful, we'd love to talk about implementing it — and if not, keep the report.
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3" aria-label="Before and after example">
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold mb-3 text-foreground">Done by you and your staff today</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">{TASKS.map(([a]) => <li key={a} className="rounded bg-muted px-3 py-2">{a}</li>)}</ul>
        </div>
        <div className="rounded-lg border border-accent bg-card p-4">
          <h2 className="text-sm font-semibold mb-3 text-foreground">Could be running automatically</h2>
          <ul className="space-y-2 text-sm text-foreground">{TASKS.map(([, b]) => <li key={b} className="rounded bg-secondary px-3 py-2">{b}</li>)}</ul>
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="text-2xl font-semibold text-foreground text-center">What you actually get</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {GET.map((g) => (
            <div key={g.title} className="rounded-lg border border-border bg-card p-5 flex gap-4">
              <g.icon className="h-6 w-6 text-accent shrink-0" aria-hidden />
              <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">{g.title}</span> — {g.body}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="text-center text-sm font-medium text-foreground">No credit card. No obligation. Your report is yours to keep.</p>
    </main>
    <Footer />
  </div>
);

export default FreeAuditLanding;

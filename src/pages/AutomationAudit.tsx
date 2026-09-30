import React from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BLUEPRINT_SECTIONS, FIT_CRITERIA } from "@/lib/auditConsent";

const AutomationAudit: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <Header />
    <main className="flex-grow container mx-auto px-4 py-12 max-w-3xl space-y-8">
      <Alert>
        <AlertTitle>Preview only</AlertTitle>
        <AlertDescription>
          This page is not published. Price, legal name and linked documents are still placeholders.
        </AlertDescription>
      </Alert>

      <section className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Automation Audit &amp; Blueprint</h1>
        <p className="text-muted-foreground">For qualified businesses across industries.</p>
        <p className="text-sm text-muted-foreground">
          Example use case: a roofing or restoration contractor mapping lead intake, estimates and
          insurance-claim follow-up.
        </p>
        <p className="text-lg font-semibold text-foreground">Price: [PRICE]</p>
        <p className="text-sm text-muted-foreground">Online payment is not available yet.</p>
        <Button asChild size="lg">
          <Link to="/automation-audit/start">Start the intake</Link>
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Who qualifies</h2>
        <p className="text-muted-foreground">
          Fit is about whether an audit would be useful for your business processes. It is not a
          funding, credit or financing decision, and revenue or credit scores are not used.
        </p>
        <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
          {FIT_CRITERIA.map((c) => <li key={c}>{c}</li>)}
        </ol>
        <p className="text-sm text-muted-foreground">
          Answers are self-reported. If something is missing or unclear, you can still submit and a
          person will review it. No one is automatically rejected, and no results are promised.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">What the Blueprint covers</h2>
        <ul className="grid sm:grid-cols-2 gap-2 text-muted-foreground list-disc pl-5">
          {BLUEPRINT_SECTIONS.map((s) => (
            <li key={s.key}>{s.label}</li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">
          Each finding is labeled as a fact, estimate, assumption or unknown. The Blueprint is
          reviewed by a person before delivery.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Separate from funding</h2>
        <p className="text-muted-foreground">
          The audit is a separate service from our funding referrals. Funding is free and optional,
          and is not part of the audit, its price or its findings.
        </p>
      </section>
    </main>
    <Footer />
  </div>
);

export default AutomationAudit;

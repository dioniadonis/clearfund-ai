import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Bot, BriefcaseBusiness, Cpu, Database, GraduationCap, Workflow } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { usePageMeta } from "@/lib/usePageMeta";

const uses = [
  [Bot, "AI software and subscriptions", "Tools that support sales, service, operations and everyday work."],
  [Workflow, "Workflow automation and integrations", "Connect repetitive tasks and the systems your business already uses."],
  [BriefcaseBusiness, "AI hires and contractors", "Add people who can implement, manage or support your AI plans."],
  [Cpu, "Hardware and computing", "Equipment and computing resources for your business operations."],
  [Database, "Data, CRM and systems setup", "Organize the information and systems behind your customer workflows."],
  [GraduationCap, "Training your team", "Help your team build practical skills for new tools and processes."],
] as const;

const steps = [
  ["1", "Answer a few questions about your business."],
  ["2", "We match you with funding options that fit."],
  ["3", "Review the provider's terms and decide."],
] as const;

const faqs = [
  ["Do I need a tech company to apply?", "No. Tech-forward businesses and traditional businesses adding AI can apply."],
  ["Does applying affect my credit?", "Our questionnaire doesn't pull credit; some providers may check credit later, and they'll tell you."],
  ["What can I use the funds for?", "Business purposes, including AI tools, automation and hiring."],
  ["Who makes the decision?", "The provider decides and sets all terms."],
] as const;

const AiFundingHome: React.FC = () => {
  const { pathname } = useLocation();
  const canonicalPath = pathname === "/ai-funding" ? "/ai-funding" : "/";
  usePageMeta(
    "ClearFund AI | Funding for Businesses Investing in AI",
    "Explore business funding for AI tools, automation, systems and people. Providers decide whether to make an offer and set all terms.",
    canonicalPath,
    "https://clearfundai.com",
  );

  return (
    <div className="flex min-h-screen min-w-0 flex-col bg-background">
      <Header />
      <main className="min-w-0 flex-grow">
        <section className="border-b bg-clearfund-pale-blue">
          <div className="container-custom py-14 text-center sm:py-20">
            <p className="text-sm font-semibold uppercase tracking-widest text-clearfund-blue">Business funding for AI investment</p>
            <h1 className="mx-auto mt-4 max-w-4xl break-words text-4xl font-bold leading-tight text-clearfund-dark-blue sm:text-5xl lg:text-6xl">Funding for Businesses Ready to Invest in AI</h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-foreground/80 sm:text-xl">Get capital for the AI tools, automation and people that help your business grow.</p>
            <div className="mx-auto mt-8 flex max-w-md flex-col justify-center gap-3 sm:max-w-none sm:flex-row">
              <Button asChild size="lg" className="min-h-12 bg-clearfund-blue px-8 text-base hover:bg-clearfund-dark-blue"><Link to="/get-started?src=clearfundai">See If You Qualify<ArrowRight className="ml-2 h-5 w-5" /></Link></Button>
              <Button asChild size="lg" variant="outline" className="min-h-12 border-clearfund-blue px-8 text-base text-clearfund-blue"><a href="#how-it-works">How It Works</a></Button>
            </div>
            <p className="mx-auto mt-5 max-w-xl text-sm text-foreground/70">Start with our short questionnaire. Providers decide whether to make an offer and set all terms.</p>
          </div>
        </section>

        <section className="container-custom py-14 sm:py-20" aria-labelledby="ai-uses-heading">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="ai-uses-heading" className="text-3xl font-bold text-clearfund-dark-blue sm:text-4xl">What businesses fund</h2>
            <p className="mt-3 text-muted-foreground">Invest in practical ways to improve how your business operates and grows.</p>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {uses.map(([Icon, title, body]) => <article key={title} className="min-w-0 rounded-lg border bg-card p-5"><Icon className="h-7 w-7 text-clearfund-blue" aria-hidden="true" /><h3 className="mt-4 break-words text-lg font-bold">{title}</h3><p className="mt-2 text-sm text-muted-foreground">{body}</p></article>)}
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-24 border-y bg-secondary/50 py-14 sm:py-20" aria-labelledby="how-heading">
          <div className="container-custom">
            <h2 id="how-heading" className="text-center text-3xl font-bold text-clearfund-dark-blue sm:text-4xl">How it works</h2>
            <div className="mt-9 grid gap-5 md:grid-cols-3">
              {steps.map(([number, text]) => <article key={number} className="rounded-lg border bg-card p-6 text-center"><div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-clearfund-blue text-xl font-bold text-primary-foreground">{number}</div><p className="mt-4 text-lg font-medium">{text}</p></article>)}
            </div>
          </div>
        </section>

        <section className="container-custom py-14 sm:py-20" aria-labelledby="who-heading">
          <div className="mx-auto max-w-4xl rounded-lg border bg-card p-6 sm:p-10">
            <h2 id="who-heading" className="text-center text-3xl font-bold text-clearfund-dark-blue">Who it's for</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-3">
              <div><h3 className="font-bold">Established activity</h3><p className="mt-2 text-sm text-muted-foreground">In business 4+ months with steady revenue.</p></div>
              <div><h3 className="font-bold">Credit review varies</h3><p className="mt-2 text-sm text-muted-foreground">Some programs use credit, but it's not required for all.</p></div>
              <div><h3 className="font-bold">Many business types</h3><p className="mt-2 text-sm text-muted-foreground">Fits tech-forward businesses and traditional businesses adding AI.</p></div>
            </div>
          </div>
        </section>

        <section className="border-t bg-card py-14 sm:py-20" aria-labelledby="faq-heading">
          <div className="container-custom">
            <div className="mx-auto max-w-3xl">
              <h2 id="faq-heading" className="text-center text-3xl font-bold text-clearfund-dark-blue">Frequently asked questions</h2>
              <Accordion type="single" collapsible className="mt-7">
                {faqs.map(([question, answer], index) => <AccordionItem key={question} value={`faq-${index}`}><AccordionTrigger className="text-left text-base">{question}</AccordionTrigger><AccordionContent className="text-base text-muted-foreground">{answer}</AccordionContent></AccordionItem>)}
              </Accordion>
            </div>
          </div>
        </section>

        <section className="bg-clearfund-dark-blue py-12 text-primary-foreground sm:py-16">
          <div className="container-custom text-center">
            <h2 className="text-3xl font-bold">Explore funding for your AI plans</h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">Tell us about your business and what you want to invest in.</p>
            <Button asChild size="lg" variant="secondary" className="mt-7 min-h-12 px-8 text-base"><Link to="/get-started?src=clearfundai">See If You Qualify<ArrowRight className="ml-2 h-5 w-5" /></Link></Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AiFundingHome;

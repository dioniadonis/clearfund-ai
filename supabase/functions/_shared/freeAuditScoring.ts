// Single source of truth for the Free Automation Audit questions and scoring.
// Pure TypeScript (no Deno/browser APIs) so both the site and the server import it.
// The server re-runs this; its numbers are authoritative.

export type Opt = { value: string; label: string };
export type Question =
  | { id: string; label: string; type: "single_cards" | "single_chips" | "multi_chips"; options: Opt[]; microcopy?: string }
  | { id: string; label: string; type: "slider"; min: number; max: number; step: number; default: number; unit?: string; microcopy?: string };
export type Step = { id: string; step_number: number; title: string; microcopy?: string; questions: Question[] };

const o = (labels: string[]): Opt[] => labels.map((l) => ({ value: l, label: l }));

export const STEPS: Step[] = [
  {
    id: "basics", step_number: 1, title: "The basics",
    questions: [
      { id: "industry", label: "What kind of business do you run?", type: "single_cards", options: o([
        "Home services / trades", "Contractor / construction", "Healthcare / dental / wellness",
        "Legal / accounting / professional services", "Real estate / property management", "Retail / e-commerce",
        "Restaurant / hospitality", "Agency / marketing / creative", "Other"]) },
      { id: "team_size", label: "How big is your team?", type: "single_chips", options: o(["Just me", "2–5", "6–15", "16–50", "50+"]) },
      { id: "years_in_business", label: "How long have you been in business?", type: "single_chips", options: o(["Under 1 year", "1–3 years", "3–10 years", "10+ years"]) },
    ],
  },
  {
    id: "time_drains", step_number: 2, title: "Where does your time go?",
    questions: [
      { id: "drains", label: "Pick everything that eats up your week.", microcopy: "Be honest, nobody's grading you.", type: "multi_chips", options: o([
        "Answering calls & texts", "Scheduling & rescheduling", "Writing quotes / estimates", "Invoicing & chasing payments",
        "Following up with leads", "Data entry & paperwork", "Social media & content", "Customer support questions",
        "Hiring & onboarding", "Building reports"]) },
      { id: "admin_hours", label: "Roughly how many hours a week go to repetitive tasks (you + team)?", type: "slider", min: 0, max: 80, step: 1, default: 15, unit: "hrs/week" },
    ],
  },
  {
    id: "leads", step_number: 3, title: "How customers find you",
    questions: [
      { id: "lead_sources", label: "Where do new customers come from?", type: "multi_chips", options: o([
        "Referrals", "Google / search", "Social media", "Paid ads", "Walk-ins", "Website forms", "Marketplaces (Yelp, Angi, etc.)", "Other"]) },
      { id: "response_time", label: "When a new lead reaches out, how fast do they usually hear back?", type: "single_cards", options: [
        { value: "under_5_min", label: "Within 5 minutes" }, { value: "under_1_hr", label: "Within an hour" },
        { value: "same_day", label: "Same day" }, { value: "next_day_plus", label: "Next day or later" },
        { value: "not_sure", label: "Honestly not sure" }] },
      { id: "follow_up", label: "If a lead doesn't buy right away, what happens?", type: "single_cards", options: [
        { value: "automated", label: "Automated follow-up sequence" }, { value: "manual", label: "We follow up when we remember" },
        { value: "rarely", label: "Usually nothing" }] },
      { id: "missed_calls", label: "About how many calls go unanswered each week?", type: "slider", min: 0, max: 50, step: 1, default: 5, unit: "calls/week" },
    ],
  },
  {
    id: "numbers", step_number: 4, title: "The numbers", microcopy: "Ballparks are fine. This is what turns your results into dollars.",
    questions: [
      { id: "monthly_leads", label: "New leads or inquiries per month", type: "slider", min: 0, max: 500, step: 5, default: 40 },
      { id: "avg_customer_value", label: "What's a typical customer worth to you?", type: "slider", min: 50, max: 25000, step: 50, default: 1500, unit: "$" },
      { id: "close_rate", label: "Out of 10 leads, how many become customers?", type: "single_chips", options: [
        { value: "0.1", label: "1" }, { value: "0.2", label: "2" }, { value: "0.3", label: "3" }, { value: "0.5", label: "4–6" }, { value: "0.7", label: "7+" }] },
    ],
  },
  {
    id: "tools", step_number: 5, title: "Your setup",
    questions: [
      { id: "current_tools", label: "What do you use to run things today?", type: "multi_chips", options: o([
        "A CRM", "Spreadsheets", "Pen & paper", "QuickBooks / accounting software", "Scheduling software", "Email marketing tool", "Nothing formal"]) },
      { id: "main_goal", label: "If you could fix one thing this year, what would it be?", type: "single_cards", options: [
        { value: "more_leads", label: "Get more leads" }, { value: "close_more", label: "Close more of the leads I get" },
        { value: "save_time", label: "Get my time back" }, { value: "scale", label: "Grow without hiring more people" }] },
    ],
  },
];

export type Answers = {
  industry?: string; team_size?: string; years_in_business?: string;
  drains?: string[]; admin_hours?: number; lead_sources?: string[];
  response_time?: string; follow_up?: string; missed_calls?: number;
  monthly_leads?: number; avg_customer_value?: number; close_rate?: string;
  current_tools?: string[]; main_goal?: string;
};

export const REQUIRED_KEYS = ["industry", "team_size", "years_in_business", "response_time", "follow_up", "close_rate", "main_goal"] as const;

const HOURLY = 35;
const WPM = 4.3;

type Lib = {
  id: string; title: string; problem: string; fix: string; impact_label: string;
  investment_range: [number, number];
  trigger: (a: Required<Answers>) => boolean;
  impact: (a: Required<Answers>, cr: number) => number;
};

export const OPPORTUNITIES: Lib[] = [
  { id: "speed_to_lead", title: "Instant lead response",
    problem: "Leads that wait go cold. Most buyers go with whoever answers first.",
    fix: "AI-powered instant reply by text and email the moment a lead comes in, plus auto-booking to your calendar.",
    impact_label: "Estimated revenue slipping away per month", investment_range: [2000, 6000],
    trigger: (a) => ["same_day", "next_day_plus", "not_sure"].includes(a.response_time),
    impact: (a, cr) => a.monthly_leads * a.avg_customer_value * cr * 0.2 },
  { id: "missed_calls", title: "Never miss a call again",
    problem: "Every unanswered call is a customer who might be calling your competitor next.",
    fix: "AI voice receptionist that answers, qualifies, and books 24/7, with missed-call text-back.",
    impact_label: "Estimated revenue from missed calls per month", investment_range: [3000, 10000],
    trigger: (a) => a.missed_calls >= 3 || a.drains.includes("Answering calls & texts"),
    impact: (a, cr) => a.missed_calls * WPM * a.avg_customer_value * cr * 0.5 },
  { id: "follow_up_system", title: "Automated follow-up",
    problem: "Most sales happen after multiple touches, and most businesses stop after one.",
    fix: "Automated follow-up sequences across text and email that run until the lead buys or opts out.",
    impact_label: "Estimated revenue in unworked leads per month", investment_range: [1500, 5000],
    trigger: (a) => ["manual", "rarely"].includes(a.follow_up),
    impact: (a, cr) => a.monthly_leads * (1 - cr) * a.avg_customer_value * 0.1 },
  { id: "crm_foundation", title: "A real system of record",
    problem: "When customer info lives in spreadsheets, texts, and your head, things fall through the cracks.",
    fix: "A CRM set up for your business, with your pipeline, contacts, and automations in one place.",
    impact_label: "Estimated revenue lost to disorganization per month", investment_range: [3000, 12000],
    trigger: (a) => !a.current_tools.includes("A CRM"),
    impact: (a, cr) => a.monthly_leads * a.avg_customer_value * cr * 0.1 },
  { id: "quoting_automation", title: "Faster quotes and estimates",
    problem: "Slow quotes give buyers time to shop around.",
    fix: "Templated, auto-generated quotes with e-signature and deposit collection built in.",
    impact_label: "Estimated revenue from faster quoting per month", investment_range: [2000, 7000],
    trigger: (a) => a.drains.includes("Writing quotes / estimates"),
    impact: (a, cr) => a.monthly_leads * a.avg_customer_value * cr * 0.08 },
  { id: "billing_automation", title: "Get paid faster",
    problem: "Chasing payments drains your time and your cash flow.",
    fix: "Automatic invoicing, payment reminders, and online payment links.",
    impact_label: "Estimated value of time recovered per month", investment_range: [1500, 4000],
    trigger: (a) => a.drains.includes("Invoicing & chasing payments"),
    impact: (a) => a.admin_hours * 0.15 * WPM * HOURLY },
  { id: "admin_time", title: "Automate the busywork",
    problem: "Hours spent on repetitive tasks are hours not spent growing the business.",
    fix: "Workflow automations for scheduling, data entry, reporting, and handoffs between your tools.",
    impact_label: "Estimated value of time recovered per month", investment_range: [2500, 15000],
    trigger: (a) => a.admin_hours >= 10,
    impact: (a) => a.admin_hours * 0.4 * WPM * HOURLY },
];

const GOAL_BOOST: Record<string, string[]> = {
  more_leads: ["speed_to_lead", "missed_calls"],
  close_more: ["follow_up_system", "quoting_automation", "speed_to_lead"],
  save_time: ["admin_time", "billing_automation", "crm_foundation"],
  scale: ["crm_foundation", "admin_time", "missed_calls"],
};

const RT_PEN: Record<string, number> = { under_5_min: 0, under_1_hr: 5, same_day: 12, next_day_plus: 20, not_sure: 15 };
const FU_PEN: Record<string, number> = { automated: 0, manual: 12, rarely: 20 };

export const LABELS = [
  { min: 75, label: "Running lean", blurb: "You're ahead of most businesses. A few targeted upgrades could still add real revenue." },
  { min: 50, label: "Room to grow", blurb: "Solid foundation, but manual work is costing you leads and hours." },
  { min: 0, label: "Big opportunity", blurb: "There's serious money on the table. The good news: these are fixable." },
];

export type ComputedOpportunity = {
  opportunity_id: string; title: string; problem: string; fix: string; impact_label: string;
  monthly_impact: number; investment_range_low: number; investment_range_high: number;
};
export type Results = {
  score: number; score_label: string; score_blurb: string;
  opportunities: ComputedOpportunity[];
  total_monthly_impact: number; annual_impact: number; min_total: number; max_total: number;
};

const round50 = (n: number) => Math.round(n / 50) * 50;

export function normalize(a: Answers): Required<Answers> {
  return {
    industry: a.industry ?? "", team_size: a.team_size ?? "", years_in_business: a.years_in_business ?? "",
    drains: a.drains ?? [], admin_hours: a.admin_hours ?? 15, lead_sources: a.lead_sources ?? [],
    response_time: a.response_time ?? "not_sure", follow_up: a.follow_up ?? "rarely", missed_calls: a.missed_calls ?? 5,
    monthly_leads: a.monthly_leads ?? 40, avg_customer_value: a.avg_customer_value ?? 1500, close_rate: a.close_rate ?? "0.2",
    current_tools: a.current_tools ?? [], main_goal: a.main_goal ?? "",
  };
}

export function computeResults(input: Answers): Results {
  const a = normalize(input);
  const cr = Number(a.close_rate) || 0.2;
  let score = 100;
  score -= RT_PEN[a.response_time] ?? 15;
  score -= FU_PEN[a.follow_up] ?? 20;
  score -= a.drains.length * 4;
  score -= Math.min(15, Math.max(0, a.missed_calls - 2));
  if (a.current_tools.includes("Nothing formal") || a.current_tools.includes("Pen & paper")) score -= 10;
  if (!a.current_tools.includes("A CRM")) score -= 6;
  score = Math.max(10, Math.min(95, score));
  const lab = LABELS.find((l) => score >= l.min)!;

  const boost = GOAL_BOOST[a.main_goal] ?? [];
  const build = (l: Lib): ComputedOpportunity => ({
    opportunity_id: l.id, title: l.title, problem: l.problem, fix: l.fix, impact_label: l.impact_label,
    monthly_impact: round50(l.impact(a, cr)), investment_range_low: l.investment_range[0], investment_range_high: l.investment_range[1],
  });
  const ranked = OPPORTUNITIES.filter((l) => l.trigger(a))
    .map((l) => ({ o: build(l), rank: l.impact(a, cr) * (boost.includes(l.id) ? 1.25 : 1) }))
    .sort((x, y) => y.rank - x.rank)
    .map((x) => x.o)
    .slice(0, 3);
  for (const id of ["crm_foundation", "admin_time"]) {
    if (ranked.length >= 3) break;
    if (!ranked.some((r) => r.opportunity_id === id)) ranked.push(build(OPPORTUNITIES.find((l) => l.id === id)!));
  }
  const total = ranked.reduce((s, r) => s + r.monthly_impact, 0);
  return {
    score, score_label: lab.label, score_blurb: lab.blurb, opportunities: ranked,
    total_monthly_impact: total, annual_impact: total * 12,
    min_total: ranked.reduce((s, r) => s + r.investment_range_low, 0),
    max_total: ranked.reduce((s, r) => s + r.investment_range_high, 0),
  };
}

export function optionLabel(qid: string, value: string): string {
  for (const s of STEPS) for (const q of s.questions)
    if (q.id === qid && q.type !== "slider") return q.options.find((x) => x.value === value)?.label ?? value;
  return value;
}

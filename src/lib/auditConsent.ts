// Displayed verbatim. Bracketed placeholders are intentional: publishing is blocked
// until approved legal identity and linked documents replace them.
// The server (submit-audit) stores its own copy of this exact text.
export const AUDIT_TERMS_TEXT = "I agree to the [Audit Terms of Service] and [Privacy Policy].";
export const AUDIT_PHONE_TEXT =
  "I agree that [LEGAL NAME] (ClearFund) may contact me at the phone number I provided, including by automated calls, AI voice assistant, prerecorded messages and text messages, about my automation audit, related services, and business funding options. Consent is not a condition of purchase. Message frequency varies. Msg & data rates may apply. Reply STOP to opt out, HELP for help. See our [Privacy Policy].";

export const AUDIT_FIELDS: { key: string; label: string; long?: boolean; hint?: string }[] = [
  { key: "business_model", label: "Business model", long: true, hint: "How you make money (e.g. retail roofing, insurance restoration, commercial)" },
  { key: "industry", label: "Industry", hint: "e.g. roofing, dental, e-commerce, logistics" },
  { key: "tools_software", label: "Tools / software you use", long: true },
  { key: "crm", label: "CRM" },
  { key: "lead_sources", label: "Lead sources", long: true },
  { key: "customer_journey", label: "Customer journey", long: true, hint: "From first contact to final payment" },
  { key: "sales_workflow", label: "Sales workflow", long: true },
  { key: "communication_channels", label: "Communication channels", long: true },
  { key: "repetitive_admin_work", label: "Repetitive / admin work", long: true },
  { key: "bottlenecks", label: "Bottlenecks", long: true },
  { key: "desired_improvements", label: "Desired improvements", long: true },
  { key: "known_costs", label: "Known costs (tools, staff time, etc.)", long: true },
  { key: "growth_capital_constraints", label: "Growth / capital constraints", long: true },
];

export const CLAIM_SHARE_OPTIONS = ["None", "Under 25%", "25–50%", "50–75%", "Over 75%", "Not sure"];
export const CARRIER_DELAY_OPTIONS = ["Under 30 days", "30–60 days", "60–90 days", "Over 90 days", "Varies / not sure"];

// Contractor-only questions are shown only when industry/business model suggests it.
export const isContractorContext = (a: Record<string, string>) =>
  /roof|restor|contractor|insurance claim|storm|remodel/i.test(`${a.industry ?? ""} ${a.business_model ?? ""}`);

// Audit-fit (process readiness only). Never funding, credit, or revenue eligibility.
export const FIT_CRITERIA = [
  "Active operating business, or an operating launch in progress",
  "Owner, founder, or authorized decision-maker participates",
  "Can describe at least one repeatable customer, sales, service, or back-office workflow",
  "Has a real operational bottleneck or measurable improvement goal",
  "Willing to share approximate, non-sensitive info on tools/processes and review a human-prepared Blueprint",
];

export const QUAL_SELECTS: { key: string; label: string; options: string[] }[] = [
  { key: "business_stage", label: "Business stage", options: ["Operating", "Launch in progress", "Idea only / not started", "Not sure"] },
  { key: "role_authority", label: "Your role", options: ["Owner / founder", "Authorized decision-maker", "Employee (not a decision-maker)", "Other"] },
  { key: "team_size", label: "Team size", options: ["Just me", "2–5", "6–20", "21–100", "100+"] },
  { key: "readiness", label: "Willing to share approximate tool/process info and review a human-prepared Blueprint?", options: ["Yes", "Not sure", "No"] },
];
export const WORKFLOW_AREAS = ["Customer intake", "Sales", "Service delivery", "Scheduling", "Billing / collections", "Back office / admin", "Marketing", "Other"];

export type FitResult = { label: "appears to meet audit-fit criteria" | "needs owner review"; missing: string[] };
export function assessFit(a: Record<string, string>): FitResult {
  const missing: string[] = [];
  if (!["Operating", "Launch in progress"].includes(a.business_stage ?? "")) missing.push(FIT_CRITERIA[0]);
  if (!["Owner / founder", "Authorized decision-maker"].includes(a.role_authority ?? "")) missing.push(FIT_CRITERIA[1]);
  if (!(a.workflow_areas ?? "").trim() || (a.sales_workflow ?? a.customer_journey ?? "").trim().length < 10) missing.push(FIT_CRITERIA[2]);
  if (((a.bottlenecks ?? "") + (a.desired_improvements ?? "")).trim().length < 10) missing.push(FIT_CRITERIA[3]);
  if (a.readiness !== "Yes") missing.push(FIT_CRITERIA[4]);
  return { label: missing.length ? "needs owner review" : "appears to meet audit-fit criteria", missing };
}

export const BLUEPRINT_SECTIONS: { key: string; label: string }[] = [
  { key: "current_state", label: "Current state" },
  { key: "manual_processes_leaks", label: "Manual processes & leaks" },
  { key: "gaps", label: "Gaps" },
  { key: "tool_waste", label: "Tool waste" },
  { key: "integration_opportunities", label: "Integration opportunities" },
  { key: "stay_human", label: "What should stay human" },
  { key: "difficulty", label: "Difficulty" },
  { key: "cost_impact", label: "Estimated cost / impact" },
  { key: "risks_dependencies", label: "Risks & dependencies" },
  { key: "plan_30", label: "30-day plan" },
  { key: "plan_60", label: "60-day plan" },
  { key: "plan_90", label: "90-day plan" },
];

export const EVIDENCE_LABELS = ["Fact", "Estimate", "Assumption", "Unknown"] as const;
export type EvidenceLabel = (typeof EVIDENCE_LABELS)[number];
export type BlueprintItem = { label: EvidenceLabel; text: string };
export type BlueprintSections = Record<string, BlueprintItem[]>;

// Displayed verbatim. Bracketed placeholders are intentional: publishing is blocked
// until approved legal identity and linked documents replace them.
// The server (submit-audit) stores its own copy of this exact text.
export const AUDIT_TERMS_TEXT = "I agree to the [Audit Terms of Service] and [Privacy Policy].";
export const AUDIT_PHONE_TEXT =
  "I agree that [LEGAL NAME] (ClearFund) may contact me at the phone number I provided, including by automated calls, AI voice assistant, prerecorded messages and text messages, about my automation audit, related services, and business funding options. Consent is not a condition of purchase. Message frequency varies. Msg & data rates may apply. Reply STOP to opt out, HELP for help. See our [Privacy Policy].";

export const AUDIT_FIELDS: { key: string; label: string; long?: boolean; hint?: string }[] = [
  { key: "business_model", label: "Business model", long: true, hint: "How you make money (e.g. retail roofing, insurance restoration, commercial)" },
  { key: "industry", label: "Industry" },
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

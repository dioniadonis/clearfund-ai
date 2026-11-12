export const RECRUIT_BLOCKED_STATES = ["VA", "CT", "MO", "CA", "VT", "ND"] as const;

export type RecruitAnswers = {
  state: string;
  over_18: "yes" | "no";
  commission_experience: "none" | "under_1" | "1_to_3" | "3_plus";
  current_work: "insurance" | "loan" | "merchant" | "consultant" | "bookkeeper" | "other_b2b" | "retail_b2c" | "none";
  owner_contact: "every_week" | "sometimes" | "rarely_never";
  owner_network: "0_5" | "6_20" | "21_50" | "50_plus";
  hours_per_week: "under_5" | "5_10" | "10_20" | "20_plus";
  commission_only_ok: "yes" | "no";
};

const scores = {
  commission_experience: { none: 0, under_1: 1, "1_to_3": 2, "3_plus": 3 },
  current_work: { insurance: 3, loan: 3, merchant: 3, consultant: 3, bookkeeper: 3, other_b2b: 2, retail_b2c: 1, none: 0 },
  owner_contact: { every_week: 3, sometimes: 1, rarely_never: 0 },
  owner_network: { "0_5": 0, "6_20": 1, "21_50": 2, "50_plus": 3 },
  hours_per_week: { under_5: 0, "5_10": 1, "10_20": 2, "20_plus": 2 },
} as const;

export function evaluateRecruit(a: RecruitAnswers) {
  const score = scores.commission_experience[a.commission_experience]
    + scores.current_work[a.current_work]
    + scores.owner_contact[a.owner_contact]
    + scores.owner_network[a.owner_network]
    + scores.hours_per_week[a.hours_per_week];

  const hardStop = (RECRUIT_BLOCKED_STATES as readonly string[]).includes(a.state)
    ? `State not served: ${a.state}`
    : a.over_18 === "no"
      ? "Applicant is under 18"
      : a.commission_only_ok === "no"
        ? "Commission-only terms not accepted"
        : null;

  return { score, hard_stop_reason: hardStop, status: hardStop ? "not_now" as const : "new" as const };
}

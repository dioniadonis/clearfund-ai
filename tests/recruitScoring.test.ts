import { describe, expect, it } from "bun:test";
import { evaluateRecruit, type RecruitAnswers } from "../supabase/functions/_shared/recruitScoring";

const base: RecruitAnswers = {
  state: "FL", over_18: "yes", commission_experience: "3_plus", current_work: "insurance",
  owner_contact: "every_week", owner_network: "50_plus", hours_per_week: "20_plus", commission_only_ok: "yes",
};

describe("recruit evaluation", () => {
  it("scores the strongest answers as 14", () => expect(evaluateRecruit(base).score).toBe(14));
  it("scores commission experience 0/1/2/3", () => expect((["none", "under_1", "1_to_3", "3_plus"] as const).map((v) => evaluateRecruit({ ...base, commission_experience: v }).score)).toEqual([11, 12, 13, 14]));
  it("scores work backgrounds 3/2/1/0", () => expect((["bookkeeper", "other_b2b", "retail_b2c", "none"] as const).map((v) => evaluateRecruit({ ...base, current_work: v }).score)).toEqual([14, 13, 12, 11]));
  it("scores owner contact 3/1/0", () => expect((["every_week", "sometimes", "rarely_never"] as const).map((v) => evaluateRecruit({ ...base, owner_contact: v }).score)).toEqual([14, 12, 11]));
  it("scores owner network 0/1/2/3", () => expect((["0_5", "6_20", "21_50", "50_plus"] as const).map((v) => evaluateRecruit({ ...base, owner_network: v }).score)).toEqual([11, 12, 13, 14]));
  it("scores hours 0/1/2/2", () => expect((["under_5", "5_10", "10_20", "20_plus"] as const).map((v) => evaluateRecruit({ ...base, hours_per_week: v }).score)).toEqual([12, 13, 14, 14]));
  it.each(["VA", "CT", "MO", "CA", "VT", "ND"])("hard-stops %s", (state) => expect(evaluateRecruit({ ...base, state })).toMatchObject({ hard_stop_reason: `State not served: ${state}`, status: "not_now" }));
  it("hard-stops applicants under 18", () => expect(evaluateRecruit({ ...base, over_18: "no" })).toMatchObject({ hard_stop_reason: "Applicant is under 18", status: "not_now" }));
  it("hard-stops rejection of commission-only terms", () => expect(evaluateRecruit({ ...base, commission_only_ok: "no" })).toMatchObject({ hard_stop_reason: "Commission-only terms not accepted", status: "not_now" }));
});

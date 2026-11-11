import { describe, it, expect } from "vitest";
import { computeCashGap } from "./cashGap";

describe("computeCashGap", () => {
  it("matches the spec check value of $75,109", () => {
    const r = computeCashGap({ contractAmount: 180000, contractMonths: 6, startDate: "2026-01-01", firstPaymentDate: "2026-03-17", upFrontPercent: 15, marginPercent: 20, cashOnHand: 0 });
    expect(r.days).toBe(75);
    expect(Math.round(r.cashGap)).toBe(75109);
  });
  it("never goes below zero", () => {
    const r = computeCashGap({ contractAmount: 1000, contractMonths: 1, startDate: "2026-01-01", firstPaymentDate: "2026-01-02", upFrontPercent: 10, marginPercent: 20, cashOnHand: 999999 });
    expect(r.cashGap).toBe(0);
  });
});

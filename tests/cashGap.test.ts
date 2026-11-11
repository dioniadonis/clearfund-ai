import { describe, expect, it } from "bun:test";
import { computeCashGap } from "../src/lib/cashGap";

const base = { contractAmount: 180000, contractMonths: 6, startDate: "2026-12-01", firstPaymentDate: "2027-02-14", upFrontPercent: 15, marginPercent: 20, cashOnHand: 0 };
const r = (o: Partial<typeof base>) => Math.round(computeCashGap({ ...base, ...o }).cashGap);

describe("computeCashGap", () => {
  it("default case is $75,109", () => expect(r({})).toBe(75109));
  it("2-month job with 120 days is capped at job cost $144,000", () =>
    expect(r({ contractMonths: 2, firstPaymentDate: "2027-03-31" })).toBe(144000));
  it("90% up front is capped at $144,000", () => expect(r({ upFrontPercent: 90, firstPaymentDate: "2027-12-01" })).toBe(144000));
  it("cash on hand covering everything gives $0", () => expect(r({ cashOnHand: 500000 })).toBe(0));
  it("first payment before start gives up-front only, $27,000", () => {
    expect(r({ firstPaymentDate: "2026-11-01" })).toBe(27000);
    expect(computeCashGap({ ...base, firstPaymentDate: "2026-11-01" }).datesInverted).toBe(true);
  });
});

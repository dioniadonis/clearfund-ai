import { describe, expect, it } from "bun:test";
import { checkoutCharge, decidePurchase, parseDollarOnly, planForCount, validDateOfLoss } from "../supabase/functions/_shared/claimList";

const now = new Date("2026-11-20T12:00:00Z");
const paid = (o: Partial<{ plan: "small" | "standard" | "major"; dateOfLoss: string; paidAt: Date }> = {}) =>
  ({ plan: "small" as const, itemLimit: 40, dateOfLoss: "2026-11-01", paidAt: new Date("2026-11-02T00:00:00Z"), ...o });

describe("claim list plans", () => {
  it("prices by line count", () => {
    expect([1, 40, 41, 150, 151].map(planForCount)).toEqual(["small", "small", "standard", "standard", "major"]);
  });
  it("same claim within 12 months is free", () => {
    expect(decidePurchase(paid(), { dateOfLoss: "2026-11-01", lines: 30 }, now).kind).toBe("free");
  });
  it("a different date of loss needs a new purchase", () => {
    expect(decidePurchase(paid(), { dateOfLoss: "2026-10-01", lines: 30 }, now)).toEqual({ kind: "new_purchase", reason: "date_changed" });
  });
  it("after 12 months the same claim needs the extension", () => {
    expect(decidePurchase(paid({ paidAt: new Date("2025-11-01T00:00:00Z") }), { dateOfLoss: "2026-11-01", lines: 30 }, now)).toEqual({ kind: "new_purchase", reason: "expired" });
    expect(checkoutCharge("extend", 30, paid(), "2026-11-01")).toEqual({ plan: "small", amount: 29, windowStart: "now" });
  });
  it("a bigger list pays only the difference", () => {
    expect(decidePurchase(paid(), { dateOfLoss: "2026-11-01", lines: 60 }, now)).toEqual({ kind: "upgrade", from: "small", to: "standard", difference: 100 });
    expect(checkoutCharge("upgrade", 60, paid(), "2026-11-01")).toEqual({ plan: "standard", amount: 100, windowStart: "keep" });
  });
  it("refuses an upgrade or extension for another date of loss", () => {
    expect(checkoutCharge("upgrade", 60, paid(), "2026-10-01")).toBeNull();
    expect(checkoutCharge("extend", 30, null, "2026-11-01")).toBeNull();
  });
  it("an unknown purchase ID opens as unpaid", () => {
    expect(decidePurchase(null, { dateOfLoss: "2026-11-01", lines: 5 }, now).kind).toBe("unpaid");
  });
  it("reads a typed dollar amount", () => {
    expect([parseDollarOnly("450"), parseDollarOnly("$2,000"), parseDollarOnly("about 450")]).toEqual([450, 2000, null]);
  });
  it("checks the date of loss", () => {
    expect([validDateOfLoss("2026-11-01", now), validDateOfLoss("2026-02-30", now), validDateOfLoss("2027-01-01", now)]).toEqual([true, false, false]);
  });
});

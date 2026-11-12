import { describe, it, expect } from "vitest";
import { countEvents, weekStart, CRM_STAGES } from "./crm";

const ev = (event: string, occurred_at: string, extra: Record<string, unknown> = {}) =>
  ({ event, occurred_at, lead_id: "L1", campaign: "c1", step: "1", recipient_email: null, ...extra }) as never;

describe("email activity counts", () => {
  it("counts an email opened 3 times as one open", () => {
    const since = new Date("2026-11-10T00:00:00");
    const c = countEvents([ev("opened", "2026-11-11T10:00:00"), ev("opened", "2026-11-11T11:00:00"), ev("opened", "2026-11-11T12:00:00")], since);
    expect(c.opened).toBe(1);
  });
  it("ignores events before the window", () => {
    const c = countEvents([ev("replied", "2026-11-01T10:00:00"), ev("replied", "2026-11-11T10:00:00")], new Date("2026-11-10T00:00:00"));
    expect(c.replied).toBe(1);
  });
  it("week starts on Monday", () => {
    expect(weekStart(new Date("2026-11-12T15:00:00")).getDay()).toBe(1);
    expect(weekStart(new Date("2026-11-15T15:00:00")).getDate()).toBe(9); // Sunday 15th -> Monday 9th
  });
  it("Replied sits right after Contacted", () => {
    expect(CRM_STAGES.indexOf("Replied")).toBe(CRM_STAGES.indexOf("Contacted") + 1);
  });
});

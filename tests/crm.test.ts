import { describe, expect, it } from "bun:test";
import { buildImportRows, normCompany, normDomain } from "../src/lib/crm";
import { parseAmount } from "../src/lib/amount";

describe("CSV import in-file duplicates", () => {
  it("drops a repeated lead id", () => {
    expect(buildImportRows([{ I: "L1" }, { I: "L1" }], { lead_ref: "I" }).rows.length).toBe(1);
  });
  it("drops a repeated email (case-insensitive)", () => {
    expect(buildImportRows([{ E: "c@x.com" }, { E: "C@x.com" }], { email: "E" }).rows.length).toBe(1);
  });
  it("drops the same website domain", () => {
    expect(buildImportRows([{ W: "https://www.acme.com/a" }, { W: "acme.com" }], { website: "W" }).rows.length).toBe(1);
  });
  it("drops same company + state but keeps same company in another state", () => {
    const r = buildImportRows(
      [{ F: "Acme Paving LLC", S: "GA" }, { F: "ACME Paving, Inc.", S: "ga" }, { F: "Acme Paving", S: "FL" }],
      { firm: "F", state: "S" });
    expect(r.rows.length).toBe(2);
    expect(r.skipped).toBe(1);
  });
});

describe("normalizers match the database", () => {
  it("domain", () => expect(normDomain("HTTPS://www.Acme.com:443/x?y")).toBe("acme.com"));
  it("company", () => expect(normCompany("Acme Paving, LLC")).toBe("acme paving"));
});

describe("amount param", () => {
  it("parses $250,000 and 250k", () => {
    expect(parseAmount("$250,000")).toBe(250000);
    expect(parseAmount("250k")).toBe(250000);
    expect(parseAmount("<b>1</b>")).toBe(null);
  });
});

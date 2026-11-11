import { describe, expect, it } from "bun:test";
import { buildImportRows } from "./crm";
import { parseAmount } from "./amount";

describe("CSV import duplicate skipping", () => {
  it("skips rows matching an existing email (case-insensitive)", () => {
    const r = buildImportRows([{ E: "A@x.com", F: "New Co" }], { email: "E", firm: "F" }, [{ email: "a@x.com", firm: null }]);
    expect(r.rows.length).toBe(0);
    expect(r.skipped).toBe(1);
  });
  it("skips rows matching an existing firm name", () => {
    const r = buildImportRows([{ E: "b@x.com", F: " acme llc " }], { email: "E", firm: "F" }, [{ email: null, firm: "Acme LLC" }]);
    expect(r.skipped).toBe(1);
  });
  it("skips duplicates within the same file", () => {
    const r = buildImportRows([{ E: "c@x.com" }, { E: "C@x.com" }], { email: "E" }, []);
    expect(r.rows.length).toBe(1);
  });
});

describe("amount param", () => {
  it("parses $250,000 and 250k", () => {
    expect(parseAmount("$250,000")).toBe(250000);
    expect(parseAmount("250k")).toBe(250000);
    expect(parseAmount("<b>1</b>")).toBe(null);
  });
});

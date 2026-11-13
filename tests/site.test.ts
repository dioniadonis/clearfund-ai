import { describe, expect, it } from "bun:test";
import { backofficeRedirect, siteForHostname } from "../src/lib/site";

describe("hostname site selection", () => {
  it("uses AI only for the two ClearFund AI hostnames", () => {
    expect(siteForHostname("clearfundai.com")).toBe("ai");
    expect(siteForHostname("WWW.CLEARFUNDAI.COM")).toBe("ai");
  });
  it("uses general for MyClearFund and every other hostname", () => {
    expect(siteForHostname("myclearfund.com")).toBe("general");
    expect(siteForHostname("www.myclearfund.com")).toBe("general");
    expect(siteForHostname("localhost")).toBe("general");
  });
});

describe("general-host backoffice redirect", () => {
  it("preserves the CRM path, query and hash", () => {
    expect(backofficeRedirect("myclearfund.com", "/crm", "?tab=leads", "#top")).toBe("https://clearfundai.com/crm?tab=leads#top");
  });
  it("redirects every operator child path on the www general host", () => {
    expect(backofficeRedirect("www.myclearfund.com", "/operator/leads")).toBe("https://clearfundai.com/operator/leads");
  });
  it("does not redirect public routes or the AI host", () => {
    expect(backofficeRedirect("myclearfund.com", "/careers")).toBeNull();
    expect(backofficeRedirect("clearfundai.com", "/crm")).toBeNull();
    expect(backofficeRedirect("localhost", "/operator")).toBeNull();
  });
});

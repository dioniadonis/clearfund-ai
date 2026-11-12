import { describe, expect, it } from "bun:test";
import { route, type Answers, type Product } from "../supabase/functions/_shared/fundingRoute";

const P = (o: Partial<Product>): Product => ({ id: o.product!, funder: "David Allen Capital", product: "x", product_kind: "other", min_months: null,
  min_monthly_revenue: null, max_monthly_revenue: null, min_annual_sales: null, min_credit_score: null, excluded_states: [],
  needs_business_checking: false, amount_min: null, amount_max: null, commission_rank: null, active: true, apply_method: "dac_link", apply_url: null, ...o });
const products = [
  P({ product: "Giggle", product_kind: "mca", max_monthly_revenue: 15000, excluded_states: ["NY", "CA", "OR"], amount_min: 400, amount_max: 10000 }),
  P({ product: "Bank Breezy", product_kind: "mca", min_months: 4, min_monthly_revenue: 15000, min_credit_score: 500, needs_business_checking: true }),
  P({ product: "CoreRate", product_kind: "loan", min_months: 24, min_monthly_revenue: 15000, min_credit_score: 680, amount_min: 50000, amount_max: 250000 }),
  P({ product: "LOC", product_kind: "loc", min_months: 24, min_annual_sales: 250000, min_credit_score: 675, amount_min: 6000, amount_max: 100000 }),
];
const A = (o: Partial<Answers>): Answers => ({ months: "24plus", revenue: "50kplus", credit: "680plus", state: "FL", amount: "50to100k", use_of_funds: "x", business_checking: true, ...o });

describe("funding routing", () => {
  it("never routes blocked states (VA)", () => expect(route(A({ state: "VA" }), products).next).toBe("state_blocked"));
  it("TX excludes MCA products", () => {
    const r = route(A({ state: "TX", revenue: "15to50k", months: "4to11", credit: "500to599", amount: "10to50k" }), products);
    expect(r.next).toBe("review");
  });
  it("NC excludes loan products", () => {
    const r = route(A({ state: "NC" }), products);
    expect(["CoreRate", "LOC"]).not.toContain(r.product?.product);
  });
  it("low revenue goes to Giggle, $15k+ with checking goes to Bank Breezy", () => {
    expect(route(A({ revenue: "5to15k", months: "lt4", credit: "lt500", amount: "lt10k", business_checking: false }), products).product?.product).toBe("Giggle");
    expect(route(A({ revenue: "15to50k", months: "4to11", credit: "500to599", amount: "10to50k" }), products).product?.product).toBe("Bank Breezy");
  });
  it("CoreRate needs 680 credit", () => {
    const e = (c: Answers["credit"]) => route(A({ credit: c, amount: "100to250k" }), products).evaluations.find((x) => x.label.endsWith("CoreRate"))!.eligible;
    expect(e("680plus")).toBe(true); expect(e("675to679")).toBe(false);
  });
  it("no match goes to review", () => expect(route(A({ months: "lt4", revenue: "lt5k", amount: "250kplus" }), products).next).toBe("review"));
});

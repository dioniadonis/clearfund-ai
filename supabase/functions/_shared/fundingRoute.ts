// Single place where qualifier answers are matched to funder products. Pure TS: used by the
// submit-qualifier function and by tests. Numbers come only from the owner-entered product rows.

export const BLOCKED_STATES = ["VA", "CT", "MO", "CA", "VT", "ND"];
// State-by-kind blocks: TX no MCA; NC no loans (lines of credit treated as loans to be safe).
export const STATE_KIND_BLOCKS: Record<string, string[]> = { TX: ["mca"], NC: ["loan", "loc"] };

export const MONTHS = { "lt4": 0, "4to11": 4, "12to23": 12, "24plus": 24 } as const;
export const REVENUE = { "lt5k": [0, 5000], "5to15k": [5000, 15000], "15to50k": [15000, 50000], "50kplus": [50000, null] } as const;
export const CREDIT = { "lt500": 0, "500to599": 500, "600to674": 600, "675to679": 675, "680plus": 680 } as const;
export const AMOUNT = { "lt10k": [400, 10000], "10to50k": [10000, 50000], "50to100k": [50000, 100000], "100to250k": [100000, 250000], "250kplus": [250000, null] } as const;

export type Answers = {
  months: keyof typeof MONTHS; revenue: keyof typeof REVENUE; credit: keyof typeof CREDIT;
  state: string; amount: keyof typeof AMOUNT; use_of_funds: string; business_checking: boolean;
};
export type Product = {
  id: string; funder: string; product: string; product_kind: string; min_months: number | null;
  min_monthly_revenue: number | null; max_monthly_revenue: number | null; min_annual_sales: number | null;
  min_credit_score: number | null; excluded_states: string[]; needs_business_checking: boolean;
  amount_min: number | null; amount_max: number | null; commission_rank: number | null; active: boolean;
  apply_method: "dac_link" | "our_form"; apply_url: string | null;
};
export type Evaluation = { product_id: string; label: string; eligible: boolean; reasons: string[]; fails: string[]; fit: number };
export type RouteResult = { next: "dac_link" | "our_form" | "review" | "state_blocked"; product: Product | null; evaluations: Evaluation[] };

const money = (n: number) => "$" + n.toLocaleString("en-US");

export function evaluate(a: Answers, p: Product): Evaluation {
  const reasons: string[] = []; const fails: string[] = [];
  const months = MONTHS[a.months]; const [revLo, revHi] = REVENUE[a.revenue]; const credit = CREDIT[a.credit];
  const [amtLo, amtHi] = AMOUNT[a.amount]; const st = a.state.toUpperCase();
  const check = (ok: boolean, yes: string, no: string) => (ok ? reasons : fails).push(ok ? yes : no);
  if (p.excluded_states.map((s) => s.toUpperCase()).includes(st)) fails.push(`Not offered in ${st}`);
  if ((STATE_KIND_BLOCKS[st] ?? []).includes(p.product_kind)) fails.push(`${p.product_kind.toUpperCase()} products not allowed in ${st}`);
  if (p.min_months != null) check(months >= p.min_months, `Time in business meets ${p.min_months}+ months`, `Needs ${p.min_months}+ months in business`);
  if (p.min_monthly_revenue != null) check(revLo >= p.min_monthly_revenue, `Revenue meets ${money(p.min_monthly_revenue)}/mo minimum`, `Needs ${money(p.min_monthly_revenue)}+/mo revenue`);
  if (p.max_monthly_revenue != null) check(revLo < p.max_monthly_revenue, `Revenue under ${money(p.max_monthly_revenue)}/mo`, `Revenue above ${money(p.max_monthly_revenue)}/mo cap`);
  if (p.min_annual_sales != null) check(revLo * 12 >= p.min_annual_sales, `Annual sales meet ${money(p.min_annual_sales)}`, `Needs ${money(p.min_annual_sales)}+ annual sales`);
  if (p.min_credit_score != null) check(credit >= p.min_credit_score, `Credit meets ${p.min_credit_score}+`, `Needs credit ${p.min_credit_score}+`);
  if (p.needs_business_checking) check(a.business_checking, "Has business checking", "Needs business checking account");
  let fit = reasons.length;
  if (p.amount_min != null || p.amount_max != null) {
    const okLo = p.amount_max == null || amtLo <= p.amount_max; const okHi = p.amount_min == null || amtHi == null || amtHi >= p.amount_min;
    check(okLo && okHi, "Requested amount fits product range", "Requested amount outside product range");
    const inside = (p.amount_min == null || amtLo >= p.amount_min) && (p.amount_max == null || (amtHi != null && amtHi <= p.amount_max));
    if (okLo && okHi && inside) fit += 1;
  }
  return { product_id: p.id, label: `${p.funder} · ${p.product}`, eligible: fails.length === 0, reasons, fails, fit };
}

export function route(a: Answers, products: Product[]): RouteResult {
  const st = a.state.toUpperCase();
  const active = products.filter((p) => p.active);
  if (BLOCKED_STATES.includes(st)) return { next: "state_blocked", product: null, evaluations: [] };
  const evals = active.map((p) => ({ p, e: evaluate(a, p) }));
  const ranked = evals.filter((x) => x.e.eligible).sort((x, y) =>
    y.e.fit - x.e.fit || (x.p.commission_rank ?? 9999) - (y.p.commission_rank ?? 9999));
  const top = ranked[0]?.p ?? null;
  return { next: top ? top.apply_method : "review", product: top, evaluations: evals.map((x) => x.e) };
}

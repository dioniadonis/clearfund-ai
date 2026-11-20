// Claim List store pricing: finds one exact product page at a major US store for each line and reads the price
// from the page itself (search snippets are often wrong). A line keeps its estimate when no page fits.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// Domain -> store name. Product-page URL patterns keep category and search pages out.
const STORES: [RegExp, string, RegExp][] = [
  [/(^|\.)walmart\.com$/, "Walmart", /\/ip\//],
  [/(^|\.)target\.com$/, "Target", /\/p\/.*A-\d+/],
  [/(^|\.)homedepot\.com$/, "Home Depot", /\/p\/.+\/\d{6,}/],
  [/(^|\.)lowes\.com$/, "Lowe's", /\/pd\//],
  [/(^|\.)bestbuy\.com$/, "Best Buy", /(\/site\/.+\.p)|(\/product\/)/],
  [/(^|\.)wayfair\.com$/, "Wayfair", /\/pdp\//],
  [/(^|\.)ikea\.com$/, "IKEA", /\/p\//],
  [/(^|\.)staples\.com$/, "Staples", /\/product_/],
  [/(^|\.)costco\.com$/, "Costco", /\.product\.\d+\.html/],
  [/(^|\.)kohls\.com$/, "Kohl's", /\/product\/prd-/],
  [/(^|\.)macys\.com$/, "Macy's", /\/shop\/product\//],
  [/(^|\.)ashleyfurniture\.com$/, "Ashley", /\/p\//],
  [/(^|\.)crateandbarrel\.com$/, "Crate & Barrel", /\/s\d+/],
  [/(^|\.)potterybarn\.com$/, "Pottery Barn", /\/products\//],
  [/(^|\.)houzz\.com$/, "Houzz", /\/products\//],
  [/(^|\.)mybobs\.com$/, "Bob's Discount Furniture", /\/p\//],
  [/(^|\.)apple\.com$/, "Apple", /\/shop\/buy-/],
  [/(^|\.)dickssportinggoods\.com$/, "Dick's Sporting Goods", /\/p\//],
];
function storeFor(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return null;
    const hit = STORES.find(([d, , p]) => d.test(u.hostname) && p.test(u.pathname));
    return hit ? hit[1] : null;
  } catch { return null; }
}

async function fc(path: string, body: unknown, ms: number) {
  const key = Deno.env.get("FIRECRAWL_API_KEY");
  if (!key) throw new Error("no_firecrawl");
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch("https://api.firecrawl.dev/v2/" + path, {
      method: "POST", signal: ctrl.signal,
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("fc_" + res.status);
    return await res.json();
  } finally { clearTimeout(t); }
}

const PAGE_SCHEMA = {
  type: "object",
  properties: {
    product_name: { type: "string" },
    price: { type: "number", description: "Current selling price in US dollars for one unit, as shown on the page. 0 if no price is shown." },
    is_single_product_page: { type: "boolean", description: "True only if this page sells one specific product (not a list, search or category page)." },
  },
  required: ["product_name", "price", "is_single_product_page"],
};

type Ask = { id: string; item: string; brand: string; price: number };
async function priceOne(a: Ask): Promise<{ id: string; store?: string; url?: string; price?: number }> {
  const q = `${a.brand} ${a.item}`.replace(/\s+/g, " ").trim() + " buy";
  const found = await fc("search", { query: q, limit: 10, country: "US" }, 20_000);
  const web: any[] = found?.data?.web ?? found?.data ?? [];
  const pages = web.map((r) => ({ url: String(r?.url ?? ""), store: storeFor(String(r?.url ?? "")) })).filter((r) => r.store).slice(0, 2);
  for (const p of pages) {
    try {
      const page = await fc("scrape", { url: p.url, formats: [{ type: "json", schema: PAGE_SCHEMA }], onlyMainContent: true, timeout: 25_000 }, 30_000);
      const j = page?.data?.json;
      const price = Math.round(Number(j?.price) * 100) / 100;
      // Keep the listing only when it is one product and its price is in the same range as the estimate.
      if (!j?.is_single_product_page || !(price > 0)) continue;
      if (a.price > 0 && (price > a.price * 3 || price < a.price / 3)) continue;
      return { id: a.id, store: p.store!, url: p.url, price };
    } catch { /* try the next page */ }
  }
  return { id: a.id };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  let b: any;
  try { b = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const asks: Ask[] = (Array.isArray(b.lines) ? b.lines : []).slice(0, 6).map((l: any) => ({
    id: String(l?.id ?? "").slice(0, 40), item: String(l?.item ?? "").slice(0, 160), brand: String(l?.brand ?? "").slice(0, 100), price: Number(l?.price) || 0,
  })).filter((a: Ask) => a.id && a.item);
  if (!asks.length) return json({ results: [] });
  if (!Deno.env.get("FIRECRAWL_API_KEY")) return json({ results: asks.map((a) => ({ id: a.id })), off: true });
  const results = await Promise.all(asks.map((a) => priceOne(a).catch(() => ({ id: a.id }))));
  return json({ results });
});

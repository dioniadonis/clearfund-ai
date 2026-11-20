// Single source for Claim List rules shared by the site, edge functions and tests.
export type Basis = "confirmed" | "estimated" | "own";
export interface Line {
  room: string; item: string; brand: string; qty: number; age: string; price: number;
  basis: Basis; note: string; store?: string; url?: string; listing?: "found" | "none" | "pending";
  helperChanged?: boolean;
}
export interface LeftOff { item: string; reason: string }
export interface ClaimState { items: Line[]; left: LeftOff[]; loss: string; dateOfLoss?: string; purchaseId?: string }

export const RULES = `You build a home contents list for an insurance claim. Follow these rules exactly.
- List personal belongings only. Things attached to the building (ceiling fans, shutters, built-in fireplaces, stair lifts, cabinets fixed to walls, flooring) go in "left_off" with a short reason, and are not priced.
- Every item is priced for REPLACEMENT, new, in US dollars, for one unit ("price"). Never repair.
- Price like kind and quality. When brand, material or size is unknown, choose a middle-of-the-road version. Never the most expensive version.
- What the owner says always beats what you see.
- "basis" is "confirmed" when the owner's own words gave a detail for that item (brand, size, material, age), "own" when the owner stated a dollar value (then "price" is exactly their value), otherwise "estimated".
- "item" is a short plain description with size and material when known, WITHOUT the brand. "brand" is the brand and model if known, otherwise "". "room" is the room the item is in, like "Living room" or "Kitchen"; use the owner's words if given, otherwise judge from the photo. "age" is the owner's words like "About 10 years" or "" if unknown. "qty" is a whole number; estimate counts for groups like books.
- "note" is "" unless a fact about the item is unverified or affects how it is valued: quantity estimated, material or construction not confirmed, possible original art or antique, live plant, medical equipment, custom-built piece, owner-stated value with no document. Write it as a neutral statement of fact in 14 words or fewer, readable by both the owner and the insurer. Never address anyone ("you", "your"), never give advice or instructions, never predict what the insurer will do.
- Items that cannot be identified exactly (generic decor, books, small household goods) are still priced: use a typical mid-range ready-made item of the same kind, and say so in "note".
- Never invent a store name or a web link.`;

export const LINE_SHAPE = `{"room":"","item":"","brand":"","qty":1,"age":"","price":0,"basis":"estimated","note":""}`;
export const SHAPE = `{"items":[${LINE_SHAPE}],"left_off":[{"item":"","reason":""}]}`;

export const LOSS_TYPES = ["Water", "Fire", "Theft", "Storm"] as const;

export type PlanId = "small" | "standard" | "major";
export const PLANS: Record<PlanId, { name: string; price: number; itemLimit: number }> = {
  small: { name: "Small claim", price: 49, itemLimit: 40 },
  standard: { name: "Standard claim", price: 149, itemLimit: 150 },
  major: { name: "Major loss", price: 299, itemLimit: Number.MAX_SAFE_INTEGER },
};
export function planForCount(lines: number): PlanId {
  if (lines <= 40) return "small";
  if (lines <= 150) return "standard";
  return "major";
}

export const FILE_LABEL: Record<Basis, string> = { confirmed: "Manual adjustment", estimated: "Estimated by photo", own: "Manual adjustment" };
export const linked = (r: Pick<Line, "store" | "url">) => !!(r.store && r.url && r.url.startsWith("https://"));

/** Typing only a dollar amount sets the price directly. Returns the number or null. */
export function parseDollarOnly(text: string): number | null {
  const m = text.trim().match(/^\$?\s*(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?\s*$/);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, "") + (m[2] ? "." + m[2] : ""));
  return Number.isFinite(n) && n > 0 && n < 10_000_000 ? n : null;
}

/** A customer edit or own price clears the store listing. */
export function applyOwnPrice(line: Line, price: number): Line {
  return { ...line, price, basis: "own", store: "", url: "", listing: "none",
    note: line.note || "Price entered manually. No supporting document attached." };
}
export function clearListing(line: Line): Line { return { ...line, store: "", url: "", listing: "none" }; }

export const lineTotal = (l: Pick<Line, "qty" | "price">) => Math.round(l.qty * l.price * 100) / 100;
export const grandTotal = (items: Line[]) => Math.round(items.reduce((t, r) => t + r.qty * r.price, 0) * 100) / 100;

export type PurchaseDecision =
  | { kind: "free"; plan: PlanId }
  | { kind: "new_purchase"; reason: "date_changed" | "expired" }
  | { kind: "upgrade"; from: PlanId; to: PlanId; difference: number }
  | { kind: "unpaid" };

/** Rules for reopening a saved file whose purchase ID was looked up in Stripe. */
export function decidePurchase(
  found: { plan: PlanId; itemLimit: number; dateOfLoss: string; paidAt: Date } | null,
  file: { dateOfLoss: string; lines: number },
  now: Date,
): PurchaseDecision {
  if (!found) return { kind: "unpaid" };
  if (found.dateOfLoss !== file.dateOfLoss) return { kind: "new_purchase", reason: "date_changed" };
  const end = new Date(found.paidAt); end.setFullYear(end.getFullYear() + 1);
  if (now > end) return { kind: "new_purchase", reason: "expired" };
  if (file.lines > found.itemLimit) {
    const to = planForCount(file.lines);
    return { kind: "upgrade", from: found.plan, to, difference: PLANS[to].price - PLANS[found.plan].price };
  }
  return { kind: "free", plan: found.plan };
}

/** Coerce model JSON into safe lines. */
export function cleanLine(x: any): Line | null {
  if (!x || typeof x !== "object") return null;
  const s = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
  const item = s(x.item, 200); if (!item) return null;
  const basis: Basis = x.basis === "confirmed" || x.basis === "own" ? x.basis : "estimated";
  const price = Number(x.price), qty = Math.round(Number(x.qty));
  return { room: s(x.room, 60) || "Other", item, brand: s(x.brand, 120), qty: qty > 0 && qty < 10000 ? qty : 1,
    age: s(x.age, 60), price: price > 0 && price < 10_000_000 ? Math.round(price * 100) / 100 : 0, basis, note: s(x.note, 160) };
}

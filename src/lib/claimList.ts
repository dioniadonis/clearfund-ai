// Claim List rules come from the one shared source; this file adds browser-only helpers.
import { deflate, inflate } from "pako";
import { supabase } from "@/integrations/supabase/client";
import type { Line, LeftOff } from "../../supabase/functions/_shared/claimList";

export * from "../../supabase/functions/_shared/claimList";
export { readXlsx } from "../../supabase/functions/_shared/claimListFiles";

export type ListLine = Line & { id: string };
export interface SavedList { items: ListLine[]; left: LeftOff[]; loss: string; dateOfLoss: string; purchaseId: string; sample?: boolean }

export const STORE_KEY = "clearfund-claim-list-v5";
export const newId = () => Math.random().toString(36).slice(2, 12);
export const usd = (n: number) => "$" + (Math.round(n * 100) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Calls a Claim List function and returns its JSON, including error bodies. */
export async function call<T = any>(fn: "claim-list-ai" | "claim-list-price" | "claim-list-pay", body: unknown): Promise<T & { error?: string }> {
  const { data, error } = await supabase.functions.invoke(fn, { body });
  if (error) {
    const ctx = (error as any).context;
    try { if (ctx && typeof ctx.json === "function") return await ctx.json(); } catch { /* fall through */ }
    return { error: "network" } as T & { error?: string };
  }
  return data as T & { error?: string };
}

/** Shrinks a photo to a JPEG data URL so a group of photos fits in one request. */
export async function shrinkPhoto(file: File, max = 1400): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = url; });
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.72);
  } finally { URL.revokeObjectURL(url); }
}

// Helper link: the whole list rides inside the link after "#", which browsers never send to a server.
const toB64Url = (u: Uint8Array) => { let s = ""; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
const fromB64Url = (s: string) => { const b = atob(s.replace(/-/g, "+").replace(/_/g, "/")); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };

export function packList(l: SavedList): string {
  const slim = { v: 1, loss: l.loss, d: l.dateOfLoss, p: l.purchaseId, left: l.left,
    i: l.items.map((r) => [r.room, r.item, r.brand, r.qty, r.age, r.price, r.basis, r.note, r.store || "", r.url || ""]) };
  return toB64Url(deflate(new TextEncoder().encode(JSON.stringify(slim))));
}
export function unpackList(s: string): SavedList | null {
  try {
    const x = JSON.parse(new TextDecoder().decode(inflate(fromB64Url(s))));
    if (x?.v !== 1 || !Array.isArray(x.i)) return null;
    const items: ListLine[] = x.i.map((a: any[]) => ({ id: newId(), room: String(a[0] ?? ""), item: String(a[1] ?? ""), brand: String(a[2] ?? ""), qty: Number(a[3]) || 1, age: String(a[4] ?? ""),
      price: Number(a[5]) || 0, basis: a[6] === "confirmed" || a[6] === "own" ? a[6] : "estimated", note: String(a[7] ?? ""), store: String(a[8] ?? ""), url: String(a[9] ?? ""), listing: a[9] ? "found" : "none" }));
    return { items, left: Array.isArray(x.left) ? x.left : [], loss: String(x.loss ?? ""), dateOfLoss: String(x.d ?? ""), purchaseId: String(x.p ?? "") };
  } catch { return null; }
}

export function saveFile(name: string, b64: string, type: string): string {
  const bin = atob(b64); const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return URL.createObjectURL(new Blob([u], { type }));
}

let sessionId = "";
export function track(event: "view_landing" | "view_app" | "order_click", plan?: string) {
  if (!sessionId) sessionId = newId() + newId();
  void call("claim-list-pay", { action: "event", event, plan, session: sessionId }).catch(() => {});
}

export const SAMPLE: [string, number, string, number, Line["basis"], string, string, string][] = [["Hisense|TV, 65 inch 4K",1,"",499.99,"confirmed","","Best Buy","https://www.bestbuy.com/product/hisense-65-class-qd6-series-hi-qled-4k-uhd-hdr-smart-fire-tv-2025/J3Z9Z42SQ6"],["TV console, dark wood, about 70 inch",1,"About 10 years",299.99,"estimated","","Bob's Discount Furniture","https://www.mybobs.com/furniture/living-room/tv-stands-media-centers/p/2292004002"],["HP|All-in-one printer, white",1,"",179.89,"confirmed","Model not verified. Priced as HP Envy 6555e.","Best Buy","https://www.bestbuy.com/site/hp-envy-6555e-wireless-ai-enabled-all-in-one-inkjet-printer-with-3-months-of-instant-ink--1-bonus-month-of-ink-w-code-white/6590105.p"],["Small folding table",1,"",31.99,"estimated","","Walmart","https://www.walmart.com/ip/19108151920"],["TV dinner tray, wood, folding",1,"",10.99,"confirmed","Not visible in photo. Added from description.","Target","https://www.target.com/p/solid-wood-tv-tray--single--black---pdg%C2%AE/-/A-11053805"],["Framed mirror or picture, large",1,"",144.44,"estimated","Priced as a framed mirror. Not verified whether it is original artwork.","Walmart","https://www.walmart.com/ip/Empire-Art-Direct-Bling-Beveled-Glass-Mirror-30-x-40-Ready-to-Hang/440158550"],["Decorative figurines",5,"",25.96,"estimated","Exact item not identified. Priced as a similar ready-made item.","Walmart","https://www.walmart.com/ip/52273741"],["Hardcover books on mantel",3,"",18.99,"estimated","Titles not identified. Priced as a typical new hardcover.","Target","https://www.target.com/p/-/A-11999893"],["Area rug, woven natural fiber, about 8 x 10 ft",1,"About 10 years",279.99,"estimated","","Walmart","https://www.walmart.com/ip/Safavieh-Natural-Fiber-Malcolm-Braided-Area-Rug-or-Runner/554021268"],["Coffee table, trunk style",1,"About 10 years",349.99,"estimated","","Home Depot","https://www.homedepot.com/p/Vintiquewise-Old-Fashioned-Large-Natural-Wood-Storage-Trunk-and-Coffee-Table-QI003414L/307714916"],["Sofa, 3-seat, genuine leather, dark brown",1,"About 10 years",1263.0,"confirmed","","Houzz","https://www.houzz.com/products/valour-88-leather-sofa-brown-prvw-vr~192152451"],["Throw blanket, woven tapestry",1,"",55.0,"estimated","","Houzz","https://www.houzz.com/products/sanctuary-nor-50x60-tap-throw-prvw-vr~90993876"],["Throw pillows, 18 x 18 in.",3,"",19.99,"estimated","","Target","https://www.target.com/p/cotton-tufted-square-throw-pillow-threshold/-/A-93514216"],["Recliner, gray fabric",1,"About 10 years",334.99,"estimated","","Staples","https://www.staples.com/flash-furniture-prescott-fabric-push-back-recliner-gray-bobs70021gy/product_24523031"],["Armchair, green leather",1,"About 10 years",240.81,"estimated","","Home Depot","https://www.homedepot.com/p/Lazzara-Saratoga-Green-Leather-Upholstery-Accent-Armchair-1010GRN-1/333873654"],["Tall plant in pot, about 6 ft",1,"",180.62,"estimated","Not verified whether the plant is live or artificial. Priced as artificial.","Home Depot","https://www.homedepot.com/p/ANGELES-HOME-6-ft-Green-Indoor-Outdoor-Decorative-Artificial-Ficus-Tree-Plant-in-Pot-Faux-Fake-Tree-Plant-M359-8HW65/322483641"],["Floor urn, metal",1,"",78.92,"estimated","","Walmart","https://www.walmart.com/ip/1210911227"],["Bookcase wall, glass doors, lighted, about 10 ft wide",4,"About 10 years",208.29,"confirmed","Priced as four ready-made 78.7 in. tall units. Unit width, solid wood or custom construction not verified.","Home Depot","https://www.homedepot.com/p/FUFU-GAGA-78-7-in-Tall-Brown-Wood-10-Shelf-Standard-Bookcase-Bookshelf-With-Glass-Doors-LED-Lights-Drawers-Adjustable-Shelves-KF020462-012/329057305"],["Walker, folding aluminum",1,"",48.87,"estimated","Durable medical equipment.","Walmart","https://www.walmart.com/ip/McKesson-Walker-for-Seniors-Folding-Mobility-Aid-350-lbs-Capacity-1-Ct/911288187"],["Books in bookcase",80,"",18.99,"estimated","Quantity estimated from a distant photo. Titles not identified. Priced as a typical new hardcover.","Target","https://www.target.com/p/-/A-11999893"],["Photo albums, large",4,"",21.99,"estimated","","Walmart","https://www.walmart.com/ip/Pioneer-Photo-Albums-Large-Sewn-Leatherette-Frame-Cover-Photo-Album-Black/126610309"],["Round accent chair",1,"",208.61,"estimated","Chair mostly covered in photo. Priced as a 42 in. papasan chair.","Walmart","https://www.walmart.com/ip/44502808"],["Desk by stairs, dark wood",1,"",577.89,"estimated","Mostly hidden in photo. Type and size not verified. Priced as a wood writing desk.","Walmart","https://www.walmart.com/ip/337616124"],["Soccer ball, size 5",1,"",14.97,"estimated","","Walmart","https://www.walmart.com/ip/15988370366"],["Round wall decor",1,"",55.09,"estimated","Exact item not identified. Priced as a similar ready-made item.","Target","https://www.target.com/p/-/A-1003517499"],["Carved wood figures",4,"",29.99,"estimated","Exact item not identified. Priced as a similar ready-made item.","Forest Decor","https://forest-decor.com/product/handmade-rustic-wood-owl-figurine/"],["Decor on top of bookcase",1,"",30,"estimated","Not clearly visible. Estimated as artificial greenery in a basket.","",""]];

export function sampleList(): SavedList {
  return {
    items: SAMPLE.map(([item, qty, age, price, basis, note, store, url]) => { const p = item.split("|");
      return { id: newId(), room: "Living room", brand: p.length > 1 ? p[0] : "", item: p[p.length - 1], qty, age, price, basis, note, store, url, listing: url ? "found" : "none" }; }),
    left: [{ item: "Ceiling fans (2)", reason: "Attached to the building." }, { item: "Window shutters", reason: "Attached to the building." },
      { item: "Brick fireplace", reason: "Part of the building." }, { item: "Stair lift", reason: "Attached to the stairs." }],
    loss: "Water", dateOfLoss: "", purchaseId: "", sample: true,
  };
}

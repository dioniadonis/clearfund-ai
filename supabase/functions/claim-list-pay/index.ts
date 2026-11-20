// Claim List payments: Stripe checkout, purchase lookup and file creation. Nothing about the list is stored:
// the purchase ID is the Stripe checkout session ID, and its metadata carries plan, item limit and date of loss.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import ExcelJS from "npm:exceljs@4.4.0";
import { jsPDF } from "npm:jspdf@2.5.1";
import * as AT from "npm:jspdf-autotable@3.8.2";
// CommonJS interop differs between runtimes; take whichever export is the function.
const autoTable: any = [(AT as any).autoTable, (AT as any).default, (AT as any).default?.default].find((f) => typeof f === "function");
import { serviceClientConfig } from "../_shared/util.ts";
import {
  PLANS, checkoutCharge, cleanLine, decidePurchase, validDateOfLoss,
  type CheckoutKind, type Line, type PlanId,
} from "../_shared/claimList.ts";
import { makePdf, makeXlsx } from "../_shared/claimListFiles.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const ALLOWED_HOSTS = ["clearfundai.com", "www.clearfundai.com", "myclearfund.com", "www.myclearfund.com"];
function returnOrigin(req: Request): string {
  const o = req.headers.get("origin") ?? "";
  try {
    const u = new URL(o);
    if (u.protocol === "https:" && (ALLOWED_HOSTS.includes(u.hostname) || u.hostname.endsWith(".lovable.app") || u.hostname.endsWith(".lovableproject.com"))) return u.origin;
  } catch { /* fall through */ }
  return "https://clearfundai.com";
}

async function stripe(path: string, init: { method?: string; form?: Record<string, string> } = {}) {
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) throw new Error("stripe_not_configured");
  const res = await fetch("https://api.stripe.com/v1/" + path, {
    method: init.method ?? "GET",
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/x-www-form-urlencoded" },
    body: init.form ? new URLSearchParams(init.form).toString() : undefined,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error("stripe_" + res.status + ":" + (body?.error?.code ?? body?.error?.type ?? ""));
  return body;
}

type Found = { plan: PlanId; itemLimit: number; dateOfLoss: string; paidAt: Date };
async function lookup(purchaseId: string): Promise<Found | null> {
  if (!/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(purchaseId)) return null;
  try {
    const s = await stripe("checkout/sessions/" + encodeURIComponent(purchaseId));
    if (s.payment_status !== "paid" || s.metadata?.product !== "claim_list") return null;
    const plan = s.metadata.plan as PlanId;
    if (!PLANS[plan]) return null;
    const start = Number(s.metadata.window_start) || s.created;
    return { plan, itemLimit: PLANS[plan].itemLimit, dateOfLoss: String(s.metadata.date_of_loss ?? ""), paidAt: new Date(start * 1000) };
  } catch (e) {
    if (String((e as Error).message).startsWith("stripe_404")) return null;
    throw e;
  }
}

function cleanState(st: any) {
  const items = (Array.isArray(st?.items) ? st.items : []).slice(0, 2000).map((x: any) => {
    const l = cleanLine(x);
    if (!l) return null;
    const url = typeof x.url === "string" && x.url.startsWith("https://") ? x.url.slice(0, 600) : "";
    return { ...l, store: url && typeof x.store === "string" ? x.store.slice(0, 60) : "", url };
  }).filter(Boolean) as Line[];
  const left = (Array.isArray(st?.left) ? st.left : []).slice(0, 200)
    .map((l: any) => ({ item: String(l?.item ?? "").slice(0, 200), reason: String(l?.reason ?? "").slice(0, 200) }))
    .filter((l: { item: string }) => l.item);
  return { items, left, loss: String(st?.loss ?? "").slice(0, 20), dateOfLoss: String(st?.dateOfLoss ?? "") };
}

const b64 = (buf: ArrayBuffer | Uint8Array) => {
  const u = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = ""; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000));
  return btoa(s);
};

async function logEvent(event: string, plan: string | null, session: string | null) {
  try {
    const { url, key } = serviceClientConfig();
    await createClient(url, key).from("claim_list_events").insert({ event, plan, session_id: session });
  } catch { /* counts are best-effort */ }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  let b: any;
  try { b = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const now = new Date();

  try {
    if (b.action === "event") {
      const ok = ["view_landing", "view_app", "order_click", "checkout_start"].includes(b.event);
      const sid = typeof b.session === "string" && /^[a-z0-9]{8,40}$/.test(b.session) ? b.session : null;
      if (ok) await logEvent(b.event, PLANS[b.plan as PlanId] ? b.plan : null, sid);
      return json({ ok });
    }

    const lines = Math.max(0, Math.min(5000, Math.round(Number(b.lines) || 0)));
    const dateOfLoss = String(b.dateOfLoss ?? "");

    if (b.action === "checkout") {
      if (!lines) return json({ error: "empty_list" }, 400);
      if (!validDateOfLoss(dateOfLoss, now)) return json({ error: "bad_date" }, 400);
      const kind: CheckoutKind = b.kind === "upgrade" || b.kind === "extend" ? b.kind : "new";
      const found = kind === "new" ? null : await lookup(String(b.purchaseId ?? ""));
      const charge = checkoutCharge(kind, lines, found, dateOfLoss);
      if (!charge) return json({ error: "not_allowed" }, 400);
      const origin = returnOrigin(req);
      const label = kind === "extend" ? "Claim List: 12 more months" : kind === "upgrade" ? "Claim List upgrade to " + PLANS[charge.plan].name : "Claim List: " + PLANS[charge.plan].name;
      const windowStart = charge.windowStart === "keep" && found ? Math.floor(found.paidAt.getTime() / 1000) : Math.floor(now.getTime() / 1000);
      const s = await stripe("checkout/sessions", {
        method: "POST",
        form: {
          mode: "payment",
          "line_items[0][quantity]": "1",
          "line_items[0][price_data][currency]": "usd",
          "line_items[0][price_data][unit_amount]": String(charge.amount * 100),
          "line_items[0][price_data][product_data][name]": label,
          "line_items[0][price_data][product_data][description]": "Contents list spreadsheet and PDF. Free changes to this claim for 12 months.",
          "payment_intent_data[statement_descriptor_suffix]": "CLAIM LIST",
          success_url: origin + "/claim-list/app?paid={CHECKOUT_SESSION_ID}",
          cancel_url: origin + "/claim-list/app?canceled=1",
          "metadata[product]": "claim_list",
          "metadata[plan]": charge.plan,
          "metadata[item_limit]": String(Math.min(PLANS[charge.plan].itemLimit, 999999)),
          "metadata[date_of_loss]": dateOfLoss,
          "metadata[window_start]": String(windowStart),
          "metadata[kind]": kind,
          ...(found ? { "metadata[from]": String(b.purchaseId) } : {}),
        },
      });
      await logEvent("checkout_start", charge.plan, null);
      return json({ url: s.url, amount: charge.amount, plan: charge.plan });
    }

    if (b.action === "verify" || b.action === "files") {
      const purchaseId = String(b.purchaseId ?? "");
      const found = await lookup(purchaseId);
      const st = b.action === "files" ? cleanState(b.state) : null;
      const decision = decidePurchase(found, { dateOfLoss, lines: st ? st.items.length : lines }, now);
      const until = found ? new Date(found.paidAt.getTime()).setFullYear(found.paidAt.getFullYear() + 1) : null;
      const info = { decision, plan: found?.plan ?? null, until: until ? new Date(until).toISOString().slice(0, 10) : null, dateOfLoss: found?.dateOfLoss ?? null };
      if (b.action === "verify" || decision.kind !== "free") return json(info);
      if (!st || !st.items.length) return json({ error: "empty_list" }, 400);
      if (st.dateOfLoss !== found!.dateOfLoss) return json({ error: "date_mismatch" }, 400);
      const day = now.toISOString().slice(0, 10);
      const full = { ...st, purchaseId };
      const xlsx = await makeXlsx(ExcelJS, full, day);
      const pdf = makePdf(jsPDF, autoTable, full, day);
      return json({ ...info, day, xlsx: b64(xlsx as ArrayBuffer), pdf: b64(pdf) });
    }

    return json({ error: "unknown_action" }, 400);
  } catch (e) {
    const m = String((e as Error).message ?? e);
    console.error("claim-list-pay", m);
    return json({ error: m === "stripe_not_configured" ? "payments_off" : "server_error" }, m === "stripe_not_configured" ? 503 : 500);
  }
});

// Claim List AI: reads photos into priced lines, applies a plain-words change to one line, or adds missed items.
// Photos are sent to the model and dropped; nothing is stored.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { RULES, cleanLine, type Line } from "../_shared/claimList.ts";

const MODEL = "openai/gpt-6-astra";
const MAX_IMAGES = 6;
const MAX_IMAGE_CHARS = 2_500_000;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const LINE_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["room", "item", "brand", "qty", "age", "price", "basis", "note"],
  properties: {
    room: { type: "string" }, item: { type: "string" }, brand: { type: "string" }, qty: { type: "integer" },
    age: { type: "string" }, price: { type: "number" }, basis: { type: "string", enum: ["confirmed", "estimated", "own"] }, note: { type: "string" },
  },
};
const LIST_SCHEMA = {
  type: "object", additionalProperties: false, required: ["items", "left_off"],
  properties: {
    items: { type: "array", items: LINE_SCHEMA },
    left_off: { type: "array", items: { type: "object", additionalProperties: false, required: ["item", "reason"], properties: { item: { type: "string" }, reason: { type: "string" } } } },
  },
};
const EDIT_SCHEMA = {
  type: "object", additionalProperties: false, required: ["remove", "line"],
  properties: { remove: { type: "boolean" }, line: LINE_SCHEMA },
};

const str = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : "");

async function ask(input: unknown, schema: object, name: string): Promise<any> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("no_api_key");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 120_000);
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST", signal: ctrl.signal,
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: MODEL, store: false, reasoning: { effort: "low" }, instructions: RULES, input,
        text: { format: { type: "json_schema", name, strict: true, schema } },
      }),
    });
    const body = await res.json().catch(() => null);
    if (res.status === 429) throw new Error("busy");
    if (!res.ok || !body) throw new Error("ai_http_" + res.status);
    const text = typeof body.output_text === "string" ? body.output_text
      : (body.output ?? []).flatMap((o: any) => o.content ?? []).filter((c: any) => c.type === "output_text").map((c: any) => c.text).join("");
    return JSON.parse(text);
  } finally { clearTimeout(timer); }
}

const lines = (arr: unknown): Line[] => (Array.isArray(arr) ? arr : []).map(cleanLine).filter(Boolean) as Line[];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  let b: any;
  try { b = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const loss = str(b.loss, 20) || "not given";

  try {
    if (b.mode === "photos") {
      const imgs = (Array.isArray(b.images) ? b.images : []).filter((s: unknown) =>
        typeof s === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(s) && s.length < MAX_IMAGE_CHARS).slice(0, MAX_IMAGES);
      if (!imgs.length) return json({ error: "no_photos" }, 400);
      const said = str(b.said, 3000).trim() || "nothing";
      const already = (Array.isArray(b.already) ? b.already : []).slice(0, 400).map((s: unknown) => str(s, 120)).filter(Boolean);
      const text = `Type of loss: ${loss}.\nWhat the owner said: "${said}"\n`
        + (already.length ? `Already listed from other photos of the same home. Do not list these again: ${already.join("; ")}\n` : "")
        + (b.first ? "Also list anything the owner mentioned that is not in any photo.\n" : "Only list what is in these photos.\n")
        + "List every belonging you can see in the attached photos of the owner's home.";
      const out = await ask([{ role: "user", content: [{ type: "input_text", text }, ...imgs.map((u: string) => ({ type: "input_image", image_url: u, detail: "high" }))] }], LIST_SCHEMA, "contents_list");
      const left = (Array.isArray(out?.left_off) ? out.left_off : []).map((l: any) => ({ item: str(l?.item, 200), reason: str(l?.reason, 200) })).filter((l: any) => l.item);
      return json({ items: lines(out?.items), left });
    }

    if (b.mode === "edit") {
      const line = cleanLine(b.line);
      const said = str(b.said, 1000).trim();
      if (!line || !said) return json({ error: "bad_request" }, 400);
      const out = await ask(`Here is one line of the list:\n${JSON.stringify(line)}\n\nThe owner says about this line: "${said}"\n\nUpdate the line to match what the owner said, and re-price it if the details changed. If the owner says they did not own it, set "remove" to true.`, EDIT_SCHEMA, "line_edit");
      if (out?.remove) return json({ remove: true });
      const updated = cleanLine(out?.line);
      return updated ? json({ line: updated }) : json({ error: "ai_failed" }, 502);
    }

    if (b.mode === "add") {
      const said = str(b.said, 2000).trim();
      if (!said) return json({ error: "bad_request" }, 400);
      const out = await ask(`Type of loss: ${loss}.\nRoom to use if the owner doesn't say: ${str(b.room, 60) || "Other"}.\nThe owner wants to add belongings that were missed: "${said}"\nList each belonging as its own line. Put nothing in left_off unless it is part of the building.`, LIST_SCHEMA, "contents_add");
      return json({ items: lines(out?.items) });
    }

    return json({ error: "unknown_mode" }, 400);
  } catch (e) {
    const m = String((e as Error).message ?? e);
    console.error("claim-list-ai", m);
    return json({ error: m === "busy" ? "busy" : "ai_failed" }, m === "busy" ? 429 : 502);
  }
});

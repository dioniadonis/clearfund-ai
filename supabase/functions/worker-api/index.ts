import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";

// Secured API for outside workers. Each worker has its own key in a secret named WORKER_KEY_<NAME>.
// All claiming/dedupe logic lives in database functions; this only authenticates, validates and routes.
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const safeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
};

function workerFor(key: string): string | null {
  if (key.length < 24) return null;
  let found: string | null = null;
  for (const [name, val] of Object.entries(Deno.env.toObject())) {
    if (name.startsWith("WORKER_KEY_") && val && safeEqual(key, val)) found = name.slice(11).toLowerCase();
  }
  return found;
}

const JobType = z.enum(["find_email", "score", "first_line", "outreach"]);
const Lead = z.object({
  lead_id: z.string().max(100).optional(), lead_ref: z.string().max(100).optional(),
  type: z.string().max(20).optional(), lead_type: z.string().max(20).optional(),
  company: z.string().max(200).optional(), firm: z.string().max(200).optional(),
  contact_name: z.string().max(200).optional(), email: z.string().max(320).optional(), phone: z.string().max(40).optional(),
  state: z.string().max(20).optional(), sector: z.string().max(120).optional(), website: z.string().max(300).optional(),
  agency: z.string().max(200).optional(), email_source: z.string().max(120).optional(),
  need_score: z.number().int().min(0).max(100).optional(), first_line: z.string().max(500).optional(), notes: z.string().max(2000).optional(),
}).transform((l) => ({ ...l, lead_ref: l.lead_ref ?? l.lead_id, lead_type: l.lead_type ?? l.type, firm: l.firm ?? l.company }));

const STAGES = ["New", "Contacted", "Replied", "Interested", "Applied", "Submitted to funder", "Funded", "Lost", "Signed up (DAC)", "Trained", "First referral", "new", "contacted", "applied", "approved", "rejected"] as const;
const routes = {
  "jobs/claim": z.object({ job_type: JobType, n: z.number().int().min(1).max(50).default(10) }),
  "jobs/result": z.object({ job_id: z.string().uuid(), ok: z.boolean(), result: z.record(z.unknown()).optional(), error: z.string().max(500).optional() }),
  "leads/contacted": z.object({ lead_id: z.string().uuid(), job_id: z.string().uuid().optional() }),
  "sources/register": z.object({ source: z.string().min(1).max(60), params: z.record(z.unknown()), refresh_days: z.number().int().min(1).max(3650).optional() }),
  "sources/claim": z.object({ source: z.string().max(60).optional() }),
  "sources/complete": z.object({ slice_id: z.string().uuid(), status: z.enum(["done", "blocked"]), leads: z.array(Lead).max(500).default([]), note: z.string().max(500).optional() }),
  "leads/find": z.object({ email: z.string().max(320).optional(), firm: z.string().max(200).optional(), limit: z.number().int().min(1).max(10).optional(), type: z.enum(["client", "partner", "recruit"]).optional() })
    .refine((v) => !!(v.email?.trim() || v.firm?.trim()), "email or firm required"),
  "leads/update": z.object({ lead_id: z.string().uuid(), stage: z.enum(STAGES).optional(), note: z.string().min(1).max(2000).optional(),
    next_follow_up: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional() })
    .refine((v) => v.stage !== undefined || v.note !== undefined || v.next_follow_up !== undefined, "stage, note or next_follow_up required"),
  "leads/dnc": z.object({ lead_id: z.string().uuid(), reason: z.string().min(1).max(200) }),
  "replies/log": z.object({ lead_id: z.string().uuid().optional(), from_email: z.string().max(320).optional(), inbox: z.string().min(1).max(120),
    subject: z.string().max(300).default(""), snippet: z.string().max(1000).default(""), label: z.string().max(50).optional(), received_at: z.string().datetime({ offset: true }) })
    .refine((v) => !!(v.lead_id || v.from_email?.trim()), "lead_id or from_email required"),
} as const;
type Route = keyof typeof routes;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const worker = workerFor(req.headers.get("x-worker-key") ?? "");
  if (!worker) return json({ error: "unauthorized" }, 401);

  const route = new URL(req.url).pathname.split("/worker-api/")[1]?.replace(/\/$/, "") as Route;
  if (!(route in routes)) return json({ error: "not_found", routes: Object.keys(routes) }, 404);

  let raw: unknown;
  try { raw = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const parsed = routes[route].safeParse(raw);
  if (!parsed.success) return json({ error: "invalid_request", details: parsed.error.flatten() }, 400);
  const b = parsed.data as any;

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data: allowed, error: rlErr } = await db.rpc("crm_worker_hit", { _worker: worker, _endpoint: route });
  if (rlErr) { console.error("rate check failed", rlErr.message); return json({ error: "server_error" }, 500); }
  if (!allowed) return json({ error: "rate_limited", retry_after_seconds: 60 }, 429);

  const call = async (fn: string, args: Record<string, unknown>) => {
    const { data, error } = await db.rpc(fn, args);
    if (error) { console.error(fn, error.message); return json({ error: "request_failed", message: error.message }, 400); }
    return json({ worker, data });
  };

  switch (route) {
    case "jobs/claim": return call("crm_claim_jobs", { _worker: worker, _type: b.job_type, _n: b.n });
    case "jobs/result": return call("crm_complete_job", { _worker: worker, _job_id: b.job_id, _ok: b.ok, _result: b.result ?? {}, _error: b.error ?? null });
    case "leads/contacted": return call("crm_mark_contacted", { _worker: worker, _lead_id: b.lead_id, _job_id: b.job_id ?? null });
    case "sources/register": return call("crm_register_source", { _worker: worker, _source: b.source, _params: b.params, _refresh_days: b.refresh_days ?? 30 });
    case "sources/claim": return call("crm_claim_source", { _worker: worker, _source: b.source ?? null });
    case "sources/complete": return call("crm_complete_source", { _worker: worker, _slice_id: b.slice_id, _status: b.status, _leads: b.leads, _note: b.note ?? null });
    case "leads/find": return call("crm_find_leads", { _worker: worker, _email: b.email ?? null, _firm: b.firm ?? null, _limit: b.limit ?? 5, _type: b.type ?? null });
    case "leads/update": return call("crm_worker_update_lead", { _worker: worker, _lead_id: b.lead_id, _stage: b.stage ?? null, _note: b.note ?? null,
      _set_follow_up: b.next_follow_up !== undefined, _next_follow_up: b.next_follow_up ?? null });
    case "leads/dnc": return call("crm_worker_mark_dnc", { _worker: worker, _lead_id: b.lead_id, _reason: b.reason });
    case "replies/log": return call("crm_worker_log_reply", { _worker: worker, _lead_id: b.lead_id ?? null, _from_email: b.from_email ?? null, _inbox: b.inbox,
      _subject: b.subject, _snippet: b.snippet, _label: b.label ?? null, _received_at: b.received_at });
  }
});

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { serviceClientConfig } from "../_shared/util.ts";
import { AGENT_QUIZ_ANSWERS, evaluateAgentQuiz } from "../_shared/agentQuiz.ts";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json" },
});
const STATES = "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" ");
const quizShape = Object.fromEntries(Object.keys(AGENT_QUIZ_ANSWERS).map((key) => [key, z.string().min(1).max(40)]));
const Schema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(7).max(30),
  city: z.string().trim().min(1).max(120),
  state: z.string().trim().toUpperCase().refine((value) => STATES.includes(value)),
  experience: z.enum(["sales", "finance", "insurance", "other"]),
  find_owners: z.string().trim().min(10).max(1500),
  quiz_answers: z.object(quizShape).strict(),
  company_website: z.string().max(200).optional().nullable(),
  elapsed_ms: z.number().int().min(0).max(86400000),
});
const hits = new Map<string, number[]>();
const throttled = (ip: string) => {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((time) => now - time < 600000);
  recent.push(now); hits.set(ip, recent);
  return recent.length > 5;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  let raw: unknown;
  try { raw = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const parsed = Schema.safeParse(raw);
  if (!parsed.success) return json({ error: "invalid_input" }, 400);
  const input = parsed.data;
  if (input.company_website || input.elapsed_ms < 3000) return json({ status: "received" });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (throttled(ip)) return json({ error: "rate_limited" }, 429);

  const evaluation = evaluateAgentQuiz(input.quiz_answers);
  const { url, key } = serviceClientConfig();
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await db.rpc("agent_submit_application", {
    _application: {
      full_name: input.full_name, email: input.email, phone: input.phone, city: input.city,
      state: input.state, experience: input.experience, find_owners: input.find_owners,
      quiz_answers: input.quiz_answers,
    },
    _quiz_score: evaluation.score,
    _passed: evaluation.passed,
  });
  if (error) { console.error("agent application save failed", error.message); return json({ error: "save_failed" }, 500); }
  return json({ status: "received" });
});

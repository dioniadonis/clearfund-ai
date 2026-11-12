# Architecture rules

- Free audit questions/scoring live only in `supabase/functions/_shared/freeAuditScoring.ts` (site re-exports via `src/lib/freeAudit.ts`) — one source; the server recomputes and its numbers are authoritative.
- Free audit results are read only through the `get-free-audit-result` function by 64-hex share token — tables stay operator-only and the public link never returns email/phone.
- The AI only writes prose for free audits; numbers never come from the model, and any AI failure falls back to library copy.
- CRM (`/crm`) access = `user_roles` admin/agent via `is_crm_user`; agents see only their own + unassigned `crm_leads` through RLS — never filter visibility client-side only.
- CRM auto-feed (apply/calculator/outreach → `crm_leads`) and stage_change logging are database triggers, so writes stay atomic and need no client code.
- /awarded visits are logged only via the `log_outreach_visit` security-definer RPC (no direct table insert); only visits matching an existing crm_leads id/lead_ref touch the CRM, and URL params never overwrite lead data.
- Sender email events enter only via the `email-events` function (shared-secret header) → `ingest_email_event` RPC; a trigger on `email_events` applies Replied/do-not-contact so every sender behaves the same, and unmatched events never create leads.
- Outside workers use only the `worker-api` function (per-worker key in a `WORKER_KEY_<NAME>` secret; the suffix is the worker name). All claiming, dedupe and write-back live in service-role-only SQL functions (`crm_claim_jobs`, `crm_complete_job`, `crm_mark_contacted`, `crm_*_source`, `crm_insert_lead`) so every worker gets identical, atomic rules.
- Every bulk/worker lead insert goes through `crm_insert_lead` (dedupe on lead_ref, email, website_key, company_key+state, backed by unique indexes); first finder is kept in `found_by`.
- Agent integrations use the SDK-owned MCP function with OAuth caller-scoped Supabase clients; tools stay read-only and rely on CRM RLS so external assistants cannot widen lead access.

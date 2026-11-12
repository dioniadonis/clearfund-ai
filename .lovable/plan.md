# CRM as single source of truth for outside workers

Adds to the approved phone-layout + email-activity CRM plan. Roles unchanged (admin all, agent own + unassigned). Not published.

## 1. Lead fields (additive changes to existing `crm_leads`)
Reuse what exists, so no field means the same thing twice:
- `lead_id` from CSVs -> existing `lead_ref` (already used by /awarded and email matching). Add a unique index on it (where not null).
- `company` -> existing `firm`. `stage`, `do_not_contact`, `email` already exist.
- New nullable columns: `lead_type` (borrower | partner), `state` (2-letter), `sector`, `website`, `website_key` (normalized domain: lowercase, no scheme/www/path), `email_source`, `need_score` (0-100 int), `first_line` (text, length-capped).
- Unique indexes on `lower(email)` and `website_key` (where not null). Before adding, I query for existing duplicates; if any, they're listed for you to merge rather than deleted.

## 2. Bulk CSV import (extend the existing admin import)
- Add the new fields to the column mapper.
- Dedupe order per row: `lead_ref` -> email -> website_key. Match = skip (default) or "fill blanks only" (never overwrites filled fields). Duplicates inside the same file are also caught.
- Runs through one server-side function in batches, so dedupe is enforced by the database, not the browser. Result summary: added / skipped (with reason) / errors, downloadable as CSV.

## 3. Work-claim system
New table `crm_jobs`: id, lead_id (-> crm_leads), job_type (find_email | score | first_line | outreach), status (claimed | done | failed), claimed_by (worker name), claimed_at, expires_at, attempts, result (jsonb), error, finished_at.
- One row per lead per job type (unique). This is what guarantees no lead is done twice.
- No seeding needed: claiming picks eligible leads that have no done/active job for that type, and creates the job row in the same atomic step (row locks, skip-locked, so two workers asking at the same instant get different leads).
- Eligibility rules live in that one claim step:
  - find_email: no email yet
  - score: no need_score
  - first_line: has email, no first_line
  - outreach: has email + first_line, stage New, not do-not-contact
- Expiry: claims older than their `expires_at` (default 30 min, set per job type) are treated as free on the next claim. No scheduled job needed. After 3 failed/expired attempts the lead is skipped and shown as "stuck".

## 4. Worker API (one secured function, `worker-api`)
- Auth: header `x-worker-key`. Each worker gets its own key stored as a project secret (e.g. one for the Mac script, one for Codex, one per cloud agent). I generate them; you copy them from Secrets into each worker. Never in the browser or chat. Revoke = delete that secret.
- `POST /claim` {job_type, n<=50} -> leads with only the fields that job needs.
- `POST /result` {job_id, ok, result|error} -> must be the claimer and claim not expired. Writes allowlisted fields back to the lead (e.g. find_email may set email + email_source; it can't change stage or do-not-contact). Logs a timeline entry.
- `POST /contacted` {lead_id, job_id} -> refused if do-not-contact; moves New -> Contacted, logs activity, marks outreach job done.
- Rate limit: per worker, e.g. 60 calls/min; batch cap 50. Small `crm_worker_calls` log used for limit + last-seen. No public/anon access; tables remain role-protected.

## 5. Workers tab in /crm (admin only, phone-first)
- Cards (2-column grid that wraps), one per job type: remaining eligible, in progress, done today, failed/stuck.
- "Workers" list: name, last seen, active claims, done today.
- "Stale claims" list (expired, not finished) with a "Release" button (confirm dialog; logs who/when).
- Vertical lists only, no sideways scrolling; Refresh button (no live updates in v1).

## Technical details
- Migration: new columns + indexes, `crm_jobs`, `crm_worker_calls` with grants + RLS (admin read; writes only via security-definer functions `crm_claim_jobs`, `crm_complete_job`, `crm_mark_contacted`, `crm_release_job`, called by the edge function with the service role).
- Edge function validates input with zod, maps key -> worker name by comparing against secrets in constant time.
- Tests: two parallel claims never overlap; expired claim is re-claimable; DNC lead never claimed for outreach; import dedupe on each of the 3 keys; wrong/missing key rejected; result from a non-claimer rejected.

## Risks / cut from v1
- Existing duplicate emails/websites block the unique indexes until merged (I'll report them first).
- A worker that does work but crashes before `/result` causes a redo after expiry; acceptable, but outreach is the one where a redo means a second email. Mitigation: worker must call `/contacted` before/immediately after sending; outreach claims expire longer (2 h).
- Sending itself still happens outside the CRM; DNC here doesn't stop a worker that ignores the API.
- Adding/removing a worker needs a secret change (no in-app key management in v1).
- Cut: worker-side CSV import endpoint, auto-scheduling, live dashboard updates, per-job priority queues, AI scoring inside the CRM (score comes from workers).

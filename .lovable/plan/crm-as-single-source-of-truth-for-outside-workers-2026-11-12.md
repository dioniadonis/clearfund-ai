# CRM as single source of truth for outside workers

Adds to the approved phone-layout + email-activity CRM plan. Roles unchanged (admin sees all, agents see their own + unassigned). Not published.

## 1. Lead fields (additive changes to existing `crm_leads`)
- `lead_id` from CSVs -> existing `lead_ref` (already used by /awarded and email matching). Add unique index (where not null).
- `company` -> existing `firm`. `stage`, `do_not_contact`, `email` already exist.
- New nullable columns: `lead_type` (borrower | partner), `state`, `sector`, `website`, `website_key` (normalized domain), `company_key` (normalized name), `email_source`, `need_score` (0-100), `first_line`, `found_by`, `found_at`, `source_id`.
- Unique indexes on `lower(email)`, `website_key`, and `(company_key, state)`. Existing duplicates are listed for you to merge first, never auto-deleted.

## 2. Bulk CSV import (extend existing admin import)
- New fields added to the column mapper.
- Goes through the single dedupe step in section 5. Match = skip (default) or "fill blanks only". In-file duplicates caught too.
- Summary: added / skipped (with reason) / errors, downloadable as CSV.

## 3. Work-claim system (`crm_jobs`)
Columns: id, lead_id, website_key, job_type (find_email | score | first_line | outreach), status (claimed | done | failed), claimed_by, claimed_at, expires_at, attempts, result (jsonb), error, finished_at.
- One job per lead per type (unique) = no lead done twice.
- No seeding: claiming picks eligible leads and creates job rows in one atomic step (row locks, skip-locked).
- Eligibility, in that one step: find_email = no email + has website; score = no need_score; first_line = has email, no first_line; outreach = email + first_line, stage New, not do-not-contact.
- Expired claims are free on the next claim (no scheduler). 3 failed/expired attempts -> "stuck".

## 4. Per-domain email lookup
- find_email is claimed per `website_key`: one active claim per domain, covering every lead on it, so two workers never hit the same site. Result writes to all leads on that domain.

## 5. One lead-insert chokepoint (import, sources, workers)
- Reject on match of any: `lead_ref`, `lower(email)`, `website_key`, or `company_key + state` (lowercase, punctuation and LLC/Inc/Corp stripped).
- First finder wins: `found_by`, `found_at`, `source_id` set once, never overwritten. Rejected rows return the existing lead id and reason.

## 6. Sources registry (`crm_sources`)
Columns: id, source (sba_search | usaspending | ...), params (jsonb, e.g. {state:GA, naics:"23", years:"2017-2025"} or {agency, from, to}), slice_key (unique hash of source + normalized params), status (open | claimed | done | blocked), claimed_by, claimed_at, expires_at, last_run_at, refresh_days (default 30), leads_found, new_leads, notes.
- Slices added by admin (Workers tab) or by a worker; exact duplicates collapse on slice_key.
- Claim takes the next slice that is open, or done and past its refresh window, or claimed and expired (default 2 h). Blocked is never handed out.
- Complete: worker submits leads + status (done | blocked); leads go through section 5; leads_found / new_leads come from actual insert results, not worker claims.

## 7. Worker API (one secured function, `worker-api`)
- Header `x-worker-key`; one key per worker stored as a project secret (Mac script, Codex, each cloud agent). I generate them; you copy from Secrets into each worker. Never in browser or chat. Revoke = delete the secret.
- `POST /jobs/claim` {job_type, n<=50}
- `POST /jobs/result` {job_id, ok, result|error} - claimer only, unexpired; writes only allowlisted fields (find_email can't touch stage/DNC).
- `POST /leads/contacted` {lead_id, job_id} - refused if do-not-contact; New -> Contacted, logs activity.
- `POST /sources/register`, `POST /sources/claim`, `POST /sources/complete`
- Rate limit per worker (e.g. 60 calls/min), batch cap 50, request log for limits and last-seen. No anon access.

## 8. Workers tab in /crm (admin only, phone-first, vertical only)
- Job-type cards (2-col grid that wraps): remaining, in progress, done today, stuck.
- Workers list: name, last seen, active claims, done today, leads found first.
- Sources list with status chips: source, params, claimed by, last run, found / new, next refresh; admin can block or reopen (confirm + logged).
- Stale claims (jobs and slices) with "Release" (confirm, logs who/when).
- Rejected duplicates list with override. Refresh button, no live updates.

## Technical details
- One migration: new columns/indexes, `crm_jobs`, `crm_sources`, `crm_worker_calls`, grants + RLS (admin read only; writes only through security-definer functions called by the edge function).
- zod validation; constant-time key comparison.
- Tests: parallel claims never overlap (jobs, domains, slices); expired claims re-claimable; slice not re-run inside refresh window; DNC never claimed for outreach; each of the 4 dedupe keys rejects; first finder kept; bad key / non-claimer rejected.

## Risks / cut from v1
- Name + state matching can merge two different real firms; rejects are visible with override, never silent.
- Overlapping slices (GA all years vs GA 2020) aren't detected, only exact duplicates; leads still dedupe but scraping effort can repeat.
- slice_key depends on normalized params; enforced server-side, so workers must use the documented param names.
- Existing duplicate emails/websites/names block the unique indexes until merged.
- Crash after sending but before `/leads/contacted` can cause a second email after expiry; outreach claims expire at 2 h and workers must mark contacted immediately.
- Sending and scraping happen outside the CRM; a worker that ignores the API isn't stopped.
- Source sites may throttle/ban; "blocked" is manual or worker-set, no auto backoff.
- Adding a worker needs a new secret (no in-app key management).
- Cut: slice overlap detection, auto source discovery, scheduling, live updates, job priorities, in-CRM AI scoring.

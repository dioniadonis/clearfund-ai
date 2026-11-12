# worker-api: routes for the inbox companion

## Already in place (nothing to add)
- **DNC fields:** `crm_leads.do_not_contact`, `dnc_reason` and `dnc_at` already exist.
- **Skipping DNC leads:** `crm_lead_eligible` already skips them when jobs are claimed (`jobs/claim`, so they never get queued). `crm_mark_contacted` already returns `do_not_contact` for them.
- **DNC badge:** the lead card already shows a "Do not contact" badge. It will now also appear when the companion marks a lead DNC.
- **Auth:** same worker keys (`WORKER_KEY_<NAME>`), the same `crm_worker_hit` logging and rate limit, and Zod validation in the router. No new secrets.

## New routes (in `supabase/functions/worker-api/index.ts`, each calling one new service-role-only SQL function)

| Route | Body | SQL function |
|---|---|---|
| `leads/find` | `email` OR `firm` (≤200 chars), optional `limit` ≤10 | `crm_find_leads` |
| `leads/update` | `lead_id`, optional `stage` (one of the CRM stages), `note` (≤2000 chars), `next_follow_up` (YYYY-MM-DD or null); at least one is required | `crm_worker_update_lead` |
| `leads/dnc` | `lead_id`, `reason` (≤200 chars) | `crm_worker_mark_dnc` |
| `replies/log` | `lead_id` OR `from_email`, `inbox`, `subject` (≤300), `snippet` (≤1000), `label` (≤50), `received_at` (ISO) | `crm_worker_log_reply` |

What each one does:
- **find:** exact case-insensitive email match first. If there's no email match, a normalized company match using the existing `crm_norm_company`. Returns id, firm, contact_name, stage, notes, next_follow_up, do_not_contact. Never returns the phone number or anything else beyond that list.
- **update:** done in one transaction.
  - The note is appended to `notes` as `\n[YYYY-MM-DD HH:MM UTC · <worker>] text`, and the lead's notes are capped at 20k characters by dropping the oldest notes.
  - The note is also inserted as a `note` activity.
  - A stage change still goes through the existing `crm_log_stage_change` trigger.
  - A stage move to Contacted, Replied or later on a DNC lead is rejected with an error.
- **dnc:** sets the flag, the reason (prefixed `worker:<name>`) and `dnc_at = now()`, and adds a note activity. It does nothing if the lead is already DNC.
- **replies/log:**
  - It finds the lead by `lead_id`, or by `from_email` against `crm_leads.email`.
  - A reply that matches no lead is not saved and returns `unmatched`, so no leads get created.
  - A matched reply is inserted as an `email` activity with the body `Reply in <inbox>: "<subject>" — <snippet> [label]`, dated `received_at`.
  - Duplicates (same lead + inbox + subject + received_at) are skipped.

## Activity tab
`ActivityView` currently reads replies from `email_events` and visits from `crm_activities`. It will also query `crm_activities` rows with `type='email'` and a body starting `Reply in` from the last 7 days, and merge them into the "Replies" section. The lead drawer timeline picks them up automatically.

## Files
- One migration with the 4 functions:
  - `SECURITY DEFINER` and `search_path=public`.
  - `REVOKE` from public, anon and authenticated; `GRANT` to service_role.
  - Every function also takes `_worker` for attribution.
- `supabase/functions/worker-api/index.ts`: 4 Zod schemas and 4 `case`s. Then redeploy.
- `src/components/crm/ActivityView.tsx`: merge in the logged replies.

## Checks
With a test worker key, through the function:
- **find:** by email and by firm.
- **update:** stage + note + date. Confirm the note format, the timeline entry and that a stage_change is logged.
- **dnc:** confirm the badge appears, a later `leads/contacted` returns `do_not_contact`, and `jobs/claim` skips the lead.
- **replies/log:** matched, unmatched, and a duplicate.
- **Bad input:** a bad key gets 401; an oversized note and a bad stage get 400.
- Every call shows up in `crm_worker_calls`.
- Delete the test rows afterwards.

## Risks / cut from v1
- **Firm match:** firm-name matching can return more than one lead. The route returns up to 10 and the companion has to choose; it never auto-picks.
- **Marking replied:** `replies/log` does not move the lead to Replied by itself. Moving it is an explicit `leads/update` (otherwise the companion and the email webhook could both do it). Say if you want it automatic.
- **Undo DNC:** there's no route to undo DNC; only an admin in the CRM can clear it.
- **External senders:** DNC is only enforced inside this CRM. Senders outside it still have to check `leads/find`.
- **Untrusted reply text:** reply text and AI notes are shown as plain text, so they can't run as code in the CRM. Treat them as untrusted.

# Operator dashboard at /operator

Backend tables and role functions already exist (leads, campaigns, content_briefs, calendar_items, call_tasks, call_scripts, integrations, user_roles, `is_operator`). No frontend for them exists yet — no login page, no operator routes. This milestone builds only the frontend plus the minimum SQL, and leaves the public marketing pages untouched.

Current data: 5 integration rows, 0 leads, 0 campaigns, 0 calls, 0 users, 0 role rows.

## What gets built

**Login** — `/operator/login`: email + password only. No sign-up link, no anonymous access, no automatic role grants.

**Route guard** — fail-closed. While the session is loading, show a spinner. No session -> redirect to login. Session but no admin/operator role -> "Not authorised" screen with sign-out. Only a confirmed role renders the dashboard. Database access rules stay the second line of defence.

**Sidebar shell** — collapsible sidebar, works on phone: Overview, Leads/Deals, Marketing, Voice, Integrations. Header shows signed-in email and Sign out.

**Overview** — real counts only, from the database: leads by stage, leads needing action (next action due today or earlier), documents outstanding, calls queued. Empty states say "No records yet", never placeholder numbers.

**Leads/Deals** — paginated table (25/page) with search by name/business/email and stage filter. Detail panel edits stage, notes, next action + due date; saves write to the database and log an activity entry. Every list has loading, error and empty states.

**Marketing** — read-only lists of existing campaigns, content briefs and calendar items, plus a labelled note that content generation and ad execution are not connected yet.

**Voice** — read-only lists of call scripts and call tasks, plus a labelled note that live calling is not connected yet. No call can be started.

**Integrations** — the 5 existing integration rows with their status and required setup, editable status/notes. No new providers.

## Files

- New: `src/pages/operator/Login.tsx`, `Layout.tsx`, `Overview.tsx`, `Leads.tsx`, `Marketing.tsx`, `Voice.tsx`, `Integrations.tsx`
- New: `src/components/operator/OperatorSidebar.tsx`, `RequireOperator.tsx`, `LeadDetailSheet.tsx`
- New: `src/hooks/useOperatorAuth.tsx` (session + role, single source of truth)
- Edit: `src/App.tsx` (add `/operator` routes; public routes unchanged)
- No changes to any public page, Header, Footer or styling tokens.

## SQL needed

1. Allow operators to record notes/stage history: nothing new — `lead_events` already accepts operator inserts.
2. One-time owner grant, run once with the owner's real account id after they sign up:
   `insert into public.user_roles (user_id, role) values ('<uuid>','admin');`
3. Add `noindex` handling for operator routes is frontend-only (meta tag), no SQL.

## Owner onboarding

1. Owner creates their account on `/operator/login` (sign-up performed once by request, not exposed in the UI).
2. Confirm the email.
3. Grant the admin role with the statement above.
4. Sign in — dashboard now opens.

Until step 3 the owner sees the "Not authorised" screen. That is intended.

## Checks before hand-off

- Signed out: `/operator` and each sub-route redirect to login.
- Signed in without a role: "Not authorised", no data visible; a direct data request also fails at the database.
- With admin role: counts match direct database queries; editing a lead's stage/notes/next action persists after reload.
- Loading and error states visible with network throttled/offline.
- Build and type check clean.

## Risks / cut from v1

- **Public intake at `/apply` is not part of this milestone.** Note: current rules let only operators write leads, so a public form would need its own insert path later. Flagged, not built.
- Cut: metrics/charts, spend reporting, document upload, bulk actions, CSV export, role management UI, invitations, realtime updates.
- Cut: any write path for Marketing/Voice beyond viewing — generation, sending and calling arrive with the providers.
- Pagination is offset-based; fine at this data volume, revisit past a few thousand leads.
- Role check runs client-side for routing only; the database rules remain the real boundary.

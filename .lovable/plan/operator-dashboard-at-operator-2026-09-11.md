# Operator dashboard at /operator

Backend tables and role functions already exist (leads, campaigns, content_briefs, calendar_items, call_tasks, call_scripts, integrations, user_roles, `is_operator`). No frontend for them exists yet — no login page, no operator routes. This milestone builds only the frontend plus the minimum SQL, and leaves the public marketing pages untouched.

Current data: 5 integration rows, 0 leads, 0 campaigns, 0 calls, 0 users, 0 role rows.

## What gets built

**Login** — `/operator/login`: email + password only. It can only sign in an account that already exists. No sign-up, no anonymous access, no automatic role grants.

**Route guard** — fail-closed. While the session is loading, show a spinner. No session -> redirect to login. Session but no admin/operator role -> "Not authorised" screen with sign-out. Only a confirmed role renders the dashboard. Database access rules stay the second line of defence.

Stale-response protection: the role lookup is keyed to the current user id and tagged with a request counter; any answer that arrives for an old id or after sign-out is discarded, and signing out clears session, role and all cached dashboard data before redirecting.

**Sidebar shell** — collapsible sidebar, works on phone: Overview, Leads/Deals, Marketing, Voice, Integrations. Header shows signed-in email and Sign out.

**Overview** — real counts only, from the database: leads by stage, leads needing action (next action due today or earlier), documents outstanding, calls queued. Empty states say "No records yet", never placeholder numbers.

**Leads/Deals** — paginated table (25/page) with search by name/business/email and stage filter. Detail panel edits stage, notes, next action + due date.

Saving is one atomic call, never two browser writes: a small operator-only database routine updates the lead and writes the matching history entry inside a single transaction, so a lead never changes without its history or vice versa.

**Marketing** — read-only lists of existing campaigns, content briefs and calendar items, plus a labelled note that content generation and ad execution are not connected yet.

**Voice** — read-only lists of call scripts and call tasks, plus a labelled note that live calling is not connected yet. No call can be started.

**Integrations** — read-only. Shows the 5 existing rows with status and required setup. No status or notes editing: a hand-typed status could falsely claim a provider is connected. Status becomes writable only when a real connection check exists.

## Files

- New: `src/pages/operator/Login.tsx`, `Layout.tsx`, `Overview.tsx`, `Leads.tsx`, `Marketing.tsx`, `Voice.tsx`, `Integrations.tsx`
- New: `src/components/operator/OperatorSidebar.tsx`, `RequireOperator.tsx`, `LeadDetailSheet.tsx`
- New: `src/hooks/useOperatorAuth.tsx` (session + role, single source of truth, stale-response guarded)
- Edit: `src/App.tsx` (add `/operator` routes; public routes unchanged)
- No changes to any public page, Header, Footer or styling tokens.

## Intended migration

```sql
CREATE OR REPLACE FUNCTION public.operator_update_lead(
  _lead_id uuid,
  _stage public.lead_stage,
  _notes text,
  _next_action text,
  _next_action_due date,
  _event_description text
) RETURNS public.leads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _row public.leads;
BEGIN
  IF NOT public.is_operator(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.leads
     SET stage = _stage,
         notes = _notes,
         next_action = _next_action,
         next_action_due = _next_action_due
   WHERE id = _lead_id
  RETURNING * INTO _row;

  IF _row.id IS NULL THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;

  INSERT INTO public.lead_events (lead_id, event_type, description, created_by)
  VALUES (_lead_id, 'operator_update', _event_description, auth.uid());

  RETURN _row;
END;
$$;

REVOKE ALL ON FUNCTION public.operator_update_lead(uuid, public.lead_stage, text, text, date, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.operator_update_lead(uuid, public.lead_stage, text, text, date, text) TO authenticated;
```

No other schema change is needed. `lead_events` already allows operator inserts; the function keeps both writes in one transaction.

## Owner onboarding (explicit, manual)

1. Owner creates the operator account themselves through the backend user administration — invite or create-user — with their real email. The login page cannot create accounts.
2. Owner confirms the invite / sets the password.
3. Owner reads back the created account's UUID from the users list and confirms it is the right email.
4. Role is assigned to that verified UUID, run once:
   `insert into public.user_roles (user_id, role) values ('<verified-uuid>','admin');`
5. Sign in at `/operator/login` — dashboard opens.

Nothing grants a role automatically. Until step 4 the account sees "Not authorised".

## Checks before hand-off

- Signed out: `/operator` and each sub-route redirect to login; no dashboard data request succeeds.
- Signed in without a role: "Not authorised", no data visible; a direct data request also fails at the database.
- Sign out while the dashboard is loading: no role or data flashes in afterwards.
- With admin role: counts match direct database queries; a lead edit persists after reload and produced exactly one history entry.
- A failed save leaves both the lead and its history unchanged.
- Loading and error states visible with network throttled/offline.
- Build and type check clean.

## Risks / cut from v1

- **Public intake at `/apply` is not part of this milestone.** Current rules let only operators write leads, so a public form needs its own insert path later. Flagged, not built.
- Cut: metrics/charts, spend reporting, document upload, bulk actions, CSV export, role management UI, invitations UI, realtime updates.
- Cut: any write path for Marketing, Voice and Integrations — those arrive with the real providers and connection checks.
- Pagination is offset-based; fine at this volume, revisit past a few thousand leads.
- Role check runs client-side for routing only; database rules remain the real boundary.

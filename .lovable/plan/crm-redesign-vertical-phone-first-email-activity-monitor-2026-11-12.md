# CRM redesign: vertical, phone-first + email-activity monitor

## 1. Layout (no horizontal scroll at any width)

```text
[ Activity | Leads ]            <- two tabs, Activity is default
-------------------------------------------
Activity tab
  Stat grid (2 cols phone, 4 cols desktop, wraps)
   Sent today/week | Opened | Replied | Bounced
  "Needs action" - today's replies (snippet, Open lead)
  Clicks & page visits
  Bounces & unsubscribes
-------------------------------------------
Leads tab
  Search  [Filters v]  (stage, source, agent, due/overdue in a collapsible panel)
  Stage chips that wrap: All 42 | New 10 | Contacted 8 | Replied 3 | ...
  One vertical list of lead cards
   Firm / contact / amount / follow-up / DNC badge
   Stage dropdown on the card (big tap target)
  Tap card -> existing drawer
```

- Dashboard strip becomes a wrapping stat grid (stage counts move into the chips).
- Drag-and-drop board is removed. Stage changes happen from the card dropdown or the drawer, and still log a stage change.
- Desktop: the same list, laid out as a 2–3 column card grid, with the drawer as a side panel. Nothing scrolls sideways.
- Check: no element is wider than the screen at 390, 768 and 1280px.

## 2. Email activity

### Data changes
- **New stage "Replied"** between Contacted and Interested (widen the stage check).
- **Do-not-contact on leads:** new fields `do_not_contact` (default false), `dnc_reason` (bounced/unsubscribed/manual) and `dnc_at`. The card and drawer show a red badge, and the call/email buttons are disabled.
- **New `email_events` table:**
  - Fields: id, lead_id, provider, campaign, step, event (sent/delivered/opened/clicked/replied/bounced/unsubscribed), occurred_at, snippet (max 500 characters, replies only), provider_event_id (unique per provider, to drop duplicates), created_at.
  - Access: read rules match `crm_leads`, so an admin sees all and an agent sees their own plus unassigned. There is no public access. Only the webhook writes.
- **One database trigger on new email_events:**
  - replied: moves the lead to Replied if it is at New or Contacted. It never moves a lead backwards from Interested or later.
  - bounced or unsubscribed: sets do-not-contact.
  - Every event also adds a CRM timeline entry.

### Webhook (`email-events` function)
- POST with an `x-clearfund-secret` header, checked against a new `EMAIL_WEBHOOK_SECRET` secret. A wrong or missing secret gets a 401 response.
- A generic JSON body: `{ provider, event, lead_id | lead_ref | email, campaign, step, occurred_at, message_id, snippet }`. Each field is checked and capped in length, and up to 100 events can be sent in one batch.
- Matching order: lead id, then lead_ref, then email.
  - An event that matches no lead is stored with no lead and never creates a lead (same rule as /awarded).
  - The admin Activity view shows these as "Unmatched".
- A small adapter for Instantly or a Gmail-based sender's own format is added only once the sender is chosen.

### Drawer timeline
- One timeline, newest first, combining notes, calls and stage changes, email events, /awarded visits and /apply submissions.
- Each entry gets an icon by type. Opens are grouped together ("Opened 3x").

## Technical section
- Files:
  - Rewrite `src/pages/crm/Crm.tsx`.
  - Replace `CrmBoard.tsx` with `LeadList.tsx` and `ActivityView.tsx`.
  - Extend `LeadDrawer.tsx`.
  - Add the new stage and do-not-contact helpers to `src/lib/crm.ts`.
  - Add `supabase/functions/email-events/index.ts`.
- Visits and applications in the timeline: these come from a new read-only `crm_lead_timeline(lead_id)` server function. It checks that the person may see that lead before returning its visits, applications, email events and activity together. The visit and application tables themselves stay closed.
- Counts use the viewer's own time zone for "today" and a Monday start for "week". Opens are counted once per email.
- Tests:
  - Webhook: 401 without the secret; a duplicate event is stored once; an unmatched event creates no lead.
  - A reply moves New to Replied but leaves Funded alone.
  - Bounces and unsubscribes set do-not-contact.
  - An agent can't see another agent's events.
  - No sideways scroll at 390px.

## Risks / cut from v1
- **Opens are unreliable** (Apple Mail privacy and image blocking). They are shown, but nothing is automated from them.
- **No sending, sequences or reply-from-CRM in v1.** The CRM only monitors.
- **No auto-unassign or round-robin.** A reply on an unassigned lead appears in "Needs action" for everyone who can see it.
- **No real-time updates.** The view refreshes on load and with a refresh button.
- **The provider adapter waits until the sender is chosen.** Until then, the sender must post in our generic format, or we add the adapter later.
- **Unsubscribe here only flags the lead.** The sending tool must still stop the emails itself, so it isn't compliance on its own.
- **Removing drag-and-drop is a behaviour change** the owner asked for. It is not kept as an option.

## Owner decisions needed
- Confirm the "Replied" stage position: after Contacted.
- Should do-not-contact block phone calls too, or only email?

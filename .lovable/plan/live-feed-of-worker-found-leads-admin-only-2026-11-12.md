# Live feed of worker-found leads (admin only)

Adds to the CRM plan. Not published.

## What the owner sees
A new "Live" tab in /crm, admin only, next to Workers.
- Top strip (2-column grid that wraps): "Added today" total, then one small card per worker with today's count. Counts tick up as leads land.
- Below: a vertical list, newest first. Each card shows company, state, sector, need score (or "not scored"), found by, and source slice (e.g. "sba_search · state GA · naics 23"). Tap a card to open the lead drawer.
- When new leads land: the new cards slide in at the top with a short highlight, and a small green dot on the "Live" tab pulses if you're on another tab.
- A "Live" / "Reconnecting…" status pill, so a dropped connection is never mistaken for "no new leads".
- Empty state: "Waiting for workers. New leads show here as soon as they're saved."

## How it works
- Turn on live updates for the leads table, listening only to new rows whose source is "worker" (imports, /apply, calculator, manual edits are excluded).
- Access stays enforced by the existing lead permissions: admins receive every new worker lead; the tab and subscription only exist for admins. An agent who tried to subscribe would still only receive leads they can already see.
- On open: load today's worker leads (latest 100) and today's per-worker counts once, then add live events on top. Source slice names come from a cached lookup of slices, fetched once and refreshed for unknown ids.
- One subscription per open tab, created when the Live tab mounts and removed when it unmounts or the user signs out.
- On reconnect: re-run the initial load so nothing missed during the gap is lost.

## Cost and load risks
- A worker finishing a 500-lead slice produces up to 500 events in seconds. Each event is permission-checked per subscriber; with 1-2 admins watching this is small. Mitigation: the screen batches incoming events and redraws at most once per second, keeps at most 200 cards, and shows "+N more" instead of animating each one.
- Live updates bill by messages and open connections. Leaving the tab open on a phone all day keeps a connection open; the subscription pauses when the browser tab is hidden and resumes (with a reload) when visible.
- Per-worker counts are client-side increments after the initial load; if two admins compare screens they could briefly differ until the next reload. Acceptable for v1.
- "Today" uses the phone's local day.

## Technical details
- Migration: `ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_leads;` (existing RLS on crm_leads applies to realtime).
- Client: `postgres_changes` INSERT on `crm_leads` with filter `source=eq.worker`, unique channel name, cleanup on unmount / visibilitychange / sign-out.
- New `src/components/crm/LiveView.tsx`; Crm.tsx adds the admin-only tab and pulse dot.
- Checks: insert a labeled test lead via `crm_insert_lead` with a test worker name and confirm it appears without refresh at 390px; confirm an agent session receives no other agents' leads; remove test rows.

## Risks / cut from v1
- Cut: sound/push notifications, live updates for job progress and slices (Workers tab keeps its Refresh button), per-slice live counters, history beyond today.
- Field updates after insert (e.g. a score arriving later) won't update the card live; the drawer shows current data.

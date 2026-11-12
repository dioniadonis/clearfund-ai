# CRM: real counts + paged lead list

## Problem
`Crm.tsx` fetches `crm_leads` once (`.limit(5000)`, capped at 1000 by the API), then filters and counts in the browser. So every number stops at 1000 and search only covers those rows.

## DB function (one migration)
`crm_lead_counts(_q text, _source text, _agent text, _due text) returns jsonb`, **SECURITY INVOKER** so the existing CRM RLS still applies (agents count only their own plus unassigned leads). It returns one row:
- `total`, `due_today`, `overdue`, `added_week`: unfiltered, for the stat cards.
- `by_stage`: `{stage: count}` with search/source/agent/due applied but not stage, for the chips. The "All" chip is the sum.

It's one round trip with `count(*) FILTER (...)` and `GROUP BY stage`. Grant execute to `authenticated` only. "Today" comes from a `_today date` param sent by the browser, so it matches the visitor's local date as it does now.
Why one RPC and not 14 `head:true` count calls: one request, one consistent snapshot, and the search logic lives in one place.

## Lead list: `useInfiniteQuery` in `Crm.tsx`
- `.from("crm_leads").select("*").order("created_at",{ascending:false}).order("id").range(p*50, p*50+49)`
- Filters are applied on the server: `.eq("stage")`, `.eq("source")`, `.eq/.is("assigned_to", null)`, `.eq("next_follow_up", today)` / `.lt(...)`.
- Search: `.or()` with `ilike` on firm, contact_name, email, phone, agency, lead_ref, website, state, sector. Notes are left out (see risks). Input is escaped for `,()%` and debounced 300ms.
- A "Load more" button sits under the list and shows "Showing X of Y", where Y comes from the RPC.
- The query key includes the filters, so changing a filter resets to page 1.
- Stage move: update the cached page in place, then invalidate the list and counts.

## Files
- `supabase/migrations/...`: the `crm_lead_counts` function, plus a `pg_trgm` GIN index on the searched columns if search turns out slow (check with EXPLAIN on 8.6k rows first; it's probably fine without one).
- `src/pages/crm/Crm.tsx`: remove the full fetch and the in-browser counting; add the counts query, the infinite list, the debounced search and Load more.
- `src/components/crm/LeadList.tsx`: no change needed. It still takes `leads[]`, and the button goes below it.
- `src/components/crm/ActivityView.tsx`: it currently gets lead names from the full list. Switch to fetching only the lead ids that appear in its events (`.in("id", ids)`).
- Lead drawer: if the open lead isn't on a loaded page (for example, opened from Activity), fetch it by id.
- CSV export: page through the current filtered results 1000 at a time with `.range()` until done, so export covers all matching leads.
- `CrmWebTools.tsx`: reads the loaded page and reports the server total.

## Mobile
The stat cards, the wrapping chips and the vertical list stay as they are. Load more is a full-width button with h-11. Check at 390px with no sideways scroll.

## Checks
- As admin, the stat cards and the sum of the chips equal `select count(*)`, about 8.6k.
- As an agent, the counts match what RLS lets them see.
- Search finds a lead older than the newest 1000.
- Load more adds rows with no duplicates.
- Export row count equals the filtered count.
- At 390px, no sideways scroll.

## Risks / cut from v1
- Notes aren't searched: leading-wildcard `ilike` on long text is slow, and notes hold free text. Add it back later with an index if needed.
- New rows arriving while you page can shift offsets by a row. That's acceptable; ordering by `(created_at, id)` keeps it stable enough. Cursor paging is cut.
- Counts don't update live. They refresh on filter change, stage move and window focus. The Live tab is unchanged.

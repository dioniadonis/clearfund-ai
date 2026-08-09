# Remove the LeadGen Feature

## Goal
Remove the entire LeadGen feature from the app: navigation links, page/route, UI components, API client, and backend edge functions.

## Changes

### Frontend
1. **Header navigation**
   - Remove the "LeadGen" link from the desktop nav in `src/components/Header.tsx`.
   - Remove the "LeadGen" link from the mobile nav in the same file.

2. **Routing**
   - Remove the `LeadGen` import and `/leadgen` route from `src/App.tsx`.

3. **Page & components**
   - Delete `src/pages/LeadGen.tsx`.
   - Delete the entire `src/components/leadgen/` directory and its components.

4. **API client**
   - Delete `src/lib/api/firecrawl.ts` (only used by LeadGen components).

### Backend
5. **Edge functions**
   - Delete the following Supabase Edge Functions (only invoked by LeadGen):
     - `extract-leads`
     - `firecrawl-crawl`
     - `firecrawl-map`
     - `firecrawl-scrape`
     - `firecrawl-search`
   - Remove their source directories under `supabase/functions/`.
   - Deploy the deletions to the live backend.

## Verification
- Build the app to confirm no import errors or broken references remain.
- Confirm the `/leadgen` route returns the 404 page.
- Confirm the header no longer shows a LeadGen link on desktop or mobile.
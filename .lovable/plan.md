

# LeadGen Admin Page with Multi-Platform Selection

Build the full LeadGen admin page at `/leadgen` with multi-platform selection in the Query Generator.

## What You Get

### Tab 1: Search Query Generator

A form that builds Google search queries for finding contractor business owners with public emails.

**Key feature: Multi-platform selection**
- Checkbox list of all platforms so you can pick one, several, or all at once
- Platforms: Instagram, Facebook, LinkedIn (profiles), LinkedIn (companies), Google Maps, YouTube, Yelp, BBB
- "Select All" / "Deselect All" toggles for quick selection
- When multiple platforms are selected, clicking "Generate" produces one query per selected platform
- All generated queries appear in a results table with individual copy buttons and a bulk "Copy All" / "Export CSV" option

**Other inputs (dropdowns):**
- Industry: Roofing, Contractors, Landscaping/Lawn, Trucking, Food Trucks (each with sub-terms)
- Email filter: @gmail.com, @outlook.com, @yahoo.com, @hotmail.com, @icloud.com, @proton.me, info@, sales@, contact@
- Owner signal: owner, founder, ceo, principal, partner, operator, president, licensed contractor
- Location: Miami, Broward, Atlanta, Florida, Georgia

**Output per query:**
```
site:instagram.com "roofing" "owner" "@gmail.com" "Miami"
```

**Batch mode:** "Generate All Combos" rotates through selected platforms x email filters for the chosen industry/location, producing a full table.

### Tab 2: Lead Extractor (Firecrawl)

Scrape, Search, Map, and Crawl tools powered by Firecrawl with AI extraction targeting emails, business names, owner names, phone numbers, and addresses.

## Technical Details

### Files to Create

| File | Purpose |
|------|---------|
| `src/pages/LeadGen.tsx` | Main admin page with two tabs |
| `src/components/leadgen/QueryGeneratorTab.tsx` | Multi-platform Google query builder with checkboxes for platform selection |
| `src/components/leadgen/LeadExtractorTab.tsx` | Wrapper for Firecrawl sub-tabs |
| `src/components/leadgen/ScrapeTab.tsx` | Single URL scraper |
| `src/components/leadgen/SearchTab.tsx` | Web search + scrape |
| `src/components/leadgen/MapTab.tsx` | Site mapper |
| `src/components/leadgen/CrawlTab.tsx` | Recursive crawler |
| `src/components/leadgen/ResultsTable.tsx` | Shared results display with CSV/JSON export |
| `src/lib/api/firecrawl.ts` | Frontend API client |
| `supabase/functions/firecrawl-scrape/index.ts` | Scrape edge function |
| `supabase/functions/firecrawl-search/index.ts` | Search edge function |
| `supabase/functions/firecrawl-map/index.ts` | Map edge function |
| `supabase/functions/firecrawl-crawl/index.ts` | Crawl edge function |

### Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add `/leadgen` route |
| `src/components/Header.tsx` | Add "LeadGen" nav link |
| `supabase/config.toml` | Register 4 new edge functions |

### Platform Selection UI

The `QueryGeneratorTab` uses checkboxes (existing Checkbox component) for platforms:

```text
Platforms (select one or more):
[x] Instagram          [x] Facebook
[x] LinkedIn Profiles  [ ] LinkedIn Companies
[x] Google Maps        [ ] YouTube
[x] Yelp               [ ] BBB
[Select All] [Deselect All]
```

When "Generate" is clicked, one query row is created per selected platform. When "Generate All Combos" is clicked, it produces (selected platforms x email filters) queries.

### Setup

1. Connect Firecrawl via the connector to securely store the API key
2. Deploy the 4 edge functions
3. Query generator is purely frontend -- no API needed


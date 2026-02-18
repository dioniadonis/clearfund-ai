

# Smart Lead Extraction with AI + Info Tooltips

## Overview

Transform the Lead Extractor from a raw data dump into an actual lead generation tool. After Firecrawl fetches page content, AI (Gemini 2.5 Flash) extracts structured leads (business name, owner, email, phone, address). Also add small "i" hover tooltips throughout the entire LeadGen page so you always know what each tool/field does.

## What You'll See

1. **Info tooltips everywhere** -- small circled "i" icons next to labels. Hover to see a brief explanation of what that field or tool does.

2. **Search tab becomes your main lead tool** -- paste a query from the Query Generator, set how many results (default 10), click Search. It searches the web, reads each result page, and uses AI to pull out structured leads displayed in a clean table.

3. **Scrape tab extracts leads from a single page** -- paste any business listing URL and get a leads table back.

4. **Progress feedback** -- status text updates as it processes ("Searching...", "Extracting leads from 3 of 10 results...").

5. **Leads table** -- clean columns: Business Name, Owner, Email, Phone, Address, Source URL. With CSV export.

---

## Technical Details

### New backend function: `extract-leads`

**File:** `supabase/functions/extract-leads/index.ts`

- Receives `{ content: string, sourceUrl: string }` (markdown text from a scraped page)
- Calls Lovable AI gateway (`google/gemini-2.5-flash`) with a prompt to extract leads as JSON
- Returns `{ success: true, leads: [{ business_name, owner_name, email, phone, address, source_url }] }`
- Uses `LOVABLE_API_KEY` (already configured, no user action needed)
- Non-streaming response (needs structured JSON back)

**File:** `supabase/config.toml` -- add `[functions.extract-leads]` with `verify_jwt = false`

### Updated frontend components

| File | Changes |
|------|---------|
| `src/components/leadgen/SearchTab.tsx` | Add result limit input (default 10). After Firecrawl search, loop through results calling `extract-leads` for each. Show progress. Display leads in a structured table. |
| `src/components/leadgen/ScrapeTab.tsx` | After scraping, send markdown to `extract-leads`. Show leads table instead of raw JSON. |
| `src/components/leadgen/ResultsTable.tsx` | Add a "leads" display mode with proper columns (Business Name, Owner, Email, Phone, Address, Source). Keep raw JSON view as a toggle. |
| `src/components/leadgen/LeadExtractorTab.tsx` | Add description text for each tab. |
| `src/components/leadgen/MapTab.tsx` | Add tooltip explaining purpose ("Discovers all URLs on a website. Use this to find pages to scrape."). |
| `src/components/leadgen/CrawlTab.tsx` | Add tooltip explaining purpose ("Recursively scrapes all pages on a site. Use for bulk extraction from one domain."). |
| `src/components/leadgen/QueryGeneratorTab.tsx` | Add "i" tooltips next to each label (Platforms, Industry, Email Filter, Owner Signal, Location, Generate, Generate All Combos). |

### New shared component: `InfoTip`

**File:** `src/components/leadgen/InfoTip.tsx`

A small reusable component -- a circled "i" icon that shows a tooltip on hover. Uses the existing Radix Tooltip components already in the project.

```tsx
// Wraps Tooltip + TooltipTrigger + TooltipContent with an Info icon
<InfoTip text="Paste a search query here..." />
```

### Tooltip content (what each "i" will say)

**Query Generator:**
- Platforms: "Select which sites to search. Each generates a separate Google query."
- Industry: "The business type to search for."
- Email Filter: "Targets a specific email provider in results. 'All' generates one query per provider."
- Owner Signal: "Keywords that indicate the person is a business owner. 'All' generates one query per signal."
- Location: "City or region to target."
- Generate: "Creates queries for your selected options."
- Generate All Combos: "Creates every email filter combination for your selected platforms."

**Lead Extractor tabs:**
- Search: "Paste a query from the Query Generator. Searches the web, visits each result, and uses AI to extract lead info (name, email, phone)."
- Scrape: "Enter a single page URL (e.g., a Yelp listing). Extracts lead info from that one page."
- Map: "Discovers all URLs on a website. Useful for finding pages to scrape individually."
- Crawl: "Recursively visits all pages on a website. Good for bulk-extracting leads from an entire directory site."

### Flow

```
User pastes query in Search tab
  --> Firecrawl searches web, returns 10 result pages with markdown
  --> For each result, call extract-leads edge function
  --> AI parses markdown, returns structured lead data
  --> Display combined leads in table with export options
```




# Smart Input: Support Both Queries and Google Search URLs

## The Problem

Right now the Search tab only accepts text queries for Firecrawl's search API. But your natural workflow is:
1. Copy a query from the Query Generator
2. Paste it into Google
3. Copy the Google results URL
4. Paste that URL to extract leads from those results

The Search tab should detect whether you pasted a URL or a text query and handle both automatically.

## What Changes

### Search tab gets auto-detection

When you click "Search & Extract":
- If the input starts with `http` or contains `google.com/search` -- it's treated as a **URL**
- The system scrapes that Google results page, pulls out all the links, then scrapes each link and extracts leads
- If the input is plain text -- it runs the current Firecrawl search (unchanged)

### Updated flow for URL input

```text
User pastes Google search URL
  --> Firecrawl scrapes the Google results page
  --> Extract all outbound links from the page
  --> Filter to real business links (skip google.com, ads, etc.)
  --> Take up to [limit] links
  --> Scrape each link individually
  --> AI extracts leads from each page
  --> Display in leads table
```

### Updated flow for text query input (unchanged)

```text
User types a query like: general contractor owner Georgia email
  --> Firecrawl search API finds results
  --> AI extracts leads from each result
  --> Display in leads table
```

### UI changes

- Update the placeholder text to: `Paste a query OR a Google search URL`
- Update the InfoTip to explain both modes
- Add a small badge showing "Detected: URL mode" or "Detected: Query mode" so you know which path it's taking
- When in URL mode, show status: "Scraping Google results page...", "Found 12 links", "Scraping link 3 of 10...", "Extracting leads..."

## Technical Details

### File: `src/components/leadgen/SearchTab.tsx`

- Add a helper function `isUrl(input)` that checks if the input looks like a URL
- In `handleSubmit`, branch based on `isUrl(query)`:
  - **URL path**: Call `firecrawlApi.scrape(url, { formats: ['markdown', 'links'] })`, extract links from the response, filter out Google/ad domains, then loop through each link calling `firecrawlApi.scrape()` followed by `extract-leads`
  - **Query path**: Current behavior (unchanged)
- Link filtering: skip URLs containing `google.com`, `googleapis.com`, `gstatic.com`, `youtube.com`, `accounts.google`, `support.google`
- Deduplication: skip duplicate URLs and deduplicate final leads by email or business_name+phone

### No backend changes needed

All existing edge functions (firecrawl-scrape, firecrawl-search, extract-leads) already support this. The change is purely in the frontend logic.


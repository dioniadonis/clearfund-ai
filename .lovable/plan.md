# Trustpilot links in the Funding Partners section

## Goal
Make each partner name in "Our Funding Partners" a real link to its verified Trustpilot review page, styled minimal and flat to match the site.

## Current state
`src/components/FundingPartners.tsx` renders partner names as plain text. Both Trustpilot pages were verified live this turn:
- ROK Financial — https://www.trustpilot.com/review/rok.biz (claimed profile, 1,109 reviews)
- David Allen Capital — https://www.trustpilot.com/review/www.davidallencapital.com (claimed profile)

## Change (one file)
`src/components/FundingPartners.tsx` only:
- Add a `url` field to each partner entry (the two verified links above).
- Each partner name becomes an external link: `target="_blank"`, `rel="noopener noreferrer sponsored"` (sponsored because of the referral-compensation relationship).
- Minimal visual treatment: keep the current name styling, add a small `ExternalLink` icon (lucide-react) beside each name, and a hover underline. No badges, no star ratings, no review counts (they would go stale and risk over-claiming).

No changes to copy, layout structure, or other pages.

## Risks / cut from v1
- Cut: Trustpilot star ratings/review counts in static markup — numbers change; linking out is accurate without maintenance.
- Cut: Trustpilot widget/script — adds third-party JS to a lead-gen site; not asked for.
- The external links leave the site to a competitor-hosted review page; if a partner would rather not link, removing one entry is a one-line revert.

## Verification
- Type-check and build pass.
- Playwright: both links render with correct hrefs on `/` and `/apply`, open intent correct (new tab).

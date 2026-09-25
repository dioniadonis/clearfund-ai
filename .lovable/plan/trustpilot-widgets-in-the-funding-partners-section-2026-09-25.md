# Trustpilot widgets in the Funding Partners section

## Goal
Show real Trustpilot review widgets (TrustBox script embeds) for David Allen Capital and ROK Financial inside the existing "Our Funding Partners" section — professional, concise, minimal, flat to match the site theme.

## Current state
- `src/components/FundingPartners.tsx` renders partner names as plain text on homepage and /apply.
- Both Trustpilot pages verified live this turn:
  - ROK Financial — https://www.trustpilot.com/review/rok.biz — business unit `600eda90fa1950000114a333` (claimed profile, 1,109 reviews)
  - David Allen Capital — https://www.trustpilot.com/review/www.davidallencapital.com — business unit `56a23ef30000ff000587f226` (claimed profile)

## Change
1. **index.html** — add the official Trustpilot widget bootstrap script once:
   `<script type="text/javascript" src="https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js?v=20260925" async></script>`
   (version query per the project's cache-busting rule for static assets).
2. **src/components/FundingPartners.tsx** — under each partner name, render a TrustBox widget div with:
   - `class="trustpilot-widget"`, `data-locale="en-US"`, `data-template-id` (public "Mini" template `5419b6a8b0d04a9ceb044c56` for a compact star+count badge), `data-businessunit-id` per partner, `data-style-height/width` sized to fit the section, `data-schema-type="Organization"`.
   - Keep the two widgets in the existing centered symmetric row; partner names stay as verified external links (`target="_blank"`, `rel="noopener noreferrer sponsored"`).
   - Neutral copy and disclosure paragraph unchanged.
3. If the Mini template renders too tall or off-theme in preview, fall back to the slider/carousel template from the Trustpilot URL the user referenced, still minimal sizing.

## Risks / cut from v1
- Widgets load third-party script from widget.trustpilot.com — accepted because the owner explicitly requested the widget; loaded `async` so it never blocks page paint.
- Review counts/stars come live from Trustpilot — no invented claims; widget displays Trustpilot's own data.
- If Trustpilot is unreachable, the section still shows partner names and copy (widget area just stays empty).
- Cut: TrustBox carousel (heavier, marketing-style) unless Mini looks wrong in preview; dashboard-configured custom widgets need the owner's Trustpilot account — using public embed codes instead, flagged as such.

## Verification
- Type-check and build pass.
- Playwright on `/` and `/apply`: widget iframes render with partner branding, links correct, no console errors; section stays symmetric and flat.

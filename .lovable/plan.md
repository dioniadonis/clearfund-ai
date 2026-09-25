# Clear Fund AI readiness plan (review + work packet)

Audit only. No code, copy, data, integration or publishing changes. The output is a report the owner signs off on before any fixes.

## Review of the attached plan

Mostly sound. Changes I'd make:
- Batch 1 needs **one evidence column per claim**: the file/line where it appears, plus the source that backs it. Without that, "verified" means nothing.
- Batch 2 step 3 (test submissions) writes real rows. Keep it, but require owner approval, label test records `TEST-READINESS-<date>`, delete them afterwards and log the deletion.
- Batch 2 "notification behavior": the answer is already known. There are no operator alerts. Record that as a fact, not something to test.
- Batch 3 at 375px is right. Also check 768px, where tablet layouts often break.
- Add **Batch 0: freeze**. Record the current published build and the list of routes so every finding points to a specific version.

## Batch 0: Baseline
- Routes to audit: `/`, `/credit-repair`, `/working-capital`, `/gig-funding`, `/blog`, `/funding/insurance-restoration`, `/apply`, `/privacy-policy`, `/terms-and-conditions`, `/broker-disclosure`, `/disclaimers`, `/operator/login`, `/operator/*`, and a 404 route.
- Record whether the preview and the published site run the same build.

## Batch 1: Claims and funnel matrix
One table with these columns: route | element | exact text | destination or claim | owner/partner | funnel step | status (verified / owner-approved / unsupported / unknown) | evidence | owner decision needed.

Items a first code scan already shows. These must go in the matrix; none have been classified yet:

| Type | Item | Where |
|---|---|---|
| Partner link | ASAP Credit Repair signup (afcode=1328) | Credit repair section |
| Partner link | asapcreditrepair.com/clearfund | Footer |
| Partner link | davidallencapital.com/clearfund | Footer, qualification section |
| External form | JotForm 251378086816062 | Hero, slideshow, what-do-you-need section, gig funding, working capital, footer |
| External form | JotForm 251398259721162 | Header, footer |
| External form | JotForm 251428125592154 (embedded) | Blog |
| Success-rate claim | "73% success rate vs 25% industry average" | Credit Repair |
| Guarantee | "Permanent results guaranteed", "100% money back guarantee", "guarantee the best possible results" | Credit Repair |
| Timing claim | "60-90 day" results | Credit Repair |
| Timing/approval | "approved and funded in 24-48 hours" (2 places) | Working capital section |
| Timing/approval | "Same Day Funding", "Fast Approval", "deposited within 24-48 hours" | Gig Funding |
| Disclaimer conflict | "Success rates are based on partner data" | Disclaimers (no partner data is on file) |

The code scan counts as evidence of where each claim appears, not whether it is true. Every row stays "unknown" until the owner or partner supplies proof. Nothing gets rewritten in this batch.

Structural finding to decide on: the site runs **two parallel funnels**. JotForm forms go to JotForm. `/apply` goes to the operator panel. JotForm submissions never reach the operator panel.

## Batch 2: Backend and access checks (read-only, except for approved test rows)
1. **Leads fields**: confirm the database has name, business, email (optional), phone, stage, created_at, consent fields and notes. There is no single "source page" field. Source is stored as `source` plus `landing_page`/`referrer`/UTM fields. Record whether that is enough.
2. **Stages**: 10 stages exist. Transitions are **not enforced**, so any stage can jump to any other. Record this as a finding, not a failure.
3. **Form traces** (after approval): submit a test entry on `/apply` and check that the lead, the event and the operator view all update. Submit one JotForm test to see where it lands (outside the system). Test the honeypot, fill-time and rate-limit rejections.
4. **Access**: visitors who aren't signed in read zero leads through the database API. The lead-save function is refused for them. `/operator` sends them to the login page. A signed-in account without a role gets "Not authorised".
5. **States and notifications**: 404 page, `/apply` validation messages, success screen, error message. Operator notifications: none exist (known fact).

## Batch 3: Mobile and technical checks
- Automated browser run at 375 and 768px on every route: screenshot, check for sideways scrolling and overlapping elements, check that tap targets are at least 40px.
- Console and page errors on each route load.
- Per route: title, description, canonical and og/twitter tags. Most pages probably inherit the tags from the main page file; confirm this.
- Link check on every internal, external and legal link, plus every phone link (866-578-4721).
- Defect list: route | evidence (screenshot or log) | severity (blocker/major/minor) | recommended fix.

## Acceptance tests
- Matrix: 100% of CTAs, partner links and claims on the audited routes appear with file-level evidence. Zero rows missing a status.
- Each Batch 2 check has pass/fail with a query result, HTTP code or screenshot. Test rows are deleted, and a query proves the count is 0.
- Batch 3: one screenshot per route per width, plus a console log. Every defect has a severity.
- No commits and no data changes other than the approved test rows.

## Owner decisions needed
1. Credit repair claims (73%, guarantees, 60-90 days): keep with partner proof, soften, or remove?
2. "24-48 hours" and "Same Day Funding": is there partner proof? If not, remove them?
3. Which funnel is the main one? Keep JotForm, move everything to `/apply` and the screener, or run both?
4. Are the partner links (ASAP, David Allen Capital) current, and are they paid affiliate links? Paid links would need an affiliate disclosure.
5. May we create and then delete labeled test leads?
6. Should stage transitions be enforced, or stay free-form?
7. The pending funding-review screener plan: pause it until this audit is done?

## Risks / cut from v1
- The biggest risk is the **timing and guarantee claims on funding and credit repair pages**, not the code. They contradict the site's own Disclaimers and Terms.
- JotForm leads are invisible to the operator panel. The funnel stats only cover part of the leads.
- The Disclaimers page says partner data exists; it doesn't. Fix it with the other claims.
- The audit can't confirm what happens inside JotForm or on partner sites, so those rows will say "unknown – external".
- Cut: SEO scoring, speed tuning, accessibility audit beyond tap targets and overflow, cross-browser testing beyond Chromium. Do these later if needed.

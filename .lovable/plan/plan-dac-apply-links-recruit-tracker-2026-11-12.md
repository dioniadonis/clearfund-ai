# Plan: DAC Apply links + Recruit tracker

## 1) Apply buttons -> DAC replicated site

One shared constant `DAC_APPLY_URL = "https://www.davidallencapital.com/clearfund"` in `src/lib/partners.ts`, and a small `<ApplyLink>` helper (`target="_blank" rel="noopener noreferrer"`) so every button uses the same link.

Buttons/links to change (currently go to our `/apply`):
- Header menu "Apply" (`Header.tsx:70`)
- Home hero Apply (`Hero.tsx:29`)
- Home "What do you need" working-capital card (`WhatDoYouNeedSection.tsx:12`); line 16 already goes to DAC, switched to the constant
- Slideshow "Get started" (`FinancingEducationSlideShow.tsx:55`)
- Footer "Apply for Funding" (`Footer.tsx:27`); line 58 already goes to DAC, switched to the constant
- Blog "Apply" (`Blog.tsx:82`)
- Working Capital page: hero, benefits, bottom (`WorkingCapital.tsx:42/264/293`)
- Restoration Funding page: 3 buttons (`RestorationFunding.tsx:162/342/362`)
- Contract Financing: "Get Pre-Qualified", "Get Paid on My Invoice", hero and footer "Apply Now" (`ContractFinancing.tsx:47/56/110/233`)
- Personalized `/awarded` "Apply Now" (`Awarded.tsx:67`)
- Cash-gap calculator "Apply for $X" and "Apply Anyway" (`CashGapCalculator.tsx:64/153`)
- Free audit results "See my funding options" (`FreeAuditResults.tsx:146`)
- Existing DAC links: switch to the constant and `https://www.` (`GigFunding.tsx:16`, `FundingFAQSlideShow.tsx:48` which uses http, `QualificationSection.tsx:83`, `FundingPartners.tsx:9`)

Not changing: the "Call Now" buttons, the ROK portal link in Funding Partners, and the `/apply` page itself (it stays reachable by direct URL for the phone concierge's send-application links).

Copy: button labels stay the same. Where a button showed a dollar amount ("Apply for $75,109"), it becomes "Apply with our funding partner", with no amount or rate. Next to the main hero/landing buttons, one short line: "Opens David Allen Capital's application. Approval and terms are set by the provider." No rates, timelines or approvals.

Tracking: before opening the link, we log the click to `lead_attribution`/analytics (cta name, page). This is best-effort: if it fails, the link still opens. Our `?cta=` and `lead` params are not sent to DAC (their link is what credits our account).

## 2) Recruit tracker (recommendation: reuse `crm_leads.lead_type`)

`crm_leads.lead_type` already exists (`borrower`/`partner`), and the worker import already sets it. Recommendation: use `lead_type='partner'` for recruits instead of adding a new table. Why: dedupe, DNC, activities, the timeline, RLS, counts and worker-api find/update all work unchanged, so we build no second system. A separate table would duplicate all of that.

Changes:
- Migration: widen the stage CHECK to allow recruit stages `Signed up (DAC)`, `Trained`, `First referral` (`New`, `Contacted`, `Interested` are shared). The stage check in `crm_worker_update_lead` validates the stage against the lead's type: borrower stages for borrowers, recruit stages for partners. `crm_lead_counts` gets an optional `_type` filter. Source = existing `email_source`/`found_by`. Notes = existing notes.
- CRM UI: a "Clients | Recruits" toggle at the top of Leads (wraps on phone). In Recruits, the stage chips/selector show the 6 recruit stages, counts are filtered by type, and the card shows a "Recruit" badge. The vertical list stays, so no sideways scrolling.
- worker-api: `leads/find` takes an optional `type` and returns `lead_type`. `leads/update` is unchanged; stage is validated server-side by type. Same worker-key auth, logged in `crm_worker_calls`.
- Leads with no type (null) are treated as clients.

## Checks
- Playwright: every listed button opens the DAC URL in a new tab; no remaining `/apply` links except the ones meant for the concierge.
- CRM at 390px: toggle, recruit stages, counts, no horizontal scroll.
- SQL test: a recruit stage on a borrower is rejected; update/find works for a test partner, then the test row is deleted.

## Risks / cut from v1
- Our own `/apply` attribution and new-lead alerts stop for these clicks. Applications then live only in DAC's status updates. Not built: a DAC status sync (no API confirmed).
- Calculator/awarded amount prefill is lost (DAC's form won't take our params).
- A recruit converting into a client needs a type change; v1 does this through a manual type switch in the drawer (admin only).
- Cut: a separate recruits table, a commission tracking field, a recruit pipeline board.

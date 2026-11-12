# Per-lead funding routing

## What gets built
1. **Funder products list** (admin-only, editable in CRM, no rebuild to add partners). Fields as you listed plus `allowed_lead_states` handled via the global state rules below. Seeded with 4 David Allen products (Giggle, Bank Breezy Bigger Funding, CoreRate, Line of Credit) using your numbers; commission notes empty.
2. **Short qualifier** at `/get-started` (6 steps, one question per screen): months in business, monthly revenue range, credit range, state, amount needed, use of funds, business checking yes/no. Then name + email/phone + existing consent text. Saved to the CRM lead (new answer fields on the lead, matched/deduped like other inserts).
3. **Route engine** (one database function, the only place matching happens): hard rules first (state blocks, product rules, active), then rank by fit, then commission rank. Stored on the lead: suggested product, reasons ("Revenue $15k+ meets Bank Breezy minimum"), and fails ("FICO below 680 for CoreRate"). CRM lead drawer shows a "Routing" card; admin can override.
4. **Applicant next step only**: either "Continue to application" (DAC link, new tab) or our `/apply` form. No product names with rates, amounts, timelines or approval language. No match → "We'll review and contact you" (lead stage Interested, no link).
5. **`/apply` stays a real path**: submission lands in CRM as stage Applied with routed funder; new admin button "Mark submitted to funder" (confirm dialog, records who/when). Nothing is sent to any funder automatically.
6. **State rules (global, override any product)**: never VA, CT, MO, CA, VT, ND; TX blocks MCA-type products; NC blocks loan-type products. Requires a `product_kind` field (mca | loan | loc | other) on each product. Blocked state → polite "not available in your state" screen, lead saved as Lost with reason.
7. **Remove timing wording** (owner rule: no timelines). Instances found:
   - WorkingCapitalSection.tsx lines 17, 61, 75-76
   - WhatDoYouNeedSection.tsx 108
   - FundingFAQSlideShow.tsx 76, 82, 216 ("Rate determined in minutes… quick approval")
   - GigFunding.tsx 34, 372, 382
   - WorkingCapital.tsx 39, 52, 71, 106-109, 122 ("Same-day approval possible"), 289
   - Features.tsx 12, 20
   - RestorationFunding.tsx 181 ("Fast initial qualification")
   - ProcessSlideShow.tsx 84 ("less than 5 minutes"), Apply.tsx 211 ("about three minutes"), ContractFinancing.tsx 73, 200 ("Apply in minutes"), ChatInterface.tsx 15 ("about 5 minutes")
   - Out of scope unless you say: FreeAuditLanding "In 4 minutes" (not funding).
   Replacements are neutral ("Straightforward application", "Provider sets approval and terms").

## Apply buttons
Shared ApplyLink switches from "open DAC" to "open qualifier" (one-line change), so every existing button routes through the qualifier.

## Red-team
- **Friction**: 6 questions + contact before DAC loses some clicks. Mitigation: one tap per question (ranges, not typing), progress bar, contact asked last, and keep a small "Already know you want David Allen? Apply directly" link so nobody is blocked. Track drop-off per step via existing click log.
- **Double application**: someone fills our `/apply` then DAC's too, or vice versa. Mitigation: route sends each lead to exactly one next step; `/apply` only shown when the engine picks `our_form`; CRM flags when a lead has both an Applied record and a DAC click; we don't re-send DAC link after an `/apply` submission. Real risk remains: DAC's site can't tell us who applied there.
- **Fake intelligence**: "pays us best" can't rank yet — commission notes are empty text. v1 ranks by fit only; commission rank becomes a numeric `commission_rank` field you fill in later. Cut from v1: any auto-computed payout.
- **Self-reported data**: credit/revenue are ranges the applicant picks; suggestion is a hint, not a decision. Shown as "Suggested", admin approves.
- **Unknown product rules**: Giggle "personal account" and Bank Breezy terms are as you gave them; I'll not invent extra criteria. Confirm product_kind per product (is Giggle/Bank Breezy MCA? affects TX).
- **Mobile**: qualifier one column, big tap targets; CRM Routing card stacks vertically; product editor is a list of cards + edit sheet, not a table. Checked at 390px for no sideways scrolling.
- **Cut from v1**: automatic submission to funders, email/SMS to applicant, multi-funder split, rates display.

## Technical details
- Migration: `funder_products` (+ grants, RLS admin write / CRM user read), `crm_leads` add `qualifier jsonb`, `routed_product_id`, `route_reasons jsonb`, `route_override_by`, `submitted_to_funder_by/at`. Seed via data insert.
- `crm_route_lead(_answers jsonb)` security-definer; called by `submit-qualifier` edge function (honeypot + rate limit, same as apply), returns only `{next: 'dac_link'|'our_form'|'review'|'state_blocked', url}`.
- `/apply` submission trigger sets stage Applied + routed product.
- Tests: state blocks (VA rejected, TX excludes MCA, NC excludes loan), Giggle vs Bank Breezy by revenue, CoreRate FICO cutoff, no-match → review.

## Open questions
1. product_kind for each of the 4 DAC products (TX/NC rules depend on it).
2. Keep a direct-to-DAC bypass link? (recommended yes)

# ClearFund Claim List — /claim-list

## What gets built
1. **`/claim-list` page** — exact copy, sections, colors and behavior from your HTML (sample sheet with room tabs, line totals, room subtotal and grand total, FAQ, pricing). Its own simple nav and footer; no funding header, footer or links. Works on both clearfundai.com and myclearfund.com (no host guard). Added above the catch-all route.
2. **Order buttons, phase A (until Stripe is on):** each button opens a short waitlist form (email + the chosen plan) saved to a new `claim_list_waitlist` table. The "Preview only" toast is gone.
3. **Order buttons, phase B (after Stripe is on):** buttons open one-time Stripe checkout for $49 / $149 / $299. After payment → `/claim-list/thank-you` with an upload form: multiple photos, email (prefilled from checkout), optional notes. Saved to a private storage bucket and a new `claim_list_orders` table, tied to the verified payment.
4. **Operator area:** new "Claim List" tab in `/operator` listing waitlist signups and paid orders, with photo viewing through short-lived private links.
5. **Tracking:** page views and order clicks per plan (small/standard/major) logged to a `claim_list_events` table; operator tab shows views, clicks per plan, click-through rate, waitlist count and paid orders.
6. **SEO for this route only:** your title, matching description, og:title/description/url/type, canonical pointing at the current host's `/claim-list`.

## Privacy audit (answer to requirement 3)
Checked, nothing contains a person's name or a street/mailing address:
- `index.html`: author meta is "Clearfund AI" (brand). No address.
- `src/components/Footer.tsx`: business phone 866-578-4721 (company line, not personal). Not used on this route.
- `src/pages/PrivacyPolicy.tsx`, `src/pages/TermsAndConditions.tsx`: company phone 866-578-4721 and "Florida" as state of jurisdiction only; no street address, no personal name.
- The new page shows only "ClearFund" and links only to its own sections (no outbound links). The new page links to no legal pages, as in your HTML.

Things to flag:
- `index.html` default og tags say "Clearfund AI – Funding Tools…" and use a funding share image. Link-preview bots (Facebook, iMessage, LinkedIn) don't run page code, so **shared links to /claim-list will still show the funding preview**. Google sees the correct title. Fixing that needs server rendering (a larger upgrade); not in v1.
- `index.html` also carries the funding "ClearFund AI" title/description until the page code runs (a split second).

## Chat bubble
The funding chatbot is a third-party script loaded for every page in `index.html`. Plan: on `/claim-list` (and thank-you), hide its injected bubble with a small check that runs on route change. Exact element names get confirmed during build; if the script can't be hidden cleanly, I'll tell you rather than ship a half-fix.

## What I need from you
- **Stripe:** ask the Lovable editor chat to "set up payments with Stripe" (built-in; no Stripe account or keys required for the managed option). I can't enable it from here. Once on, I create three one-time products: Small claim $49, Standard claim $149, Major loss $299.
- Confirm a **business email** shown nowhere on the page is fine (none is planned — your HTML has no contact info).

## Questions
1. Upload limits: max photos per order and max size? Proposed: 200 photos, 15 MB each, images only.
2. Photo retention: delete after N days, or keep until the customer asks (FAQ promises deletion on request)? Proposed: manual delete button in operator tab for v1.
3. Should a paid customer get a confirmation email? Proposed: no in v1 (Stripe's receipt covers it); show a clear on-screen confirmation.
4. Is your HTML's "Delivered within 48 hours" / refund guarantee approved copy? It's a timing promise — fine for this non-funding product, but confirming since funding pages ban timelines.

## Technical details
- Files added: `src/pages/ClaimList.tsx`, `src/pages/ClaimListThankYou.tsx`, `src/components/claimlist/*` (sample sheet, waitlist dialog, upload form), `src/pages/operator/OperatorClaimList.tsx`, `src/lib/claimList.ts` (sample data + totals, plan ids/prices), `tests/claimList.test.ts` (totals, per-plan price mapping), edge functions `claim-list-track`, `claim-list-waitlist`, `claim-list-upload` (+ checkout/verify functions in phase B).
- Files touched: `src/App.tsx` (2 routes above `*`), operator sidebar/routes, `AGENTS.md` (one rule: Claim List is isolated from funding UI/data).
- Styling: page-scoped CSS variables/classes in the component so it matches the HTML exactly without changing site-wide tokens. The HTML's hero uses a gradient; project rule says no gradients — **I'll keep it since you said reproduce exactly**, unless you want it flat.
- Fonts: Poppins/Inter loaded only if not already present.
- Tables (RLS on all): `claim_list_events` (insert via function only, operator read), `claim_list_waitlist` (insert via function with honeypot + rate limit, operator read), `claim_list_orders` (written only after server verifies Stripe payment; operator read/update). Bucket `claim-list-photos` private; uploads via function bound to a paid order token; operator views via signed links.
- Tracking: anonymous session id kept in sessionStorage (analytics only, not storage of records); one view per session, every click logged.

## Risks / cut from v1
- Risk: share previews stay funding-branded (see above).
- Risk: hiding a third-party chat script can break if the vendor changes markup.
- Risk to existing routes: minimal — only additive routes; no changes to Header/Footer/funding pages. Catch-all order preserved.
- Cut: customer accounts, list-generation tool, voice notes, emails, coupons, refunds automation, retention auto-delete.

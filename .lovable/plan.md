# Packet CF-01: Retire JotForm, one lead pipeline, remove credit repair

This plan follows the packet's batch order: Batch 0, then B1 to B5, then B7 (which can run in parallel with the others). Every decision in the packet is kept. The conflicts below need an answer before building; the plan stops at them instead of guessing.

## Conflicts that need an answer before building

1. **The header and footer JotForm (251398259721162) is a contact form, not an application.** Sending "Contact us" to a funding application changes what the button means. Recommendation: keep the label and send it to `/apply?cta=header_contact` (or `footer_contact`), accepting that it becomes an application. The alternative is a short contact form, which is out of scope.
2. **B3 phone consent rule.** Phone is always required on `/apply`, so "phone consent required whenever a phone is entered" means nobody can submit without agreeing to calls. That makes call consent a condition of applying, which is a consent-law risk (TCPA). The current rule is: at least one contact method must be checked, and all boxes start unchecked. Recommendation: keep the current rule and meet "unchecked by default" as the site already does.
3. **The blog block heading "Ready to see what you qualify for?"** implies a qualification result, which the site has already cut once as an over-promise. Recommendation: "Ready to start your funding review?" and keep the button text "Start your application".
4. **B7 test "0 results for 'guarantee'"** would require removing "No Guarantee of Approval" from Terms and Disclaimers. That is protective legal language, and the packet also says not to touch legal pages. Recommendation: narrow the test to "no guarantee *claims*": 'money back', 'guaranteed', 'Permanent results'.
5. **B7 search for 'credit repair'** also matches Privacy, Terms and Broker Disclosure. The packet only allows edits to Disclaimers. Recommendation: allow one-line removals of credit repair mentions in those three legal pages too, or exempt them from the test.
6. **B2 email sender (separate prerequisite, owner-approved):** alerts go to mark@clearfundai.com and arrive through the existing IONOS forwarding. No Gmail or Google Workspace is needed. Sending still needs a sender the owner approves, with no paid provider and no new account. The candidate is the built-in email sending, which requires verifying clearfundai.com (a DNS change at IONOS). Until the owner approves a sender, the email channel logs "not configured" and the lead still saves.
7. **Extra speed claim not in the packet:** "Funding as fast as 24 hours" on the Instant Micro Funding card. The packet's rule (no numbers without written confirmation) says replace it with "Fast funding decisions". Confirm.

## Batch 0: Baseline (read-only)
- Record the current published build and the route list: `/`, `/credit-repair`, `/working-capital`, `/gig-funding`, `/blog`, `/funding/insurance-restoration`, `/apply`, the four legal pages, `/operator/*`, and 404.
- Record a starting search count for "jotform", credit repair terms and speed claims.

## B1: Lead fields
- Add two fields to leads: `service_interest` (required; working_capital / gig_funding / insurance_restoration / other; defaults to other so existing rows are filled) and `entry_cta` (optional short text).
- Operator lead list: add a service column and a service filter. Lead detail: show both fields, read-only.
- Nothing else changes: access rules, stages, existing fields.
- Tests: existing leads show "other"; the filter works; a signed-out read still returns 0 rows.

## B2: New-lead alerts
- After the lead has saved, the submission function sends two alerts independently: an email to the owner and a message to the Telegram webhook. Each contains name, business, phone, service, entry CTA and a link to `/operator/leads?lead=<id>`. No consent details or notes.
- One place sends the alerts. Each channel has its own error handling, and each result is logged on the lead's history (sent, failed, or not configured). A failure never stops the lead from saving and never blocks the other channel.
- Needs the Leads page to open the lead from the `?lead=` link (small addition).
- Covers `/apply` submissions and leads created by the phone concierge (send-application), so all leads alert.
- Tests: one email and one Telegram message per test lead; the links open that lead; switching one channel off still saves the lead and sends the other.

## B3: `/apply` handles every service
- Read `?interest=` and `?cta=` from the link. A valid interest preselects the service dropdown, which the applicant can change. The headline follows the packet's copy. A missing or invalid interest shows "Apply for business funding" with nothing preselected.
- Service dropdown: working capital, gig funding, insurance restoration, other. No credit repair.
- Save service_interest and entry_cta (length-limited) through the submission function.
- The restoration page's "Start my funding review" button adds `interest=insurance_restoration&cta=restoration_hero`.
- Unchanged: validation, consent wording, success and error screens, spam protection.

## B4 + B5: Replace JotForm (merged; the leftovers are small)
| Location | New destination |
|---|---|
| Hero "Apply Now" | `/apply?cta=hero` |
| Slideshow | `/apply?cta=slideshow` |
| What-do-you-need, Working Capital card | `/apply?interest=working_capital&cta=what_do_you_need` |
| Header contact | `/apply?cta=header` (pending conflict 1) |
| Footer (application + contact) | `/apply?cta=footer` |
| Gig funding page | `/apply?interest=gig_funding&cta=gig_funding_section` |
| Working capital page | `/apply?interest=working_capital&cta=working_capital_section` |
| Blog embed | Styled button block linking to `/apply?cta=blog` (pending conflict 3) |

- Remove the application pop-ups that only wrapped the JotForm frames. Button labels and styling stay the same.
- Remove JotForm leftovers: the embed script in `index.html`, the blog's JotForm scripts, and the JotForm type declarations in Footer. Every removal is listed in the build report.
- David Allen Capital links and phone links stay as they are.
- Tests: a codebase search for "jotform" or "jotfor" returns 0; no requests to jotform.com on any route; no new console errors; every former CTA opens `/apply` with the right parameters.

## B7: Remove credit repair and speed claims, add disclosure
- Delete the `/credit-repair` page and the credit repair section. Remove the credit repair card on the homepage (the grid goes from 3 to 2 cards, centered), plus the header and footer items. `/credit-repair` redirects to `/`.
- Remove all ASAP links (afcode=1328, asapcreditrepair.com/clearfund).
- Replace with "Fast funding decisions": "approved and funded in 24-48 hours" (2 places, working capital section), "Same Day Funding", "Fast Approval", "deposited within 24-48 hours" (gig funding), plus the micro-funding card line (pending conflict 7).
- Disclaimers page: remove the "Success rates are based on partner data" line and the credit repair wording.
- Add "ClearFundAI may receive compensation from partners linked on this site." next to each David Allen Capital link (footer, qualification section, micro-funding card) and once in the footer.
- The full list of text changes goes in the build report.

## End-to-end test (after approval)
- Submit 5 leads named `TEST-READINESS-2026-09-25`: one per interest value, one with no interest, one from the blog.
- Check each lead's service and CTA in the operator panel, and check the alert result on each channel.
- Delete the test leads and their history. Confirm the test-name query returns 0 and record the deletion in the report.

## Cutover (owner)
Review the preview, approve publishing, then disable the three forms inside JotForm.

## Technical details
- Migration: create a `service_interest` enum and add the columns with a default. No policy changes. Operator types are regenerated.
- `submit-application`: accepts the two new optional fields, then calls a shared notifier (`_shared/notify.ts`) after the insert. `send-application` calls the same notifier when it creates a new lead.
- Secrets needed: `TOD_TELEGRAM_WEBHOOK_URL` and `OWNER_ALERT_EMAIL`, plus the email sender settings. Secrets are requested through the secure prompt, never in chat.
- The redirect is a route in `App.tsx` pointing to `/`.

## Risks / cut from v1
- Header "Contact" becoming an application may lower contact volume. Watch this after launch.
- The email alert is blocked until an email sender is connected. Telegram alone may ship first.
- The Instant Micro Funding card will have no speed number once the claim is removed. The copy gets vaguer on purpose.
- Old JotForm links shared outside the site (ads, texts) will still work until the owner disables the forms. They then break, and those leads are never captured.
- Cut: contact form, alert retries or queue, and editing service or CTA in the lead detail (read-only in v1).
- Still paused: the screener plan and the audit's Batch 3 mobile fixes.

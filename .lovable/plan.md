# Homepage hero: call-first CTAs + short screener

## What changes on the homepage hero

Primary button becomes a call button; the online route becomes a real (new) short screener; "What We Do" demotes to a smaller link below.

```text
[ Call Now ]                <- primary, dials 866-578-4721
Speak with our AI concierge to find your next step.
Screening identifies possible options; it does not establish approval.

[ Start My Funding Review ]  <- secondary, goes to the new screener
What We Do                    <- smaller text link, opens the existing slideshow
```

- No "Check Eligibility" wording anywhere — nothing scores applicants, so nothing may imply an eligibility result.
- 866-578-4721, same as the header. One funnel; no per-page call tracking in v1.
- The AI chat preview panel on the hero's right side stays — it now matches the concierge-first story.
- Rest of the homepage untouched.

## The short screener: new page at `/funding-review`

A form the concierge flow can also point to. Deliberately short — it opens the relationship, it is not the application.

Fields:
- Owner name (required), phone (required), email (optional)
- Monthly revenue — range dropdown, not a typed number
- Time in business — range dropdown
- Funding need — amount (optional) + purpose dropdown

Consent, matching the `/apply` pattern:
- Separate unchecked boxes: phone contact, email contact, SMS contact — consent wording version and timestamp stored on the lead
- Broker acknowledgment checkbox: ClearFund matches businesses with third-party funding providers; we are not a lender

No SSN, no bank numbers, ever.

**After submit:** success screen says the review has started, with a "Call Now" button (866-578-4721) as the next step and a link to the full `/apply` application for people ready to continue online.

**Attribution:** captures all `utm_*` params, referrer and landing page from the URL, same as `/apply`, so the screener's cost-per-lead is measurable from day one.

**Spam protection:** same trio as `/apply` — honeypot field, minimum fill time, per-IP rate limit.

## How the submission is handled

- New server function `submit-screener`: validates input, applies spam checks, upserts the lead by phone (last-10-digit match) or email, sets stage `qualification`, source `site_screener`, stores consent fields, writes a lead history event.
- No schema changes — the existing leads table already holds every field this needs.
- No public read access; leads stay operator-only as today.

## Files

- Edit: `src/components/Hero.tsx` — CTA block per the layout above
- New: `src/pages/FundingReview.tsx` — the screener (existing header/footer, flat styling)
- New: `supabase/functions/submit-screener/index.ts`
- Edit: `src/App.tsx` — `/funding-review` route above the catch-all

## Risks / cut from v1

- Cut: any scoring or "you may qualify" output — the screener saves a lead at stage `qualification` for human review only; the concierge's screening conversation is the screener.
- Cut: email/SMS alert to the operator when a screener lands — it appears in the dashboard; alerts are a separate step.
- Cut: per-page call tracking number — 866-578-4721 is shared with the header, so page-driven calls aren't distinguishable yet.
- Cut: email field validation beyond format; no email verification.
- Assumption carried from your answer: the AI concierge is live on 866-578-4721 and can hold a screening call. The send-a-link plumbing (shared secret in Retell, Twilio/Resend) is still pending — the concierge can talk but cannot yet text or email the application.
- If the form gets abused beyond honeypot + timing + rate limit, add a CAPTCHA then.

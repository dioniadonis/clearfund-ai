# Restoration contractor landing page — critique and build plan

## Critique of the brief

**Strong:** the ICP, the "competent operator with a timing problem" framing, the ban on approval/rate guarantees, and the refusal to invent privacy claims. Keep all of that verbatim.

**Problems to fix before building:**

1. **No destination.** The brief defines CTAs but never says where they go. This site already has a real intake form at `/apply` and a phone concierge that can send the application by text or email. Without wiring the CTAs to those, the page is a brochure that collects nothing.
2. **Attribution is missing.** The brief calls this an ad landing page but never mentions campaign tracking. Lead records already store source and campaign fields; the page must pass those through to `/apply` or cost per lead can never be measured. This is the single most important omission.
3. **Visual instructions conflict with the brand rule.** The brief says reuse "gradients"; this project's standing rule is flat design, no gradients. Some older pages still use gradients. Plan follows the flat rule.
4. **"See what I may qualify for" over-promises.** There is no qualification engine — nothing scores an applicant on submission. The page must not imply an instant answer. Wording becomes "Start my funding review", and the broker acknowledgment already required on applications stays.
5. **Four photoreal job-site images is a trap.** The brief bans AI artifacts (bad hands, fake screen text, impossible equipment) while requesting exactly the imagery most likely to produce them. Plan uses one hero image, wide and equipment/environment led with no close-up faces, and no other photography until you supply real job photos.
6. **"Master template for future industries" is overbuild for v1.** Build one page well. Extract the shared skeleton when the second industry page actually exists — otherwise the abstraction gets guessed wrong.
7. **Side-by-side "generic funding conversation" comparison** is fine but must stay generic — no named competitors, no claims about what other brokers do.

## What gets built

New page at `/funding/insurance-restoration`, existing header and footer, flat styling matching the site's blue/amber palette.

Sections, in order:
1. Hero — eyebrow, headline "Keep taking restoration jobs while insurance catches up", supporting copy, primary CTA to the application, secondary CTA to call, friction microcopy (no guarantees, no timers).
2. The core problem — the gap between the job and the payment. Short.
3. Capital use cases — six cards: payroll and crews, materials and reconstruction, vehicles and equipment, CAT and surge capacity, expansion, working capital.
4. Positioning comparison — generic "how much do you need?" versus need-driven questions.
5. Funding paths — lines of credit, working capital, equipment finance, term, receivables/factoring where appropriate, SBA for qualifying businesses; framed as options that may be explored, never offered.
6. Process — four steps, matching what actually happens: tell us what's happening, complete the application, we review with funding partners, next steps.
7. Technology positioning — short, AI as plumbing not product; names the virtual assistant honestly as a virtual assistant.
8. Final CTA — repeats both actions, with the responsible-data-handling line and links to Privacy and Terms.

Compliance carried through: broker language ("we match businesses with third-party funding providers, we are not a lender"), no approval or timing guarantees, no security claims that haven't been verified.

## Technical notes

- New: `src/pages/RestorationFunding.tsx`, one generated hero image in `src/assets`.
- Edit: `src/App.tsx` (add the route above the catch-all).
- CTAs: primary links to `/apply` preserving any `utm_*` query parameters from the ad click and adding `source=restoration-landing`; secondary is a `tel:` link.
- `/apply` records source and UTM values already, so no schema change and no new database work.
- Page-level title, meta description, canonical, single H1, alt text on the hero.
- Not touching the header, footer, global styles or any existing page.

## Risks / cut from v1

- Cut: reusable multi-industry template, extra imagery set, scroll animations beyond what the site already does, testimonials, any qualification calculator or estimated-amount widget.
- Cut: a dedicated shorter landing header — keep the normal header so navigation and phone stay consistent.
- Assumption to confirm on review: the secondary CTA dials the same phone number the header uses. If the ad funnel should ring the AI concierge on a separate number instead, say so and I'll swap it.
- Copy is written from the brief and industry knowledge; it contains no invented figures, no claimed funding amounts and no client names.

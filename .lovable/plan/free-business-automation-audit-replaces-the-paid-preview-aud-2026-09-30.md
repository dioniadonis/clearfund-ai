# Free Business Automation Audit (replaces the paid preview audit)

## Decisions applied
- The free audit replaces the paid one at /automation-audit. The paid intake pages are removed. Old paid records and the operator Audits pages are kept, read-only, so no data is lost.
- Uses the flat site style: current brand colors, light mode, no gradients, no dark toggle. This overrides the spec's design section.
- The contact step reuses the existing audit consent wording exactly. The terms/privacy box is required and the phone box is optional. Both start unchecked.
- The spec's copy, question flow, scoring rules, AI prompts and compliance footer are used word for word.
- Stays in preview only. Not published. No outbound messages.

## What the visitor sees
1. **/automation-audit** landing page with the spec copy: eyebrow, headline, CTA, "why it's free" callout, "What you actually get", a simple before/after list, and the trust line.
2. **/automation-audit/start** has one question per screen: large tap cards/chips, sliders with live values, "Step X of 7", a thin progress bar, a Back button and ~250ms slide/fade. Answers are kept in the browser until submitted so a refresh doesn't wipe them. Contact details are never stored in the browser.
3. **Contact step** comes before results: name, business, email, optional phone, and the consent boxes.
4. **Loading step** lasts at least 2.5s while the AI analysis runs.
5. **/results/:token** shows the score dial counting up, the "today vs automated" columns, 3 opportunity cards revealed one by one, the "first ten audits" callout, funding context, a funding CTA to /apply?cta=audit_results, a Download PDF button (print view) and the hard-coded compliance footer.

## Technical details
- **Tables** (new, with names kept apart from the old paid audit tables): `free_audits` (answers, computed score/opportunities, ai_analysis, ai_raw, contact, consent flags, UTM/referrer, share token, timestamps), `free_audit_consents` (displayed text, checked, form version, IP) and `free_audit_events` (analytics + `ai_analysis_failed`). Grants are included. RLS allows only operators to read, and there is no anonymous access.
- **Scoring** runs in `src/lib/freeAudit/` (spec JSON steps, scoring and opportunity library), a pure module. The server re-runs the same scoring and its numbers are authoritative, so the client can't fake scores.
- **Edge function `submit-free-audit`** validates with zod, then runs the honeypot, timing and per-IP rate-limit checks. It computes the score, saves the audit and consents atomically (deleting all of it if any step fails), then calls the AI. The AI call uses Lovable AI Gateway, `openai/gpt-6-astra`, Responses API, streamed, with a structured schema. It retries once, then falls back to the library copy and logs `ai_analysis_failed`. It returns the share token.
- **Edge function `get-free-audit-result`** takes a random 32-byte token and returns only results fields. It never returns contact info, so a shared link exposes no personal information.
- **Analytics events** listed in the spec JSON go through the submit function after the audit exists. Pre-submit step events are kept in the browser and sent with the submission, so there are no anonymous public writes.
- **Operator:** add "Free audits" to the sidebar, with a list (search, email, score, date) and a detail view. The old Audits pages stay.
- **Files:** new pages `FreeAuditLanding`, `FreeAuditFlow`, `FreeAuditResults`; `src/lib/freeAudit/*`; 2 edge functions; 1 migration; operator `FreeAudits.tsx`; route updates in `App.tsx`. Delete `AutomationAudit.tsx` and `AutomationAuditStart.tsx`, plus the `submit-audit` function after the new flow is verified.
- **Checks:** type-check; Playwright run through the full flow on mobile width; a labeled test submission confirms the AI output or fallback; anonymous table reads are denied; the results link shows no contact data; then the test rows are deleted.

## Risks / cut from v1
- **Legal placeholders still block publishing:** [LEGAL NAME], [Audit Terms of Service], [Privacy Policy].
- **Dollar figures** come only from the spec's formulas on self-reported answers. They are labeled as estimates, and no real metrics are invented.
- **"First ten client stories"** is a claim you're making. It needs to stay true: count real audits and remove the line once there are 10.
- **AI cost** is about 2k tokens per audit. The rate limit and the contact step come before the AI call.
- **Cut:** dark/light toggle, gradient, real PDF generation (the browser's print-to-PDF is used instead), emailing results, CRM lead creation from audits (no automatic funding lead; the visitor chooses /apply).
- **Removing the paid audit** removes the [PRICE] Blueprint offer. Old records are kept for retention.

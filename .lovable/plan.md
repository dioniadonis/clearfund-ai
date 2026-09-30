# AI Readiness Audit / Blueprint — implementation outline

## Source status
- **SPEC.pdf and COMPLIANCE.pdf are not in the project.** Only earlier uploads are present (JotForm packet, readiness plan, platform objective JSON, prompt text). This outline uses only the owner's instructions in chat. Any approved compliance copy, price, address, or credentials must come from those PDFs or the owner. Nothing gets invented.
- Instruction handling: only owner messages count as requirements. Any document text that says to ignore instructions, skip consent, or auto-approve is treated as data and flagged. It is never followed.
- **Payment provider: none configured.** There is no Stripe or Paddle in the code or secrets, so payment stays a stub.

## Reused as-is
- Auth, `user_roles`, `is_operator`, `RequireOperator`, operator layout/sidebar
- `_shared/util.ts` protections: honeypot, timing check, per-IP rate limit, validation
- `_shared/notify.ts` for new-audit alerts (still "not configured" until the owner sets it up)
- Pattern for server-side public submission, taken from `submit-application`
- Design tokens, Header/Footer, flat design

## Kept separate (not touched)
- No changes to funding pages, `/apply`, FundingPartners, partner links, the `leads` table, lead stages or `lead_events`
- Audits get their own tables, so they never mix with the funding pipeline or referral data
- No Retell, SMS or Odysseus involvement. Email delivery is optional and falls back to the operator downloading the report manually

## Screens
1. `/ai-readiness` — landing page. It uses approved copy only. Price shows as "[PRICE — owner to supply]" and the page stays unpublished until filled.
2. `/ai-readiness/start` — multi-step intake form, then consent, then submit.
3. `/ai-readiness/checkout/:ref` — **payment stub**: "Payment not yet connected — we will contact you." It records `payment_status = 'not_required_stub'`. No card fields.
4. `/ai-readiness/submitted` — confirmation page with a reference code. It makes no promises about timing.
5. `/operator/audits` — list with search, status filter and CSV export.
6. `/operator/audits/:id` — intake view, review checklist, report editor, status changes, and redact/delete controls.

## Intake fields (minimal)
- Contact: name, business name, work email, phone (optional), website (optional)
- Business: industry (select), team size band, revenue band (bands only, no exact figures)
- Current state: tools in use (multi-select plus "other"), main processes to improve (free text, 1,000-character limit), data sources (select), current AI use (select)
- Goals: top 3 goals, timeline band, budget band (optional)
- Consent: separate unchecked boxes for terms/privacy (required) and email follow-up (optional). Stores the timestamp and the consent text version.
- **Not collected:** SSN, EIN, bank or credit details, DOB, customer PII, credentials or API keys. Free-text fields show a warning, and the server removes obvious SSN, card and email patterns before saving.

## Data model (one migration, with GRANTs and RLS)
- `audit_requests`: id, ref_code, contact fields, answers jsonb, consent fields, status enum (`submitted, in_review, report_draft, report_approved, delivered, cancelled`), payment_status (`not_required_stub, pending, paid, refunded`), utm/referrer, assigned_to, retention_until, redacted_at, redacted_by, redaction_reason, created/updated
- `audit_reports`: request_id, version, body (structured jsonb sections), status (`draft|approved`), approved_by/at. Stored separately from intake so a new version never overwrites an old one.
- `audit_events`: append-only audit trail (who, what, when, why)
- RLS: operator-only for everything. The public has no read access. Inserts happen only through the edge function using the service role.
- An operator RPC `operator_update_audit(...)` changes status and writes the matching event in one transaction, the same approach as `operator_update_lead`.

## Report deliverable (Blueprint)
- Fixed template sections: Summary, Current state, Opportunities (ranked by operator), Recommended tools/categories, 30/60/90 roadmap, Risks and assumptions, Next steps
- **Written by a person.** An optional "AI draft" button can pre-fill sections for the operator to edit, but every report needs an operator to approve it before release. The report scores nothing automatically.
- Output: a print-styled HTML page, saved as PDF with the browser's print function. There is no PDF service in v1.
- The report does not make funding, ROI or savings claims, and does not cross-sell referrals.

## Retention and redaction
- `retention_until` defaults to the value set in COMPLIANCE.pdf. **This is a blocker**: no number will be invented.
- "Redact" nulls the contact fields and free text and keeps the anonymized answers. It needs a confirm dialog and a reason, and writes an event.
- "Delete" does a hard delete with confirmation, and only an admin can do it.
- A daily expiry job is **cut from v1**. v1 shows a "past retention" filter so records can be redacted by hand.

## Phases
1. **Data + intake:** migration, `submit-audit` edge function, landing page, intake and confirmation pages
2. **Operator review:** Audits list/detail, status RPC, CSV export, sidebar link
3. **Report:** editor, versions, approval, print view, optional AI draft (Lovable AI)
4. **Retention/redaction** controls and the past-retention filter
5. **Payment:** replace the stub once the owner picks and connects a provider (blocked)

## Files
- New: `src/pages/AiReadiness.tsx`, `AiReadinessStart.tsx`, `AiReadinessCheckout.tsx`, `AiReadinessSubmitted.tsx`
- New: `src/pages/operator/Audits.tsx`, `AuditDetail.tsx`; `src/components/operator/AuditReportEditor.tsx`, `AuditReportPrint.tsx`, `ConfirmActionDialog.tsx`
- New: `supabase/functions/submit-audit/index.ts`; optional `draft-audit-report/index.ts`
- Edit: `src/App.tsx` (routes), `OperatorSidebar.tsx` (Audits link)
- Not changed: every funding page, Apply, FundingPartners, Header/Footer links (a public nav link only after owner approval)

## Acceptance criteria
- Submitting without JavaScript tricks saves one `audit_requests` row. Honeypot, fast-submit and rate-limit cases are rejected.
- Anonymous users can't read any audit table, even directly. Non-operators get "Not authorised".
- No row is written to `leads`, and funding pages and partner links are unchanged (compared against the current state).
- Status changes always write exactly one event. A failed change leaves both unchanged.
- A report can't be marked delivered until it is approved. Approved versions are locked.
- Redact removes the contact fields and free text, keeps the event, and needs a confirmation plus a reason.
- The payment stub never shows card inputs or claims that payment happened.
- Placeholders for price, address and compliance text show clearly and block publishing.
- Build and type check pass. The flow is verified with Playwright using a labeled TEST record, which is deleted afterwards.

## Blockers / owner questions
1. Upload SPEC.pdf and COMPLIANCE.pdf. They are missing.
2. Physical business address, needed for footer/terms/email compliance. Missing.
3. Audit price, plus refund/cancellation terms.
4. Retention period, and whether a customer can request deletion.
5. Payment provider: Stripe or Paddle, now or later.
6. Should the AI draft button be in v1 or cut?
7. Final wording for the unclear compliance placeholders, verbatim from COMPLIANCE.pdf.

## Risks / cut from v1
- Cut: live payment, automatic expiry job, emailed PDF delivery, customer login portal, automated scoring, integrations.
- Risk: calling it an "audit" can suggest a certification. Needs the owner's approved wording.
- Risk: free text may still contain PII. Server-side removal only reduces this.
- Risk: an AI draft could invent claims about the customer. Mandatory human approval handles this.

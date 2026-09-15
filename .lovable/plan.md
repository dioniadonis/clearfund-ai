# Fix operator login + phone-agent endpoints and application page

## 1. Why login "does nothing"

Your account `dioniadonis@gmail.com` exists and **did sign in successfully** (last sign-in recorded 04:40 on Sep 11). It has no operator permission row, so the sign-in page had nothing to navigate to and no message to show — it just sat still.

Fix:
- Grant your account admin (operator) permission.
- Sign-in page: after a successful sign-in with no access, show "Signed in, but this account has no operator access" plus a sign-out button instead of silence. Same for any unexpected error.

## 2. Public application page at `/apply`

A real intake form the concierge can send people to, matching the existing site styling.

- Fields: owner name, business name, business address, email, phone, business start date, monthly revenue, funding need, funding purpose.
- Separate unchecked consent boxes for email / SMS / phone contact, with the consent wording version and timestamp stored.
- Broker acknowledgment checkbox (ClearFund is a broker, not a lender).
- No SSN and no bank account numbers on this form — those belong to the secure document step, which is not built here.
- Saves through a server-side function (validation + simple spam protection: honeypot field, timing check, per-IP rate limit). No public read access to leads.
- Prefill by token: when the concierge sends a link it includes a one-time token so name/business/phone/email already collected on the call are pre-filled and the record links back to that call.

## 3. Two endpoints for the Retell agent

Both are server functions, protected by a shared secret header that you paste into Retell's tool config (no secret in chat, no public access).

**POST `/send-application`**
Body: `delivery_method` (`sms_link` | `email_link` | `email_pdf`), `phone_number` (required for sms_link), `email` (required for email_link/email_pdf), `business_name`, `owner_name`.
Behaviour: validates the body, creates or matches the lead, creates a tokenised `/apply` link, records the send request, dispatches it, returns `{ "status": "sent" }`. If dispatch is not possible it returns `{ "status": "failed", "reason": ... }` — it will never report "sent" for something that wasn't sent.

**POST `/schedule-callback`**
Body: `preferred_datetime` (natural language or ISO), `reason` (`application_unfinished` | `thinking_it_over`), `phone_number`.
Behaviour: validates, stores the request with the raw text plus a parsed time when it can be read confidently, links it to the lead where the phone matches, returns `{ "status": "scheduled" }`.

## 4. Operator dashboard additions

- **Callbacks** list: who to call back, requested time, reason, status (pending / done / cancelled), with a note that placing the outbound calls is a later step.
- **Applications sent** list: who it went to, method, sent/failed, whether the form was completed.
- Both with search and empty states.

## 5. Delivery: what works day one

- **Text (SMS):** Retell does not expose a general "send this SMS" API for outside use, so texting the link needs an SMS sender. Twilio is available as a one-click connection here — with it connected, `sms_link` sends for real. Until then `sms_link` returns `failed` with reason `sms_provider_not_connected`.
- **Email:** no email sender is set up. `email_link` and `email_pdf` return `failed` with reason `email_provider_not_connected` until one is added (this needs a domain you can send from).
- **PDF:** `email_pdf` is accepted but deliberately not implemented in v1 — it returns `failed` with reason `pdf_not_available`. The concierge should offer text or email link. Building a PDF the caller then has to print, fill and return is worse than the web form.

So: both endpoints are live, validated, and log everything immediately; actual sending switches on per channel as each provider is connected.

## Technical notes

- Migration: grant `admin` in `user_roles` to `fa8ac7b9-4467-41b1-8ce7-376d4f030737`; new tables `application_sends` (lead_id, delivery_method, token hash, status, failure_reason, sent_at, completed_at) and `callback_requests` (lead_id, phone, preferred_datetime_raw, preferred_at, reason, status, created_at); RLS operator-only + GRANTs; a lead-insert path for the public form via security-definer function only (no anon table insert).
- Edge functions: `submit-application`, `send-application`, `schedule-callback`, all `verify_jwt = false` with their own auth (shared secret for the Retell two, none for the public form).
- Tokens stored hashed; single use; 14-day expiry.
- Frontend: `src/pages/Apply.tsx`, operator `Callbacks.tsx` and `Applications.tsx`, sidebar entries, login-page state fix. Public marketing pages untouched.

## Risks / cut from v1

- Cut: PDF generation, outbound scheduled calling, document upload/SSN/bank collection, e-signature.
- Cut: editing callback times from the dashboard beyond status changes — a mis-typed time is worse than reading the caller's own words.
- The Retell agent prompt itself is configured in Retell, not here; I only supply the two URLs and the shared secret.
- `preferred_datetime` in free text won't always parse; the raw text is always kept and shown, parsed time is advisory only.
- Spam protection is honeypot + timing + IP rate limit, no CAPTCHA. If the form gets abused, add one then.

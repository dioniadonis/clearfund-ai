# Roadmap — Packet CF-01

## VA program step 2 (preview only)
- [ ] 1. Add `?va=` merchant intake, emailed private resume links, e-signature, secure document uploads and consent logs
- [ ] 2. Enforce eligible-file dedupe, VA credit and email-reply exclusion
- [ ] 3. Add internal DNC, immediate VA blocking and batch scrub gate
- [ ] 4. Add admin Complete-file review, document viewer, routing and editable VA rules/settings
- [ ] 5. Add gated VA role, six training modules, quiz, limited dashboard and lead-email consent logging
- [ ] 6. Add VA pay statements, funded bonuses, dials evidence, inactivity flags and admin paid controls
- [ ] Test access boundaries, uploads, scoring/credit, DNC, training, payouts and 390px layouts; do not publish

## Host-specific homepages (preview only)
- [x] Add hostname/preview site selection, host branding, titles, descriptions and canonicals
- [x] Add AI funding homepage and preserve the general homepage with a cross-site link
- [x] Redirect general-host CRM/operator routes to the AI host; keep all other routes intact
- [x] Store `/get-started?src=` in the existing lead source field without a schema change
- [x] Test host rules, both homepages, existing VA pages/CRM and 390px layouts; do not publish

## VA program step 1 (preview only)
- [x] Add public `/careers` application with exact job/pay copy, validation, consent and source attribution
- [x] Add isolated `va_applications` storage with anonymous insert-only and admin-only review/update policies
- [x] Add CRM VA Applicants list, filters, scoring and detail panel without horizontal scrolling
- [x] Test submission, access rules, weighted scores and 390px layouts; do not publish

## Compliance and two-tier payouts (preview only)
- [x] Remove the public funder name, review widget/link, and unsupported footer audience claim
- [x] Retire the old recruiting page and every remaining reference so `/agents` is the only sign-up page
- [x] Add separate assigned-lead and own-referral payout defaults and per-agent overrides
- [x] Apply the correct percentage at funding time and update payout displays and training
- [x] Update and run focused tests; verify public searches and CRM mobile layout; do not publish

## Agent program (preview only)
- [x] Add recruit lead type, isolated CRM Recruits pipeline and staged CSV import
- [x] Add public `/agents` application, server-side quiz screening and referral attribution
- [x] Add protected `/agent` portal with training, agreement gate and warm-lead-only access
- [x] Add admin assignment, warm filters, funded commission capture, payouts and leaderboard
- [x] Verify role/RLS isolation, import dedupe, referral flow, tests and mobile layouts; do not publish
- Unverified with a real approved account: Auth invite delivery and signed-in agent portal session; no test invitation was sent.

## Public partner compliance cleanup
- [x] Remove unapproved provider names and outbound application links from public pages
- [x] Route public funding CTAs through `/get-started`; preserve private CRM routing
- [x] Retire the old recruiting page and neutralize recruiting copy
- [x] Remove public rate, timing, approval and earnings claims; verify searches and preview
- [x] Do not publish

## Recruiting applications
- [x] Build the former recruiting page and 12-step screener (later retired)
- [x] Add server-side recruit scoring, hard stops, spam controls and CRM-only access
- [x] Add CRM Recruits card list with status/score filters and status actions
- [x] Verify scoring, access rules, submission and 390px layouts; do not publish

## Agent integrations
- [x] Enable OAuth authorization for external AI clients
- [x] Add read-only CRM MCP tools using caller-scoped RLS
- [x] Add consent/login return flow and browser-local CRM view tools
- [x] Extract and verify the MCP catalog
- [x] Verify consent denial, approval, repeat authorization, failures, and authenticated CRM behavior
- [ ] Republish to activate the hosted MCP revision

- [x] B1 lead fields service_interest + entry_cta, operator list/filter/detail
- [x] B2 new-lead alerts (Telegram + email), `?lead=` deep link — wired, channels report "not configured" until setup
- [x] B3 /apply reads ?interest/?cta, service dropdown, headlines
- [x] B4+B5 replace all JotForm with /apply links, remove scripts
- [x] B7 remove credit repair, speed claims, add partner disclosure
- [x] End-to-end test with TEST-READINESS lead, then deleted
- Blocked: email sender (owner-approved prerequisite); TOD_TELEGRAM_WEBHOOK_URL secret
- Owner decision: legal pages still mention credit repair referrals; unsupported footer audience claim removed
- Later packet: Telegram approvals + emergency stop
- Cutover: owner disables JotForm forms
- [x] Phase 2 audit built (preview only). Blocked publish: legal name, Audit Terms + Privacy links, price, intake retention, payment link, redaction approval
- [x] Free Automation Audit replaces paid preview audit (/automation-audit, /results/:token, operator Free audits). Blocked publish: legal name, Audit Terms + Privacy links; "first ten" line must be removed after 10 real audits

# Roadmap — Packet CF-01

## Public partner compliance cleanup
- [x] Remove unapproved provider names and outbound application links from public pages
- [x] Route public funding CTAs through `/get-started`; preserve private CRM routing
- [x] Hide `/join` from discovery and neutralize recruiting copy
- [x] Remove public rate, timing, approval and earnings claims; verify searches and preview
- [x] Do not publish

## Recruiting applications
- [x] Build public `/join` page and 12-step screener
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
- Owner decision: legal pages still mention credit repair referrals; footer "thousands of owners" claim unverified
- Later packet: Telegram approvals + emergency stop
- Cutover: owner disables JotForm forms
- [x] Phase 2 audit built (preview only). Blocked publish: legal name, Audit Terms + Privacy links, price, intake retention, payment link, redaction approval
- [x] Free Automation Audit replaces paid preview audit (/automation-audit, /results/:token, operator Free audits). Blocked publish: legal name, Audit Terms + Privacy links; "first ten" line must be removed after 10 real audits

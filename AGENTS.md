# Architecture rules

- Free audit questions/scoring live only in `supabase/functions/_shared/freeAuditScoring.ts` (site re-exports via `src/lib/freeAudit.ts`) — one source; the server recomputes and its numbers are authoritative.
- Free audit results are read only through the `get-free-audit-result` function by 64-hex share token — tables stay operator-only and the public link never returns email/phone.
- The AI only writes prose for free audits; numbers never come from the model, and any AI failure falls back to library copy.

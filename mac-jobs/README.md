# mac-jobs

Job notes and scripts for the Mac worker. Ops only: no app code, no lead lists, no keys.

- `subaward_reader_job.md`: set up the daily subcontractor reader (weekdays 7:30 AM ET).
- `machine/run_subawards.py`: the reader. Copy into `~/clearfund/machine/` next to the existing `cfm/`.
- `machine/cfm/` and `machine/config/sources.json`: fallback copies only. If the Mac already has these, keep its own.
- `contractor_pick_2026-11-15.md`: Sunday contractor picks and verify order.
- `verify_fix.md`: write email-check results into the CRM (sent Nov 14; kept for reference).

Secrets (API keys) come from environment variables on the Mac only, never from files here.

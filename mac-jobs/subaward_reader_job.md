# Mac job: daily subcontractor reader (approved Nov 15 2026)

For the Mac session. Nothing for the owner to type. Internal only.

1. Copy mac-jobs/machine/run_subawards.py in this branch into ~/clearfund/machine/ next to run_agendas.py. It uses the existing cfm/ modules (emails.sbs_lookup, states.allowed, http throttle).
2. Test once: `python3 run_subawards.py --days 14 --limit 40`. Expect roughly 20 to 25 contactable rows in ../leads/subaward_leads.csv.
3. CRM insert, same path the morning award pull uses to add leads: for each new row call
   `crm_insert_lead(lead, 'subaward_reader', null, 'fill')` with
   lead_ref = the row's lead_id, lead_type 'borrower', firm, contact_name, email, phone, state, website,
   email_source 'sba_sbs', need_score 60 if founded within 10 years else 40,
   notes "Named as subcontractor on a federal contract: $NNK, YYYY-MM-DD. Founded YYYY. Contact from SBA small business directory." plus "TX: contract financing / working capital only, no MCA." for TX and "NC: no loans." for NC.
   The RPC skips duplicates (lead_ref, email, website, company+state) and only fills blanks on existing rows.
4. Schedule with launchd: weekdays at 7:30 AM Eastern (after com.mark.clearfund-award-pull at 7 AM, done well before the 9 AM email batch). Label com.mark.clearfund-subawards. Default 14-day window; data/state/seen.sqlite keeps it from looking up the same firm twice.
5. Guardrails: stop on any 403/429 from USAspending or SBA search, never route around it. Skip rows whose SBA record is in a different state. Excluded states are filtered by states.allowed().
6. Report back: first run time, rows found, inserted, duplicates.

Already done from the cloud (Nov 15, ~01:55 UTC): first batch of 24 checked, 19 inserted (lead_ref SUB-20261115-002 to -024), 5 were already in the CRM and got missing contact filled.

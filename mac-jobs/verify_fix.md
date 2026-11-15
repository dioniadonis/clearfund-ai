# Message to paste into the Mac Claude session (written Nov 14)

The daily email check verified 0 of 8,653 CRM leads. Cause found from the shared code: cfm/emails.py `verify`
writes results only into the CSV file it is given (email_verified / email_check) and never writes
crm_leads.scrub_result or scrubbed_at. So even rows it checked never reach the CRM.

Please fix and confirm:
1. Check that MYEMAILVERIFIER_API_KEY is set in the environment of the scheduled 7 AM job (not just your shell). Don't print it.
2. After each verify run, push results to the CRM through the worker API: for each checked email set
   scrub_result = valid / invalid / risky (plus the reason) and scrubbed_at = now.
3. Daily order, 95 checks a day: 20 partner addresses in outreach/partner_drafts_batch1.csv first, then award
   leads, then other borrowers with email. Skip any row whose scrub_result is already valid or invalid.
4. Push the results you already have (award batch1: 70 valid, 29 risky) to the CRM today.
5. Nothing gets sent. Reply with counts written to the CRM.

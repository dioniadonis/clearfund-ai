# For the Mac session, Sun Nov 15 before 9 AM ET (relay from the cloud thread)

Goal: 7 contractor emails to add to Sunday's batch of 10 from mark@ (3 partners already picked; that list stays out of this public repo, ask the cloud thread or read the CRM).
Nothing sends. the owner approves the list first.

1. From your award batch results (batch1: 70 valid), pick 7 with the newest award dates.
   Keep only states.py allowed() (no VA, CT, MO, CA, VT, ND; no TX for MCA), email_verified == valid.
   Skip anyone already sent, already drafted in the hub, or marked do-not-contact in the CRM (worker API leads/find).
2. The daily free MyEmailVerifier credits (100 a day, reset daily) should be back. Use today's credits in this order:
   recheck the 5 partners marked risky (greylisted) in crm_leads.scrub_result, then the 11
   unchecked partners in partner_drafts_batch1.csv, then the next award leads. If the account the owner signed in to
   tonight is a different account from your key, its API key is a separate 100 a day; use it only if the owner gives it to you.
3. Write each result to the CRM: scrub_result = valid/invalid/risky, scrubbed_at = now (direct, or via your branch once merged).
4. Write the 7 picks to outreach/send_2026-11-15_contractors.csv: firm, first name if known, email, state, agency,
   award date, award amount. Use email 1 of cold-email-sequence.md, no {link}, unique subject "{Agency} contract".

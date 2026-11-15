-- VA merchants live in crm_leads with their own stages. The table-wide checks predate them and
-- rejected every VA merchant write. Per-type stage rules stay in crm_stage_ok (crm_leads_stage_type trigger).
ALTER TABLE public.crm_leads DROP CONSTRAINT IF EXISTS crm_leads_lead_type_check;
ALTER TABLE public.crm_leads ADD CONSTRAINT crm_leads_lead_type_check CHECK (lead_type = ANY (ARRAY['borrower','partner','recruit','va_merchant']));
ALTER TABLE public.crm_leads DROP CONSTRAINT IF EXISTS crm_leads_stage_check;
ALTER TABLE public.crm_leads ADD CONSTRAINT crm_leads_stage_check CHECK (stage = ANY (ARRAY[
  'New','Contacted','Replied','Interested','Applied','Submitted to funder','Funded','Lost',
  'Signed up (DAC)','Trained','First referral',
  'new','contacted','applied','approved','rejected',
  'Started','Qualified','Docs Pending','Complete','Approved by Dioni','Submitted','Declined','Rejected','Not yet, follow up later.']));

ALTER TABLE public.crm_leads DROP CONSTRAINT crm_leads_lead_type_check;
ALTER TABLE public.crm_leads ADD CONSTRAINT crm_leads_lead_type_check CHECK (lead_type = ANY (ARRAY['borrower','partner','recruit']));
ALTER TABLE public.crm_leads DROP CONSTRAINT crm_leads_stage_check;
ALTER TABLE public.crm_leads ADD CONSTRAINT crm_leads_stage_check CHECK (stage = ANY (ARRAY['New','Contacted','Replied','Interested','Applied','Submitted to funder','Funded','Lost','Signed up (DAC)','Trained','First referral','new','contacted','applied','approved','rejected']));
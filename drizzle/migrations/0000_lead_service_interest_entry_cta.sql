CREATE TYPE public.service_interest AS ENUM ('working_capital','gig_funding','insurance_restoration','other');
ALTER TABLE public.leads ADD COLUMN service_interest public.service_interest NOT NULL DEFAULT 'other';
ALTER TABLE public.leads ADD COLUMN entry_cta text;
CREATE INDEX IF NOT EXISTS leads_service_interest_idx ON public.leads(service_interest);
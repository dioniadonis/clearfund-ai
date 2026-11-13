ALTER TABLE public.agents
  ADD COLUMN program_type text NOT NULL DEFAULT 'agent',
  ADD COLUMN va_file_pay numeric,
  ADD COLUMN va_funded_bonus numeric,
  ADD COLUMN va_started_at date;
ALTER TABLE public.agents ADD CONSTRAINT agents_program_type_check CHECK (program_type IN ('agent','va')) NOT VALID;
ALTER TABLE public.agents ADD CONSTRAINT agents_va_file_pay_check CHECK (va_file_pay IS NULL OR va_file_pay BETWEEN 20 AND 25) NOT VALID;
ALTER TABLE public.agents ADD CONSTRAINT agents_va_funded_bonus_check CHECK (va_funded_bonus IS NULL OR va_funded_bonus BETWEEN 75 AND 100) NOT VALID;

ALTER TABLE public.crm_leads
  ADD COLUMN va_code text,
  ADD COLUMN va_auto_passed boolean NOT NULL DEFAULT false,
  ADD COLUMN va_eligible boolean NOT NULL DEFAULT false,
  ADD COLUMN va_eligible_at timestamptz,
  ADD COLUMN va_approved_by uuid,
  ADD COLUMN va_email_consent_at timestamptz,
  ADD COLUMN federal_dnc_flag boolean NOT NULL DEFAULT false,
  ADD COLUMN litigator_flag boolean NOT NULL DEFAULT false,
  ADD COLUMN scrubbed_at timestamptz,
  ADD COLUMN scrub_result text,
  ADD COLUMN terminal_at timestamptz;
CREATE INDEX crm_leads_va_code_idx ON public.crm_leads (va_code) WHERE va_code IS NOT NULL;
CREATE INDEX crm_leads_va_review_idx ON public.crm_leads (stage, created_at) WHERE va_code IS NOT NULL;

CREATE TABLE public.va_settings (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  min_months integer NOT NULL DEFAULT 4,
  min_monthly_deposits numeric NOT NULL DEFAULT 10000,
  require_business_bank boolean NOT NULL DEFAULT true,
  blocked_states text[] NOT NULL DEFAULT '{VA,CT,MO,CA,VT,ND}',
  max_current_positions integer,
  excluded_industries text[] NOT NULL DEFAULT '{}',
  base_weekly numeric NOT NULL DEFAULT 25,
  base_weeks integer NOT NULL DEFAULT 2,
  default_file_pay numeric NOT NULL DEFAULT 25,
  default_funded_bonus numeric NOT NULL DEFAULT 100,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT va_settings_rules_check CHECK (min_months >= 0 AND min_monthly_deposits >= 0 AND (max_current_positions IS NULL OR max_current_positions >= 0)),
  CONSTRAINT va_settings_pay_check CHECK (base_weekly = 25 AND base_weeks = 2 AND default_file_pay BETWEEN 20 AND 25 AND default_funded_bonus BETWEEN 75 AND 100)
);
GRANT SELECT ON public.va_settings TO authenticated;
GRANT ALL ON public.va_settings TO service_role;
ALTER TABLE public.va_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage VA settings" ON public.va_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Active VAs read settings" ON public.va_settings FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.agents a WHERE a.user_id=auth.uid() AND a.program_type='va' AND a.active));

CREATE TABLE public.va_resume_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.va_resume_tokens TO service_role;
ALTER TABLE public.va_resume_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read resume tokens" ON public.va_resume_tokens FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.va_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  consent_type text NOT NULL,
  displayed_text text NOT NULL,
  version text NOT NULL,
  ip text,
  consented_at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid
);
GRANT ALL ON public.va_consents TO service_role;
ALTER TABLE public.va_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read VA consents" ON public.va_consents FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.va_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  doc_type text NOT NULL CHECK (doc_type IN ('signed_application','bank_statement','photo_id')),
  file_path text NOT NULL UNIQUE,
  original_name text NOT NULL,
  byte_size integer NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  delete_after timestamptz
);
GRANT ALL ON public.va_documents TO service_role;
ALTER TABLE public.va_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read VA documents" ON public.va_documents FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX va_documents_lead_idx ON public.va_documents (lead_id, doc_type, uploaded_at);

CREATE TABLE public.va_document_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.va_documents(id) ON DELETE CASCADE,
  viewed_by uuid NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  ip text
);
GRANT ALL ON public.va_document_views TO service_role;
ALTER TABLE public.va_document_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read document views" ON public.va_document_views FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.va_dnc (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text,
  email text,
  reason text NOT NULL,
  added_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (phone IS NOT NULL OR email IS NOT NULL)
);
GRANT ALL ON public.va_dnc TO service_role;
ALTER TABLE public.va_dnc ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read internal DNC" ON public.va_dnc FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE UNIQUE INDEX va_dnc_phone_idx ON public.va_dnc (lower(phone)) WHERE phone IS NOT NULL;
CREATE UNIQUE INDEX va_dnc_email_idx ON public.va_dnc (lower(email)) WHERE email IS NOT NULL;

CREATE OR REPLACE FUNCTION public.crm_stage_ok(_lead_type text, _stage text)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN _lead_type = 'partner' THEN _stage IN ('New','Contacted','Interested','Signed up (DAC)','Trained','First referral')
    WHEN _lead_type = 'recruit' THEN _stage IN ('new','contacted','applied','approved','rejected')
    WHEN _lead_type = 'va_merchant' THEN _stage IN ('New','Started','Qualified','Docs Pending','Complete','Approved by Dioni','Submitted','Funded','Declined','Rejected','Not yet, follow up later.')
    ELSE _stage IN ('New','Contacted','Replied','Interested','Applied','Submitted to funder','Funded','Lost') END
$$;

CREATE OR REPLACE FUNCTION public.va_link_valid(_code text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.agents WHERE referral_code=upper(trim(_code)) AND program_type='va' AND active)
$$;
REVOKE ALL ON FUNCTION public.va_link_valid(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.va_link_valid(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.va_list_leads()
RETURNS TABLE(id uuid, business_name text, owner_name text, status text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT l.id,l.firm,l.contact_name,l.stage,l.created_at FROM public.crm_leads l
  WHERE l.assigned_to=auth.uid() AND l.va_code IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.agents a WHERE a.user_id=auth.uid() AND a.program_type='va' AND a.active)
  ORDER BY l.created_at DESC LIMIT 500
$$;
REVOKE ALL ON FUNCTION public.va_list_leads() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.va_list_leads() TO authenticated;

CREATE OR REPLACE FUNCTION public.va_mark_dnc(_lead_id uuid, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE l public.crm_leads%ROWTYPE;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.agents a WHERE a.user_id=auth.uid() AND a.program_type='va' AND a.active) THEN RAISE EXCEPTION 'VA access required'; END IF;
  SELECT * INTO l FROM public.crm_leads WHERE id=_lead_id AND assigned_to=auth.uid() FOR UPDATE;
  IF l.id IS NULL THEN RAISE EXCEPTION 'Lead not available'; END IF;
  UPDATE public.crm_leads SET do_not_contact=true,dnc_reason=left(trim(_reason),200),dnc_at=now(),scrub_result='blocked' WHERE id=l.id;
  INSERT INTO public.va_dnc(phone,email,reason,added_by) VALUES (NULLIF(l.phone,''),NULLIF(lower(l.email),''),left(trim(_reason),200),auth.uid())
  ON CONFLICT DO NOTHING;
  INSERT INTO public.crm_activities(lead_id,user_id,type,body) VALUES (l.id,auth.uid(),'note','VA marked do not call: '||left(trim(_reason),200));
END $$;
REVOKE ALL ON FUNCTION public.va_mark_dnc(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.va_mark_dnc(uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.va_log_email_consent(_lead_id uuid, _ip text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.agents a WHERE a.user_id=auth.uid() AND a.program_type='va' AND a.active) THEN RAISE EXCEPTION 'VA access required'; END IF;
  UPDATE public.crm_leads SET va_email_consent_at=now() WHERE id=_lead_id AND assigned_to=auth.uid() AND va_code IS NOT NULL AND NOT do_not_contact;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lead not available'; END IF;
  INSERT INTO public.va_consents(lead_id,consent_type,displayed_text,version,ip,actor_id)
  VALUES (_lead_id,'va_intake_email','Merchant agreed to get the link by email','va-email-consent-v1',left(_ip,100),auth.uid());
END $$;
REVOKE ALL ON FUNCTION public.va_log_email_consent(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.va_log_email_consent(uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.va_scrub_and_assign(_lead_ids uuid[], _va_id uuid, _federal_ids uuid[], _litigator_ids uuid[])
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _count integer;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.agents WHERE user_id=_va_id AND program_type='va' AND active) THEN RAISE EXCEPTION 'Active VA required'; END IF;
  UPDATE public.crm_leads l SET federal_dnc_flag=(l.id=ANY(_federal_ids)),litigator_flag=(l.id=ANY(_litigator_ids)),scrubbed_at=now(),
    scrub_result=CASE WHEN l.id=ANY(_federal_ids) OR l.id=ANY(_litigator_ids) OR l.do_not_contact OR EXISTS(SELECT 1 FROM public.va_dnc d WHERE (d.phone IS NOT NULL AND d.phone=l.phone) OR (d.email IS NOT NULL AND lower(d.email)=lower(l.email))) THEN 'blocked' ELSE 'clear' END
  WHERE l.id=ANY(_lead_ids);
  UPDATE public.crm_leads l SET assigned_to=_va_id,va_code=(SELECT referral_code FROM public.agents WHERE user_id=_va_id),source='va_call'
  WHERE l.id=ANY(_lead_ids) AND l.scrub_result='clear' AND l.scrubbed_at>now()-interval '30 days' AND NOT l.federal_dnc_flag AND NOT l.litigator_flag AND NOT l.do_not_contact;
  GET DIAGNOSTICS _count=ROW_COUNT;
  INSERT INTO public.crm_activities(lead_id,user_id,type,body) SELECT id,auth.uid(),'note','VA batch scrub completed; only clear leads assigned' FROM public.crm_leads WHERE id=ANY(_lead_ids);
  RETURN _count;
END $$;
REVOKE ALL ON FUNCTION public.va_scrub_and_assign(uuid[],uuid,uuid[],uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.va_scrub_and_assign(uuid[],uuid,uuid[],uuid[]) TO authenticated;

CREATE POLICY "Admins open VA merchant documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id='va-documents' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins open VA dial evidence" ON storage.objects FOR SELECT TO authenticated USING (bucket_id='va-dial-evidence' AND public.has_role(auth.uid(),'admin'));

-- Agent program: additive fields and separate application/progress/agreement/payout records.
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS agent_id uuid;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS warm_reason text;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS clearfund_commission numeric;
ALTER TABLE public.crm_leads ADD CONSTRAINT crm_leads_commission_nonnegative CHECK (clearfund_commission IS NULL OR clearfund_commission >= 0) NOT VALID;
ALTER TABLE public.cta_clicks ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.crm_leads(id) ON DELETE SET NULL;
ALTER TABLE public.cta_clicks ADD COLUMN IF NOT EXISTS agent_id uuid;

CREATE TABLE public.agent_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crm_lead_id uuid REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  city text,
  state text NOT NULL,
  experience text NOT NULL,
  find_owners text NOT NULL,
  quiz_answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  quiz_score integer NOT NULL,
  passed boolean NOT NULL,
  status text NOT NULL DEFAULT 'new',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agent_application_score CHECK (quiz_score BETWEEN 0 AND 5),
  CONSTRAINT agent_application_status CHECK (status IN ('new','approved','rejected'))
);
GRANT SELECT ON public.agent_applications TO authenticated;
GRANT ALL ON public.agent_applications TO service_role;
ALTER TABLE public.agent_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins review agent applications" ON public.agent_applications FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE UNIQUE INDEX agent_applications_email_uq ON public.agent_applications (lower(email));
CREATE INDEX agent_applications_status_idx ON public.agent_applications (status, created_at DESC);

CREATE TABLE public.agents (
  user_id uuid PRIMARY KEY,
  application_id uuid UNIQUE REFERENCES public.agent_applications(id) ON DELETE RESTRICT,
  full_name text NOT NULL,
  email text NOT NULL,
  referral_code text NOT NULL UNIQUE,
  payout_percent numeric CHECK (payout_percent IS NULL OR payout_percent BETWEEN 0 AND 100),
  active boolean NOT NULL DEFAULT true,
  last_assigned_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.agents TO authenticated;
GRANT ALL ON public.agents TO service_role;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage agents" ON public.agents FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Agents read own profile" ON public.agents FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.agent_training_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(user_id) ON DELETE CASCADE,
  section_key text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, section_key)
);
GRANT SELECT ON public.agent_training_progress TO authenticated;
GRANT ALL ON public.agent_training_progress TO service_role;
ALTER TABLE public.agent_training_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read training" ON public.agent_training_progress FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Agents read own training" ON public.agent_training_progress FOR SELECT TO authenticated USING (agent_id = auth.uid());

CREATE TABLE public.agent_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(user_id) ON DELETE CASCADE,
  version text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip text,
  UNIQUE (agent_id, version)
);
GRANT SELECT ON public.agent_agreements TO authenticated;
GRANT ALL ON public.agent_agreements TO service_role;
ALTER TABLE public.agent_agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read agreements" ON public.agent_agreements FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Agents read own agreements" ON public.agent_agreements FOR SELECT TO authenticated USING (agent_id = auth.uid());

CREATE TABLE public.agent_settings (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  payout_percent numeric NOT NULL DEFAULT 30 CHECK (payout_percent BETWEEN 0 AND 100),
  auto_assign boolean NOT NULL DEFAULT false,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.agent_settings TO authenticated;
GRANT ALL ON public.agent_settings TO service_role;
ALTER TABLE public.agent_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read agent settings" ON public.agent_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.agent_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL UNIQUE REFERENCES public.crm_leads(id) ON DELETE RESTRICT,
  agent_id uuid NOT NULL REFERENCES public.agents(user_id) ON DELETE RESTRICT,
  clearfund_commission numeric NOT NULL CHECK (clearfund_commission >= 0),
  agent_percent numeric NOT NULL CHECK (agent_percent BETWEEN 0 AND 100),
  agent_amount numeric NOT NULL CHECK (agent_amount >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid')),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.agent_payouts TO authenticated;
GRANT ALL ON public.agent_payouts TO service_role;
ALTER TABLE public.agent_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read payouts" ON public.agent_payouts FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Agents read own payouts" ON public.agent_payouts FOR SELECT TO authenticated USING (agent_id = auth.uid());
CREATE INDEX agent_payouts_agent_idx ON public.agent_payouts (agent_id, status);

CREATE INDEX cta_clicks_lead_idx ON public.cta_clicks (lead_id, clicked_at DESC);
CREATE INDEX cta_clicks_agent_idx ON public.cta_clicks (agent_id, clicked_at DESC);
CREATE INDEX crm_leads_warm_idx ON public.crm_leads (warm_reason, assigned_to) WHERE warm_reason IS NOT NULL;
CREATE INDEX crm_leads_type_state_idx ON public.crm_leads (lead_type, state);

-- Portal agents no longer inherit broad CRM table access. CRM administration stays admin-only.
CREATE OR REPLACE FUNCTION public.is_crm_user(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
$$;

DROP POLICY IF EXISTS "crm leads select" ON public.crm_leads;
DROP POLICY IF EXISTS "crm leads update" ON public.crm_leads;
CREATE POLICY "crm leads select admin" ON public.crm_leads FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "crm leads update admin" ON public.crm_leads FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Public click inserts remain supported, but linked warm attribution must go through the validated RPC.
DROP POLICY IF EXISTS "Anyone can log a click" ON public.cta_clicks;
CREATE POLICY "Anyone can log an unlinked click" ON public.cta_clicks FOR INSERT TO anon, authenticated WITH CHECK (lead_id IS NULL AND agent_id IS NULL);

CREATE OR REPLACE FUNCTION public.crm_stage_ok(_lead_type text, _stage text)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN _lead_type = 'partner' THEN _stage IN ('New','Contacted','Interested','Signed up (DAC)','Trained','First referral')
    WHEN _lead_type = 'recruit' THEN _stage IN ('new','contacted','applied','approved','rejected')
    ELSE _stage IN ('New','Contacted','Replied','Interested','Applied','Submitted to funder','Funded','Lost') END
$$;

CREATE OR REPLACE FUNCTION public.crm_lead_eligible(_l public.crm_leads, _type text)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT NOT _l.do_not_contact
    AND _l.lead_type IS DISTINCT FROM 'partner' AND _l.lead_type IS DISTINCT FROM 'recruit'
    AND CASE _type
      WHEN 'find_email' THEN COALESCE(_l.email,'') = '' AND _l.website_key IS NOT NULL
      WHEN 'score' THEN _l.need_score IS NULL
      WHEN 'first_line' THEN COALESCE(_l.email,'') <> '' AND COALESCE(_l.first_line,'') = ''
      WHEN 'outreach' THEN COALESCE(_l.email,'') <> '' AND COALESCE(_l.first_line,'') <> '' AND _l.stage = 'New'
      ELSE false END
$$;

CREATE OR REPLACE FUNCTION public.crm_lead_counts(_today date, _q text DEFAULT NULL, _source text DEFAULT NULL, _agent text DEFAULT NULL, _due text DEFAULT NULL, _type text DEFAULT NULL)
RETURNS jsonb LANGUAGE sql STABLE SET search_path = public AS $$
  WITH base AS (SELECT * FROM public.crm_leads l WHERE coalesce(_type,'') = '' OR (_type = 'partner' AND l.lead_type = 'partner') OR (_type = 'recruit' AND l.lead_type = 'recruit') OR (_type = 'client' AND l.lead_type IS DISTINCT FROM 'partner' AND l.lead_type IS DISTINCT FROM 'recruit')),
  f AS (SELECT stage FROM base l WHERE
    (coalesce(_q,'') = '' OR concat_ws(' ',l.firm,l.contact_name,l.email,l.phone,l.agency,l.lead_ref,l.website,l.state,l.sector) ILIKE '%' || replace(replace(replace(_q,'\','\\'),'%','\%'),'_','\_') || '%')
    AND (coalesce(_source,'') = '' OR l.source = _source)
    AND (coalesce(_agent,'') = '' OR (_agent = 'unassigned' AND l.assigned_to IS NULL) OR (_agent <> 'unassigned' AND l.assigned_to::text = _agent))
    AND (coalesce(_due,'') = '' OR (_due = 'today' AND l.next_follow_up = _today) OR (_due = 'overdue' AND l.next_follow_up < _today)))
  SELECT jsonb_build_object('total',(SELECT count(*) FROM base),'due_today',(SELECT count(*) FROM base WHERE next_follow_up=_today),'overdue',(SELECT count(*) FROM base WHERE next_follow_up<_today),'added_week',(SELECT count(*) FROM base WHERE created_at>=now()-interval '7 days'),'by_stage',coalesce((SELECT jsonb_object_agg(stage,n) FROM (SELECT stage,count(*) n FROM f GROUP BY stage) s),'{}'::jsonb));
$$;

CREATE OR REPLACE FUNCTION public.crm_lead_counts_v2(_today date, _q text DEFAULT NULL, _source text DEFAULT NULL, _agent text DEFAULT NULL, _due text DEFAULT NULL, _type text DEFAULT NULL, _warm boolean DEFAULT false)
RETURNS jsonb LANGUAGE sql STABLE SET search_path = public AS $$
  WITH base AS (SELECT * FROM public.crm_leads l WHERE coalesce(_type,'') = '' OR (_type = 'partner' AND l.lead_type = 'partner') OR (_type = 'recruit' AND l.lead_type = 'recruit') OR (_type = 'client' AND l.lead_type IS DISTINCT FROM 'partner' AND l.lead_type IS DISTINCT FROM 'recruit')),
  f AS (SELECT stage FROM base l WHERE
    (NOT COALESCE(_warm,false) OR l.warm_reason IS NOT NULL)
    AND (coalesce(_q,'') = '' OR concat_ws(' ',l.firm,l.contact_name,l.email,l.phone,l.agency,l.lead_ref,l.website,l.state,l.sector) ILIKE '%' || replace(replace(replace(_q,'\','\\'),'%','\%'),'_','\_') || '%')
    AND (coalesce(_source,'') = '' OR l.source = _source)
    AND (coalesce(_agent,'') = '' OR (_agent = 'unassigned' AND l.assigned_to IS NULL) OR (_agent <> 'unassigned' AND l.assigned_to::text = _agent))
    AND (coalesce(_due,'') = '' OR (_due = 'today' AND l.next_follow_up = _today) OR (_due = 'overdue' AND l.next_follow_up < _today)))
  SELECT jsonb_build_object('total',(SELECT count(*) FROM base WHERE NOT COALESCE(_warm,false) OR warm_reason IS NOT NULL),'due_today',(SELECT count(*) FROM base WHERE next_follow_up=_today AND (NOT COALESCE(_warm,false) OR warm_reason IS NOT NULL)),'overdue',(SELECT count(*) FROM base WHERE next_follow_up<_today AND (NOT COALESCE(_warm,false) OR warm_reason IS NOT NULL)),'added_week',(SELECT count(*) FROM base WHERE created_at>=now()-interval '7 days' AND (NOT COALESCE(_warm,false) OR warm_reason IS NOT NULL)),'by_stage',coalesce((SELECT jsonb_object_agg(stage,n) FROM (SELECT stage,count(*) n FROM f GROUP BY stage) s),'{}'::jsonb));
$$;

-- Warmth is explicit and maintained by database triggers, never inferred by the agent UI.
CREATE OR REPLACE FUNCTION public.crm_compute_warm_reason(_lead public.crm_leads)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN _lead.lead_type IN ('partner','recruit') THEN NULL
    WHEN _lead.agent_id IS NOT NULL THEN 'Own referral'
    WHEN _lead.qualifier IS NOT NULL THEN 'Qualifier submission'
    WHEN EXISTS (SELECT 1 FROM public.email_events e WHERE e.lead_id=_lead.id AND e.event='replied') THEN 'Email reply'
    WHEN EXISTS (SELECT 1 FROM public.crm_activities a WHERE a.lead_id=_lead.id AND a.type='email' AND a.body LIKE 'Reply in %') THEN 'Email reply'
    WHEN EXISTS (SELECT 1 FROM public.cta_clicks c WHERE c.lead_id=_lead.id) THEN 'CTA click'
    ELSE NULL END
$$;
REVOKE ALL ON FUNCTION public.crm_compute_warm_reason(public.crm_leads) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.crm_set_warm_reason()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.warm_reason := public.crm_compute_warm_reason(NEW);
  RETURN NEW;
END $$;
CREATE TRIGGER crm_leads_warm_before BEFORE INSERT OR UPDATE OF qualifier, agent_id ON public.crm_leads FOR EACH ROW EXECUTE FUNCTION public.crm_set_warm_reason();

CREATE OR REPLACE FUNCTION public.crm_refresh_warm_from_email()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.lead_id IS NOT NULL AND NEW.event='replied' THEN
    UPDATE public.crm_leads SET warm_reason='Email reply' WHERE id=NEW.lead_id AND lead_type IS DISTINCT FROM 'partner' AND lead_type IS DISTINCT FROM 'recruit' AND (warm_reason IS NULL OR warm_reason='CTA click');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER email_events_warm_after AFTER INSERT ON public.email_events FOR EACH ROW EXECUTE FUNCTION public.crm_refresh_warm_from_email();

CREATE OR REPLACE FUNCTION public.crm_refresh_warm_from_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.type='email' AND NEW.body LIKE 'Reply in %' THEN
    UPDATE public.crm_leads SET warm_reason='Email reply' WHERE id=NEW.lead_id AND lead_type IS DISTINCT FROM 'partner' AND lead_type IS DISTINCT FROM 'recruit' AND (warm_reason IS NULL OR warm_reason='CTA click');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER crm_activities_warm_after AFTER INSERT ON public.crm_activities FOR EACH ROW EXECUTE FUNCTION public.crm_refresh_warm_from_activity();

CREATE OR REPLACE FUNCTION public.crm_refresh_warm_from_click()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.lead_id IS NOT NULL THEN
    UPDATE public.crm_leads SET warm_reason='CTA click' WHERE id=NEW.lead_id AND lead_type IS DISTINCT FROM 'partner' AND lead_type IS DISTINCT FROM 'recruit' AND warm_reason IS NULL;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER cta_clicks_warm_after AFTER INSERT ON public.cta_clicks FOR EACH ROW EXECUTE FUNCTION public.crm_refresh_warm_from_click();

-- Backfill is part of the additive warm_reason schema change.
UPDATE public.crm_leads l SET warm_reason = CASE
  WHEN l.lead_type IN ('partner','recruit') THEN NULL
  WHEN l.agent_id IS NOT NULL THEN 'Own referral'
  WHEN l.qualifier IS NOT NULL THEN 'Qualifier submission'
  WHEN EXISTS (SELECT 1 FROM public.email_events e WHERE e.lead_id=l.id AND e.event='replied') THEN 'Email reply'
  WHEN EXISTS (SELECT 1 FROM public.crm_activities a WHERE a.lead_id=l.id AND a.type='email' AND a.body LIKE 'Reply in %') THEN 'Email reply'
  WHEN EXISTS (SELECT 1 FROM public.cta_clicks c WHERE c.lead_id=l.id) THEN 'CTA click'
  ELSE NULL END;

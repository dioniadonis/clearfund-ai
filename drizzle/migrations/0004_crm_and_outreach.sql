ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'agent';

CREATE OR REPLACE FUNCTION public.is_crm_user(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role::text IN ('admin','agent'))
$$;

CREATE TABLE public.crm_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm text,
  contact_name text,
  email text,
  phone text,
  agency text,
  award_amount numeric,
  award_date date,
  source text NOT NULL DEFAULT 'manual',
  stage text NOT NULL DEFAULT 'New' CHECK (stage IN ('New','Contacted','Interested','Applied','Submitted to funder','Funded','Lost')),
  assigned_to uuid,
  next_follow_up date,
  notes text,
  lead_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX crm_leads_email_idx ON public.crm_leads (lower(email));
CREATE INDEX crm_leads_ref_idx ON public.crm_leads (lead_ref);
CREATE INDEX crm_leads_assigned_idx ON public.crm_leads (assigned_to);

CREATE TABLE public.crm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  user_id uuid,
  type text NOT NULL CHECK (type IN ('call','email','text','note','stage_change')),
  body text CHECK (char_length(body) <= 5000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX crm_activities_lead_idx ON public.crm_activities (lead_id, created_at DESC);

CREATE TABLE public.outreach_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead text CHECK (char_length(lead) <= 100),
  firm text CHECK (char_length(firm) <= 200),
  agency text CHECK (char_length(agency) <= 200),
  visited_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_leads TO authenticated;
GRANT SELECT, INSERT ON public.crm_activities TO authenticated;
GRANT INSERT ON public.outreach_visits TO anon, authenticated;
GRANT ALL ON public.crm_leads, public.crm_activities, public.outreach_visits TO service_role;

ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm leads select" ON public.crm_leads FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR (public.is_crm_user(auth.uid()) AND (assigned_to IS NULL OR assigned_to = auth.uid())));
CREATE POLICY "crm leads update" ON public.crm_leads FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR (public.is_crm_user(auth.uid()) AND (assigned_to IS NULL OR assigned_to = auth.uid())))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR (public.is_crm_user(auth.uid()) AND (assigned_to IS NULL OR assigned_to = auth.uid())));
CREATE POLICY "crm leads insert admin" ON public.crm_leads FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "crm leads delete admin" ON public.crm_leads FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "crm activities select" ON public.crm_activities FOR SELECT TO authenticated
  USING (public.is_crm_user(auth.uid()) AND EXISTS (SELECT 1 FROM public.crm_leads l WHERE l.id = lead_id));
CREATE POLICY "crm activities insert" ON public.crm_activities FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND type <> 'stage_change' AND public.is_crm_user(auth.uid()) AND EXISTS (SELECT 1 FROM public.crm_leads l WHERE l.id = lead_id));

CREATE POLICY "outreach visits insert" ON public.outreach_visits FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TRIGGER crm_leads_updated_at BEFORE UPDATE ON public.crm_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Stage changes are logged atomically with the update
CREATE OR REPLACE FUNCTION public.crm_log_stage_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.stage IS DISTINCT FROM OLD.stage THEN
    INSERT INTO public.crm_activities (lead_id, user_id, type, body)
    VALUES (NEW.id, auth.uid(), 'stage_change', OLD.stage || ' → ' || NEW.stage);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER crm_leads_stage_log AFTER UPDATE OF stage ON public.crm_leads
  FOR EACH ROW EXECUTE FUNCTION public.crm_log_stage_change();

-- Agents list (CRM users only)
CREATE OR REPLACE FUNCTION public.crm_list_agents()
RETURNS TABLE (id uuid, email text, role text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT ON (r.user_id) r.user_id, p.email, r.role::text
  FROM public.user_roles r LEFT JOIN public.profiles p ON p.id = r.user_id
  WHERE r.role::text IN ('admin','agent') AND public.is_crm_user(auth.uid())
  ORDER BY r.user_id, (r.role::text = 'admin') DESC
$$;
REVOKE EXECUTE ON FUNCTION public.crm_list_agents() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.crm_list_agents() TO authenticated;

-- Auto-feed
CREATE OR REPLACE FUNCTION public.crm_feed_from_apply()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  IF NEW.application_status <> 'completed' OR (TG_OP = 'UPDATE' AND OLD.application_status = 'completed') THEN RETURN NEW; END IF;
  SELECT id INTO _id FROM public.crm_leads WHERE NEW.email IS NOT NULL AND lower(email) = lower(NEW.email) ORDER BY created_at LIMIT 1;
  IF _id IS NULL THEN
    INSERT INTO public.crm_leads (firm, contact_name, email, phone, source, stage, lead_ref)
    VALUES (NEW.business_name, NEW.full_name, NEW.email, NEW.phone, 'apply', 'Applied', NEW.id::text) RETURNING id INTO _id;
  ELSE
    UPDATE public.crm_leads SET
      firm = COALESCE(NULLIF(firm,''), NEW.business_name),
      contact_name = COALESCE(NULLIF(contact_name,''), NEW.full_name),
      phone = COALESCE(NULLIF(phone,''), NEW.phone),
      stage = CASE WHEN stage IN ('New','Contacted','Interested') THEN 'Applied' ELSE stage END
    WHERE id = _id;
  END IF;
  INSERT INTO public.crm_activities (lead_id, type, body) VALUES (_id, 'note', 'Submitted the /apply form');
  RETURN NEW;
END; $$;
CREATE TRIGGER leads_crm_feed AFTER INSERT OR UPDATE OF application_status ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.crm_feed_from_apply();

CREATE OR REPLACE FUNCTION public.crm_feed_from_calculator()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  SELECT id INTO _id FROM public.crm_leads WHERE lower(email) = lower(NEW.email) ORDER BY created_at LIMIT 1;
  IF _id IS NULL THEN
    INSERT INTO public.crm_leads (email, source, award_amount)
    VALUES (NEW.email, 'calculator', NULLIF(NEW.inputs->>'contractAmount','')::numeric) RETURNING id INTO _id;
  END IF;
  INSERT INTO public.crm_activities (lead_id, type, body)
  VALUES (_id, 'note', 'Saved a cash-gap estimate of $' || round(NEW.cash_gap)::text);
  RETURN NEW;
END; $$;
CREATE TRIGGER cash_gap_leads_crm_feed AFTER INSERT ON public.cash_gap_leads
  FOR EACH ROW EXECUTE FUNCTION public.crm_feed_from_calculator();

CREATE OR REPLACE FUNCTION public.crm_feed_from_outreach()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  IF NULLIF(NEW.lead,'') IS NOT NULL THEN
    SELECT id INTO _id FROM public.crm_leads WHERE lead_ref = NEW.lead OR id::text = NEW.lead ORDER BY created_at LIMIT 1;
  END IF;
  IF _id IS NULL THEN
    IF NULLIF(NEW.lead,'') IS NULL AND NULLIF(NEW.firm,'') IS NULL THEN RETURN NEW; END IF;
    INSERT INTO public.crm_leads (firm, agency, source, lead_ref)
    VALUES (NULLIF(NEW.firm,''), NULLIF(NEW.agency,''), 'outreach', NULLIF(NEW.lead,'')) RETURNING id INTO _id;
  ELSE
    UPDATE public.crm_leads SET firm = COALESCE(NULLIF(firm,''), NULLIF(NEW.firm,'')), agency = COALESCE(NULLIF(agency,''), NULLIF(NEW.agency,'')) WHERE id = _id;
  END IF;
  INSERT INTO public.crm_activities (lead_id, type, body) VALUES (_id, 'note', 'Opened the /awarded outreach page');
  RETURN NEW;
END; $$;
CREATE TRIGGER outreach_visits_crm_feed AFTER INSERT ON public.outreach_visits
  FOR EACH ROW EXECUTE FUNCTION public.crm_feed_from_outreach();

REVOKE EXECUTE ON FUNCTION public.crm_feed_from_apply(), public.crm_feed_from_calculator(), public.crm_feed_from_outreach(), public.crm_log_stage_change() FROM anon, authenticated, public;
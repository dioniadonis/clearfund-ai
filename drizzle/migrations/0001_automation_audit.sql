CREATE TYPE public.audit_status AS ENUM ('submitted','in_review','blueprint_draft','owner_approved','delivered','cancelled');

CREATE TABLE public.audit_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code text NOT NULL UNIQUE,
  full_name text NOT NULL,
  business_name text NOT NULL,
  email text NOT NULL,
  phone text,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  status public.audit_status NOT NULL DEFAULT 'submitted',
  payment_status text NOT NULL DEFAULT 'unavailable_stub',
  phone_contact_allowed boolean NOT NULL DEFAULT false,
  form_version text NOT NULL,
  utm_source text, utm_medium text, utm_campaign text, referrer text, landing_page text,
  retention_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.audit_requests TO authenticated;
GRANT ALL ON public.audit_requests TO service_role;
ALTER TABLE public.audit_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Operators view audit requests" ON public.audit_requests FOR SELECT TO authenticated USING (public.is_operator(auth.uid()));
CREATE TRIGGER audit_requests_updated_at BEFORE UPDATE ON public.audit_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.audit_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.audit_requests(id),
  consent_type text NOT NULL,
  displayed_text text NOT NULL,
  checked boolean NOT NULL,
  form_version text NOT NULL,
  ip text,
  page_url text,
  phone_entered text,
  consented_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.audit_consents IS 'Consent/disclosure records. Retain at least 5 years. Never redact.';
GRANT SELECT ON public.audit_consents TO authenticated;
GRANT ALL ON public.audit_consents TO service_role;
ALTER TABLE public.audit_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Operators view audit consents" ON public.audit_consents FOR SELECT TO authenticated USING (public.is_operator(auth.uid()));

CREATE TABLE public.audit_blueprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.audit_requests(id),
  version integer NOT NULL,
  sections jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, version)
);
GRANT SELECT ON public.audit_blueprints TO authenticated;
GRANT ALL ON public.audit_blueprints TO service_role;
ALTER TABLE public.audit_blueprints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Operators view blueprints" ON public.audit_blueprints FOR SELECT TO authenticated USING (public.is_operator(auth.uid()));

CREATE TABLE public.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.audit_requests(id),
  event_type text NOT NULL,
  description text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_events TO authenticated;
GRANT ALL ON public.audit_events TO service_role;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Operators view audit events" ON public.audit_events FOR SELECT TO authenticated USING (public.is_operator(auth.uid()));

CREATE OR REPLACE FUNCTION public.operator_set_audit_status(_request_id uuid, _status public.audit_status, _note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_operator(auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF _status = 'delivered' AND NOT EXISTS (SELECT 1 FROM public.audit_blueprints WHERE request_id = _request_id AND status = 'approved') THEN
    RAISE EXCEPTION 'Blueprint must be owner-approved before delivery';
  END IF;
  UPDATE public.audit_requests SET status = _status WHERE id = _request_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Audit not found'; END IF;
  INSERT INTO public.audit_events (request_id, event_type, description, created_by)
  VALUES (_request_id, 'status_change', 'Status set to ' || _status || COALESCE(': ' || NULLIF(_note,''), ''), auth.uid());
END; $$;

CREATE OR REPLACE FUNCTION public.operator_save_blueprint(_request_id uuid, _sections jsonb, _approve boolean)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _v integer;
BEGIN
  IF NOT public.is_operator(auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF _approve AND NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Only the owner (admin) can approve'; END IF;
  SELECT COALESCE(MAX(version),0)+1 INTO _v FROM public.audit_blueprints WHERE request_id = _request_id;
  INSERT INTO public.audit_blueprints (request_id, version, sections, status, created_by, approved_by, approved_at)
  VALUES (_request_id, _v, _sections, CASE WHEN _approve THEN 'approved' ELSE 'draft' END, auth.uid(),
          CASE WHEN _approve THEN auth.uid() END, CASE WHEN _approve THEN now() END);
  UPDATE public.audit_requests SET status = CASE WHEN _approve THEN 'owner_approved'::public.audit_status ELSE 'blueprint_draft'::public.audit_status END WHERE id = _request_id;
  INSERT INTO public.audit_events (request_id, event_type, description, created_by)
  VALUES (_request_id, CASE WHEN _approve THEN 'blueprint_approved' ELSE 'blueprint_saved' END, 'Blueprint version ' || _v, auth.uid());
  RETURN _v;
END; $$;

REVOKE ALL ON FUNCTION public.operator_set_audit_status(uuid, public.audit_status, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.operator_save_blueprint(uuid, jsonb, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.operator_set_audit_status(uuid, public.audit_status, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.operator_save_blueprint(uuid, jsonb, boolean) TO authenticated;
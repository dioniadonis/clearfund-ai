CREATE TABLE public.free_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_token text NOT NULL UNIQUE,
  first_name text NOT NULL,
  business_name text NOT NULL,
  email text NOT NULL,
  phone text,
  phone_contact_allowed boolean NOT NULL DEFAULT false,
  answers jsonb NOT NULL,
  results jsonb NOT NULL,
  ai_analysis jsonb,
  ai_raw text,
  ai_status text NOT NULL DEFAULT 'pending',
  form_version text NOT NULL,
  utm_source text, utm_medium text, utm_campaign text, referrer text, landing_page text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.free_audits TO authenticated;
GRANT ALL ON public.free_audits TO service_role;
ALTER TABLE public.free_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Operators read free audits" ON public.free_audits FOR SELECT TO authenticated USING (public.is_operator(auth.uid()));
CREATE TRIGGER free_audits_updated_at BEFORE UPDATE ON public.free_audits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.free_audit_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid NOT NULL REFERENCES public.free_audits(id) ON DELETE CASCADE,
  consent_type text NOT NULL,
  displayed_text text NOT NULL,
  checked boolean NOT NULL,
  form_version text NOT NULL,
  ip text, page_url text, phone_entered text,
  consented_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.free_audit_consents TO authenticated;
GRANT ALL ON public.free_audit_consents TO service_role;
ALTER TABLE public.free_audit_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Operators read free audit consents" ON public.free_audit_consents FOR SELECT TO authenticated USING (public.is_operator(auth.uid()));

CREATE TABLE public.free_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid NOT NULL REFERENCES public.free_audits(id) ON DELETE CASCADE,
  event_name text NOT NULL,
  step_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  utm_source text, utm_medium text, utm_campaign text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.free_audit_events TO authenticated;
GRANT ALL ON public.free_audit_events TO service_role;
ALTER TABLE public.free_audit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Operators read free audit events" ON public.free_audit_events FOR SELECT TO authenticated USING (public.is_operator(auth.uid()));
CREATE INDEX free_audit_events_audit_idx ON public.free_audit_events(audit_id);
CREATE INDEX free_audits_created_idx ON public.free_audits(created_at DESC);
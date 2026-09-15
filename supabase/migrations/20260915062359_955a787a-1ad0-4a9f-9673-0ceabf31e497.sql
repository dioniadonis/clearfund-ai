CREATE TABLE public.application_sends (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  delivery_method text NOT NULL,
  destination text NOT NULL,
  owner_name text,
  business_name text,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL DEFAULT now() + interval '14 days',
  used_at timestamp with time zone,
  status text NOT NULL DEFAULT 'pending',
  failure_reason text,
  provider_message_id text,
  sent_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.application_sends TO authenticated;
GRANT ALL ON public.application_sends TO service_role;
ALTER TABLE public.application_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Operators manage application sends" ON public.application_sends
  FOR ALL TO authenticated
  USING (public.is_operator(auth.uid()))
  WITH CHECK (public.is_operator(auth.uid()));

CREATE TRIGGER application_sends_updated_at BEFORE UPDATE ON public.application_sends
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX application_sends_lead_idx ON public.application_sends(lead_id);
CREATE INDEX application_sends_created_idx ON public.application_sends(created_at DESC);

CREATE TABLE public.callback_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  phone text NOT NULL,
  preferred_datetime_raw text NOT NULL,
  preferred_at timestamp with time zone,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  resolved_at timestamp with time zone,
  resolved_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.callback_requests TO authenticated;
GRANT ALL ON public.callback_requests TO service_role;
ALTER TABLE public.callback_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Operators manage callback requests" ON public.callback_requests
  FOR ALL TO authenticated
  USING (public.is_operator(auth.uid()))
  WITH CHECK (public.is_operator(auth.uid()));

CREATE TRIGGER callback_requests_updated_at BEFORE UPDATE ON public.callback_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX callback_requests_status_idx ON public.callback_requests(status, created_at DESC);
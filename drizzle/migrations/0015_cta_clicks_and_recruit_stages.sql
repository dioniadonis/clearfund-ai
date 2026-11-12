CREATE TABLE public.cta_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cta text NOT NULL CHECK (length(cta) <= 80),
  page text CHECK (length(page) <= 200),
  destination text NOT NULL CHECK (destination = 'dac'),
  clicked_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.cta_clicks TO anon, authenticated;
GRANT SELECT ON public.cta_clicks TO authenticated;
GRANT ALL ON public.cta_clicks TO service_role;
ALTER TABLE public.cta_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can log a click" ON public.cta_clicks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Operators read clicks" ON public.cta_clicks FOR SELECT TO authenticated USING (public.is_operator(auth.uid()) OR public.is_crm_user(auth.uid()));

CREATE OR REPLACE FUNCTION public.crm_stage_ok(_lead_type text, _stage text) RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN _lead_type = 'partner'
    THEN _stage IN ('New','Contacted','Interested','Signed up (DAC)','Trained','First referral')
    ELSE _stage IN ('New','Contacted','Replied','Interested','Applied','Submitted to funder','Funded','Lost') END
$$;
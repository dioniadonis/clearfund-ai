CREATE TABLE public.cash_gap_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL CHECK (char_length(email) BETWEEN 5 AND 254 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  stage text CHECK (stage IS NULL OR stage IN ('bidding','won','working','invoiced')),
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (pg_column_size(inputs) < 4000),
  cash_gap numeric NOT NULL CHECK (cash_gap >= 0 AND cash_gap < 1000000000),
  marketing_consent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.cash_gap_leads TO anon, authenticated;
GRANT SELECT ON public.cash_gap_leads TO authenticated;
GRANT ALL ON public.cash_gap_leads TO service_role;
ALTER TABLE public.cash_gap_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can save an estimate" ON public.cash_gap_leads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Operators read estimates" ON public.cash_gap_leads FOR SELECT TO authenticated USING (public.is_operator(auth.uid()));
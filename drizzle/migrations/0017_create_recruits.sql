CREATE TABLE public.recruits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  state text NOT NULL,
  over_18 boolean NOT NULL,
  commission_experience text NOT NULL,
  current_work text NOT NULL,
  owner_contact text NOT NULL,
  owner_network text NOT NULL,
  hours_per_week text NOT NULL,
  outside_work_limit text NOT NULL,
  commission_only_ok boolean NOT NULL,
  written_answer text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  hard_stop_reason text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'review', 'call', 'sent_link', 'certified', 'not_now')),
  notes text,
  source text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.recruits TO anon;
GRANT SELECT ON public.recruits TO authenticated;
GRANT UPDATE (status, notes) ON public.recruits TO authenticated;
GRANT ALL ON public.recruits TO service_role;
ALTER TABLE public.recruits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can submit recruiting applications" ON public.recruits FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "CRM users read recruiting applications" ON public.recruits FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
CREATE POLICY "CRM users update recruiting applications" ON public.recruits FOR UPDATE TO authenticated USING (public.is_crm_user(auth.uid())) WITH CHECK (public.is_crm_user(auth.uid()));
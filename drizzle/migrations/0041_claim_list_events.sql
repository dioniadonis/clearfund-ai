CREATE TABLE public.claim_list_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  event text NOT NULL CHECK (event IN ('view_landing','view_app','order_click','checkout_start')),
  plan text CHECK (plan IS NULL OR plan IN ('small','standard','major')),
  session_id text CHECK (session_id IS NULL OR session_id ~ '^[a-z0-9]{8,40}$')
);
GRANT SELECT ON public.claim_list_events TO authenticated;
GRANT ALL ON public.claim_list_events TO service_role;
ALTER TABLE public.claim_list_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Operators read claim list events" ON public.claim_list_events
  FOR SELECT TO authenticated USING (public.is_operator(auth.uid()));
CREATE INDEX claim_list_events_created_idx ON public.claim_list_events (created_at DESC);
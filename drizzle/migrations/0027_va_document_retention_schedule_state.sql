CREATE TABLE public.va_maintenance_state (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  access_key uuid NOT NULL DEFAULT gen_random_uuid()
);
ALTER TABLE public.va_maintenance_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.va_maintenance_state FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.va_maintenance_state TO service_role;
-- Shared secrets for inbound integrations (the Retell webhook), stored as SHA-256 hashes only.
-- No policies: only the service role (edge functions) can read or check them.
CREATE TABLE IF NOT EXISTS public.integration_tokens (
  name text PRIMARY KEY,
  token_hash text NOT NULL CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.integration_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.integration_tokens FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.integration_tokens TO service_role;

CREATE OR REPLACE FUNCTION public.integration_token_ok(_name text, _token_hash text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.integration_tokens WHERE name=_name AND token_hash=lower(_token_hash)) $$;
REVOKE ALL ON FUNCTION public.integration_token_ok(text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.integration_token_ok(text,text) TO service_role;

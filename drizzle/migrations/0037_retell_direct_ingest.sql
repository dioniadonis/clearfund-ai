-- Retell posts call events straight to the database API (no edge function needed):
--   POST https://<project>.supabase.co/rest/v1/rpc/retell_ingest?apikey=<publishable key>
-- Body is Retell's own {"event": ..., "call": {...}}. Accepted only from Retell's published webhook IP
-- (100.20.5.228, as seen by the API gateway) and only for the ClearFund agent. Transcripts are not stored.
CREATE TABLE IF NOT EXISTS public.retell_ingest_rejects (
  id bigserial PRIMARY KEY, ip text, agent_id text, event text, created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.retell_ingest_rejects ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.retell_ingest_rejects FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS "Admins read Retell rejects" ON public.retell_ingest_rejects;
CREATE POLICY "Admins read Retell rejects" ON public.retell_ingest_rejects FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.retell_ingest(event text, "call" jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  _h json := NULLIF(current_setting('request.headers', true),'')::json;
  _ip text := trim(split_part(COALESCE(_h->>'cf-connecting-ip', _h->>'x-real-ip', _h->>'x-forwarded-for', ''), ',', 1));
  _agent text := "call"->>'agent_id';
BEGIN
  IF _ip IS DISTINCT FROM '100.20.5.228' OR _agent IS DISTINCT FROM 'agent_735704f5f662e162697fe2bc07' THEN
    IF (SELECT count(*) FROM retell_ingest_rejects WHERE created_at > now() - interval '1 hour') < 50 THEN
      INSERT INTO retell_ingest_rejects(ip, agent_id, event) VALUES (left(_ip,64), left(_agent,64), left(event,40));
    END IF;
    RETURN;  -- quiet: nothing is written for callers that are not Retell
  END IF;
  IF event NOT IN ('call_ended','call_analyzed') OR jsonb_typeof("call") <> 'object' THEN RETURN; END IF;
  PERFORM public.crm_record_ai_call(jsonb_strip_nulls(jsonb_build_object(
    'call_id', "call"->'call_id', 'direction', "call"->'direction', 'from_number', "call"->'from_number',
    'to_number', "call"->'to_number', 'call_status', "call"->'call_status', 'start_timestamp', "call"->'start_timestamp',
    'end_timestamp', "call"->'end_timestamp', 'duration_ms', "call"->'duration_ms', 'call_analysis', "call"->'call_analysis',
    'collected_dynamic_variables', "call"->'collected_dynamic_variables')));
END $$;
REVOKE ALL ON FUNCTION public.retell_ingest(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.retell_ingest(text, jsonb) TO anon, service_role;

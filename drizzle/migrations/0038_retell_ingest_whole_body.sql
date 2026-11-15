-- Retell's webhook body can carry more top-level keys than {event, call}; the database API only matches a
-- named-argument function when the keys match exactly (otherwise 404). A single unnamed jsonb argument
-- receives the whole body instead, whatever keys it has. Same checks as 0037.
DROP FUNCTION IF EXISTS public.retell_ingest(text, jsonb);
CREATE OR REPLACE FUNCTION public.retell_ingest(jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  _body jsonb := $1;
  _event text := _body->>'event';
  _call jsonb := _body->'call';
  _h json := NULLIF(current_setting('request.headers', true),'')::json;
  _ip text := trim(split_part(COALESCE(_h->>'cf-connecting-ip', _h->>'x-real-ip', _h->>'x-forwarded-for', ''), ',', 1));
  _agent text := _call->>'agent_id';
BEGIN
  IF _ip IS DISTINCT FROM '100.20.5.228' OR _agent IS DISTINCT FROM 'agent_735704f5f662e162697fe2bc07' THEN
    IF (SELECT count(*) FROM retell_ingest_rejects WHERE created_at > now() - interval '1 hour') < 50 THEN
      INSERT INTO retell_ingest_rejects(ip, agent_id, event) VALUES (left(_ip,64), left(_agent,64), left(_event,40));
    END IF;
    RETURN;  -- quiet: nothing is written for callers that are not Retell
  END IF;
  IF _event NOT IN ('call_ended','call_analyzed') OR jsonb_typeof(_call) IS DISTINCT FROM 'object' THEN RETURN; END IF;
  PERFORM public.crm_record_ai_call(jsonb_strip_nulls(jsonb_build_object(
    'call_id', _call->'call_id', 'direction', _call->'direction', 'from_number', _call->'from_number',
    'to_number', _call->'to_number', 'call_status', _call->'call_status', 'start_timestamp', _call->'start_timestamp',
    'end_timestamp', _call->'end_timestamp', 'duration_ms', _call->'duration_ms', 'call_analysis', _call->'call_analysis',
    'collected_dynamic_variables', _call->'collected_dynamic_variables')));
END $$;
REVOKE ALL ON FUNCTION public.retell_ingest(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.retell_ingest(jsonb) TO anon, service_role;
NOTIFY pgrst, 'reload schema';

CREATE OR REPLACE FUNCTION public.crm_cap_json(_j jsonb, _max integer) RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN _j IS NULL OR length(_j::text) <= _max THEN _j ELSE jsonb_build_object('truncated', true) END
$$;

CREATE OR REPLACE FUNCTION public.crm_complete_job(_worker text, _job_id uuid, _ok boolean, _result jsonb, _error text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _j crm_jobs; _email text; _score int; _line text; _src text;
BEGIN
  SELECT * INTO _j FROM crm_jobs WHERE id = _job_id FOR UPDATE;
  IF _j.id IS NULL THEN RETURN 'not_found'; END IF;
  IF _j.claimed_by <> left(_worker,80) THEN RETURN 'not_claimer'; END IF;
  IF _j.status <> 'claimed' THEN RETURN 'not_claimed'; END IF;
  IF _j.expires_at < now() THEN RETURN 'expired'; END IF;
  IF NOT COALESCE(_ok,false) THEN
    UPDATE crm_jobs SET status = 'failed', error = left(COALESCE(_error,'failed'),500), finished_at = now() WHERE id = _job_id;
    RETURN 'failed_recorded';
  END IF;
  IF _j.job_type = 'find_email' THEN
    _email := lower(left(trim(COALESCE(_result->>'email','')),320));
    _src := NULLIF(left(trim(COALESCE(_result->>'email_source','')),120),'');
    IF _email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN RETURN 'invalid_email'; END IF;
    IF EXISTS (SELECT 1 FROM crm_leads WHERE lower(email) = _email AND id <> _j.lead_id) THEN
      UPDATE crm_jobs SET status = 'done', result = jsonb_build_object('email', _email, 'duplicate', true), finished_at = now() WHERE id = _job_id;
      RETURN 'duplicate_email';
    END IF;
    UPDATE crm_leads SET email = _email, email_source = COALESCE(_src, email_source) WHERE id = _j.lead_id AND COALESCE(email,'') = '';
  ELSIF _j.job_type = 'score' THEN
    IF COALESCE(_result->>'need_score','') !~ '^\d{1,3}$' OR (_result->>'need_score')::int > 100 THEN RETURN 'invalid_score'; END IF;
    UPDATE crm_leads SET need_score = (_result->>'need_score')::int WHERE id = _j.lead_id;
  ELSIF _j.job_type = 'first_line' THEN
    _line := NULLIF(left(trim(COALESCE(_result->>'first_line','')),500),'');
    IF _line IS NULL THEN RETURN 'invalid_first_line'; END IF;
    UPDATE crm_leads SET first_line = _line WHERE id = _j.lead_id;
  END IF;
  UPDATE crm_jobs SET status = 'done', result = crm_cap_json(_result, 4000), finished_at = now() WHERE id = _job_id;
  INSERT INTO crm_activities (lead_id, type, body) VALUES (_j.lead_id, 'note', 'Worker ' || _j.claimed_by || ' finished ' || _j.job_type);
  RETURN 'done';
END; $$;

CREATE OR REPLACE FUNCTION public.crm_complete_source(_worker text, _slice_id uuid, _status text, _leads jsonb, _note text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _s crm_sources; _r jsonb; _res jsonb; _found int := 0; _new int := 0; _out jsonb := '[]'::jsonb;
BEGIN
  IF _status NOT IN ('done','blocked') THEN RAISE EXCEPTION 'status must be done or blocked'; END IF;
  IF jsonb_typeof(COALESCE(_leads,'[]'::jsonb)) <> 'array' OR jsonb_array_length(COALESCE(_leads,'[]'::jsonb)) > 500 THEN RAISE EXCEPTION 'leads must be an array of at most 500'; END IF;
  SELECT * INTO _s FROM crm_sources WHERE id = _slice_id FOR UPDATE;
  IF _s.id IS NULL THEN RETURN jsonb_build_object('error','not_found'); END IF;
  IF _s.status <> 'claimed' OR _s.claimed_by <> left(_worker,80) THEN RETURN jsonb_build_object('error','not_claimer'); END IF;
  IF _s.expires_at < now() THEN RETURN jsonb_build_object('error','expired'); END IF;
  FOR _r IN SELECT * FROM jsonb_array_elements(COALESCE(_leads,'[]'::jsonb)) LOOP
    _res := crm_insert_lead(_r, left(_worker,80), _slice_id, 'skip');
    IF _res->>'status' = 'invalid' THEN CONTINUE; END IF;
    _found := _found + 1;
    IF _res->>'status' = 'inserted' THEN _new := _new + 1;
    ELSE
      INSERT INTO crm_lead_rejects (found_by, source_id, reason, existing_lead_id, payload)
      VALUES (left(_worker,80), _slice_id, _res->>'reason', (_res->>'id')::uuid, crm_cap_json(_r, 4000));
    END IF;
    _out := _out || jsonb_build_array(_res);
  END LOOP;
  UPDATE crm_sources SET status = _status, last_run_at = now(), leads_found = _found, new_leads = _new,
    expires_at = NULL, notes = COALESCE(NULLIF(left(trim(COALESCE(_note,'')),500),''), notes) WHERE id = _slice_id;
  RETURN jsonb_build_object('leads_found', _found, 'new_leads', _new, 'results', _out);
END; $$;
REVOKE ALL ON FUNCTION public.crm_complete_job(text, uuid, boolean, jsonb, text), public.crm_complete_source(text, uuid, text, jsonb, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crm_complete_job(text, uuid, boolean, jsonb, text), public.crm_complete_source(text, uuid, text, jsonb, text) TO service_role;

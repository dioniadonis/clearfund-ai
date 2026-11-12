CREATE OR REPLACE FUNCTION public.crm_claim_jobs(_worker text, _type text, _n integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _ids uuid[]; _more uuid[]; _w text := left(_worker,80);
BEGIN
  IF _type NOT IN ('find_email','score','first_line','outreach') THEN RAISE EXCEPTION 'bad job_type'; END IF;
  _n := LEAST(GREATEST(COALESCE(_n,1),1),50);
  WITH c AS (
    SELECT j.id FROM crm_jobs j JOIN crm_leads l ON l.id = j.lead_id
    WHERE j.job_type = _type AND j.attempts < 3 AND crm_lead_eligible(l, _type)
      AND ((j.status = 'claimed' AND j.expires_at < now()) OR j.status = 'failed')
    ORDER BY j.claimed_at LIMIT _n FOR UPDATE OF j SKIP LOCKED),
  u AS (UPDATE crm_jobs j SET claimed_by = _w, claimed_at = now(), expires_at = now() + crm_job_ttl(_type),
      status = 'claimed', attempts = j.attempts + 1, error = NULL, finished_at = NULL
    FROM c WHERE j.id = c.id RETURNING j.id)
  SELECT COALESCE(array_agg(id), '{}') INTO _ids FROM u;

  IF cardinality(_ids) < _n THEN
    WITH cand AS (
      SELECT l.id, l.website_key FROM crm_leads l
      WHERE crm_lead_eligible(l, _type)
        AND NOT EXISTS (SELECT 1 FROM crm_jobs j WHERE j.lead_id = l.id AND j.job_type = _type)
        AND (_type <> 'find_email' OR NOT EXISTS (SELECT 1 FROM crm_jobs j WHERE j.job_type = 'find_email' AND j.website_key = l.website_key))
      ORDER BY l.created_at LIMIT (_n - cardinality(_ids)) FOR UPDATE OF l SKIP LOCKED),
    ins AS (INSERT INTO crm_jobs (lead_id, website_key, job_type, claimed_by, expires_at)
      SELECT id, CASE WHEN _type = 'find_email' THEN website_key END, _type, _w, now() + crm_job_ttl(_type) FROM cand
      ON CONFLICT DO NOTHING RETURNING id)
    SELECT COALESCE(array_agg(id), '{}') INTO _more FROM ins;
    _ids := _ids || _more;
  END IF;

  RETURN COALESCE((SELECT jsonb_agg(jsonb_build_object(
    'job_id', j.id, 'job_type', j.job_type, 'expires_at', j.expires_at, 'attempt', j.attempts,
    'lead', jsonb_build_object('id', l.id, 'lead_ref', l.lead_ref, 'lead_type', l.lead_type, 'firm', l.firm, 'contact_name', l.contact_name,
      'email', l.email, 'website', l.website, 'website_key', l.website_key, 'state', l.state, 'sector', l.sector, 'agency', l.agency,
      'need_score', l.need_score, 'first_line', l.first_line)))
    FROM crm_jobs j JOIN crm_leads l ON l.id = j.lead_id WHERE j.id = ANY(_ids)), '[]'::jsonb);
END; $$;

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
    BEGIN _score := (_result->>'need_score')::int; EXCEPTION WHEN others THEN RETURN 'invalid_score'; END;
    IF _score IS NULL OR _score NOT BETWEEN 0 AND 100 THEN RETURN 'invalid_score'; END IF;
    UPDATE crm_leads SET need_score = _score WHERE id = _j.lead_id;
  ELSIF _j.job_type = 'first_line' THEN
    _line := NULLIF(left(trim(COALESCE(_result->>'first_line','')),500),'');
    IF _line IS NULL THEN RETURN 'invalid_first_line'; END IF;
    UPDATE crm_leads SET first_line = _line WHERE id = _j.lead_id;
  END IF;
  UPDATE crm_jobs SET status = 'done', result = left(COALESCE(_result,'{}'::jsonb)::text, 4000)::jsonb, finished_at = now() WHERE id = _job_id;
  INSERT INTO crm_activities (lead_id, type, body) VALUES (_j.lead_id, 'note', 'Worker ' || _j.claimed_by || ' finished ' || _j.job_type);
  RETURN 'done';
EXCEPTION WHEN invalid_text_representation THEN
  UPDATE crm_jobs SET status = 'done', result = NULL, finished_at = now() WHERE id = _job_id;
  RETURN 'done';
END; $$;

CREATE OR REPLACE FUNCTION public.crm_mark_contacted(_worker text, _lead_id uuid, _job_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _l crm_leads;
BEGIN
  SELECT * INTO _l FROM crm_leads WHERE id = _lead_id FOR UPDATE;
  IF _l.id IS NULL THEN RETURN 'not_found'; END IF;
  IF _l.do_not_contact THEN RETURN 'do_not_contact'; END IF;
  UPDATE crm_leads SET stage = 'Contacted' WHERE id = _lead_id AND stage = 'New';
  INSERT INTO crm_activities (lead_id, type, body) VALUES (_lead_id, 'email', 'Contacted by worker ' || left(_worker,80));
  IF _job_id IS NOT NULL THEN
    UPDATE crm_jobs SET status = 'done', finished_at = now()
     WHERE id = _job_id AND lead_id = _lead_id AND claimed_by = left(_worker,80) AND status = 'claimed';
  END IF;
  RETURN 'contacted';
END; $$;

CREATE OR REPLACE FUNCTION public.crm_source_key(_source text, _params jsonb) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT md5(lower(trim(_source)) || '|' || COALESCE((SELECT jsonb_object_agg(lower(trim(k)),
      CASE WHEN jsonb_typeof(v) = 'string' THEN to_jsonb(lower(trim(v #>> '{}'))) ELSE v END) FROM jsonb_each(_params) e(k, v)), '{}'::jsonb)::text)
$$;

CREATE OR REPLACE FUNCTION public.crm_register_source(_worker text, _source text, _params jsonb, _refresh_days integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _k text; _id uuid; _src text := lower(left(trim(COALESCE(_source,'')),60));
BEGIN
  IF _src = '' OR jsonb_typeof(_params) <> 'object' OR length(_params::text) > 2000 THEN RAISE EXCEPTION 'invalid source'; END IF;
  _k := crm_source_key(_src, _params);
  INSERT INTO crm_sources (source, params, slice_key, refresh_days, created_by)
  VALUES (_src, _params, _k, LEAST(GREATEST(COALESCE(_refresh_days,30),1),3650), left(_worker,80))
  ON CONFLICT (slice_key) DO NOTHING RETURNING id INTO _id;
  IF _id IS NOT NULL THEN RETURN jsonb_build_object('status','created','id',_id); END IF;
  SELECT id INTO _id FROM crm_sources WHERE slice_key = _k;
  RETURN jsonb_build_object('status','exists','id',_id);
END; $$;

CREATE OR REPLACE FUNCTION public.crm_claim_source(_worker text, _source text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _s crm_sources;
BEGIN
  SELECT * INTO _s FROM crm_sources
   WHERE (_source IS NULL OR source = lower(trim(_source)))
     AND (status = 'open' OR (status = 'done' AND last_run_at < now() - make_interval(days => refresh_days))
          OR (status = 'claimed' AND expires_at < now()))
   ORDER BY (status = 'open') DESC, last_run_at NULLS FIRST, created_at
   LIMIT 1 FOR UPDATE SKIP LOCKED;
  IF _s.id IS NULL THEN RETURN NULL; END IF;
  UPDATE crm_sources SET status = 'claimed', claimed_by = left(_worker,80), claimed_at = now(), expires_at = now() + interval '2 hours'
   WHERE id = _s.id RETURNING * INTO _s;
  RETURN jsonb_build_object('slice_id', _s.id, 'source', _s.source, 'params', _s.params, 'expires_at', _s.expires_at);
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
      VALUES (left(_worker,80), _slice_id, _res->>'reason', (_res->>'id')::uuid, left(_r::text, 4000)::jsonb);
    END IF;
    _out := _out || jsonb_build_array(_res);
  END LOOP;
  UPDATE crm_sources SET status = _status, last_run_at = now(), leads_found = _found, new_leads = _new,
    expires_at = NULL, notes = COALESCE(NULLIF(left(trim(COALESCE(_note,'')),500),''), notes) WHERE id = _slice_id;
  RETURN jsonb_build_object('leads_found', _found, 'new_leads', _new, 'results', _out);
END; $$;

CREATE OR REPLACE FUNCTION public.crm_worker_hit(_worker text, _endpoint text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT count(*) FROM crm_worker_calls WHERE worker = _worker AND created_at > now() - interval '1 minute') >= 60 THEN RETURN false; END IF;
  INSERT INTO crm_worker_calls (worker, endpoint) VALUES (left(_worker,80), left(_endpoint,40));
  RETURN true;
END; $$;

-- Admin-only helpers for the Workers tab.
CREATE OR REPLACE FUNCTION public.crm_worker_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN (SELECT jsonb_object_agg(t, jsonb_build_object(
    'remaining', (SELECT count(*) FROM crm_leads l WHERE crm_lead_eligible(l, t) AND NOT EXISTS (SELECT 1 FROM crm_jobs j WHERE j.lead_id = l.id AND j.job_type = t)),
    'in_progress', (SELECT count(*) FROM crm_jobs WHERE job_type = t AND status = 'claimed' AND expires_at >= now()),
    'stale', (SELECT count(*) FROM crm_jobs WHERE job_type = t AND status = 'claimed' AND expires_at < now()),
    'done_today', (SELECT count(*) FROM crm_jobs WHERE job_type = t AND status = 'done' AND finished_at >= date_trunc('day', now())),
    'stuck', (SELECT count(*) FROM crm_jobs WHERE job_type = t AND status <> 'done' AND attempts >= 3 AND (status = 'failed' OR expires_at < now()))))
    FROM unnest(ARRAY['find_email','score','first_line','outreach']) t);
END; $$;

CREATE OR REPLACE FUNCTION public.crm_admin_release(_kind text, _id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _who text := COALESCE((SELECT email FROM profiles WHERE id = auth.uid()), auth.uid()::text);
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF _kind = 'job' THEN
    UPDATE crm_jobs SET status = 'failed', expires_at = now(), finished_at = now(),
      error = 'Released by ' || _who || ' at ' || to_char(now(), 'YYYY-MM-DD HH24:MI') WHERE id = _id AND status = 'claimed';
  ELSIF _kind = 'source' THEN
    UPDATE crm_sources SET status = 'open', claimed_by = NULL, claimed_at = NULL, expires_at = NULL,
      notes = 'Released by ' || _who || ' at ' || to_char(now(), 'YYYY-MM-DD HH24:MI') WHERE id = _id AND status = 'claimed';
  ELSE RAISE EXCEPTION 'bad kind'; END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.crm_admin_set_source_status(_id uuid, _status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _who text := COALESCE((SELECT email FROM profiles WHERE id = auth.uid()), auth.uid()::text);
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF _status NOT IN ('open','blocked') THEN RAISE EXCEPTION 'bad status'; END IF;
  UPDATE crm_sources SET status = _status, claimed_by = NULL, claimed_at = NULL, expires_at = NULL,
    notes = initcap(_status) || ' by ' || _who || ' at ' || to_char(now(), 'YYYY-MM-DD HH24:MI') WHERE id = _id;
END; $$;

CREATE OR REPLACE FUNCTION public.crm_admin_add_source(_source text, _params jsonb, _refresh_days integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN public.crm_register_source('admin', _source, _params, _refresh_days);
END; $$;

CREATE OR REPLACE FUNCTION public.crm_admin_dismiss_reject(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE crm_lead_rejects SET dismissed_at = now(), dismissed_by = auth.uid() WHERE id = _id;
END; $$;

-- Worker-facing functions take a worker name and must only be callable by the server (service role).
REVOKE ALL ON FUNCTION public.crm_insert_lead(jsonb, text, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.crm_claim_jobs(text, text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.crm_complete_job(text, uuid, boolean, jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.crm_mark_contacted(text, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.crm_register_source(text, text, jsonb, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.crm_claim_source(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.crm_complete_source(text, uuid, text, jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.crm_worker_hit(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crm_insert_lead(jsonb, text, uuid, text), public.crm_claim_jobs(text, text, integer),
  public.crm_complete_job(text, uuid, boolean, jsonb, text), public.crm_mark_contacted(text, uuid, uuid),
  public.crm_register_source(text, text, jsonb, integer), public.crm_claim_source(text, text),
  public.crm_complete_source(text, uuid, text, jsonb, text), public.crm_worker_hit(text, text) TO service_role;
REVOKE ALL ON FUNCTION public.crm_import_leads(jsonb, text), public.crm_worker_stats(), public.crm_admin_release(text, uuid),
  public.crm_admin_set_source_status(uuid, text), public.crm_admin_add_source(text, jsonb, integer), public.crm_admin_dismiss_reject(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_import_leads(jsonb, text), public.crm_worker_stats(), public.crm_admin_release(text, uuid),
  public.crm_admin_set_source_status(uuid, text), public.crm_admin_add_source(text, jsonb, integer), public.crm_admin_dismiss_reject(uuid) TO authenticated;

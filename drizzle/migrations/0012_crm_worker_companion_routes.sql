CREATE OR REPLACE FUNCTION public.crm_find_leads(_worker text, _email text, _firm text, _limit integer)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _e text := NULLIF(lower(trim(left(COALESCE(_email,''),320))),''); _k text := crm_norm_company(left(_firm,200)); _n int := LEAST(GREATEST(COALESCE(_limit,5),1),10); _r jsonb;
BEGIN
  IF _e IS NOT NULL THEN
    SELECT jsonb_agg(x) INTO _r FROM (SELECT id, firm, contact_name, stage, notes, next_follow_up, do_not_contact FROM crm_leads WHERE lower(email) = _e ORDER BY created_at LIMIT _n) x;
  END IF;
  IF _r IS NULL AND _k IS NOT NULL THEN
    SELECT jsonb_agg(x) INTO _r FROM (SELECT id, firm, contact_name, stage, notes, next_follow_up, do_not_contact FROM crm_leads WHERE company_key = _k OR crm_norm_company(firm) = _k ORDER BY created_at LIMIT _n) x;
  END IF;
  RETURN COALESCE(_r, '[]'::jsonb);
END; $$;

CREATE OR REPLACE FUNCTION public.crm_worker_update_lead(_worker text, _lead_id uuid, _stage text, _note text, _set_follow_up boolean, _next_follow_up date)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _l crm_leads; _w text := left(_worker,80); _txt text := NULLIF(trim(left(COALESCE(_note,''),2000)),''); _line text;
BEGIN
  SELECT * INTO _l FROM crm_leads WHERE id = _lead_id FOR UPDATE;
  IF _l.id IS NULL THEN RETURN jsonb_build_object('status','not_found'); END IF;
  IF _stage IS NOT NULL AND _stage NOT IN ('New','Contacted','Replied','Interested','Applied','Submitted to funder','Funded','Lost') THEN RAISE EXCEPTION 'bad stage'; END IF;
  IF _stage = 'Contacted' AND _l.do_not_contact THEN RETURN jsonb_build_object('status','do_not_contact'); END IF;
  IF _txt IS NOT NULL THEN
    _line := '[' || to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI') || ' UTC · ' || _w || '] ' || _txt;
  END IF;
  UPDATE crm_leads SET
    stage = COALESCE(_stage, stage),
    notes = CASE WHEN _line IS NULL THEN notes ELSE right(COALESCE(NULLIF(notes,'') || E'\n', '') || _line, 20000) END,
    next_follow_up = CASE WHEN COALESCE(_set_follow_up,false) THEN _next_follow_up ELSE next_follow_up END
  WHERE id = _lead_id;
  IF _line IS NOT NULL THEN INSERT INTO crm_activities (lead_id, type, body) VALUES (_lead_id, 'note', left(_line, 5000)); END IF;
  RETURN jsonb_build_object('status','updated','id',_lead_id);
END; $$;

CREATE OR REPLACE FUNCTION public.crm_worker_mark_dnc(_worker text, _lead_id uuid, _reason text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _r text := 'worker:' || left(_worker,80) || COALESCE(' ' || NULLIF(trim(left(COALESCE(_reason,''),200)),''), '');
BEGIN
  IF NOT EXISTS (SELECT 1 FROM crm_leads WHERE id = _lead_id) THEN RETURN 'not_found'; END IF;
  UPDATE crm_leads SET do_not_contact = true, dnc_reason = _r, dnc_at = now() WHERE id = _lead_id AND NOT do_not_contact;
  IF NOT FOUND THEN RETURN 'already_dnc'; END IF;
  INSERT INTO crm_activities (lead_id, type, body) VALUES (_lead_id, 'note', 'Marked do-not-contact (' || _r || ')');
  RETURN 'marked';
END; $$;

CREATE OR REPLACE FUNCTION public.crm_worker_log_reply(_worker text, _lead_id uuid, _from_email text, _inbox text, _subject text, _snippet text, _label text, _received_at timestamptz)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid; _e text := NULLIF(lower(trim(left(COALESCE(_from_email,''),320))),''); _body text;
BEGIN
  IF _lead_id IS NOT NULL THEN SELECT id INTO _id FROM crm_leads WHERE id = _lead_id; END IF;
  IF _id IS NULL AND _e IS NOT NULL THEN SELECT id INTO _id FROM crm_leads WHERE lower(email) = _e ORDER BY created_at LIMIT 1; END IF;
  IF _id IS NULL THEN RETURN jsonb_build_object('status','unmatched'); END IF;
  _body := 'Reply in ' || left(trim(COALESCE(_inbox,'inbox')),120) || ': "' || left(trim(COALESCE(_subject,'')),300) || '"'
    || COALESCE(' — ' || NULLIF(left(trim(COALESCE(_snippet,'')),1000),''), '')
    || COALESCE(' [' || NULLIF(left(trim(COALESCE(_label,'')),50),'') || ']', '');
  IF EXISTS (SELECT 1 FROM crm_activities WHERE lead_id = _id AND type = 'email' AND created_at = COALESCE(_received_at, now())
             AND split_part(body, ' — ', 1) = split_part(_body, ' — ', 1)) THEN
    RETURN jsonb_build_object('status','duplicate','lead_id',_id);
  END IF;
  INSERT INTO crm_activities (lead_id, type, body, created_at) VALUES (_id, 'email', _body, COALESCE(_received_at, now()));
  RETURN jsonb_build_object('status','logged','lead_id',_id);
END; $$;

REVOKE ALL ON FUNCTION public.crm_find_leads(text,text,text,integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.crm_worker_update_lead(text,uuid,text,text,boolean,date) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.crm_worker_mark_dnc(text,uuid,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.crm_worker_log_reply(text,uuid,text,text,text,text,text,timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crm_find_leads(text,text,text,integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.crm_worker_update_lead(text,uuid,text,text,boolean,date) TO service_role;
GRANT EXECUTE ON FUNCTION public.crm_worker_mark_dnc(text,uuid,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.crm_worker_log_reply(text,uuid,text,text,text,text,text,timestamptz) TO service_role;
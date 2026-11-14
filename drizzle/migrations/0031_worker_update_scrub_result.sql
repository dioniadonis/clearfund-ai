DROP FUNCTION public.crm_worker_update_lead(text, uuid, text, text, boolean, date);

CREATE FUNCTION public.crm_worker_update_lead(
  _worker text,
  _lead_id uuid,
  _stage text,
  _note text,
  _set_follow_up boolean,
  _next_follow_up date,
  _scrub_result text,
  _scrub_detail text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _l crm_leads;
  _w text := left(_worker,80);
  _txt text := NULLIF(trim(left(COALESCE(_note,''),2000)),'');
  _line text;
  _scrub_note text;
BEGIN
  SELECT * INTO _l FROM crm_leads WHERE id = _lead_id FOR UPDATE;
  IF _l.id IS NULL THEN RETURN jsonb_build_object('status','not_found'); END IF;
  IF _stage IS NOT NULL AND NOT crm_stage_ok(_l.lead_type, _stage) THEN RETURN jsonb_build_object('status','bad_stage','lead_type',COALESCE(_l.lead_type,'borrower')); END IF;
  IF _stage = 'Contacted' AND _l.do_not_contact THEN RETURN jsonb_build_object('status','do_not_contact'); END IF;
  IF _scrub_result IS NOT NULL AND _scrub_result NOT IN ('valid','invalid','risky') THEN RAISE EXCEPTION 'bad scrub result'; END IF;
  IF _scrub_result IS NOT NULL THEN
    _scrub_note := 'Email check: ' || upper(_scrub_result) || COALESCE(' (' || NULLIF(trim(left(COALESCE(_scrub_detail,''),200)),'') || ')','');
    _txt := concat_ws(E'\n', _txt, _scrub_note);
  END IF;
  IF _txt IS NOT NULL THEN
    _line := '[' || to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI') || ' UTC · ' || _w || '] ' || _txt;
  END IF;
  UPDATE crm_leads SET
    stage = COALESCE(_stage, stage),
    notes = CASE WHEN _line IS NULL THEN notes ELSE right(COALESCE(NULLIF(notes,'') || E'\n', '') || _line, 20000) END,
    next_follow_up = CASE WHEN COALESCE(_set_follow_up,false) THEN _next_follow_up ELSE next_follow_up END,
    scrub_result = CASE WHEN _scrub_result IS NOT NULL AND (scrub_result IS NULL OR scrub_result IN ('valid','invalid','risky')) THEN _scrub_result ELSE scrub_result END,
    scrubbed_at = CASE WHEN _scrub_result IS NOT NULL AND (scrub_result IS NULL OR scrub_result IN ('valid','invalid','risky')) THEN now() ELSE scrubbed_at END
  WHERE id = _lead_id;
  IF _line IS NOT NULL THEN INSERT INTO crm_activities (lead_id, type, body) VALUES (_lead_id, 'note', left(_line, 5000)); END IF;
  RETURN jsonb_build_object('status','updated','id',_lead_id);
END; $$;

REVOKE ALL ON FUNCTION public.crm_worker_update_lead(text,uuid,text,text,boolean,date,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crm_worker_update_lead(text,uuid,text,text,boolean,date,text,text) TO service_role;

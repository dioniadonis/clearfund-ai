ALTER TABLE public.crm_leads DROP CONSTRAINT crm_leads_stage_check;
ALTER TABLE public.crm_leads ADD CONSTRAINT crm_leads_stage_check CHECK (stage = ANY (ARRAY['New','Contacted','Replied','Interested','Applied','Submitted to funder','Funded','Lost','Signed up (DAC)','Trained','First referral']));

CREATE OR REPLACE FUNCTION public.crm_stage_ok(_lead_type text, _stage text) RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN _lead_type = 'partner'
    THEN _stage IN ('New','Contacted','Interested','Signed up (DAC)','Trained','First referral','Lost')
    ELSE _stage IN ('New','Contacted','Replied','Interested','Applied','Submitted to funder','Funded','Lost') END
$$;

CREATE OR REPLACE FUNCTION public.crm_check_stage_type() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR NEW.stage IS DISTINCT FROM OLD.stage OR NEW.lead_type IS DISTINCT FROM OLD.lead_type)
     AND NOT public.crm_stage_ok(NEW.lead_type, NEW.stage) THEN
    IF NEW.stage = 'New' OR TG_OP = 'INSERT' AND NEW.stage = 'Replied' AND NEW.lead_type = 'partner' THEN NEW.stage := 'New';
    ELSE RAISE EXCEPTION 'stage % not allowed for this lead type', NEW.stage; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER crm_leads_stage_type BEFORE INSERT OR UPDATE ON public.crm_leads FOR EACH ROW EXECUTE FUNCTION public.crm_check_stage_type();

DROP FUNCTION public.crm_find_leads(text, text, text, integer);
CREATE FUNCTION public.crm_find_leads(_worker text, _email text, _firm text, _limit integer, _type text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _e text := NULLIF(lower(trim(left(COALESCE(_email,''),320))),''); _k text := crm_norm_company(left(_firm,200)); _n int := LEAST(GREATEST(COALESCE(_limit,5),1),10); _r jsonb;
  _t text := NULLIF(lower(trim(COALESCE(_type,''))),'');
BEGIN
  IF _t = 'recruit' THEN _t := 'partner'; END IF;
  IF _t = 'client' THEN _t := 'borrower'; END IF;
  IF _e IS NOT NULL THEN
    SELECT jsonb_agg(x) INTO _r FROM (SELECT id, lead_type, firm, contact_name, stage, notes, next_follow_up, do_not_contact FROM crm_leads
      WHERE lower(email) = _e AND (_t IS NULL OR (_t='partner' AND lead_type='partner') OR (_t<>'partner' AND lead_type IS DISTINCT FROM 'partner')) ORDER BY created_at LIMIT _n) x;
  END IF;
  IF _r IS NULL AND _k IS NOT NULL THEN
    SELECT jsonb_agg(x) INTO _r FROM (SELECT id, lead_type, firm, contact_name, stage, notes, next_follow_up, do_not_contact FROM crm_leads
      WHERE (company_key = _k OR crm_norm_company(firm) = _k) AND (_t IS NULL OR (_t='partner' AND lead_type='partner') OR (_t<>'partner' AND lead_type IS DISTINCT FROM 'partner')) ORDER BY created_at LIMIT _n) x;
  END IF;
  RETURN COALESCE(_r, '[]'::jsonb);
END; $$;
REVOKE ALL ON FUNCTION public.crm_find_leads(text, text, text, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crm_find_leads(text, text, text, integer, text) TO service_role;

CREATE OR REPLACE FUNCTION public.crm_worker_update_lead(_worker text, _lead_id uuid, _stage text, _note text, _set_follow_up boolean, _next_follow_up date)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _l crm_leads; _w text := left(_worker,80); _txt text := NULLIF(trim(left(COALESCE(_note,''),2000)),''); _line text;
BEGIN
  SELECT * INTO _l FROM crm_leads WHERE id = _lead_id FOR UPDATE;
  IF _l.id IS NULL THEN RETURN jsonb_build_object('status','not_found'); END IF;
  IF _stage IS NOT NULL AND NOT crm_stage_ok(_l.lead_type, _stage) THEN RETURN jsonb_build_object('status','bad_stage','lead_type',COALESCE(_l.lead_type,'borrower')); END IF;
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

DROP FUNCTION public.crm_lead_counts(date, text, text, text, text);
CREATE FUNCTION public.crm_lead_counts(_today date, _q text DEFAULT NULL, _source text DEFAULT NULL, _agent text DEFAULT NULL, _due text DEFAULT NULL, _type text DEFAULT NULL)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  WITH base AS (SELECT * FROM public.crm_leads l WHERE coalesce(_type,'') = '' OR (_type = 'partner' AND l.lead_type = 'partner') OR (_type = 'client' AND l.lead_type IS DISTINCT FROM 'partner')),
  f AS (
    SELECT stage FROM base l WHERE
      (coalesce(_q,'') = '' OR concat_ws(' ', l.firm, l.contact_name, l.email, l.phone, l.agency, l.lead_ref, l.website, l.state, l.sector) ILIKE '%' || replace(replace(replace(_q,'\','\\'),'%','\%'),'_','\_') || '%')
      AND (coalesce(_source,'') = '' OR l.source = _source)
      AND (coalesce(_agent,'') = '' OR (_agent = 'unassigned' AND l.assigned_to IS NULL) OR (_agent <> 'unassigned' AND l.assigned_to::text = _agent))
      AND (coalesce(_due,'') = '' OR (_due = 'today' AND l.next_follow_up = _today) OR (_due = 'overdue' AND l.next_follow_up < _today))
  )
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM base),
    'due_today', (SELECT count(*) FROM base WHERE next_follow_up = _today),
    'overdue', (SELECT count(*) FROM base WHERE next_follow_up < _today),
    'added_week', (SELECT count(*) FROM base WHERE created_at >= now() - interval '7 days'),
    'by_stage', coalesce((SELECT jsonb_object_agg(stage, n) FROM (SELECT stage, count(*) n FROM f GROUP BY stage) s), '{}'::jsonb)
  );
$$;
REVOKE ALL ON FUNCTION public.crm_lead_counts(date, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_lead_counts(date, text, text, text, text, text) TO authenticated;
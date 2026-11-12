CREATE OR REPLACE FUNCTION public.agent_eligible(_user_id uuid, _require_training boolean)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.agents a WHERE a.user_id=_user_id AND a.active)
    AND EXISTS (SELECT 1 FROM public.agent_agreements g WHERE g.agent_id=_user_id AND g.version='agent-agreement-v1')
    AND (NOT _require_training OR (SELECT count(DISTINCT section_key) FROM public.agent_training_progress t WHERE t.agent_id=_user_id AND t.section_key IN ('program','who','conversations','rules','payouts'))=5)
$$;
REVOKE ALL ON FUNCTION public.agent_eligible(uuid,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.agent_eligible(uuid,boolean) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.agent_list_leads()
RETURNS TABLE(id uuid, contact_name text, firm text, warm_reason text, stage text, notes text, next_follow_up date)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT l.id,l.contact_name,l.firm,l.warm_reason,l.stage,l.notes,l.next_follow_up
  FROM public.crm_leads l
  WHERE public.agent_eligible(auth.uid(),false)
    AND l.assigned_to=auth.uid() AND l.warm_reason IS NOT NULL
    AND l.lead_type IS DISTINCT FROM 'partner' AND l.lead_type IS DISTINCT FROM 'recruit'
  ORDER BY l.next_follow_up ASC NULLS LAST,l.created_at DESC
  LIMIT 500
$$;
REVOKE ALL ON FUNCTION public.agent_list_leads() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.agent_list_leads() TO authenticated;

CREATE OR REPLACE FUNCTION public.agent_update_lead(_lead_id uuid, _stage text DEFAULT NULL, _note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _l public.crm_leads; _txt text := NULLIF(trim(left(COALESCE(_note,''),2000)),''); _line text;
BEGIN
  IF NOT public.agent_eligible(auth.uid(),false) THEN RAISE EXCEPTION 'Accept the current agreement first'; END IF;
  SELECT * INTO _l FROM public.crm_leads WHERE id=_lead_id AND assigned_to=auth.uid() AND warm_reason IS NOT NULL FOR UPDATE;
  IF _l.id IS NULL THEN RAISE EXCEPTION 'Lead not available'; END IF;
  IF _stage IS NOT NULL AND _stage NOT IN ('New','Contacted','Replied','Interested','Applied','Lost') THEN RAISE EXCEPTION 'Stage not allowed'; END IF;
  IF _txt IS NOT NULL THEN _line := '['||to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD HH24:MI')||' UTC · agent] '||_txt; END IF;
  UPDATE public.crm_leads SET stage=COALESCE(_stage,stage),notes=CASE WHEN _line IS NULL THEN notes ELSE right(COALESCE(NULLIF(notes,'')||E'\n','')||_line,20000) END WHERE id=_lead_id;
  IF _line IS NOT NULL THEN INSERT INTO public.crm_activities(lead_id,user_id,type,body) VALUES(_lead_id,auth.uid(),'note',left(_line,5000)); END IF;
END $$;
REVOKE ALL ON FUNCTION public.agent_update_lead(uuid,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.agent_update_lead(uuid,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.agent_mark_training(_section text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.agents WHERE user_id=auth.uid() AND active) THEN RAISE EXCEPTION 'Agent account not active'; END IF;
  IF _section NOT IN ('program','who','conversations','rules','payouts') THEN RAISE EXCEPTION 'Unknown training section'; END IF;
  INSERT INTO public.agent_training_progress(agent_id,section_key) VALUES(auth.uid(),_section) ON CONFLICT DO NOTHING;
END $$;
REVOKE ALL ON FUNCTION public.agent_mark_training(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.agent_mark_training(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.agent_record_agreement(_user_id uuid, _version text, _ip text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _version <> 'agent-agreement-v1' THEN RAISE EXCEPTION 'Current agreement version required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.agents WHERE user_id=_user_id AND active) THEN RAISE EXCEPTION 'Agent account not active'; END IF;
  INSERT INTO public.agent_agreements(agent_id,version,ip) VALUES(_user_id,_version,left(COALESCE(_ip,''),80)) ON CONFLICT (agent_id,version) DO NOTHING;
END $$;
REVOKE ALL ON FUNCTION public.agent_record_agreement(uuid,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.agent_record_agreement(uuid,text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.track_agent_referral(_code text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.agents WHERE referral_code=upper(left(trim(COALESCE(_code,'')),20)) AND active)
$$;
REVOKE ALL ON FUNCTION public.track_agent_referral(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_agent_referral(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.log_cta_click(_cta text, _page text, _destination text, _lead_id uuid DEFAULT NULL, _agent_code text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _agent uuid; _lead uuid := _lead_id; _id uuid;
BEGIN
  IF _lead IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.crm_leads WHERE id=_lead) THEN _lead := NULL; END IF;
  SELECT user_id INTO _agent FROM public.agents WHERE referral_code=upper(left(trim(COALESCE(_agent_code,'')),20)) AND active;
  INSERT INTO public.cta_clicks(cta,page,destination,lead_id,agent_id) VALUES(left(COALESCE(_cta,'unknown'),80),left(COALESCE(_page,''),300),left(COALESCE(_destination,''),500),_lead,_agent) RETURNING id INTO _id;
  RETURN _id;
END $$;
REVOKE ALL ON FUNCTION public.log_cta_click(text,text,text,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_cta_click(text,text,text,uuid,text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.agent_submit_application(_application jsonb, _quiz_score integer, _passed boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _app public.agent_applications; _lead uuid; _email text := lower(left(trim(_application->>'email'),255)); _status text := CASE WHEN _passed THEN 'new' ELSE 'rejected' END; _lead_stage text := CASE WHEN _passed THEN 'applied' ELSE 'rejected' END;
BEGIN
  IF _quiz_score NOT BETWEEN 0 AND 5 THEN RAISE EXCEPTION 'Invalid score'; END IF;
  SELECT * INTO _app FROM public.agent_applications WHERE lower(email)=_email FOR UPDATE;
  IF _app.id IS NOT NULL AND _app.status='approved' THEN RETURN jsonb_build_object('status','received'); END IF;
  IF _app.id IS NULL THEN
    INSERT INTO public.agent_applications(full_name,email,phone,city,state,experience,find_owners,quiz_answers,quiz_score,passed,status)
    VALUES(left(trim(_application->>'full_name'),120),_email,left(trim(_application->>'phone'),30),left(trim(_application->>'city'),120),upper(left(trim(_application->>'state'),2)),left(trim(_application->>'experience'),30),left(trim(_application->>'find_owners'),1500),COALESCE(_application->'quiz_answers','{}'::jsonb),_quiz_score,_passed,_status) RETURNING * INTO _app;
  ELSE
    UPDATE public.agent_applications SET full_name=left(trim(_application->>'full_name'),120),phone=left(trim(_application->>'phone'),30),city=left(trim(_application->>'city'),120),state=upper(left(trim(_application->>'state'),2)),experience=left(trim(_application->>'experience'),30),find_owners=left(trim(_application->>'find_owners'),1500),quiz_answers=COALESCE(_application->'quiz_answers','{}'::jsonb),quiz_score=_quiz_score,passed=_passed,status=_status,updated_at=now() WHERE id=_app.id RETURNING * INTO _app;
  END IF;
  _lead := _app.crm_lead_id;
  IF _lead IS NULL THEN SELECT id INTO _lead FROM public.crm_leads WHERE lead_ref='agent:'||_app.id::text; END IF;
  IF _lead IS NULL THEN
    INSERT INTO public.crm_leads(lead_ref,lead_type,contact_name,email,phone,city,state,sector,notes,stage,source,found_by,found_at)
    VALUES('agent:'||_app.id::text,'recruit',_app.full_name,CASE WHEN EXISTS(SELECT 1 FROM public.crm_leads WHERE lower(email)=_email) THEN NULL ELSE _email END,_app.phone,_app.city,_app.state,_app.experience,left('How they would find owners: '||_app.find_owners,2000),_lead_stage,'agents','agents',now()) RETURNING id INTO _lead;
  ELSE
    UPDATE public.crm_leads SET contact_name=_app.full_name,phone=_app.phone,city=_app.city,state=_app.state,sector=_app.experience,notes=left('How they would find owners: '||_app.find_owners,2000),stage=_lead_stage,source='agents' WHERE id=_lead AND lead_type='recruit';
  END IF;
  UPDATE public.agent_applications SET crm_lead_id=_lead,updated_at=now() WHERE id=_app.id;
  RETURN jsonb_build_object('status','received');
END $$;
REVOKE ALL ON FUNCTION public.agent_submit_application(jsonb,integer,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.agent_submit_application(jsonb,integer,boolean) TO service_role;

CREATE OR REPLACE FUNCTION public.agent_approve_application(_application_id uuid, _user_id uuid, _reviewer uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _app public.agent_applications; _code text;
BEGIN
  SELECT * INTO _app FROM public.agent_applications WHERE id=_application_id AND status='new' AND passed FOR UPDATE;
  IF _app.id IS NULL THEN RAISE EXCEPTION 'Application is not eligible for approval'; END IF;
  _code := 'CF'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
  INSERT INTO public.agents(user_id,application_id,full_name,email,referral_code) VALUES(_user_id,_app.id,_app.full_name,_app.email,_code);
  INSERT INTO public.user_roles(user_id,role) VALUES(_user_id,'agent') ON CONFLICT DO NOTHING;
  UPDATE public.agent_applications SET status='approved',reviewed_by=_reviewer,reviewed_at=now(),updated_at=now() WHERE id=_app.id;
  UPDATE public.crm_leads SET stage='approved' WHERE id=_app.crm_lead_id AND lead_type='recruit';
  RETURN _code;
END $$;
REVOKE ALL ON FUNCTION public.agent_approve_application(uuid,uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.agent_approve_application(uuid,uuid,uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.agent_reject_application(_application_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _lead uuid;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.agent_applications SET status='rejected',reviewed_by=auth.uid(),reviewed_at=now(),updated_at=now() WHERE id=_application_id AND status='new' RETURNING crm_lead_id INTO _lead;
  IF _lead IS NOT NULL THEN UPDATE public.crm_leads SET stage='rejected' WHERE id=_lead AND lead_type='recruit'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.agent_reject_application(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.agent_reject_application(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.crm_list_agents()
RETURNS TABLE(id uuid,email text,role text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT ON (x.id) x.id,x.email,x.role FROM (
    SELECT r.user_id AS id,p.email,'admin'::text AS role FROM public.user_roles r LEFT JOIN public.profiles p ON p.id=r.user_id WHERE r.role='admin'
    UNION ALL SELECT a.user_id,a.email,'agent'::text FROM public.agents a WHERE a.active
  ) x WHERE public.is_crm_user(auth.uid()) ORDER BY x.id,(x.role='admin') DESC
$$;

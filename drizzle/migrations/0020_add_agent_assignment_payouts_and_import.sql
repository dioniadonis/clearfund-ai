CREATE OR REPLACE FUNCTION public.crm_admin_assign_agent(_lead_id uuid, _agent_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.crm_leads WHERE id=_lead_id AND warm_reason IS NOT NULL AND lead_type IS DISTINCT FROM 'partner' AND lead_type IS DISTINCT FROM 'recruit') THEN RAISE EXCEPTION 'Only warm client leads can be assigned'; END IF;
  IF NOT public.agent_eligible(_agent_id,false) THEN RAISE EXCEPTION 'Agent must be active and accept the current agreement'; END IF;
  UPDATE public.crm_leads SET assigned_to=_agent_id WHERE id=_lead_id;
  UPDATE public.agents SET last_assigned_at=now(),updated_at=now() WHERE user_id=_agent_id;
END $$;
REVOKE ALL ON FUNCTION public.crm_admin_assign_agent(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_admin_assign_agent(uuid,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.crm_auto_assign_lead(_lead_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _lead public.crm_leads; _agent uuid;
BEGIN
  SELECT * INTO _lead FROM public.crm_leads WHERE id=_lead_id FOR UPDATE;
  IF _lead.id IS NULL OR _lead.warm_reason IS NULL OR _lead.assigned_to IS NOT NULL OR _lead.lead_type IN ('partner','recruit') THEN RETURN; END IF;
  IF _lead.agent_id IS NOT NULL AND EXISTS(SELECT 1 FROM public.agents WHERE user_id=_lead.agent_id AND active) THEN
    UPDATE public.crm_leads SET assigned_to=_lead.agent_id WHERE id=_lead.id;
    UPDATE public.agents SET last_assigned_at=now(),updated_at=now() WHERE user_id=_lead.agent_id;
    RETURN;
  END IF;
  IF NOT COALESCE((SELECT auto_assign FROM public.agent_settings WHERE singleton),false) THEN RETURN; END IF;
  SELECT a.user_id INTO _agent FROM public.agents a WHERE public.agent_eligible(a.user_id,true) ORDER BY a.last_assigned_at ASC NULLS FIRST,a.created_at,a.user_id LIMIT 1;
  IF _agent IS NOT NULL THEN
    UPDATE public.crm_leads SET assigned_to=_agent WHERE id=_lead.id;
    UPDATE public.agents SET last_assigned_at=now(),updated_at=now() WHERE user_id=_agent;
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.crm_auto_assign_lead(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.crm_auto_assign_trigger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.crm_auto_assign_lead(NEW.id); RETURN NEW; END $$;
CREATE TRIGGER crm_leads_auto_assign_after AFTER INSERT OR UPDATE OF warm_reason,agent_id ON public.crm_leads FOR EACH ROW EXECUTE FUNCTION public.crm_auto_assign_trigger();

CREATE OR REPLACE FUNCTION public.crm_admin_save_agent_settings(_percent numeric, _auto_assign boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF _percent < 0 OR _percent > 100 THEN RAISE EXCEPTION 'Percent must be between 0 and 100'; END IF;
  INSERT INTO public.agent_settings(singleton,payout_percent,auto_assign,updated_by,updated_at) VALUES(true,_percent,COALESCE(_auto_assign,false),auth.uid(),now())
  ON CONFLICT(singleton) DO UPDATE SET payout_percent=_percent,auto_assign=COALESCE(_auto_assign,false),updated_by=auth.uid(),updated_at=now();
  IF COALESCE(_auto_assign,false) THEN
    FOR _id IN SELECT id FROM public.crm_leads WHERE warm_reason IS NOT NULL AND assigned_to IS NULL AND lead_type IS DISTINCT FROM 'partner' AND lead_type IS DISTINCT FROM 'recruit' ORDER BY created_at LIMIT 500 LOOP
      PERFORM public.crm_auto_assign_lead(_id);
    END LOOP;
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.crm_admin_save_agent_settings(numeric,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_admin_save_agent_settings(numeric,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.crm_validate_funded()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.stage='Funded' AND NEW.lead_type IS DISTINCT FROM 'partner' AND NEW.lead_type IS DISTINCT FROM 'recruit' AND NEW.clearfund_commission IS NULL THEN
    RAISE EXCEPTION 'Enter ClearFund commission before marking funded';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER crm_leads_validate_funded BEFORE UPDATE OF stage,clearfund_commission ON public.crm_leads FOR EACH ROW EXECUTE FUNCTION public.crm_validate_funded();

CREATE OR REPLACE FUNCTION public.crm_sync_agent_payout()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _percent numeric;
BEGIN
  IF NEW.stage='Funded' AND NEW.clearfund_commission IS NOT NULL AND NEW.assigned_to IS NOT NULL AND EXISTS(SELECT 1 FROM public.agents WHERE user_id=NEW.assigned_to) THEN
    SELECT COALESCE(a.payout_percent,s.payout_percent,30) INTO _percent FROM public.agents a LEFT JOIN public.agent_settings s ON s.singleton WHERE a.user_id=NEW.assigned_to;
    INSERT INTO public.agent_payouts(lead_id,agent_id,clearfund_commission,agent_percent,agent_amount)
    VALUES(NEW.id,NEW.assigned_to,NEW.clearfund_commission,COALESCE(_percent,30),round(NEW.clearfund_commission*COALESCE(_percent,30)/100,2))
    ON CONFLICT(lead_id) DO UPDATE SET agent_id=EXCLUDED.agent_id,clearfund_commission=EXCLUDED.clearfund_commission,agent_percent=EXCLUDED.agent_percent,agent_amount=EXCLUDED.agent_amount,updated_at=now() WHERE agent_payouts.status='pending';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER crm_leads_sync_payout AFTER UPDATE OF stage,clearfund_commission,assigned_to ON public.crm_leads FOR EACH ROW EXECUTE FUNCTION public.crm_sync_agent_payout();

CREATE OR REPLACE FUNCTION public.crm_admin_mark_payout_paid(_payout_id uuid, _paid boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.agent_payouts SET status=CASE WHEN _paid THEN 'paid' ELSE 'pending' END,paid_at=CASE WHEN _paid THEN now() ELSE NULL END,updated_at=now() WHERE id=_payout_id;
END $$;
REVOKE ALL ON FUNCTION public.crm_admin_mark_payout_paid(uuid,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_admin_mark_payout_paid(uuid,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.crm_agent_leaderboard()
RETURNS TABLE(agent_id uuid,full_name text,email text,referral_code text,payout_percent numeric,funded_deals bigint,warm_leads bigint,pending_total numeric,paid_total numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.user_id,a.full_name,a.email,a.referral_code,a.payout_percent,
    (SELECT count(*) FROM public.agent_payouts p WHERE p.agent_id=a.user_id),
    (SELECT count(*) FROM public.crm_leads l WHERE l.assigned_to=a.user_id AND l.warm_reason IS NOT NULL),
    COALESCE((SELECT sum(p.agent_amount) FROM public.agent_payouts p WHERE p.agent_id=a.user_id AND p.status='pending'),0),
    COALESCE((SELECT sum(p.agent_amount) FROM public.agent_payouts p WHERE p.agent_id=a.user_id AND p.status='paid'),0)
  FROM public.agents a WHERE public.has_role(auth.uid(),'admin') ORDER BY 6 DESC,a.full_name
$$;
REVOKE ALL ON FUNCTION public.crm_agent_leaderboard() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_agent_leaderboard() TO authenticated;

CREATE OR REPLACE FUNCTION public.crm_preview_recruit_import(_rows jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _r jsonb; _out jsonb := '[]'::jsonb; _email text; _domain text; _contact text; _firm text; _state text; _status text; _reason text; _seen_e text[] := '{}'; _seen_w text[] := '{}';
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF jsonb_typeof(_rows)<>'array' OR jsonb_array_length(_rows)>5000 THEN RAISE EXCEPTION 'Maximum 5000 rows'; END IF;
  FOR _r IN SELECT value FROM jsonb_array_elements(_rows) LOOP
    _email := NULLIF(lower(left(trim(COALESCE(_r->>'email','')),255)),''); _domain := public.crm_norm_domain(_r->>'website'); _contact := NULLIF(left(trim(COALESCE(_r->>'contact','')),200),''); _firm := NULLIF(left(trim(COALESCE(_r->>'firm','')),200),''); _state := NULLIF(upper(left(trim(COALESCE(_r->>'state','')),2)),''); _status := 'new'; _reason := NULL;
    IF _contact IS NULL AND _firm IS NULL THEN _status := 'invalid'; _reason := 'contact_or_firm_required';
    ELSIF _email IS NOT NULL AND _email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN _status := 'invalid'; _reason := 'invalid_email';
    ELSIF COALESCE(_r->>'state','')<>'' AND _state !~ '^[A-Z]{2}$' THEN _status := 'invalid'; _reason := 'invalid_state';
    ELSIF (_email IS NOT NULL AND (_email=ANY(_seen_e) OR EXISTS(SELECT 1 FROM public.crm_leads WHERE lower(email)=_email))) OR (_domain IS NOT NULL AND (_domain=ANY(_seen_w) OR EXISTS(SELECT 1 FROM public.crm_leads WHERE website_key=_domain))) THEN _status := 'duplicate'; _reason := 'email_or_website'; END IF;
    IF _status='new' THEN IF _email IS NOT NULL THEN _seen_e := _seen_e||_email; END IF; IF _domain IS NOT NULL THEN _seen_w := _seen_w||_domain; END IF; END IF;
    _out := _out||jsonb_build_array(jsonb_build_object('status',_status,'reason',_reason,'row',jsonb_build_object('firm',_firm,'contact',_contact,'email',_email,'phone',NULLIF(left(trim(COALESCE(_r->>'phone','')),40),''),'website',NULLIF(left(trim(COALESCE(_r->>'website','')),300),''),'website_key',_domain,'city',NULLIF(left(trim(COALESCE(_r->>'city','')),120),''),'state',_state,'sector',NULLIF(left(trim(COALESCE(_r->>'sector','')),120),''),'source_url',NULLIF(left(trim(COALESCE(_r->>'source_url','')),500),''))));
  END LOOP;
  RETURN _out;
END $$;
REVOKE ALL ON FUNCTION public.crm_preview_recruit_import(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_preview_recruit_import(jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.crm_import_recruits(_rows jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _preview jsonb; _item jsonb; _r jsonb; _added integer := 0; _duplicate integer := 0; _invalid integer := 0;
BEGIN
  _preview := public.crm_preview_recruit_import(_rows);
  FOR _item IN SELECT value FROM jsonb_array_elements(_preview) LOOP
    IF _item->>'status'='new' THEN
      _r := _item->'row';
      BEGIN
        INSERT INTO public.crm_leads(lead_type,firm,contact_name,email,phone,website,website_key,company_key,city,state,sector,source_url,stage,source,found_by,found_at)
        VALUES('recruit',_r->>'firm',_r->>'contact',_r->>'email',_r->>'phone',_r->>'website',_r->>'website_key',public.crm_norm_company(_r->>'firm'),_r->>'city',_r->>'state',_r->>'sector',_r->>'source_url','new','csv','csv',now());
        _added := _added+1;
      EXCEPTION WHEN unique_violation THEN _duplicate := _duplicate+1; END;
    ELSIF _item->>'status'='duplicate' THEN _duplicate := _duplicate+1;
    ELSE _invalid := _invalid+1; END IF;
  END LOOP;
  RETURN jsonb_build_object('added',_added,'duplicate',_duplicate,'invalid',_invalid);
END $$;
REVOKE ALL ON FUNCTION public.crm_import_recruits(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_import_recruits(jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.crm_find_leads(_worker text, _email text, _firm text, _limit integer, _type text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _e text := NULLIF(lower(trim(left(COALESCE(_email,''),320))),''); _k text := public.crm_norm_company(left(_firm,200)); _n int := LEAST(GREATEST(COALESCE(_limit,5),1),10); _r jsonb; _t text := NULLIF(lower(trim(COALESCE(_type,''))),'');
BEGIN
  IF _t='client' THEN _t := 'borrower'; END IF;
  IF _e IS NOT NULL THEN
    SELECT jsonb_agg(x) INTO _r FROM (SELECT id,lead_type,firm,contact_name,stage,notes,next_follow_up,do_not_contact FROM public.crm_leads WHERE lower(email)=_e AND (_t IS NULL OR (_t='partner' AND lead_type='partner') OR (_t='recruit' AND lead_type='recruit') OR (_t='borrower' AND lead_type IS DISTINCT FROM 'partner' AND lead_type IS DISTINCT FROM 'recruit')) ORDER BY created_at LIMIT _n)x;
  END IF;
  IF _r IS NULL AND _k IS NOT NULL THEN
    SELECT jsonb_agg(x) INTO _r FROM (SELECT id,lead_type,firm,contact_name,stage,notes,next_follow_up,do_not_contact FROM public.crm_leads WHERE (company_key=_k OR public.crm_norm_company(firm)=_k) AND (_t IS NULL OR (_t='partner' AND lead_type='partner') OR (_t='recruit' AND lead_type='recruit') OR (_t='borrower' AND lead_type IS DISTINCT FROM 'partner' AND lead_type IS DISTINCT FROM 'recruit')) ORDER BY created_at LIMIT _n)x;
  END IF;
  RETURN COALESCE(_r,'[]'::jsonb);
END $$;

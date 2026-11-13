ALTER TABLE public.funder_products ADD COLUMN requires_photo_id boolean NOT NULL DEFAULT false;
ALTER TABLE public.crm_leads ADD COLUMN va_credit_blocked_reason text;

CREATE TABLE public.va_quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  va_id uuid NOT NULL,
  score integer NOT NULL,
  passed boolean NOT NULL,
  answers jsonb NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.va_quiz_attempts TO authenticated;
GRANT ALL ON public.va_quiz_attempts TO service_role;
ALTER TABLE public.va_quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "VAs read own quiz attempts" ON public.va_quiz_attempts FOR SELECT TO authenticated USING (va_id=auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.va_dials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  va_id uuid NOT NULL,
  week_start date NOT NULL,
  dial_count integer NOT NULL CHECK (dial_count BETWEEN 0 AND 10000),
  screenshot_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(va_id,week_start)
);
GRANT SELECT ON public.va_dials TO authenticated;
GRANT ALL ON public.va_dials TO service_role;
ALTER TABLE public.va_dials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "VAs read own dials" ON public.va_dials FOR SELECT TO authenticated USING (va_id=auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.va_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  va_id uuid NOT NULL,
  lead_id uuid REFERENCES public.crm_leads(id),
  kind text NOT NULL CHECK (kind IN ('eligible_file','funded_bonus')),
  amount numeric NOT NULL,
  week_start date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid')),
  paid_at timestamptz,
  paid_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(va_id,lead_id,kind)
);
GRANT SELECT ON public.va_payouts TO authenticated;
GRANT ALL ON public.va_payouts TO service_role;
ALTER TABLE public.va_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "VAs read own VA payouts" ON public.va_payouts FOR SELECT TO authenticated USING (va_id=auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.va_weekly_statements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  va_id uuid NOT NULL,
  week_start date NOT NULL,
  base_amount numeric NOT NULL DEFAULT 0,
  files_count integer NOT NULL DEFAULT 0,
  file_amount numeric NOT NULL DEFAULT 0,
  bonus_amount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid')),
  paid_at timestamptz,
  paid_by uuid,
  generated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(va_id,week_start)
);
GRANT SELECT ON public.va_weekly_statements TO authenticated;
GRANT ALL ON public.va_weekly_statements TO service_role;
ALTER TABLE public.va_weekly_statements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "VAs read own statements" ON public.va_weekly_statements FOR SELECT TO authenticated USING (va_id=auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.agent_eligible(_user_id uuid, _require_training boolean)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.agents a WHERE a.user_id=_user_id AND a.active AND a.program_type='agent')
    AND EXISTS (SELECT 1 FROM public.agent_agreements g WHERE g.agent_id=_user_id AND g.version='agent-agreement-v1')
    AND (NOT _require_training OR (SELECT count(DISTINCT section_key) FROM public.agent_training_progress t WHERE t.agent_id=_user_id AND t.section_key IN ('program','who','conversations','rules','payouts'))=5)
$$;

CREATE OR REPLACE FUNCTION public.crm_auto_assign_lead(_lead_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _lead public.crm_leads; _agent uuid;
BEGIN
  SELECT * INTO _lead FROM public.crm_leads WHERE id=_lead_id FOR UPDATE;
  IF _lead.id IS NULL OR _lead.warm_reason IS NULL OR _lead.assigned_to IS NOT NULL OR _lead.lead_type IN ('partner','recruit','va_merchant') THEN RETURN; END IF;
  IF _lead.agent_id IS NOT NULL AND EXISTS(SELECT 1 FROM public.agents WHERE user_id=_lead.agent_id AND active AND program_type='agent') THEN
    UPDATE public.crm_leads SET assigned_to=_lead.agent_id WHERE id=_lead.id;
    UPDATE public.agents SET last_assigned_at=now() WHERE user_id=_lead.agent_id;
    RETURN;
  END IF;
  IF NOT COALESCE((SELECT auto_assign FROM public.agent_settings WHERE singleton),false) THEN RETURN; END IF;
  SELECT a.user_id INTO _agent FROM public.agents a WHERE public.agent_eligible(a.user_id,true) ORDER BY a.last_assigned_at ASC NULLS FIRST,a.created_at,a.user_id LIMIT 1;
  IF _agent IS NOT NULL THEN
    UPDATE public.crm_leads SET assigned_to=_agent WHERE id=_lead.id;
    UPDATE public.agents SET last_assigned_at=now() WHERE user_id=_agent;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.crm_sync_agent_payout()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _percent numeric; _basis text;
BEGIN
  IF NEW.va_code IS NULL AND NEW.stage='Funded' AND NEW.clearfund_commission IS NOT NULL AND NEW.assigned_to IS NOT NULL AND EXISTS(SELECT 1 FROM public.agents WHERE user_id=NEW.assigned_to AND program_type='agent') THEN
    _basis := CASE WHEN NEW.agent_id IS NOT NULL AND NEW.agent_id=NEW.assigned_to THEN 'own_referral' ELSE 'assigned' END;
    IF _basis='own_referral' THEN SELECT COALESCE(a.referral_payout_percent,s.referral_payout_percent,50) INTO _percent FROM public.agents a LEFT JOIN public.agent_settings s ON s.singleton WHERE a.user_id=NEW.assigned_to;
    ELSE SELECT COALESCE(a.assigned_payout_percent,s.assigned_payout_percent,30) INTO _percent FROM public.agents a LEFT JOIN public.agent_settings s ON s.singleton WHERE a.user_id=NEW.assigned_to; END IF;
    INSERT INTO public.agent_payouts(lead_id,agent_id,clearfund_commission,agent_percent,agent_amount,payout_basis)
    VALUES(NEW.id,NEW.assigned_to,NEW.clearfund_commission,_percent,round(NEW.clearfund_commission*_percent/100,2),_basis)
    ON CONFLICT(lead_id) DO UPDATE SET agent_id=EXCLUDED.agent_id,clearfund_commission=EXCLUDED.clearfund_commission,agent_percent=EXCLUDED.agent_percent,agent_amount=EXCLUDED.agent_amount,payout_basis=EXCLUDED.payout_basis,updated_at=now() WHERE agent_payouts.status='pending';
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.va_unlocked(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.agents WHERE user_id=_user_id AND program_type='va' AND active)
    AND (SELECT count(DISTINCT section_key) FROM public.agent_training_progress WHERE agent_id=_user_id AND section_key IN ('va_1','va_2','va_3','va_4','va_5','va_6'))=6
    AND EXISTS(SELECT 1 FROM public.va_quiz_attempts WHERE va_id=_user_id AND passed)
$$;
CREATE OR REPLACE FUNCTION public.va_link_valid(_code text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.agents a WHERE a.referral_code=upper(trim(_code)) AND public.va_unlocked(a.user_id))
$$;

CREATE OR REPLACE FUNCTION public.va_mark_training(_section text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.agents WHERE user_id=auth.uid() AND program_type='va' AND active) THEN RAISE EXCEPTION 'Active VA required'; END IF;
  IF _section NOT IN ('va_1','va_2','va_3','va_4','va_5','va_6') THEN RAISE EXCEPTION 'Unknown training section'; END IF;
  INSERT INTO public.agent_training_progress(agent_id,section_key) VALUES(auth.uid(),_section) ON CONFLICT DO NOTHING;
END $$;
REVOKE ALL ON FUNCTION public.va_mark_training(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.va_mark_training(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.va_documents_ready(_lead_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT (SELECT count(*) FROM public.va_documents WHERE lead_id=_lead_id AND doc_type='signed_application')>=1
    AND (SELECT count(*) FROM public.va_documents WHERE lead_id=_lead_id AND doc_type='bank_statement')>=3
    AND (NOT COALESCE((SELECT p.requires_photo_id FROM public.crm_leads l JOIN public.funder_products p ON p.id=l.routed_product_id WHERE l.id=_lead_id),false)
      OR EXISTS(SELECT 1 FROM public.va_documents WHERE lead_id=_lead_id AND doc_type='photo_id'))
$$;

CREATE OR REPLACE FUNCTION public.va_record_eligible_payout(_lead_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE l public.crm_leads%ROWTYPE; _amount numeric;
BEGIN
  SELECT * INTO l FROM public.crm_leads WHERE id=_lead_id;
  IF l.va_eligible AND l.va_credit_blocked_reason IS NULL AND l.assigned_to IS NOT NULL THEN
    SELECT COALESCE(a.va_file_pay,s.default_file_pay,25) INTO _amount FROM public.agents a LEFT JOIN public.va_settings s ON s.singleton WHERE a.user_id=l.assigned_to;
    INSERT INTO public.va_payouts(va_id,lead_id,kind,amount,week_start) VALUES(l.assigned_to,l.id,'eligible_file',_amount,(date_trunc('week',l.va_eligible_at)::date)) ON CONFLICT DO NOTHING;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.va_admin_review(_lead_id uuid, _action text, _note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE l public.crm_leads%ROWTYPE; _duplicate boolean; _recent_reply boolean;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  SELECT * INTO l FROM public.crm_leads WHERE id=_lead_id AND va_code IS NOT NULL FOR UPDATE;
  IF l.id IS NULL THEN RAISE EXCEPTION 'VA file not found'; END IF;
  IF _action NOT IN ('approve','reject','request_more') THEN RAISE EXCEPTION 'Unknown review action'; END IF;
  IF _action='request_more' THEN UPDATE public.crm_leads SET stage='Docs Pending' WHERE id=l.id;
  ELSIF _action='reject' THEN UPDATE public.crm_leads SET stage='Rejected',va_eligible=false,va_credit_blocked_reason='admin_rejected' WHERE id=l.id;
  ELSE
    IF l.stage<>'Complete' OR NOT l.va_auto_passed OR NOT public.va_documents_ready(l.id) THEN RAISE EXCEPTION 'File must pass auto-check and include every required document'; END IF;
    SELECT EXISTS(SELECT 1 FROM public.crm_leads o WHERE o.id<>l.id AND o.created_at>=l.created_at-interval '90 days' AND o.created_at<l.created_at AND (lower(o.email)=lower(l.email) OR (o.phone IS NOT NULL AND l.phone IS NOT NULL AND right(regexp_replace(o.phone,'\D','','g'),10)=right(regexp_replace(l.phone,'\D','','g'),10)) OR (o.company_key IS NOT NULL AND o.company_key=l.company_key))) INTO _duplicate;
    SELECT EXISTS(SELECT 1 FROM public.email_events e WHERE e.event='replied' AND e.occurred_at>=now()-interval '30 days' AND (e.lead_id=l.id OR lower(e.recipient_email)=lower(l.email))) INTO _recent_reply;
    UPDATE public.crm_leads SET stage='Approved by Dioni',va_eligible=NOT _duplicate,va_eligible_at=CASE WHEN NOT _duplicate THEN now() ELSE NULL END,va_approved_by=auth.uid(),va_credit_blocked_reason=CASE WHEN _duplicate THEN 'duplicate_90_days' WHEN _recent_reply THEN 'replied_within_30_days' ELSE NULL END WHERE id=l.id;
    PERFORM public.va_record_eligible_payout(l.id);
  END IF;
  INSERT INTO public.crm_activities(lead_id,user_id,type,body) VALUES(l.id,auth.uid(),'note','VA file review: '||_action||COALESCE(' — '||left(trim(_note),2000),''));
END $$;
REVOKE ALL ON FUNCTION public.va_admin_review(uuid,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.va_admin_review(uuid,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.va_sync_funded_payout()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _amount numeric;
BEGIN
  IF NEW.stage='Funded' AND OLD.stage IS DISTINCT FROM 'Funded' AND NEW.va_eligible AND NEW.va_credit_blocked_reason IS NULL AND NEW.assigned_to IS NOT NULL THEN
    SELECT COALESCE(a.va_funded_bonus,s.default_funded_bonus,100) INTO _amount FROM public.agents a LEFT JOIN public.va_settings s ON s.singleton WHERE a.user_id=NEW.assigned_to;
    INSERT INTO public.va_payouts(va_id,lead_id,kind,amount,week_start) VALUES(NEW.assigned_to,NEW.id,'funded_bonus',_amount,date_trunc('week',now())::date) ON CONFLICT DO NOTHING;
  END IF;
  IF NEW.stage IN ('Funded','Declined') AND OLD.stage IS DISTINCT FROM NEW.stage THEN
    UPDATE public.va_documents SET delete_after=now()+interval '30 days' WHERE lead_id=NEW.id;
    NEW.terminal_at=now();
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER crm_va_funded_payout BEFORE UPDATE OF stage ON public.crm_leads FOR EACH ROW EXECUTE FUNCTION public.va_sync_funded_payout();

CREATE OR REPLACE FUNCTION public.va_admin_save_member(_va_id uuid, _active boolean, _file_pay numeric, _funded_bonus numeric, _started_at date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF _file_pay IS NOT NULL AND _file_pay NOT BETWEEN 20 AND 25 THEN RAISE EXCEPTION 'Per-file pay must be between 20 and 25'; END IF;
  IF _funded_bonus IS NOT NULL AND _funded_bonus NOT BETWEEN 75 AND 100 THEN RAISE EXCEPTION 'Funded bonus must be between 75 and 100'; END IF;
  UPDATE public.agents SET active=_active,va_file_pay=_file_pay,va_funded_bonus=_funded_bonus,va_started_at=_started_at WHERE user_id=_va_id AND program_type='va';
  IF NOT FOUND THEN RAISE EXCEPTION 'VA not found'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.va_admin_save_member(uuid,boolean,numeric,numeric,date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.va_admin_save_member(uuid,boolean,numeric,numeric,date) TO authenticated;

CREATE OR REPLACE FUNCTION public.va_generate_statement(_va_id uuid, _week_start date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _started date; _base numeric; _files integer; _file_amount numeric; _bonus numeric;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF _week_start<>date_trunc('week',_week_start)::date THEN RAISE EXCEPTION 'Week must start Monday'; END IF;
  SELECT va_started_at INTO _started FROM public.agents WHERE user_id=_va_id AND program_type='va';
  SELECT base_weekly INTO _base FROM public.va_settings WHERE singleton;
  IF _started IS NULL OR _week_start<date_trunc('week',_started)::date OR _week_start>=date_trunc('week',_started)::date+14 THEN _base=0; END IF;
  SELECT count(*) FILTER(WHERE kind='eligible_file'),COALESCE(sum(amount) FILTER(WHERE kind='eligible_file'),0),COALESCE(sum(amount) FILTER(WHERE kind='funded_bonus'),0) INTO _files,_file_amount,_bonus FROM public.va_payouts WHERE va_id=_va_id AND week_start=_week_start;
  INSERT INTO public.va_weekly_statements(va_id,week_start,base_amount,files_count,file_amount,bonus_amount,total)
  VALUES(_va_id,_week_start,COALESCE(_base,0),_files,_file_amount,_bonus,COALESCE(_base,0)+_file_amount+_bonus)
  ON CONFLICT(va_id,week_start) DO UPDATE SET base_amount=EXCLUDED.base_amount,files_count=EXCLUDED.files_count,file_amount=EXCLUDED.file_amount,bonus_amount=EXCLUDED.bonus_amount,total=EXCLUDED.total,generated_at=now() WHERE va_weekly_statements.status='pending';
END $$;
REVOKE ALL ON FUNCTION public.va_generate_statement(uuid,date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.va_generate_statement(uuid,date) TO authenticated;

CREATE OR REPLACE FUNCTION public.va_mark_statement_paid(_statement_id uuid, _paid boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  UPDATE public.va_weekly_statements SET status=CASE WHEN _paid THEN 'paid' ELSE 'pending' END,paid_at=CASE WHEN _paid THEN now() ELSE NULL END,paid_by=CASE WHEN _paid THEN auth.uid() ELSE NULL END WHERE id=_statement_id;
END $$;
REVOKE ALL ON FUNCTION public.va_mark_statement_paid(uuid,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.va_mark_statement_paid(uuid,boolean) TO authenticated;

-- VA call screen: one call list per VA, one-tap outcomes, one Qualified action, one status label.
-- The VA only talks to owners. Files are collected by the file worker (0032).

ALTER TABLE public.crm_leads
  ADD COLUMN IF NOT EXISTS call_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_call_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_call_outcome text,
  ADD COLUMN IF NOT EXISTS callback_at timestamptz,
  ADD COLUMN IF NOT EXISTS best_time_to_call text,
  ADD COLUMN IF NOT EXISTS app_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS app_reminders_sent integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_reminder_at timestamptz,
  ADD COLUMN IF NOT EXISTS docs_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS file_summary jsonb,
  ADD COLUMN IF NOT EXISTS file_ready_at timestamptz,
  ADD COLUMN IF NOT EXISTS file_pay_tier numeric;
ALTER TABLE public.crm_leads DROP CONSTRAINT IF EXISTS crm_leads_last_call_outcome_check;
ALTER TABLE public.crm_leads ADD CONSTRAINT crm_leads_last_call_outcome_check
  CHECK (last_call_outcome IS NULL OR last_call_outcome IN ('no_answer','call_later','not_interested','dnc','qualified','not_qualified')) NOT VALID;
CREATE INDEX IF NOT EXISTS crm_leads_va_calls_idx ON public.crm_leads (assigned_to, next_follow_up) WHERE va_code IS NOT NULL;

-- Every call outcome, for coaching and the owner's progress view. Written only through the functions below.
CREATE TABLE IF NOT EXISTS public.va_call_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  va_id uuid NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('no_answer','call_later','not_interested','dnc','qualified','not_qualified')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS va_call_log_va_idx ON public.va_call_log (va_id, created_at DESC);
CREATE INDEX IF NOT EXISTS va_call_log_lead_idx ON public.va_call_log (lead_id, created_at DESC);
GRANT SELECT ON public.va_call_log TO authenticated;
GRANT ALL ON public.va_call_log TO service_role;
ALTER TABLE public.va_call_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read VA call log" ON public.va_call_log;
CREATE POLICY "Admins read VA call log" ON public.va_call_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "VAs read own call log" ON public.va_call_log;
CREATE POLICY "VAs read own call log" ON public.va_call_log FOR SELECT TO authenticated USING (va_id=auth.uid());

-- The one status label shown everywhere (VA portal, CRM, owner view). Order matters: first match wins.
CREATE OR REPLACE FUNCTION public.va_status_label(l public.crm_leads)
RETURNS text LANGUAGE sql STABLE SET search_path=public AS $$
  SELECT CASE
    WHEN l.do_not_contact THEN 'Do not call'
    WHEN l.stage='Funded' THEN 'Funded'
    WHEN l.stage IN ('Declined','Rejected') THEN 'Declined'
    WHEN l.stage='Submitted' THEN 'Submitted'
    WHEN l.stage='Approved by Dioni' THEN 'Approved'
    WHEN l.file_ready_at IS NOT NULL THEN 'File ready'
    WHEN l.file_summary IS NOT NULL THEN 'Docs missing'
    WHEN l.stage='Complete' OR l.docs_in_at IS NOT NULL THEN 'Docs in'
    WHEN l.app_sent_at IS NOT NULL THEN 'App sent'
    WHEN l.stage='Qualified' THEN 'Qualified'
    WHEN l.stage='Not yet, follow up later.' THEN 'Not ready yet'
    WHEN l.stage='Lost' OR l.last_call_outcome='not_interested' THEN 'Not interested'
    WHEN l.last_call_outcome='call_later' THEN 'Call later'
    WHEN l.call_attempts>0 THEN 'Called'
    ELSE 'New' END
$$;

-- Why a lead is on today's list. NULL means it is not due today.
CREATE OR REPLACE FUNCTION public.va_due_reason(l public.crm_leads)
RETURNS text LANGUAGE sql STABLE SET search_path=public AS $$
  SELECT CASE
    WHEN l.do_not_contact OR l.stage IN ('Funded','Declined','Rejected','Submitted','Approved by Dioni','Complete','Lost') OR l.file_ready_at IS NOT NULL THEN NULL
    WHEN l.file_summary IS NOT NULL AND COALESCE(l.next_follow_up,current_date)<=current_date THEN 'Missing documents'
    WHEN l.app_sent_at IS NOT NULL AND l.docs_in_at IS NULL AND l.app_sent_at<=now()-interval '7 days' AND COALESCE(l.next_follow_up,current_date)<=current_date THEN 'No upload yet'
    WHEN l.app_sent_at IS NOT NULL OR l.stage IN ('Qualified','Docs Pending') THEN NULL
    WHEN l.last_call_outcome='call_later' AND l.next_follow_up<=current_date THEN 'Callback'
    WHEN l.stage='Not yet, follow up later.' AND l.next_follow_up<=current_date THEN 'Check back'
    WHEN l.last_call_outcome='no_answer' AND l.call_attempts<3 AND l.next_follow_up<=current_date THEN 'Try again'
    WHEN l.call_attempts=0 AND l.last_call_outcome IS NULL AND l.stage='New' THEN 'New'
    ELSE NULL END
$$;

CREATE OR REPLACE FUNCTION public.va_require_unlocked()
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE _code text;
BEGIN
  SELECT referral_code INTO _code FROM public.agents WHERE user_id=auth.uid() AND program_type='va' AND active;
  IF _code IS NULL OR NOT public.va_unlocked(auth.uid()) THEN RAISE EXCEPTION 'Finish VA training first'; END IF;
  RETURN _code;
END $$;
REVOKE ALL ON FUNCTION public.va_require_unlocked() FROM PUBLIC;

-- The VA's call list. Only name, contact, phone and state: never where a lead came from or what kind it is.
-- _scope 'today' = due now, callbacks first; 'all' = every lead assigned to this VA.
CREATE OR REPLACE FUNCTION public.va_call_list(_scope text DEFAULT 'today')
RETURNS TABLE(id uuid, business_name text, owner_name text, phone text, email text, state text, status text, reason text,
              call_attempts integer, callback_at timestamptz, best_time_to_call text, last_call_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  PERFORM public.va_require_unlocked();
  IF _scope NOT IN ('today','all') THEN RAISE EXCEPTION 'Unknown list'; END IF;
  RETURN QUERY
  SELECT l.id, l.firm, l.contact_name, l.phone, l.email, l.state, public.va_status_label(l), public.va_due_reason(l),
         l.call_attempts, l.callback_at, l.best_time_to_call, l.last_call_at
  FROM public.crm_leads l
  WHERE l.assigned_to=auth.uid() AND l.va_code IS NOT NULL
    AND (_scope='all' OR public.va_due_reason(l) IS NOT NULL)
  ORDER BY CASE public.va_due_reason(l) WHEN 'Callback' THEN 0 WHEN 'Missing documents' THEN 1 WHEN 'No upload yet' THEN 2 WHEN 'Check back' THEN 3 WHEN 'Try again' THEN 4 WHEN 'New' THEN 5 ELSE 6 END,
           l.callback_at NULLS LAST, l.last_call_at NULLS FIRST, l.created_at
  LIMIT CASE WHEN _scope='today' THEN 80 ELSE 1000 END;
END $$;
REVOKE ALL ON FUNCTION public.va_call_list(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.va_call_list(text) TO authenticated;

-- One tap per call: no_answer, call_later (needs a time), not_interested, dnc.
CREATE OR REPLACE FUNCTION public.va_log_call(_lead_id uuid, _outcome text, _callback_at timestamptz DEFAULT NULL, _note text DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE l public.crm_leads%ROWTYPE; _note_clean text := NULLIF(left(trim(COALESCE(_note,'')),500),'');
BEGIN
  PERFORM public.va_require_unlocked();
  IF _outcome NOT IN ('no_answer','call_later','not_interested','dnc') THEN RAISE EXCEPTION 'Unknown call outcome'; END IF;
  SELECT * INTO l FROM public.crm_leads WHERE id=_lead_id AND assigned_to=auth.uid() AND va_code IS NOT NULL FOR UPDATE;
  IF l.id IS NULL THEN RAISE EXCEPTION 'Lead not available'; END IF;
  IF l.do_not_contact THEN RAISE EXCEPTION 'This owner is on the do not call list'; END IF;
  IF _outcome='call_later' AND (_callback_at IS NULL OR _callback_at<now()-interval '5 minutes' OR _callback_at>now()+interval '90 days') THEN
    RAISE EXCEPTION 'Pick a callback time in the next 90 days';
  END IF;

  IF _outcome='dnc' THEN
    INSERT INTO public.va_call_log(lead_id,va_id,outcome,note) VALUES (l.id,auth.uid(),'dnc',_note_clean);
    UPDATE public.crm_leads SET call_attempts=call_attempts+1,last_call_at=now(),last_call_outcome='dnc',next_follow_up=NULL,callback_at=NULL WHERE id=l.id;
    PERFORM public.va_mark_dnc(l.id, COALESCE(_note_clean,'Owner asked not to be called'));
    RETURN public.va_status_label((SELECT x FROM public.crm_leads x WHERE x.id=l.id));
  END IF;

  UPDATE public.crm_leads SET
    call_attempts=call_attempts+1,
    last_call_at=now(),
    last_call_outcome=_outcome,
    callback_at=CASE WHEN _outcome='call_later' THEN _callback_at ELSE NULL END,
    next_follow_up=CASE
      WHEN _outcome='call_later' THEN (_callback_at AT TIME ZONE 'America/New_York')::date
      WHEN _outcome='no_answer' AND l.call_attempts+1<3 THEN current_date+2
      ELSE NULL END,
    stage=CASE
      WHEN COALESCE(lead_type,'borrower')='borrower' AND _outcome='not_interested' THEN 'Lost'
      WHEN COALESCE(lead_type,'borrower')='borrower' AND stage='New' THEN 'Contacted'
      WHEN lead_type='va_merchant' AND _outcome='not_interested' AND stage IN ('New','Started','Qualified','Docs Pending','Not yet, follow up later.') THEN 'Declined'
      ELSE stage END
  WHERE id=l.id;
  INSERT INTO public.va_call_log(lead_id,va_id,outcome,note) VALUES (l.id,auth.uid(),_outcome,_note_clean);
  IF _note_clean IS NOT NULL THEN
    INSERT INTO public.crm_activities(lead_id,user_id,type,body) VALUES (l.id,auth.uid(),'note','VA call note: '||_note_clean);
  END IF;
  RETURN public.va_status_label((SELECT x FROM public.crm_leads x WHERE x.id=l.id));
END $$;
REVOKE ALL ON FUNCTION public.va_log_call(uuid,text,timestamptz,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.va_log_call(uuid,text,timestamptz,text) TO authenticated;

-- The one Qualified action. Rules match the VA job post: 4+ months in business, owner wants funding,
-- state allowed, business bank account when settings require it. Revenue is a range here; the real
-- monthly deposits come from the statements the file worker reads.
CREATE OR REPLACE FUNCTION public.va_qualify_lead(
  _lead_id uuid, _months text, _revenue text, _business_checking boolean, _owner_wants_funding boolean,
  _email text, _best_time text DEFAULT NULL, _note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE l public.crm_leads%ROWTYPE; s public.va_settings%ROWTYPE; _code text; _m integer; _st text;
        _email_clean text := lower(trim(COALESCE(_email,''))); _reasons text[] := '{}'; _pass boolean;
        _note_clean text := NULLIF(left(trim(COALESCE(_note,'')),500),'');
BEGIN
  _code := public.va_require_unlocked();
  SELECT * INTO l FROM public.crm_leads WHERE id=_lead_id AND assigned_to=auth.uid() AND va_code IS NOT NULL FOR UPDATE;
  IF l.id IS NULL THEN RAISE EXCEPTION 'Lead not available'; END IF;
  IF l.do_not_contact THEN RAISE EXCEPTION 'This owner is on the do not call list'; END IF;
  IF l.app_sent_at IS NOT NULL OR l.stage IN ('Qualified','Docs Pending','Complete','Approved by Dioni','Submitted','Funded') THEN
    RAISE EXCEPTION 'This owner is already qualified';
  END IF;
  IF NOT COALESCE(_owner_wants_funding,false) THEN RAISE EXCEPTION 'Confirm the owner wants funding before qualifying'; END IF;
  IF _email_clean !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR length(_email_clean)>255 THEN RAISE EXCEPTION 'Enter a valid email for the owner'; END IF;
  _m := CASE _months WHEN 'lt4' THEN 0 WHEN '4to11' THEN 4 WHEN '12to23' THEN 12 WHEN '24plus' THEN 24 END;
  IF _m IS NULL THEN RAISE EXCEPTION 'Pick time in business'; END IF;
  IF _revenue NOT IN ('lt10k','10to25k','25to50k','50kplus') THEN RAISE EXCEPTION 'Pick monthly revenue'; END IF;
  SELECT * INTO s FROM public.va_settings WHERE singleton;
  _st := upper(trim(COALESCE(l.state,'')));

  IF _m < COALESCE(s.min_months,4) THEN _reasons := array_append(_reasons, 'Under 4 months in business'); END IF;
  IF _st = ANY(ARRAY['VA','CT','MO','CA','VT','ND'] || COALESCE(s.blocked_states,'{}')) THEN _reasons := array_append(_reasons, 'State not served'); END IF;
  IF COALESCE(s.require_business_bank,true) AND NOT COALESCE(_business_checking,false) THEN _reasons := array_append(_reasons, 'No business bank account'); END IF;
  _pass := cardinality(_reasons)=0;

  UPDATE public.crm_leads SET
    lead_type='va_merchant',
    stage=CASE WHEN _pass THEN 'Qualified' ELSE 'Not yet, follow up later.' END,
    email=_email_clean,
    va_code=_code,
    va_auto_passed=_pass,
    va_email_consent_at=CASE WHEN _pass THEN now() ELSE va_email_consent_at END,
    qualifier=jsonb_build_object('months',_months,'revenue',_revenue,'business_checking',COALESCE(_business_checking,false),'owner_wants_funding',true,
      'state',_st,'source','va_call','qualified_by',auth.uid(),'at',now(),'reasons',to_jsonb(_reasons)),
    best_time_to_call=NULLIF(left(trim(COALESCE(_best_time,'')),80),''),
    call_attempts=call_attempts+1,
    last_call_at=now(),
    last_call_outcome=CASE WHEN _pass THEN 'qualified' ELSE 'not_qualified' END,
    callback_at=NULL,
    next_follow_up=CASE WHEN _pass THEN NULL ELSE current_date+60 END
  WHERE id=l.id;

  INSERT INTO public.va_call_log(lead_id,va_id,outcome,note) VALUES (l.id,auth.uid(),CASE WHEN _pass THEN 'qualified' ELSE 'not_qualified' END,_note_clean);
  IF _pass THEN
    INSERT INTO public.va_consents(lead_id,consent_type,displayed_text,version,actor_id)
    VALUES (l.id,'va_intake_email','Owner agreed on the call to get the application link by email','va-email-consent-v2',auth.uid());
  END IF;
  INSERT INTO public.crm_activities(lead_id,user_id,type,body)
  VALUES (l.id,auth.uid(),'note',CASE WHEN _pass THEN 'VA qualified the owner; application email queued'
    ELSE 'VA call: not ready yet ('||array_to_string(_reasons,', ')||')' END || COALESCE(' — '||_note_clean,''));
  RETURN jsonb_build_object('result',CASE WHEN _pass THEN 'qualified' ELSE 'not_yet' END,'reasons',to_jsonb(_reasons),
    'status',public.va_status_label((SELECT x FROM public.crm_leads x WHERE x.id=l.id)));
END $$;
REVOKE ALL ON FUNCTION public.va_qualify_lead(uuid,text,text,boolean,boolean,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.va_qualify_lead(uuid,text,text,boolean,boolean,text,text,text) TO authenticated;

-- Docs in: the merchant page marks the file Complete when every required document is uploaded.
CREATE OR REPLACE FUNCTION public.va_track_file_stages()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.stage='Complete' AND OLD.stage IS DISTINCT FROM 'Complete' AND NEW.docs_in_at IS NULL THEN NEW.docs_in_at := now(); END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS crm_va_track_file_stages ON public.crm_leads;
CREATE TRIGGER crm_va_track_file_stages BEFORE UPDATE OF stage ON public.crm_leads FOR EACH ROW EXECUTE FUNCTION public.va_track_file_stages();

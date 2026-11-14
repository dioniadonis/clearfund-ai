-- File pipeline run by the local worker on the owner's Mac.
-- The worker signs in as a dedicated user listed in file_workers. It sends the application email,
-- sends reminders on day 1, 3 and 7, reads bank statements locally and writes back summary figures only.

CREATE TABLE IF NOT EXISTS public.file_workers (user_id uuid PRIMARY KEY, label text, created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.file_workers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read file workers" ON public.file_workers;
CREATE POLICY "Admins read file workers" ON public.file_workers FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.is_file_worker()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.file_workers WHERE user_id=auth.uid()) $$;
REVOKE ALL ON FUNCTION public.is_file_worker() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_file_worker() TO authenticated;

-- The worker may read (download) VA documents, nothing else in storage.
DO $do$ BEGIN
  IF to_regclass('storage.objects') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "File worker reads VA documents" ON storage.objects';
    EXECUTE 'CREATE POLICY "File worker reads VA documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = ''va-documents'' AND public.is_file_worker())';
  END IF;
END $do$;

-- Work queue for one worker run.
CREATE OR REPLACE FUNCTION public.fw_jobs()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE _send jsonb; _remind jsonb; _read jsonb;
BEGIN
  IF NOT public.is_file_worker() THEN RAISE EXCEPTION 'File worker access required'; END IF;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('lead_id',l.id,'business_name',l.firm,'owner_name',l.contact_name,'email',l.email) ORDER BY l.updated_at),'[]') INTO _send
  FROM (SELECT * FROM crm_leads l WHERE l.lead_type='va_merchant' AND l.stage='Qualified' AND l.app_sent_at IS NULL AND NOT l.do_not_contact
          AND l.va_email_consent_at IS NOT NULL AND l.email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' ORDER BY l.updated_at LIMIT 25) l;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('lead_id',l.id,'business_name',l.firm,'owner_name',l.contact_name,'email',l.email,'reminder_number',l.app_reminders_sent+1)),'[]') INTO _remind
  FROM (SELECT * FROM crm_leads l WHERE l.lead_type='va_merchant' AND l.app_sent_at IS NOT NULL AND l.docs_in_at IS NULL AND NOT l.do_not_contact
          AND l.stage IN ('Qualified','Docs Pending') AND l.app_reminders_sent < 3
          AND now() >= l.app_sent_at + (CASE l.app_reminders_sent WHEN 0 THEN 1 WHEN 1 THEN 3 ELSE 7 END) * interval '1 day'
          AND (l.last_reminder_at IS NULL OR l.last_reminder_at < now() - interval '20 hours')
        ORDER BY l.app_sent_at LIMIT 25) l;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('lead_id',l.id,'business_name',l.firm,'owner_name',l.contact_name,
      'documents',(SELECT jsonb_agg(jsonb_build_object('id',d.id,'doc_type',d.doc_type,'file_path',d.file_path) ORDER BY d.uploaded_at)
                   FROM va_documents d WHERE d.lead_id=l.id AND d.doc_type='bank_statement'))),'[]') INTO _read
  FROM (SELECT * FROM crm_leads l WHERE l.lead_type='va_merchant' AND l.stage IN ('Complete','Docs Pending') AND l.file_ready_at IS NULL AND NOT l.do_not_contact
          AND EXISTS(SELECT 1 FROM va_documents d WHERE d.lead_id=l.id AND d.doc_type='bank_statement')
          AND (l.file_summary IS NULL OR EXISTS(SELECT 1 FROM va_documents d WHERE d.lead_id=l.id AND d.uploaded_at > (l.file_summary->>'read_at')::timestamptz))
        ORDER BY l.updated_at LIMIT 10) l;
  RETURN jsonb_build_object('send_app',_send,'remind',_remind,'read',_read);
END $$;

-- The worker made a fresh 48-hex token, emailed the link, and stores only its hash here.
CREATE OR REPLACE FUNCTION public.fw_app_sent(_lead_id uuid, _token_hash text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.is_file_worker() THEN RAISE EXCEPTION 'File worker access required'; END IF;
  IF _token_hash !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Bad token hash'; END IF;
  UPDATE crm_leads SET app_sent_at=now(), updated_at=now() WHERE id=_lead_id AND stage='Qualified' AND app_sent_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lead not waiting for an application'; END IF;
  INSERT INTO va_resume_tokens(lead_id, token_hash, expires_at) VALUES (_lead_id, _token_hash, now()+interval '30 days');
  INSERT INTO crm_activities(lead_id, type, body) VALUES (_lead_id, 'email', 'Application and secure upload link emailed to the owner');
END $$;

CREATE OR REPLACE FUNCTION public.fw_reminder_sent(_lead_id uuid, _token_hash text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _n integer;
BEGIN
  IF NOT public.is_file_worker() THEN RAISE EXCEPTION 'File worker access required'; END IF;
  IF _token_hash !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Bad token hash'; END IF;
  UPDATE crm_leads SET app_reminders_sent=app_reminders_sent+1, last_reminder_at=now(), updated_at=now()
    WHERE id=_lead_id AND app_sent_at IS NOT NULL AND docs_in_at IS NULL AND app_reminders_sent<3 RETURNING app_reminders_sent INTO _n;
  IF _n IS NULL THEN RAISE EXCEPTION 'Lead not waiting for a reminder'; END IF;
  INSERT INTO va_resume_tokens(lead_id, token_hash, expires_at) VALUES (_lead_id, _token_hash, now()+interval '30 days');
  INSERT INTO crm_activities(lead_id, type, body) VALUES (_lead_id, 'email', 'Document reminder '||_n||' of 3 emailed to the owner');
END $$;

-- Summary figures from the local reader. Shape is checked strictly so no statement text,
-- transactions or account numbers can be stored. Eligibility is rule based.
CREATE OR REPLACE FUNCTION public.fw_save_summary(_lead_id uuid, _summary jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  l crm_leads%ROWTYPE; s va_settings%ROWTYPE; _st jsonb; _k text; _months integer; _avg numeric; _min numeric;
  _blockers text[] := '{}'; _flags text[] := '{}'; _missing boolean := false; _eligible boolean; _tier numeric; _clean jsonb; _stmts jsonb := '[]';
BEGIN
  IF NOT public.is_file_worker() THEN RAISE EXCEPTION 'File worker access required'; END IF;
  SELECT * INTO l FROM crm_leads WHERE id=_lead_id FOR UPDATE;
  IF l.id IS NULL OR l.lead_type IS DISTINCT FROM 'va_merchant' THEN RAISE EXCEPTION 'Lead not found'; END IF;
  SELECT * INTO s FROM va_settings WHERE singleton;
  IF jsonb_typeof(_summary) <> 'object' THEN RAISE EXCEPTION 'Summary must be an object'; END IF;
  FOR _k IN SELECT jsonb_object_keys(_summary) LOOP
    IF _k NOT IN ('method','statements','name_match','unreadable_files') THEN RAISE EXCEPTION 'Unexpected summary field %', _k; END IF;
  END LOOP;
  IF jsonb_typeof(_summary->'statements') <> 'array' OR jsonb_array_length(_summary->'statements') > 12 THEN RAISE EXCEPTION 'statements must be a list of up to 12'; END IF;
  FOR _st IN SELECT * FROM jsonb_array_elements(_summary->'statements') LOOP
    FOR _k IN SELECT jsonb_object_keys(_st) LOOP
      IF _k NOT IN ('month','deposits','nsf','negative_end') THEN RAISE EXCEPTION 'Unexpected statement field %', _k; END IF;
    END LOOP;
    IF (_st->>'month') !~ '^\d{4}-(0[1-9]|1[0-2])$' OR jsonb_typeof(_st->'deposits') <> 'number' OR (_st->>'deposits')::numeric < 0 OR (_st->>'deposits')::numeric > 100000000 THEN
      RAISE EXCEPTION 'Bad statement row'; END IF;
    _stmts := _stmts || jsonb_build_array(jsonb_build_object('month',_st->>'month','deposits',round((_st->>'deposits')::numeric),
      'nsf',LEAST(GREATEST(COALESCE((_st->>'nsf')::int,0),0),999),'negative_end',COALESCE((_st->>'negative_end')::boolean,false)));
  END LOOP;

  -- One figure per calendar month (latest statement wins if a month repeats).
  SELECT count(*), avg(dep), min(dep) INTO _months, _avg, _min FROM (
    SELECT DISTINCT ON (x->>'month') (x->>'deposits')::numeric dep FROM jsonb_array_elements(_stmts) x ORDER BY x->>'month') m;
  _avg := round(COALESCE(_avg,0)); _min := round(COALESCE(_min,0));

  IF NOT public.va_documents_ready(l.id) THEN _blockers := array_append(_blockers,'Missing signed application or statements'); _missing := true; END IF;
  IF COALESCE(jsonb_array_length(_summary->'unreadable_files'),0) > 0 THEN _blockers := array_append(_blockers,'A statement could not be read'); _missing := true; END IF;
  IF _months < 3 THEN _blockers := array_append(_blockers,'Need 3 months of statements'); _missing := true; END IF;
  IF _months >= 3 AND (_min <= 0 OR _min < 0.5*_avg) THEN _blockers := array_append(_blockers,'Revenue not steady'); END IF;
  IF COALESCE(l.qualifier->>'months','') = 'lt4' THEN _blockers := array_append(_blockers,'Under 4 months in business'); END IF;
  IF (l.qualifier->>'owner_wants_funding') = 'false' THEN _blockers := array_append(_blockers,'Owner interest not confirmed'); END IF;
  IF upper(COALESCE(l.state,'')) = ANY(ARRAY['VA','CT','MO','CA','VT','ND'] || COALESCE(s.blocked_states,'{}')) THEN _blockers := array_append(_blockers,'State not served'); END IF;
  IF EXISTS(SELECT 1 FROM crm_leads o WHERE o.id<>l.id AND o.va_code IS NOT NULL AND o.va_code IS DISTINCT FROM l.va_code
            AND ((o.phone IS NOT NULL AND l.phone IS NOT NULL AND right(regexp_replace(o.phone,'\D','','g'),10)=right(regexp_replace(l.phone,'\D','','g'),10))
              OR (o.company_key IS NOT NULL AND o.company_key=l.company_key))) THEN
    _blockers := array_append(_blockers,'Already worked by another VA'); END IF;
  IF (_summary->>'name_match') = 'false' THEN _flags := array_append(_flags,'Name on statements does not match the business'); END IF;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(_stmts) x WHERE (x->>'nsf')::int > 3 OR (x->>'negative_end')::boolean) THEN _flags := array_append(_flags,'Overdrafts or negative balances'); END IF;
  IF upper(COALESCE(l.state,''))='TX' THEN _flags := array_append(_flags,'Texas: no MCA'); END IF;
  IF upper(COALESCE(l.state,''))='NC' THEN _flags := array_append(_flags,'North Carolina: no loans'); END IF;

  _eligible := cardinality(_blockers)=0;
  _tier := CASE WHEN NOT _eligible THEN NULL WHEN _avg >= 10000 THEN 25 ELSE 20 END;
  _clean := jsonb_build_object('method',left(COALESCE(_summary->>'method','text'),20),'statements',_stmts,'months_covered',_months,
    'avg_monthly_deposits',_avg,'lowest_month',_min,'name_match',_summary->'name_match','eligible',_eligible,'missing_docs',_missing,
    'problems',to_jsonb(_blockers),'flags',to_jsonb(_flags),'read_at',now());
  UPDATE crm_leads SET file_summary=_clean, file_ready_at=CASE WHEN _eligible THEN now() END, file_pay_tier=_tier,
    next_follow_up=CASE WHEN _eligible THEN NULL WHEN _missing THEN current_date ELSE next_follow_up END, updated_at=now()
  WHERE id=l.id;
  INSERT INTO crm_activities(lead_id, type, body) VALUES (l.id, 'note', CASE WHEN _eligible
    THEN 'File ready for review: '||_months||' months read, average deposits about $'||to_char(_avg,'FM999,999,999')||'. VA pay tier $'||_tier||'.'
    ELSE 'File checked, not ready: '||array_to_string(_blockers,', ')||'.' END
    || CASE WHEN cardinality(_flags)>0 THEN ' Flags: '||array_to_string(_flags,', ')||'.' ELSE '' END);
  RETURN jsonb_build_object('eligible',_eligible,'pay_tier',_tier,'problems',to_jsonb(_blockers),'flags',to_jsonb(_flags));
END $$;

REVOKE ALL ON FUNCTION public.fw_jobs(), public.fw_app_sent(uuid,text), public.fw_reminder_sent(uuid,text), public.fw_save_summary(uuid,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fw_jobs(), public.fw_app_sent(uuid,text), public.fw_reminder_sent(uuid,text), public.fw_save_summary(uuid,jsonb) TO authenticated;

-- Status labels now tell missing documents apart from files that need a look.
CREATE OR REPLACE FUNCTION public.va_status_label(l public.crm_leads)
RETURNS text LANGUAGE sql STABLE SET search_path=public AS $$
  SELECT CASE
    WHEN l.do_not_contact THEN 'Do not call'
    WHEN l.stage='Funded' THEN 'Funded'
    WHEN l.stage IN ('Declined','Rejected') THEN 'Declined'
    WHEN l.stage='Submitted' THEN 'Submitted'
    WHEN l.stage='Approved by Dioni' THEN 'Approved'
    WHEN l.file_ready_at IS NOT NULL THEN 'File ready'
    WHEN COALESCE((l.file_summary->>'missing_docs')::boolean,false) THEN 'Docs missing'
    WHEN l.file_summary IS NOT NULL THEN 'Not eligible'
    WHEN l.stage='Complete' OR l.docs_in_at IS NOT NULL THEN 'Docs in'
    WHEN l.app_sent_at IS NOT NULL THEN 'App sent'
    WHEN l.stage='Qualified' THEN 'Qualified'
    WHEN l.stage='Not yet, follow up later.' THEN 'Not ready yet'
    WHEN l.stage='Lost' OR l.last_call_outcome='not_interested' THEN 'Not interested'
    WHEN l.last_call_outcome='call_later' THEN 'Call later'
    WHEN l.call_attempts>0 THEN 'Called'
    ELSE 'New' END
$$;

CREATE OR REPLACE FUNCTION public.va_due_reason(l public.crm_leads)
RETURNS text LANGUAGE sql STABLE SET search_path=public AS $$
  SELECT CASE
    WHEN l.do_not_contact OR l.stage IN ('Funded','Declined','Rejected','Submitted','Approved by Dioni','Lost') OR l.file_ready_at IS NOT NULL THEN NULL
    WHEN COALESCE((l.file_summary->>'missing_docs')::boolean,false) AND COALESCE(l.next_follow_up,current_date)<=current_date THEN 'Missing documents'
    WHEN l.stage='Complete' OR l.file_summary IS NOT NULL THEN NULL
    WHEN l.app_sent_at IS NOT NULL AND l.docs_in_at IS NULL AND l.app_sent_at<=now()-interval '7 days' AND COALESCE(l.next_follow_up,current_date)<=current_date THEN 'No upload yet'
    WHEN l.app_sent_at IS NOT NULL OR l.stage IN ('Qualified','Docs Pending') THEN NULL
    WHEN l.last_call_outcome='call_later' AND l.next_follow_up<=current_date THEN 'Callback'
    WHEN l.stage='Not yet, follow up later.' AND l.next_follow_up<=current_date THEN 'Check back'
    WHEN l.last_call_outcome='no_answer' AND l.call_attempts<3 AND l.next_follow_up<=current_date THEN 'Try again'
    WHEN l.call_attempts=0 AND l.last_call_outcome IS NULL AND l.stage='New' THEN 'New'
    ELSE NULL END
$$;

-- VA pay per eligible file follows the revenue tier the reader set ($25 at $10k+ a month, $20 below).
CREATE OR REPLACE FUNCTION public.va_record_eligible_payout(_lead_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE l public.crm_leads%ROWTYPE; _amount numeric;
BEGIN
  SELECT * INTO l FROM public.crm_leads WHERE id=_lead_id;
  IF l.va_eligible AND l.va_credit_blocked_reason IS NULL AND l.assigned_to IS NOT NULL THEN
    SELECT COALESCE(l.file_pay_tier,a.va_file_pay,s.default_file_pay,25) INTO _amount FROM public.agents a LEFT JOIN public.va_settings s ON s.singleton WHERE a.user_id=l.assigned_to;
    INSERT INTO public.va_payouts(va_id,lead_id,kind,amount,week_start) VALUES(l.assigned_to,l.id,'eligible_file',_amount,(date_trunc('week',l.va_eligible_at)::date)) ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Retention: every upload expires after 60 days at most, and 7 days after the file is submitted.
CREATE OR REPLACE FUNCTION public.va_documents_default_expiry()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN NEW.delete_after := LEAST(COALESCE(NEW.delete_after, now()+interval '60 days'), now()+interval '60 days'); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS va_documents_expiry ON public.va_documents;
CREATE TRIGGER va_documents_expiry BEFORE INSERT ON public.va_documents FOR EACH ROW EXECUTE FUNCTION public.va_documents_default_expiry();
UPDATE public.va_documents SET delete_after = uploaded_at + interval '60 days' WHERE delete_after IS NULL;

CREATE OR REPLACE FUNCTION public.va_documents_submit_expiry()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.stage='Submitted' AND OLD.stage IS DISTINCT FROM 'Submitted' THEN
    UPDATE public.va_documents SET delete_after=LEAST(COALESCE(delete_after, now()+interval '7 days'), now()+interval '7 days') WHERE lead_id=NEW.id;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS crm_va_submit_expiry ON public.crm_leads;
CREATE TRIGGER crm_va_submit_expiry AFTER UPDATE OF stage ON public.crm_leads FOR EACH ROW EXECUTE FUNCTION public.va_documents_submit_expiry();

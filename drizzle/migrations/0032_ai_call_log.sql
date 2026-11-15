-- Every call the AI phone line handles is logged here and tied to a CRM lead.
CREATE TABLE IF NOT EXISTS public.crm_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'retell',
  provider_call_id text NOT NULL,
  lead_id uuid REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  direction text,
  caller_phone text,
  started_at timestamptz,
  ended_at timestamptz,
  duration_s integer,
  status text,
  summary text CHECK (char_length(summary) <= 4000),
  sentiment text,
  successful boolean,
  callback_requested boolean NOT NULL DEFAULT false,
  callback_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_call_id)
);
CREATE INDEX IF NOT EXISTS crm_calls_lead_idx ON public.crm_calls(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS crm_calls_created_idx ON public.crm_calls(created_at DESC);
ALTER TABLE public.crm_calls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read AI calls" ON public.crm_calls;
CREATE POLICY "Admins read AI calls" ON public.crm_calls FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Called by the retell-webhook edge function (service role only).
-- Idempotent per call: call_ended creates the row, call_analyzed fills in the summary.
CREATE OR REPLACE FUNCTION public.crm_record_ai_call(_call jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  _cid text := left(NULLIF(trim(_call->>'call_id'),''),120);
  _dir text := lower(COALESCE(_call->>'direction','inbound'));
  _raw_phone text := CASE WHEN lower(COALESCE(_call->>'direction','inbound'))='outbound' THEN _call->>'to_number' ELSE _call->>'from_number' END;
  _digits text;
  _a jsonb := COALESCE(_call->'call_analysis','{}'::jsonb);
  _x jsonb := COALESCE(_call->'call_analysis'->'custom_analysis_data','{}'::jsonb) || COALESCE(_call->'collected_dynamic_variables','{}'::jsonb);
  _name text; _biz text; _email text; _summary text; _cb boolean; _cb_note text;
  _facts text;
  _lead public.crm_leads%ROWTYPE; _new boolean := false; _call_row public.crm_calls%ROWTYPE; _first_summary boolean;
  _start timestamptz; _end timestamptz;
BEGIN
  IF _cid IS NULL THEN RAISE EXCEPTION 'call_id required'; END IF;
  _digits := right(regexp_replace(COALESCE(_raw_phone,''),'\D','','g'),10);
  IF length(_digits) < 10 THEN _digits := NULL; END IF;
  _name := left(NULLIF(trim(COALESCE(_x->>'caller_name',_x->>'name',_x->>'owner_name','')),''),120);
  _biz := left(NULLIF(trim(COALESCE(_x->>'business_name',_x->>'company',_x->>'business','')),''),200);
  _email := lower(left(NULLIF(trim(COALESCE(_x->>'email',_x->>'caller_email',_x->>'contact_email','')),''),200));
  IF _email IS NOT NULL AND _email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN _email := NULL; END IF;
  _summary := left(NULLIF(trim(COALESCE(_a->>'call_summary','')),''),4000);
  _cb := lower(COALESCE(_x->>'callback_requested',_x->>'wants_callback','false')) IN ('true','yes','1');
  _cb_note := left(NULLIF(trim(COALESCE(_x->>'callback_time',_x->>'preferred_callback_time','')),''),200);
  IF _cb_note IS NOT NULL THEN _cb := true; END IF;
  -- Intake answers from the agent's post-call extraction, kept as one short line on the activity.
  _facts := NULLIF(concat_ws(' · ',
    'Time in business: '||NULLIF(trim(_x->>'time_in_business'),''),
    'Monthly revenue: '||NULLIF(trim(_x->>'monthly_revenue'),''),
    'Fits: '||NULLIF(trim(_x->>'qualified_products'),''),
    'Notes: '||NULLIF(trim(_x->>'business_evaluation'),'')),'');
  _start := CASE WHEN (_call->>'start_timestamp') ~ '^\d+$' THEN to_timestamp((_call->>'start_timestamp')::bigint/1000.0) END;
  _end := CASE WHEN (_call->>'end_timestamp') ~ '^\d+$' THEN to_timestamp((_call->>'end_timestamp')::bigint/1000.0) END;

  -- Find the lead: phone first, then email.
  IF _digits IS NOT NULL THEN
    SELECT * INTO _lead FROM crm_leads WHERE phone IS NOT NULL AND right(regexp_replace(phone,'\D','','g'),10)=_digits ORDER BY created_at LIMIT 1;
  END IF;
  IF _lead.id IS NULL AND _email IS NOT NULL THEN
    SELECT * INTO _lead FROM crm_leads WHERE lower(email)=_email LIMIT 1;
  END IF;
  -- Real callers become leads. Hang-ups with nothing said are logged without a lead.
  IF _lead.id IS NULL AND _digits IS NOT NULL AND (_summary IS NOT NULL OR _name IS NOT NULL OR _biz IS NOT NULL OR _email IS NOT NULL OR COALESCE((_call->>'duration_ms')::numeric,0) >= 20000) THEN
    INSERT INTO crm_leads(firm, contact_name, phone, email, source, lead_type, stage, warm_reason, next_follow_up)
    VALUES (_biz, _name, _digits, _email, 'ai_phone', 'borrower', 'Interested', 'Called the business line', current_date)
    RETURNING * INTO _lead;
    _new := true;
  ELSIF _lead.id IS NOT NULL THEN
    UPDATE crm_leads SET
      firm = COALESCE(firm, _biz), contact_name = COALESCE(contact_name, _name),
      email = CASE WHEN email IS NULL AND _email IS NOT NULL AND NOT EXISTS(SELECT 1 FROM crm_leads o WHERE lower(o.email)=_email) THEN _email ELSE email END,
      phone = COALESCE(phone, _digits),
      warm_reason = COALESCE(warm_reason, 'Called the business line'),
      stage = CASE WHEN COALESCE(lead_type,'borrower')='borrower' AND stage IN ('New','Contacted') THEN 'Interested' ELSE stage END,
      next_follow_up = CASE WHEN do_not_contact THEN next_follow_up WHEN _cb THEN current_date ELSE COALESCE(LEAST(next_follow_up, current_date+1), current_date+1) END,
      updated_at = now()
    WHERE id=_lead.id RETURNING * INTO _lead;
  END IF;

  SELECT * INTO _call_row FROM crm_calls WHERE provider='retell' AND provider_call_id=_cid;
  _first_summary := _summary IS NOT NULL AND _call_row.summary IS NULL;
  INSERT INTO crm_calls(provider, provider_call_id, lead_id, direction, caller_phone, started_at, ended_at, duration_s, status, summary, sentiment, successful, callback_requested, callback_note)
  VALUES ('retell', _cid, _lead.id, left(_dir,20), _digits, _start, _end,
    CASE WHEN (_call->>'duration_ms') ~ '^\d+$' THEN ((_call->>'duration_ms')::bigint/1000)::int END,
    left(_call->>'call_status',40), _summary, left(_a->>'user_sentiment',40),
    CASE WHEN _a ? 'call_successful' THEN (_a->>'call_successful')::boolean END, _cb, _cb_note)
  ON CONFLICT (provider, provider_call_id) DO UPDATE SET
    lead_id = COALESCE(crm_calls.lead_id, EXCLUDED.lead_id),
    started_at = COALESCE(EXCLUDED.started_at, crm_calls.started_at), ended_at = COALESCE(EXCLUDED.ended_at, crm_calls.ended_at),
    duration_s = COALESCE(EXCLUDED.duration_s, crm_calls.duration_s), status = COALESCE(EXCLUDED.status, crm_calls.status),
    summary = COALESCE(EXCLUDED.summary, crm_calls.summary), sentiment = COALESCE(EXCLUDED.sentiment, crm_calls.sentiment),
    successful = COALESCE(EXCLUDED.successful, crm_calls.successful),
    callback_requested = crm_calls.callback_requested OR EXCLUDED.callback_requested,
    callback_note = COALESCE(EXCLUDED.callback_note, crm_calls.callback_note), updated_at = now()
  RETURNING * INTO _call_row;

  -- One activity per call, written when the summary arrives (the call_analyzed event).
  IF _lead.id IS NOT NULL AND _first_summary THEN
    INSERT INTO crm_activities(lead_id, type, body) VALUES (_lead.id, 'call', left(
      'AI phone call' || COALESCE(' ('||_call_row.duration_s||'s)','') || '. ' ||
      _summary ||
      COALESCE(' '||left(_facts,1500),'') ||
      CASE WHEN _cb THEN ' Callback requested' || COALESCE(': '||_cb_note,'') || '.' ELSE '' END, 5000));
  END IF;
  RETURN jsonb_build_object('lead_id', _lead.id, 'new_lead', _new, 'call_id', _call_row.id);
END $$;
REVOKE ALL ON FUNCTION public.crm_record_ai_call(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crm_record_ai_call(jsonb) TO service_role;

-- The two in-call tools also land in the CRM: a lead per caller, plus a follow-up for callbacks.
CREATE OR REPLACE FUNCTION public.crm_ai_tool_touch(_phone text, _kind text, _detail text, _name text DEFAULT NULL, _business text DEFAULT NULL, _email text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _digits text := right(regexp_replace(COALESCE(_phone,''),'\D','','g'),10); _e text := lower(NULLIF(trim(COALESCE(_email,'')),'')); _id uuid;
BEGIN
  IF length(_digits) < 10 THEN RETURN NULL; END IF;
  IF _e IS NOT NULL AND _e !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN _e := NULL; END IF;
  SELECT id INTO _id FROM crm_leads WHERE phone IS NOT NULL AND right(regexp_replace(phone,'\D','','g'),10)=_digits ORDER BY created_at LIMIT 1;
  IF _id IS NULL AND _e IS NOT NULL THEN SELECT id INTO _id FROM crm_leads WHERE lower(email)=_e LIMIT 1; END IF;
  IF _id IS NULL THEN
    INSERT INTO crm_leads(firm, contact_name, phone, email, source, lead_type, stage, warm_reason, next_follow_up)
    VALUES (left(_business,200), left(_name,120), _digits, _e, 'ai_phone', 'borrower', 'Interested', 'Called the business line', current_date)
    RETURNING id INTO _id;
  ELSE
    UPDATE crm_leads SET firm=COALESCE(firm,left(_business,200)), contact_name=COALESCE(contact_name,left(_name,120)),
      email = CASE WHEN email IS NULL AND _e IS NOT NULL AND NOT EXISTS(SELECT 1 FROM crm_leads o WHERE lower(o.email)=_e) THEN _e ELSE email END,
      stage = CASE WHEN COALESCE(lead_type,'borrower')='borrower' AND stage IN ('New','Contacted') THEN 'Interested' ELSE stage END,
      next_follow_up = CASE WHEN do_not_contact THEN next_follow_up ELSE current_date END, updated_at=now()
    WHERE id=_id;
  END IF;
  INSERT INTO crm_activities(lead_id, type, body) VALUES (_id, 'call', left(
    CASE _kind WHEN 'callback' THEN 'AI phone: callback requested for ' ELSE 'AI phone: application link sent. ' END || COALESCE(_detail,''), 5000));
  RETURN _id;
END $$;
REVOKE ALL ON FUNCTION public.crm_ai_tool_touch(text,text,text,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crm_ai_tool_touch(text,text,text,text,text,text) TO service_role;

-- Owner view: VA progress, each VA's call log, and the AI phone line's calls. Admin only.
CREATE OR REPLACE FUNCTION public.crm_va_progress(_days integer DEFAULT 7)
RETURNS TABLE(va_id uuid, full_name text, referral_code text, active boolean, assigned integer, calls integer,
  no_answer integer, call_later integer, not_interested integer, dnc integer, qualified integer, not_qualified integer,
  apps_sent integer, files_in integer, files_ready integer, funded integer, pay_owed numeric, last_call_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE _since timestamptz := CASE WHEN _days <= 1 THEN date_trunc('day', now() AT TIME ZONE 'America/New_York') AT TIME ZONE 'America/New_York' ELSE now() - make_interval(days => LEAST(_days,365)) END;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  RETURN QUERY
  SELECT a.user_id, a.full_name, a.referral_code, a.active,
    (SELECT count(*)::int FROM crm_leads l WHERE l.assigned_to=a.user_id AND NOT l.do_not_contact AND l.stage NOT IN ('Funded','Declined','Rejected','Lost')),
    count(c.id)::int,
    count(c.id) FILTER (WHERE c.outcome='no_answer')::int,
    count(c.id) FILTER (WHERE c.outcome='call_later')::int,
    count(c.id) FILTER (WHERE c.outcome='not_interested')::int,
    count(c.id) FILTER (WHERE c.outcome='dnc')::int,
    count(c.id) FILTER (WHERE c.outcome='qualified')::int,
    count(c.id) FILTER (WHERE c.outcome='not_qualified')::int,
    (SELECT count(*)::int FROM crm_leads l WHERE l.assigned_to=a.user_id AND l.app_sent_at >= _since),
    (SELECT count(*)::int FROM crm_leads l WHERE l.assigned_to=a.user_id AND l.docs_in_at >= _since),
    (SELECT count(*)::int FROM crm_leads l WHERE l.assigned_to=a.user_id AND l.file_ready_at >= _since),
    (SELECT count(*)::int FROM crm_leads l WHERE l.assigned_to=a.user_id AND l.stage='Funded' AND l.terminal_at >= _since),
    (SELECT COALESCE(sum(p.amount),0) FROM va_payouts p WHERE p.va_id=a.user_id AND p.status='pending'),
    (SELECT max(c2.created_at) FROM va_call_log c2 WHERE c2.va_id=a.user_id)
  FROM agents a
  LEFT JOIN va_call_log c ON c.va_id=a.user_id AND c.created_at >= _since
  WHERE a.program_type='va'
  GROUP BY a.user_id, a.full_name, a.referral_code, a.active
  ORDER BY a.active DESC, count(c.id) DESC, a.full_name;
END $$;

CREATE OR REPLACE FUNCTION public.crm_va_call_log(_va_id uuid, _limit integer DEFAULT 50)
RETURNS TABLE(id uuid, created_at timestamptz, outcome text, lead_id uuid, business_name text, owner_name text, status text, note text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  RETURN QUERY
  SELECT c.id, c.created_at, c.outcome, l.id, l.firm, l.contact_name, public.va_status_label(l), c.note
  FROM va_call_log c JOIN crm_leads l ON l.id=c.lead_id
  WHERE c.va_id=_va_id ORDER BY c.created_at DESC LIMIT LEAST(GREATEST(_limit,1),200);
END $$;

CREATE OR REPLACE FUNCTION public.crm_ai_call_list(_limit integer DEFAULT 30)
RETURNS TABLE(id uuid, created_at timestamptz, lead_id uuid, business_name text, owner_name text, caller_phone text,
  duration_s integer, summary text, sentiment text, callback_requested boolean, callback_note text, new_lead boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  RETURN QUERY
  SELECT c.id, COALESCE(c.started_at,c.created_at), c.lead_id, l.firm, l.contact_name, c.caller_phone, c.duration_s, c.summary, c.sentiment,
    c.callback_requested, c.callback_note, (l.source='ai_phone' AND l.created_at >= c.created_at - interval '5 minutes')
  FROM crm_calls c LEFT JOIN crm_leads l ON l.id=c.lead_id
  ORDER BY COALESCE(c.started_at,c.created_at) DESC LIMIT LEAST(GREATEST(_limit,1),200);
END $$;

REVOKE ALL ON FUNCTION public.crm_va_progress(integer), public.crm_va_call_log(uuid,integer), public.crm_ai_call_list(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_va_progress(integer), public.crm_va_call_log(uuid,integer), public.crm_ai_call_list(integer) TO authenticated;

ALTER TABLE public.outreach_visits ADD COLUMN IF NOT EXISTS crm_lead_id uuid, ADD COLUMN IF NOT EXISTS ip_hash text;
CREATE INDEX IF NOT EXISTS outreach_visits_lead_time ON public.outreach_visits (crm_lead_id, visited_at DESC);
CREATE INDEX IF NOT EXISTS outreach_visits_ip_time ON public.outreach_visits (ip_hash, visited_at DESC);

DROP POLICY IF EXISTS "outreach visits insert" ON public.outreach_visits;
REVOKE INSERT ON public.outreach_visits FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.crm_feed_from_outreach()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.crm_lead_id IS NULL THEN RETURN NEW; END IF;
  INSERT INTO public.crm_activities (lead_id, type, body) VALUES (NEW.crm_lead_id, 'note', 'Opened the /awarded outreach page');
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.log_outreach_visit(_lead text, _firm text, _agency text)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _ip text; _hash text; _id uuid; _l text;
BEGIN
  _l := left(regexp_replace(COALESCE(_lead,''), '[^A-Za-z0-9_-]', '', 'g'), 100);
  BEGIN
    _ip := split_part(COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', ''), ',', 1);
  EXCEPTION WHEN others THEN _ip := '';
  END;
  _hash := md5('ov:' || COALESCE(NULLIF(trim(_ip),''), 'unknown'));
  IF (SELECT count(*) FROM public.outreach_visits WHERE ip_hash = _hash AND visited_at > now() - interval '1 hour') >= 30 THEN
    RETURN 'rate_limited';
  END IF;
  IF _l <> '' THEN
    SELECT id INTO _id FROM public.crm_leads WHERE id::text = _l OR lead_ref = _l ORDER BY created_at LIMIT 1;
  END IF;
  IF _id IS NOT NULL AND EXISTS (SELECT 1 FROM public.outreach_visits WHERE crm_lead_id = _id AND visited_at > now() - interval '10 minutes') THEN
    RETURN 'duplicate';
  END IF;
  INSERT INTO public.outreach_visits (lead, firm, agency, crm_lead_id, ip_hash)
  VALUES (NULLIF(_l,''), NULLIF(left(trim(COALESCE(_firm,'')),120),''), NULLIF(left(trim(COALESCE(_agency,'')),120),''), _id, _hash);
  RETURN CASE WHEN _id IS NULL THEN 'anonymous' ELSE 'logged' END;
END; $function$;

REVOKE EXECUTE ON FUNCTION public.log_outreach_visit(text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.log_outreach_visit(text, text, text) TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.crm_feed_from_outreach() FROM anon, authenticated, public;
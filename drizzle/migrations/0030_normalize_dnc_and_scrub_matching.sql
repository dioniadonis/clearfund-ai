CREATE OR REPLACE FUNCTION public.crm_sync_dnc_everywhere()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.do_not_contact AND OLD.do_not_contact IS DISTINCT FROM true THEN
    UPDATE public.leads SET opted_out=true,opted_out_at=COALESCE(opted_out_at,now()),consent_call=false,consent_email=false,consent_sms=false
    WHERE (NEW.email IS NOT NULL AND lower(email)=lower(NEW.email)) OR (NEW.phone IS NOT NULL AND right(regexp_replace(phone,'\D','','g'),10)=right(regexp_replace(NEW.phone,'\D','','g'),10));
    INSERT INTO public.va_dnc(phone,email,reason,added_by) VALUES(NULLIF(NEW.phone,''),NULLIF(lower(NEW.email),''),COALESCE(NEW.dnc_reason,'do_not_contact'),NULL) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.va_scrub_and_assign(_lead_ids uuid[], _va_id uuid, _federal_ids uuid[], _litigator_ids uuid[])
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _count integer;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.agents WHERE user_id=_va_id AND program_type='va' AND active) THEN RAISE EXCEPTION 'Active VA required'; END IF;
  UPDATE public.crm_leads l SET federal_dnc_flag=(l.id=ANY(_federal_ids)),litigator_flag=(l.id=ANY(_litigator_ids)),scrubbed_at=now(),
    scrub_result=CASE WHEN l.id=ANY(_federal_ids) OR l.id=ANY(_litigator_ids) OR l.do_not_contact OR EXISTS(SELECT 1 FROM public.va_dnc d WHERE (d.phone IS NOT NULL AND l.phone IS NOT NULL AND right(regexp_replace(d.phone,'\D','','g'),10)=right(regexp_replace(l.phone,'\D','','g'),10)) OR (d.email IS NOT NULL AND l.email IS NOT NULL AND lower(d.email)=lower(l.email))) THEN 'blocked' ELSE 'clear' END
  WHERE l.id=ANY(_lead_ids);
  UPDATE public.crm_leads l SET assigned_to=_va_id,va_code=(SELECT referral_code FROM public.agents WHERE user_id=_va_id),source='va_call'
  WHERE l.id=ANY(_lead_ids) AND l.scrub_result='clear' AND l.scrubbed_at>now()-interval '30 days' AND NOT l.federal_dnc_flag AND NOT l.litigator_flag AND NOT l.do_not_contact;
  GET DIAGNOSTICS _count=ROW_COUNT;
  INSERT INTO public.crm_activities(lead_id,user_id,type,body) SELECT id,auth.uid(),'note','VA batch scrub completed; only clear leads assigned' FROM public.crm_leads WHERE id=ANY(_lead_ids);
  RETURN _count;
END $$;

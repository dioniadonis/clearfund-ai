CREATE OR REPLACE FUNCTION public.crm_sync_dnc_everywhere()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.do_not_contact AND OLD.do_not_contact IS DISTINCT FROM true THEN
    UPDATE public.leads SET opted_out=true,opted_out_at=COALESCE(opted_out_at,now()),consent_call=false,consent_email=false,consent_sms=false
    WHERE (NEW.email IS NOT NULL AND lower(email)=lower(NEW.email)) OR (NEW.phone IS NOT NULL AND right(regexp_replace(phone,'\D','','g'),10)=right(regexp_replace(NEW.phone,'\D','','g'),10));
    INSERT INTO public.va_dnc(phone,email,reason,added_by) VALUES(NULLIF(NEW.phone,''),NULLIF(lower(NEW.email),''),COALESCE(NEW.dnc_reason,'do_not_contact'),NEW.dnc_at::text::uuid) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  UPDATE public.leads SET opted_out=true,opted_out_at=COALESCE(opted_out_at,now()),consent_call=false,consent_email=false,consent_sms=false
  WHERE (NEW.email IS NOT NULL AND lower(email)=lower(NEW.email)) OR (NEW.phone IS NOT NULL AND right(regexp_replace(phone,'\D','','g'),10)=right(regexp_replace(NEW.phone,'\D','','g'),10));
  INSERT INTO public.va_dnc(phone,email,reason,added_by) VALUES(NULLIF(NEW.phone,''),NULLIF(lower(NEW.email),''),COALESCE(NEW.dnc_reason,'do_not_contact'),NULL) ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER crm_sync_dnc_everywhere_trigger AFTER UPDATE OF do_not_contact ON public.crm_leads FOR EACH ROW EXECUTE FUNCTION public.crm_sync_dnc_everywhere();

CREATE OR REPLACE FUNCTION public.va_list_leads()
RETURNS TABLE(id uuid, business_name text, owner_name text, status text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT l.id,l.firm,l.contact_name,l.stage,l.created_at FROM public.crm_leads l
  WHERE l.assigned_to=auth.uid() AND l.va_code IS NOT NULL AND NOT l.do_not_contact
    AND EXISTS(SELECT 1 FROM public.agents a WHERE a.user_id=auth.uid() AND a.program_type='va' AND a.active)
  ORDER BY l.created_at DESC LIMIT 500
$$;

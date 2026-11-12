ALTER TABLE public.agent_settings ADD COLUMN assigned_payout_percent numeric NOT NULL DEFAULT 30;
ALTER TABLE public.agent_settings ADD COLUMN referral_payout_percent numeric NOT NULL DEFAULT 50;
ALTER TABLE public.agents ADD COLUMN assigned_payout_percent numeric;
ALTER TABLE public.agents ADD COLUMN referral_payout_percent numeric;
ALTER TABLE public.agent_payouts ADD COLUMN payout_basis text NOT NULL DEFAULT 'assigned';

-- Preserve existing customized assigned-lead settings; own-referral payouts use the new default unless overridden.
UPDATE public.agent_settings SET assigned_payout_percent = payout_percent;
UPDATE public.agents SET assigned_payout_percent = payout_percent;
UPDATE public.agent_payouts p SET payout_basis = 'own_referral'
FROM public.crm_leads l
WHERE l.id = p.lead_id AND l.agent_id IS NOT NULL AND l.agent_id = l.assigned_to AND l.assigned_to = p.agent_id;

ALTER TABLE public.agent_settings ADD CONSTRAINT agent_settings_assigned_percent CHECK (assigned_payout_percent BETWEEN 0 AND 100);
ALTER TABLE public.agent_settings ADD CONSTRAINT agent_settings_referral_percent CHECK (referral_payout_percent BETWEEN 0 AND 100);
ALTER TABLE public.agents ADD CONSTRAINT agents_assigned_percent CHECK (assigned_payout_percent IS NULL OR assigned_payout_percent BETWEEN 0 AND 100);
ALTER TABLE public.agents ADD CONSTRAINT agents_referral_percent CHECK (referral_payout_percent IS NULL OR referral_payout_percent BETWEEN 0 AND 100);
ALTER TABLE public.agent_payouts ADD CONSTRAINT agent_payouts_basis CHECK (payout_basis IN ('assigned','own_referral'));

COMMENT ON COLUMN public.agent_settings.payout_percent IS 'DEPRECATED: replaced by assigned_payout_percent and referral_payout_percent';
COMMENT ON COLUMN public.agents.payout_percent IS 'DEPRECATED: replaced by assigned_payout_percent and referral_payout_percent';

CREATE OR REPLACE FUNCTION public.crm_admin_save_agent_settings(_percent numeric, _auto_assign boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF _percent IS NULL OR _percent < 0 OR _percent > 100 THEN RAISE EXCEPTION 'Percent must be between 0 and 100'; END IF;
  INSERT INTO public.agent_settings(singleton,payout_percent,assigned_payout_percent,auto_assign,updated_by,updated_at)
  VALUES(true,_percent,_percent,COALESCE(_auto_assign,false),auth.uid(),now())
  ON CONFLICT(singleton) DO UPDATE SET payout_percent=_percent,assigned_payout_percent=_percent,auto_assign=COALESCE(_auto_assign,false),updated_by=auth.uid(),updated_at=now();
  IF COALESCE(_auto_assign,false) THEN
    FOR _id IN SELECT id FROM public.crm_leads WHERE warm_reason IS NOT NULL AND assigned_to IS NULL AND lead_type IS DISTINCT FROM 'partner' AND lead_type IS DISTINCT FROM 'recruit' ORDER BY created_at LIMIT 500 LOOP
      PERFORM public.crm_auto_assign_lead(_id);
    END LOOP;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.crm_admin_save_agent_settings_v2(_assigned_percent numeric, _referral_percent numeric, _auto_assign boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF _assigned_percent IS NULL OR _assigned_percent < 0 OR _assigned_percent > 100 OR _referral_percent IS NULL OR _referral_percent < 0 OR _referral_percent > 100 THEN RAISE EXCEPTION 'Percent must be between 0 and 100'; END IF;
  INSERT INTO public.agent_settings(singleton,payout_percent,assigned_payout_percent,referral_payout_percent,auto_assign,updated_by,updated_at)
  VALUES(true,_assigned_percent,_assigned_percent,_referral_percent,COALESCE(_auto_assign,false),auth.uid(),now())
  ON CONFLICT(singleton) DO UPDATE SET payout_percent=_assigned_percent,assigned_payout_percent=_assigned_percent,referral_payout_percent=_referral_percent,auto_assign=COALESCE(_auto_assign,false),updated_by=auth.uid(),updated_at=now();
  IF COALESCE(_auto_assign,false) THEN
    FOR _id IN SELECT id FROM public.crm_leads WHERE warm_reason IS NOT NULL AND assigned_to IS NULL AND lead_type IS DISTINCT FROM 'partner' AND lead_type IS DISTINCT FROM 'recruit' ORDER BY created_at LIMIT 500 LOOP
      PERFORM public.crm_auto_assign_lead(_id);
    END LOOP;
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.crm_admin_save_agent_settings_v2(numeric,numeric,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_admin_save_agent_settings_v2(numeric,numeric,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.crm_sync_agent_payout()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _percent numeric; _basis text;
BEGIN
  IF NEW.stage='Funded' AND NEW.clearfund_commission IS NOT NULL AND NEW.assigned_to IS NOT NULL AND EXISTS(SELECT 1 FROM public.agents WHERE user_id=NEW.assigned_to) THEN
    _basis := CASE WHEN NEW.agent_id IS NOT NULL AND NEW.agent_id = NEW.assigned_to THEN 'own_referral' ELSE 'assigned' END;
    IF _basis = 'own_referral' THEN
      SELECT COALESCE(a.referral_payout_percent,s.referral_payout_percent,50) INTO _percent
      FROM public.agents a LEFT JOIN public.agent_settings s ON s.singleton WHERE a.user_id=NEW.assigned_to;
    ELSE
      SELECT COALESCE(a.assigned_payout_percent,s.assigned_payout_percent,30) INTO _percent
      FROM public.agents a LEFT JOIN public.agent_settings s ON s.singleton WHERE a.user_id=NEW.assigned_to;
    END IF;
    INSERT INTO public.agent_payouts(lead_id,agent_id,clearfund_commission,agent_percent,agent_amount,payout_basis)
    VALUES(NEW.id,NEW.assigned_to,NEW.clearfund_commission,_percent,round(NEW.clearfund_commission*_percent/100,2),_basis)
    ON CONFLICT(lead_id) DO UPDATE SET agent_id=EXCLUDED.agent_id,clearfund_commission=EXCLUDED.clearfund_commission,agent_percent=EXCLUDED.agent_percent,agent_amount=EXCLUDED.agent_amount,payout_basis=EXCLUDED.payout_basis,updated_at=now() WHERE agent_payouts.status='pending';
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.crm_agent_leaderboard_v2()
RETURNS TABLE(agent_id uuid,full_name text,email text,referral_code text,assigned_payout_percent numeric,referral_payout_percent numeric,funded_deals bigint,warm_leads bigint,pending_total numeric,paid_total numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.user_id,a.full_name,a.email,a.referral_code,a.assigned_payout_percent,a.referral_payout_percent,
    (SELECT count(*) FROM public.agent_payouts p WHERE p.agent_id=a.user_id),
    (SELECT count(*) FROM public.crm_leads l WHERE l.assigned_to=a.user_id AND l.warm_reason IS NOT NULL),
    COALESCE((SELECT sum(p.agent_amount) FROM public.agent_payouts p WHERE p.agent_id=a.user_id AND p.status='pending'),0),
    COALESCE((SELECT sum(p.agent_amount) FROM public.agent_payouts p WHERE p.agent_id=a.user_id AND p.status='paid'),0)
  FROM public.agents a WHERE public.has_role(auth.uid(),'admin') ORDER BY 7 DESC,a.full_name
$$;
REVOKE ALL ON FUNCTION public.crm_agent_leaderboard_v2() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_agent_leaderboard_v2() TO authenticated;

COMMENT ON FUNCTION public.crm_admin_save_agent_settings(numeric,boolean) IS 'DEPRECATED: use crm_admin_save_agent_settings_v2 for separate assigned and referral percentages';
COMMENT ON FUNCTION public.crm_agent_leaderboard() IS 'DEPRECATED: use crm_agent_leaderboard_v2 for separate assigned and referral overrides';
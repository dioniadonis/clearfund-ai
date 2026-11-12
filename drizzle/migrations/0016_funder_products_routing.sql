CREATE TABLE public.funder_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funder text NOT NULL,
  product text NOT NULL,
  product_kind text NOT NULL DEFAULT 'other' CHECK (product_kind IN ('mca','loan','loc','other')),
  min_months integer,
  min_monthly_revenue numeric,
  max_monthly_revenue numeric,
  min_annual_sales numeric,
  min_credit_score integer,
  excluded_states text[] NOT NULL DEFAULT '{}',
  needs_business_checking boolean NOT NULL DEFAULT false,
  amount_min numeric,
  amount_max numeric,
  commission_note text,
  commission_rank integer,
  active boolean NOT NULL DEFAULT true,
  apply_method text NOT NULL DEFAULT 'dac_link' CHECK (apply_method IN ('dac_link','our_form')),
  apply_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.funder_products TO authenticated;
GRANT ALL ON public.funder_products TO service_role;
ALTER TABLE public.funder_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CRM users read products" ON public.funder_products FOR SELECT TO authenticated USING (public.is_crm_user(auth.uid()));
CREATE POLICY "Admins manage products" ON public.funder_products FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER funder_products_updated_at BEFORE UPDATE ON public.funder_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.crm_leads
  ADD COLUMN qualifier jsonb,
  ADD COLUMN routed_product_id uuid REFERENCES public.funder_products(id) ON DELETE SET NULL,
  ADD COLUMN route_reasons jsonb,
  ADD COLUMN route_next text,
  ADD COLUMN routed_at timestamptz,
  ADD COLUMN route_override_by uuid,
  ADD COLUMN submitted_to_funder_by uuid,
  ADD COLUMN submitted_to_funder_at timestamptz;

CREATE OR REPLACE FUNCTION public.crm_set_route(_lead_id uuid, _product_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _p funder_products;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF _product_id IS NOT NULL THEN SELECT * INTO _p FROM funder_products WHERE id = _product_id; IF _p.id IS NULL THEN RAISE EXCEPTION 'product not found'; END IF; END IF;
  UPDATE crm_leads SET routed_product_id = _product_id, route_override_by = auth.uid(), routed_at = now() WHERE id = _lead_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'lead not found'; END IF;
  INSERT INTO crm_activities (lead_id, user_id, type, body) VALUES (_lead_id, auth.uid(), 'note',
    'Routing set by admin to ' || COALESCE(_p.funder || ' · ' || _p.product, 'none'));
END $$;

CREATE OR REPLACE FUNCTION public.crm_mark_submitted_to_funder(_lead_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _l crm_leads; _p funder_products;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO _l FROM crm_leads WHERE id = _lead_id FOR UPDATE;
  IF _l.id IS NULL THEN RAISE EXCEPTION 'lead not found'; END IF;
  IF _l.stage <> 'Applied' THEN RAISE EXCEPTION 'Lead must be in Applied'; END IF;
  IF _l.routed_product_id IS NULL THEN RAISE EXCEPTION 'Pick a funder first'; END IF;
  SELECT * INTO _p FROM funder_products WHERE id = _l.routed_product_id;
  UPDATE crm_leads SET stage = 'Submitted to funder', submitted_to_funder_by = auth.uid(), submitted_to_funder_at = now() WHERE id = _lead_id;
  INSERT INTO crm_activities (lead_id, user_id, type, body) VALUES (_lead_id, auth.uid(), 'note',
    'Approved and marked submitted to ' || _p.funder || ' · ' || _p.product);
END $$;
REVOKE ALL ON FUNCTION public.crm_set_route(uuid,uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.crm_mark_submitted_to_funder(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_set_route(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.crm_mark_submitted_to_funder(uuid) TO authenticated;

INSERT INTO public.funder_products (funder, product, product_kind, min_months, min_monthly_revenue, max_monthly_revenue, min_annual_sales, min_credit_score, excluded_states, needs_business_checking, amount_min, amount_max, apply_method, apply_url) VALUES
 ('David Allen Capital','Giggle','mca',NULL,NULL,15000,NULL,NULL,ARRAY['NY','CA','OR'],false,400,10000,'dac_link','https://www.davidallencapital.com/clearfund'),
 ('David Allen Capital','Bank Breezy Bigger Funding','mca',4,15000,NULL,NULL,500,'{}',true,NULL,NULL,'dac_link','https://www.davidallencapital.com/clearfund'),
 ('David Allen Capital','CoreRate','loan',24,15000,NULL,NULL,680,'{}',false,50000,250000,'dac_link','https://www.davidallencapital.com/clearfund'),
 ('David Allen Capital','Line of Credit','loc',24,NULL,NULL,250000,675,'{}',false,6000,100000,'dac_link','https://www.davidallencapital.com/clearfund');
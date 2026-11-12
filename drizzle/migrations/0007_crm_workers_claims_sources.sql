CREATE OR REPLACE FUNCTION public.crm_norm_domain(_t text) RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT NULLIF(regexp_replace(regexp_replace(lower(trim(COALESCE(_t,''))), '^[a-z]+://', ''), '^www\.|[/?#:].*$', '', 'g'), '')
$$;
CREATE OR REPLACE FUNCTION public.crm_norm_company(_t text) RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT NULLIF(trim(regexp_replace(regexp_replace(regexp_replace(lower(COALESCE(_t,'')), '[^a-z0-9 ]', ' ', 'g'),
    '\m(llc|inc|incorporated|corp|corporation|co|company|ltd|pllc|llp|lp)\M', ' ', 'g'), '\s+', ' ', 'g')), '')
$$;

CREATE TABLE public.crm_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  slice_key text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','claimed','done','blocked')),
  claimed_by text, claimed_at timestamptz, expires_at timestamptz,
  last_run_at timestamptz, refresh_days integer NOT NULL DEFAULT 30 CHECK (refresh_days BETWEEN 1 AND 3650),
  leads_found integer NOT NULL DEFAULT 0, new_leads integer NOT NULL DEFAULT 0,
  notes text, created_by text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.crm_sources TO authenticated;
GRANT ALL ON public.crm_sources TO service_role;
ALTER TABLE public.crm_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read sources" ON public.crm_sources FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER crm_sources_updated_at BEFORE UPDATE ON public.crm_sources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.crm_leads
  ADD COLUMN lead_type text CHECK (lead_type IN ('borrower','partner')),
  ADD COLUMN state text,
  ADD COLUMN sector text,
  ADD COLUMN website text,
  ADD COLUMN website_key text GENERATED ALWAYS AS (public.crm_norm_domain(website)) STORED,
  ADD COLUMN company_key text GENERATED ALWAYS AS (public.crm_norm_company(firm)) STORED,
  ADD COLUMN email_source text,
  ADD COLUMN need_score integer CHECK (need_score BETWEEN 0 AND 100),
  ADD COLUMN first_line text,
  ADD COLUMN found_by text,
  ADD COLUMN found_at timestamptz,
  ADD COLUMN source_id uuid REFERENCES public.crm_sources(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX crm_leads_lead_ref_uq ON public.crm_leads (lead_ref) WHERE lead_ref IS NOT NULL;
CREATE UNIQUE INDEX crm_leads_email_uq ON public.crm_leads (lower(email)) WHERE email IS NOT NULL AND email <> '';
CREATE UNIQUE INDEX crm_leads_website_uq ON public.crm_leads (website_key) WHERE website_key IS NOT NULL;
CREATE UNIQUE INDEX crm_leads_company_state_uq ON public.crm_leads (company_key, upper(state)) WHERE company_key IS NOT NULL AND state IS NOT NULL;

CREATE TABLE public.crm_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  website_key text,
  job_type text NOT NULL CHECK (job_type IN ('find_email','score','first_line','outreach')),
  status text NOT NULL DEFAULT 'claimed' CHECK (status IN ('claimed','done','failed')),
  claimed_by text NOT NULL, claimed_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 1, result jsonb, error text, finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX crm_jobs_lead_type_uq ON public.crm_jobs (lead_id, job_type);
CREATE UNIQUE INDEX crm_jobs_domain_uq ON public.crm_jobs (website_key) WHERE job_type = 'find_email';
CREATE INDEX crm_jobs_status_idx ON public.crm_jobs (job_type, status, expires_at);
GRANT SELECT ON public.crm_jobs TO authenticated;
GRANT ALL ON public.crm_jobs TO service_role;
ALTER TABLE public.crm_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read jobs" ON public.crm_jobs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.crm_worker_calls (
  id bigserial PRIMARY KEY, worker text NOT NULL, endpoint text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX crm_worker_calls_idx ON public.crm_worker_calls (worker, created_at DESC);
GRANT SELECT ON public.crm_worker_calls TO authenticated;
GRANT ALL ON public.crm_worker_calls TO service_role;
GRANT USAGE ON SEQUENCE public.crm_worker_calls_id_seq TO service_role;
ALTER TABLE public.crm_worker_calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read worker calls" ON public.crm_worker_calls FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.crm_lead_rejects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  found_by text NOT NULL, source_id uuid REFERENCES public.crm_sources(id) ON DELETE SET NULL,
  reason text NOT NULL, existing_lead_id uuid REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  payload jsonb NOT NULL, dismissed_at timestamptz, dismissed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.crm_lead_rejects TO authenticated;
GRANT ALL ON public.crm_lead_rejects TO service_role;
ALTER TABLE public.crm_lead_rejects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read rejects" ON public.crm_lead_rejects FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Single lead-insert chokepoint: rejects duplicates on lead_ref, email, domain, company+state.
CREATE OR REPLACE FUNCTION public.crm_insert_lead(_lead jsonb, _found_by text, _source_id uuid, _mode text DEFAULT 'skip')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _ref text := NULLIF(left(trim(_lead->>'lead_ref'),100),'');
  _email text := NULLIF(lower(left(trim(_lead->>'email'),320)),'');
  _web text := NULLIF(left(trim(_lead->>'website'),300),'');
  _firm text := NULLIF(left(trim(_lead->>'firm'),200),'');
  _state text := NULLIF(upper(left(trim(_lead->>'state'),2)),'');
  _type text := NULLIF(lower(trim(_lead->>'lead_type')),'');
  _score int; _id uuid; _reason text;
BEGIN
  IF _email IS NOT NULL AND _email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN _email := NULL; END IF;
  IF _type IS NOT NULL AND _type NOT IN ('borrower','partner') THEN _type := NULL; END IF;
  BEGIN _score := (_lead->>'need_score')::int; IF _score NOT BETWEEN 0 AND 100 THEN _score := NULL; END IF;
  EXCEPTION WHEN others THEN _score := NULL; END;
  IF _ref IS NULL AND _email IS NULL AND _web IS NULL AND _firm IS NULL THEN
    RETURN jsonb_build_object('status','invalid','reason','empty');
  END IF;
  IF _ref IS NOT NULL THEN SELECT id INTO _id FROM crm_leads WHERE lead_ref = _ref; IF _id IS NOT NULL THEN _reason := 'lead_id'; END IF; END IF;
  IF _id IS NULL AND _email IS NOT NULL THEN SELECT id INTO _id FROM crm_leads WHERE lower(email) = _email; IF _id IS NOT NULL THEN _reason := 'email'; END IF; END IF;
  IF _id IS NULL AND crm_norm_domain(_web) IS NOT NULL THEN SELECT id INTO _id FROM crm_leads WHERE website_key = crm_norm_domain(_web); IF _id IS NOT NULL THEN _reason := 'website'; END IF; END IF;
  IF _id IS NULL AND crm_norm_company(_firm) IS NOT NULL AND _state IS NOT NULL THEN
    SELECT id INTO _id FROM crm_leads WHERE company_key = crm_norm_company(_firm) AND upper(state) = _state; IF _id IS NOT NULL THEN _reason := 'company_state'; END IF;
  END IF;
  IF _id IS NOT NULL THEN
    IF _mode = 'fill' THEN
      UPDATE crm_leads SET
        contact_name = COALESCE(NULLIF(contact_name,''), NULLIF(left(trim(_lead->>'contact_name'),200),'')),
        phone = COALESCE(NULLIF(phone,''), NULLIF(left(trim(_lead->>'phone'),40),'')),
        lead_type = COALESCE(lead_type, _type), sector = COALESCE(NULLIF(sector,''), NULLIF(left(trim(_lead->>'sector'),120),'')),
        state = COALESCE(state, _state), need_score = COALESCE(need_score, _score),
        first_line = COALESCE(NULLIF(first_line,''), NULLIF(left(trim(_lead->>'first_line'),500),'')),
        email_source = COALESCE(NULLIF(email_source,''), NULLIF(left(trim(_lead->>'email_source'),120),'')),
        agency = COALESCE(NULLIF(agency,''), NULLIF(left(trim(_lead->>'agency'),200),''))
      WHERE id = _id;
    END IF;
    RETURN jsonb_build_object('status','duplicate','reason',_reason,'id',_id);
  END IF;
  BEGIN
    INSERT INTO crm_leads (lead_ref, lead_type, firm, contact_name, email, phone, state, sector, website, agency, email_source, need_score,
      first_line, notes, stage, source, found_by, found_at, source_id)
    VALUES (_ref, _type, _firm, NULLIF(left(trim(_lead->>'contact_name'),200),''), _email, NULLIF(left(trim(_lead->>'phone'),40),''),
      _state, NULLIF(left(trim(_lead->>'sector'),120),''), _web, NULLIF(left(trim(_lead->>'agency'),200),''),
      NULLIF(left(trim(_lead->>'email_source'),120),''), _score, NULLIF(left(trim(_lead->>'first_line'),500),''),
      NULLIF(left(trim(_lead->>'notes'),2000),''), 'New', CASE WHEN _found_by = 'import' THEN 'import' ELSE 'worker' END,
      left(_found_by,80), now(), _source_id)
    RETURNING id INTO _id;
  EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('status','duplicate','reason','race');
  END;
  RETURN jsonb_build_object('status','inserted','id',_id);
END; $$;

CREATE OR REPLACE FUNCTION public.crm_import_leads(_rows jsonb, _mode text DEFAULT 'skip')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _r jsonb; _out jsonb := '[]'::jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF jsonb_array_length(_rows) > 1000 THEN RAISE EXCEPTION 'Max 1000 rows per batch'; END IF;
  FOR _r IN SELECT * FROM jsonb_array_elements(_rows) LOOP
    _out := _out || jsonb_build_array(public.crm_insert_lead(_r, 'import', NULL, CASE WHEN _mode = 'fill' THEN 'fill' ELSE 'skip' END));
  END LOOP;
  RETURN _out;
END; $$;

CREATE OR REPLACE FUNCTION public.crm_job_ttl(_type text) RETURNS interval LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN _type = 'outreach' THEN interval '2 hours' ELSE interval '30 minutes' END
$$;

CREATE OR REPLACE FUNCTION public.crm_lead_eligible(_l public.crm_leads, _type text) RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT NOT _l.do_not_contact AND CASE _type
    WHEN 'find_email' THEN COALESCE(_l.email,'') = '' AND _l.website_key IS NOT NULL
    WHEN 'score' THEN _l.need_score IS NULL
    WHEN 'first_line' THEN COALESCE(_l.email,'') <> '' AND COALESCE(_l.first_line,'') = ''
    WHEN 'outreach' THEN COALESCE(_l.email,'') <> '' AND COALESCE(_l.first_line,'') <> '' AND _l.stage = 'New'
    ELSE false END
$$;

CREATE OR REPLACE FUNCTION public.crm_claim_jobs(_worker text, _type text, _n integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _ids uuid[] := '{}'; _more uuid[]; _left int;
BEGIN
  IF _type NOT IN ('find_email','score','first_line','outreach') THEN RAISE EXCEPTION 'bad job_type'; END IF;
  _n := LEAST(GREATEST(COALESCE(_n,1),1),50);
  -- Reclaim expired or failed jobs (max 3 attempts) whose lead is still eligible.
  WITH c AS (
    SELECT j.id FROM crm_jobs j JOIN crm_leads l ON l.id = j.lead_id
    WHERE j.job_type = _type AND j.attempts < 3 AND crm_lead_eligible(l, _type)
      AND ((j.status = 'claimed' AND j.expires_at < now()) OR j.status = 'failed')
    ORDER BY j.claimed_at LIMIT _n FOR UPDATE OF j SKIP LOCKED)
  UPDATE crm_jobs j SET claimed_by = left(_worker,80), claimed_at = now(), expires_at = now() + crm_job_ttl(_type),
    status = 'claimed', attempts = j.attempts + 1, error = NULL
  FROM c WHERE j.id = c.id RETURNING j.id INTO STRICT _more;
  RETURN NULL;
EXCEPTION WHEN no_data_found OR too_many_rows THEN
  RETURN NULL;
END; $$;

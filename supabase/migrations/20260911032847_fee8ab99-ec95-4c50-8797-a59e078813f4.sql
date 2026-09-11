-- Roles
CREATE TYPE public.app_role AS ENUM ('admin','operator');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_operator(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','operator'))
$$;

CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Operators can view profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_operator(auth.uid()));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Leads
CREATE TYPE public.lead_stage AS ENUM ('new','qualification','nurture','application','documents','submitted','conditions','funded','declined','lost');
CREATE TYPE public.application_status AS ENUM ('not_started','in_progress','completed');
CREATE TYPE public.document_status AS ENUM ('none','requested','partial','complete');

CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  business_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  monthly_revenue numeric,
  time_in_business_months integer,
  funding_need numeric,
  funding_purpose text,
  stage public.lead_stage NOT NULL DEFAULT 'new',
  source text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  referrer text,
  landing_page text,
  notes text,
  next_action text,
  next_action_due date,
  application_status public.application_status NOT NULL DEFAULT 'not_started',
  document_status public.document_status NOT NULL DEFAULT 'none',
  consent_email boolean NOT NULL DEFAULT false,
  consent_sms boolean NOT NULL DEFAULT false,
  consent_call boolean NOT NULL DEFAULT false,
  consent_text_version text,
  consent_at timestamptz,
  opted_out boolean NOT NULL DEFAULT false,
  opted_out_at timestamptz,
  qualification_score integer,
  qualification_notes text,
  campaign_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Operators manage leads" ON public.leads FOR ALL TO authenticated
USING (public.is_operator(auth.uid())) WITH CHECK (public.is_operator(auth.uid()));
CREATE TRIGGER leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.lead_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.lead_events TO authenticated;
GRANT ALL ON public.lead_events TO service_role;
ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Operators view lead events" ON public.lead_events FOR SELECT TO authenticated USING (public.is_operator(auth.uid()));
CREATE POLICY "Operators add lead events" ON public.lead_events FOR INSERT TO authenticated WITH CHECK (public.is_operator(auth.uid()) AND created_by = auth.uid());

CREATE TABLE public.lead_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  status text NOT NULL DEFAULT 'requested',
  requested_at timestamptz NOT NULL DEFAULT now(),
  received_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_documents TO authenticated;
GRANT ALL ON public.lead_documents TO service_role;
ALTER TABLE public.lead_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Operators manage lead documents" ON public.lead_documents FOR ALL TO authenticated
USING (public.is_operator(auth.uid())) WITH CHECK (public.is_operator(auth.uid()));
CREATE TRIGGER lead_documents_updated_at BEFORE UPDATE ON public.lead_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Qualification criteria (transparent, editable)
CREATE TABLE public.qualification_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  field text NOT NULL,
  comparator text NOT NULL,
  threshold numeric NOT NULL,
  weight integer NOT NULL DEFAULT 1,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.qualification_criteria TO authenticated;
GRANT ALL ON public.qualification_criteria TO service_role;
ALTER TABLE public.qualification_criteria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Operators manage criteria" ON public.qualification_criteria FOR ALL TO authenticated
USING (public.is_operator(auth.uid())) WITH CHECK (public.is_operator(auth.uid()));
CREATE TRIGGER qualification_criteria_updated_at BEFORE UPDATE ON public.qualification_criteria FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Marketing
CREATE TABLE public.content_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  channel text,
  audience text,
  objective text,
  brief text,
  draft_copy text,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_briefs TO authenticated;
GRANT ALL ON public.content_briefs TO service_role;
ALTER TABLE public.content_briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Operators manage content briefs" ON public.content_briefs FOR ALL TO authenticated
USING (public.is_operator(auth.uid())) WITH CHECK (public.is_operator(auth.uid()));
CREATE TRIGGER content_briefs_updated_at BEFORE UPDATE ON public.content_briefs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.creative_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  asset_type text NOT NULL DEFAULT 'image',
  url text,
  status text NOT NULL DEFAULT 'draft',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creative_assets TO authenticated;
GRANT ALL ON public.creative_assets TO service_role;
ALTER TABLE public.creative_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Operators manage creative assets" ON public.creative_assets FOR ALL TO authenticated
USING (public.is_operator(auth.uid())) WITH CHECK (public.is_operator(auth.uid()));
CREATE TRIGGER creative_assets_updated_at BEFORE UPDATE ON public.creative_assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.calendar_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  channel text,
  scheduled_for date NOT NULL,
  status text NOT NULL DEFAULT 'planned',
  brief_id uuid REFERENCES public.content_briefs(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_items TO authenticated;
GRANT ALL ON public.calendar_items TO service_role;
ALTER TABLE public.calendar_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Operators manage calendar" ON public.calendar_items FOR ALL TO authenticated
USING (public.is_operator(auth.uid())) WITH CHECK (public.is_operator(auth.uid()));
CREATE TRIGGER calendar_items_updated_at BEFORE UPDATE ON public.calendar_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  channel text NOT NULL DEFAULT 'meta',
  offer text,
  budget numeric,
  status text NOT NULL DEFAULT 'draft',
  utm_campaign text,
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Operators manage campaigns" ON public.campaigns FOR ALL TO authenticated
USING (public.is_operator(auth.uid())) WITH CHECK (public.is_operator(auth.uid()));
CREATE TRIGGER campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.campaign_spend (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  spend_date date NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  entered_manually boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_spend TO authenticated;
GRANT ALL ON public.campaign_spend TO service_role;
ALTER TABLE public.campaign_spend ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Operators manage campaign spend" ON public.campaign_spend FOR ALL TO authenticated
USING (public.is_operator(auth.uid())) WITH CHECK (public.is_operator(auth.uid()));
CREATE TRIGGER campaign_spend_updated_at BEFORE UPDATE ON public.campaign_spend FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Voice
CREATE TABLE public.call_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  script_type text NOT NULL DEFAULT 'qualification',
  body text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_scripts TO authenticated;
GRANT ALL ON public.call_scripts TO service_role;
ALTER TABLE public.call_scripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Operators manage call scripts" ON public.call_scripts FOR ALL TO authenticated
USING (public.is_operator(auth.uid())) WITH CHECK (public.is_operator(auth.uid()));
CREATE TRIGGER call_scripts_updated_at BEFORE UPDATE ON public.call_scripts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.call_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  script_id uuid REFERENCES public.call_scripts(id) ON DELETE SET NULL,
  call_type text NOT NULL DEFAULT 'qualification',
  status text NOT NULL DEFAULT 'queued',
  outcome text,
  handoff_state text NOT NULL DEFAULT 'none',
  transcript text,
  summary text,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  scheduled_for timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_tasks TO authenticated;
GRANT ALL ON public.call_tasks TO service_role;
ALTER TABLE public.call_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Operators manage call tasks" ON public.call_tasks FOR ALL TO authenticated
USING (public.is_operator(auth.uid())) WITH CHECK (public.is_operator(auth.uid()));
CREATE TRIGGER call_tasks_updated_at BEFORE UPDATE ON public.call_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.enforce_call_consent()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE ok boolean;
BEGIN
  SELECT (consent_call AND NOT opted_out) INTO ok FROM public.leads WHERE id = NEW.lead_id;
  IF NOT COALESCE(ok, false) THEN
    RAISE EXCEPTION 'Lead has not consented to phone contact or has opted out';
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER call_tasks_consent BEFORE INSERT OR UPDATE OF lead_id ON public.call_tasks
FOR EACH ROW EXECUTE FUNCTION public.enforce_call_consent();

-- Integrations
CREATE TABLE public.integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key text NOT NULL UNIQUE,
  display_name text NOT NULL,
  category text NOT NULL,
  status text NOT NULL DEFAULT 'not_connected',
  required_setup text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.integrations TO authenticated;
GRANT ALL ON public.integrations TO service_role;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Operators manage integrations" ON public.integrations FOR ALL TO authenticated
USING (public.is_operator(auth.uid())) WITH CHECK (public.is_operator(auth.uid()));
CREATE TRIGGER integrations_updated_at BEFORE UPDATE ON public.integrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.integrations (provider_key, display_name, category, required_setup) VALUES
('meta_ads','Meta Ads','advertising','Meta business account, app credentials and ad account ID stored as server-side secrets'),
('google_ads','Google Ads','advertising','Google Ads developer token, OAuth client and customer ID stored as server-side secrets'),
('voice','Voice calling provider','voice','Provider account, outbound number and API key stored as server-side secrets'),
('email_sms','Email / SMS delivery','messaging','Verified sending domain, messaging provider account and API key stored as server-side secrets'),
('secure_docs','Secure document collection','documents','Storage bucket or document provider account with signed upload links');

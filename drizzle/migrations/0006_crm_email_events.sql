ALTER TABLE public.crm_leads DROP CONSTRAINT crm_leads_stage_check;
ALTER TABLE public.crm_leads ADD CONSTRAINT crm_leads_stage_check CHECK (stage = ANY (ARRAY['New','Contacted','Replied','Interested','Applied','Submitted to funder','Funded','Lost']));
ALTER TABLE public.crm_leads
  ADD COLUMN IF NOT EXISTS do_not_contact boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dnc_reason text,
  ADD COLUMN IF NOT EXISTS dnc_at timestamptz;

CREATE TABLE public.email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  provider text NOT NULL DEFAULT 'generic' CHECK (char_length(provider) <= 40),
  event text NOT NULL CHECK (event IN ('sent','delivered','opened','clicked','replied','bounced','unsubscribed')),
  campaign text CHECK (char_length(campaign) <= 200),
  step text CHECK (char_length(step) <= 60),
  recipient_email text CHECK (char_length(recipient_email) <= 320),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  snippet text CHECK (char_length(snippet) <= 500),
  provider_event_id text CHECK (char_length(provider_event_id) <= 200),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX email_events_provider_event_uq ON public.email_events (provider, provider_event_id);
CREATE INDEX email_events_lead_idx ON public.email_events (lead_id, occurred_at DESC);
CREATE INDEX email_events_time_idx ON public.email_events (occurred_at DESC);

GRANT SELECT ON public.email_events TO authenticated;
GRANT ALL ON public.email_events TO service_role;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email events select" ON public.email_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR (lead_id IS NOT NULL AND public.is_crm_user(auth.uid()) AND EXISTS (SELECT 1 FROM public.crm_leads l WHERE l.id = email_events.lead_id)));

CREATE OR REPLACE FUNCTION public.crm_apply_email_event()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.lead_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.event = 'replied' THEN
    UPDATE public.crm_leads SET stage = 'Replied' WHERE id = NEW.lead_id AND stage IN ('New','Contacted');
  ELSIF NEW.event IN ('bounced','unsubscribed') THEN
    UPDATE public.crm_leads SET do_not_contact = true, dnc_reason = NEW.event, dnc_at = now()
     WHERE id = NEW.lead_id AND NOT do_not_contact;
    IF FOUND THEN
      INSERT INTO public.crm_activities (lead_id, type, body) VALUES (NEW.lead_id, 'note', 'Marked do-not-contact: email ' || NEW.event);
    END IF;
  END IF;
  RETURN NEW;
END; $function$;
CREATE TRIGGER email_events_apply AFTER INSERT ON public.email_events FOR EACH ROW EXECUTE FUNCTION public.crm_apply_email_event();

CREATE OR REPLACE FUNCTION public.ingest_email_event(_provider text, _event text, _lead_id text, _lead_ref text, _email text,
  _campaign text, _step text, _occurred_at timestamptz, _message_id text, _snippet text)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _id uuid; _e text := lower(left(trim(COALESCE(_email,'')),320)); _n int;
BEGIN
  IF NULLIF(_lead_id,'') IS NOT NULL THEN SELECT id INTO _id FROM crm_leads WHERE id::text = _lead_id; END IF;
  IF _id IS NULL AND NULLIF(_lead_ref,'') IS NOT NULL THEN SELECT id INTO _id FROM crm_leads WHERE lead_ref = left(_lead_ref,100) ORDER BY created_at LIMIT 1; END IF;
  IF _id IS NULL AND _e <> '' THEN SELECT id INTO _id FROM crm_leads WHERE lower(email) = _e ORDER BY created_at LIMIT 1; END IF;
  INSERT INTO email_events (lead_id, provider, event, campaign, step, recipient_email, occurred_at, snippet, provider_event_id)
  VALUES (_id, COALESCE(NULLIF(left(trim(_provider),40),''),'generic'), _event, NULLIF(left(trim(COALESCE(_campaign,'')),200),''),
          NULLIF(left(trim(COALESCE(_step,'')),60),''), NULLIF(_e,''), COALESCE(_occurred_at, now()),
          CASE WHEN _event = 'replied' THEN NULLIF(left(trim(COALESCE(_snippet,'')),500),'') END,
          NULLIF(left(trim(COALESCE(_message_id,'')),200),''))
  ON CONFLICT (provider, provider_event_id) DO NOTHING;
  GET DIAGNOSTICS _n = ROW_COUNT;
  RETURN CASE WHEN _n = 0 THEN 'duplicate' WHEN _id IS NULL THEN 'unmatched' ELSE 'stored' END;
END; $function$;
REVOKE EXECUTE ON FUNCTION public.ingest_email_event(text,text,text,text,text,text,text,timestamptz,text,text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ingest_email_event(text,text,text,text,text,text,text,timestamptz,text,text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.crm_apply_email_event() FROM public, anon, authenticated;
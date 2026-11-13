-- Isolated regression checks for VA application scoring and access configuration. Always rolls back.
BEGIN;

INSERT INTO public.va_applications (
  full_name, email, phone, country, city, calling_experience_years,
  experience_areas, eastern_availability, hours_per_week, internet_speed_mbps,
  headset, quiet_workspace, voice_intro_url, voice_contractor_url, voice_objection_url,
  why_good_fit, contact_consent, consent_text, consent_version, source
) VALUES (
  'TEST weighted VA', 'test-va@example.invalid', '+10000000000', 'Testland', 'Test City', 2,
  ARRAY['appointment_setting'], 'yes', 30, 100,
  true, true, 'https://example.com/intro', 'https://example.com/opening', 'https://example.com/objection',
  'TEST application for weighted scoring.', true,
  'I agree to be contacted by email or WhatsApp about this application.', 'va-careers-v1', 'test'
);

DO $$
DECLARE
  application_id uuid;
  total numeric;
BEGIN
  SELECT id INTO application_id FROM public.va_applications WHERE email = 'test-va@example.invalid';
  IF NOT FOUND THEN RAISE EXCEPTION 'Application insert failed'; END IF;
  IF (SELECT status FROM public.va_applications WHERE id = application_id) <> 'New' THEN
    RAISE EXCEPTION 'Default status must be New';
  END IF;
  IF (SELECT weighted_total FROM public.va_applications WHERE id = application_id) IS NOT NULL THEN
    RAISE EXCEPTION 'Incomplete scores must have no weighted total';
  END IF;

  UPDATE public.va_applications SET
    hours_overlap = 10, experience = 8, english_clarity = 6,
    tone_warmth = 4, objection_handling = 2, setup = 10
  WHERE id = application_id
  RETURNING weighted_total INTO total;
  IF total <> 6.70 THEN RAISE EXCEPTION 'Weighted total must be 6.70, got %', total; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'va_applications' AND rowsecurity = true
  ) THEN RAISE EXCEPTION 'Row security must be enabled'; END IF;

  IF (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'va_applications') <> 3 THEN
    RAISE EXCEPTION 'Expected anonymous insert and admin select/update policies only';
  END IF;
END $$;

ROLLBACK;

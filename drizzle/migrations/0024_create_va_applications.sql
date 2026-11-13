CREATE TABLE public.va_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  country text NOT NULL,
  city text NOT NULL,
  calling_experience_years numeric(4,1) NOT NULL CHECK (calling_experience_years >= 0 AND calling_experience_years <= 80),
  experience_areas text[] NOT NULL DEFAULT '{}',
  experience_other text,
  eastern_availability text NOT NULL CHECK (eastern_availability IN ('yes', 'partly', 'no')),
  hours_per_week numeric(5,2) NOT NULL CHECK (hours_per_week > 0 AND hours_per_week <= 168),
  internet_speed_mbps numeric(8,2) NOT NULL CHECK (internet_speed_mbps >= 0 AND internet_speed_mbps <= 100000),
  headset boolean NOT NULL,
  quiet_workspace boolean NOT NULL,
  voice_intro_url text NOT NULL,
  voice_contractor_url text NOT NULL,
  voice_objection_url text NOT NULL,
  why_good_fit text NOT NULL CHECK (char_length(why_good_fit) <= 500),
  contact_consent boolean NOT NULL DEFAULT false CHECK (contact_consent = true),
  consent_text text NOT NULL,
  consent_version text NOT NULL,
  consented_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Shortlisted', 'Invited', 'Hired', 'Rejected')),
  hours_overlap integer CHECK (hours_overlap BETWEEN 1 AND 10),
  experience integer CHECK (experience BETWEEN 1 AND 10),
  english_clarity integer CHECK (english_clarity BETWEEN 1 AND 10),
  tone_warmth integer CHECK (tone_warmth BETWEEN 1 AND 10),
  objection_handling integer CHECK (objection_handling BETWEEN 1 AND 10),
  setup integer CHECK (setup BETWEEN 1 AND 10),
  weighted_total numeric(4,2) GENERATED ALWAYS AS (
    CASE
      WHEN hours_overlap IS NOT NULL AND experience IS NOT NULL AND english_clarity IS NOT NULL AND tone_warmth IS NOT NULL AND objection_handling IS NOT NULL AND setup IS NOT NULL
      THEN round(hours_overlap * 0.20 + experience * 0.20 + english_clarity * 0.20 + tone_warmth * 0.15 + objection_handling * 0.15 + setup * 0.10, 2)
      ELSE NULL
    END
  ) STORED,
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'direct'
);

GRANT INSERT ON public.va_applications TO anon;
GRANT SELECT ON public.va_applications TO authenticated;
GRANT UPDATE (status, hours_overlap, experience, english_clarity, tone_warmth, objection_handling, setup, admin_notes) ON public.va_applications TO authenticated;
GRANT ALL ON public.va_applications TO service_role;

ALTER TABLE public.va_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anonymous applicants can submit VA applications"
ON public.va_applications
FOR INSERT
TO anon
WITH CHECK (
  status = 'New'
  AND contact_consent = true
  AND hours_overlap IS NULL
  AND experience IS NULL
  AND english_clarity IS NULL
  AND tone_warmth IS NULL
  AND objection_handling IS NULL
  AND setup IS NULL
  AND admin_notes IS NULL
);

CREATE POLICY "Admins can review VA applications"
ON public.va_applications
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can score VA applications"
ON public.va_applications
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
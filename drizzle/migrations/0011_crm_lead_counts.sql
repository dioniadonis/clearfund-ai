CREATE OR REPLACE FUNCTION public.crm_lead_counts(_today date, _q text DEFAULT NULL, _source text DEFAULT NULL, _agent text DEFAULT NULL, _due text DEFAULT NULL)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  WITH base AS (SELECT * FROM public.crm_leads),
  f AS (
    SELECT stage FROM base l WHERE
      (coalesce(_q,'') = '' OR concat_ws(' ', l.firm, l.contact_name, l.email, l.phone, l.agency, l.lead_ref, l.website, l.state, l.sector) ILIKE '%' || replace(replace(replace(_q,'\','\\'),'%','\%'),'_','\_') || '%')
      AND (coalesce(_source,'') = '' OR l.source = _source)
      AND (coalesce(_agent,'') = '' OR (_agent = 'unassigned' AND l.assigned_to IS NULL) OR (_agent <> 'unassigned' AND l.assigned_to::text = _agent))
      AND (coalesce(_due,'') = '' OR (_due = 'today' AND l.next_follow_up = _today) OR (_due = 'overdue' AND l.next_follow_up < _today))
  )
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM base),
    'due_today', (SELECT count(*) FROM base WHERE next_follow_up = _today),
    'overdue', (SELECT count(*) FROM base WHERE next_follow_up < _today),
    'added_week', (SELECT count(*) FROM base WHERE created_at >= now() - interval '7 days'),
    'by_stage', coalesce((SELECT jsonb_object_agg(stage, n) FROM (SELECT stage, count(*) n FROM f GROUP BY stage) s), '{}'::jsonb)
  );
$$;
REVOKE ALL ON FUNCTION public.crm_lead_counts(date, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_lead_counts(date, text, text, text, text) TO authenticated;
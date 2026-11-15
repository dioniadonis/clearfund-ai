CREATE OR REPLACE FUNCTION public.crm_worker_list_no_email(
  _limit integer DEFAULT 100,
  _after uuid DEFAULT NULL,
  _states_exclude text[] DEFAULT '{}'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _cursor_created_at timestamptz;
  _items jsonb := '[]'::jsonb;
  _rows jsonb := '[]'::jsonb;
  _next_cursor uuid;
  _has_more boolean := false;
BEGIN
  _limit := LEAST(GREATEST(COALESCE(_limit, 100), 1), 200);

  IF _after IS NOT NULL THEN
    SELECT created_at INTO _cursor_created_at FROM public.crm_leads WHERE id = _after;
    IF NOT FOUND THEN RETURN jsonb_build_object('rows', '[]'::jsonb, 'next_cursor', NULL); END IF;
  END IF;

  WITH page AS (
    SELECT l.id, l.created_at,
      jsonb_build_object(
        'id', l.id,
        'lead_ref', l.lead_ref,
        'lead_type', l.lead_type,
        'firm', l.firm,
        'contact_name', l.contact_name,
        'phone', l.phone,
        'state', l.state,
        'city', l.city,
        'website', l.website,
        'sector', l.sector,
        'agency', l.agency,
        'award_amount', l.award_amount,
        'award_date', l.award_date,
        'need_score', l.need_score,
        'created_at', l.created_at
      ) AS item
    FROM public.crm_leads l
    WHERE (l.email IS NULL OR btrim(l.email) = '')
      AND l.do_not_contact IS FALSE
      AND upper(COALESCE(l.state, '')) NOT IN ('VA', 'CT', 'MO', 'CA', 'VT', 'ND')
      AND NOT (upper(COALESCE(l.state, '')) = ANY(
        SELECT upper(trim(state)) FROM unnest(COALESCE(_states_exclude, '{}')) AS excluded(state)
        WHERE NULLIF(trim(state), '') IS NOT NULL
      ))
      AND (_after IS NULL OR (l.created_at, l.id) < (_cursor_created_at, _after))
    ORDER BY l.created_at DESC, l.id DESC
    LIMIT (_limit + 1)
  )
  SELECT COALESCE(jsonb_agg(item ORDER BY created_at DESC, id DESC), '[]'::jsonb)
    INTO _items FROM page;

  _has_more := jsonb_array_length(_items) > _limit;
  SELECT COALESCE(jsonb_agg(value ORDER BY ord), '[]'::jsonb)
    INTO _rows
    FROM jsonb_array_elements(_items) WITH ORDINALITY AS e(value, ord)
    WHERE ord <= _limit;

  IF _has_more THEN
    _next_cursor := (_rows->(_limit - 1)->>'id')::uuid;
  END IF;

  RETURN jsonb_build_object('rows', _rows, 'next_cursor', _next_cursor);
END;
$$;

REVOKE ALL ON FUNCTION public.crm_worker_list_no_email(integer, uuid, text[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crm_worker_list_no_email(integer, uuid, text[]) TO service_role;

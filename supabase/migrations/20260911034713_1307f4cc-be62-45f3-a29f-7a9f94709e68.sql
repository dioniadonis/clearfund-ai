CREATE OR REPLACE FUNCTION public.operator_update_lead(
  _lead_id uuid,
  _stage public.lead_stage,
  _notes text,
  _next_action text,
  _next_action_due date,
  _event_description text
) RETURNS public.leads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _row public.leads;
BEGIN
  IF NOT public.is_operator(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.leads
     SET stage = _stage,
         notes = _notes,
         next_action = _next_action,
         next_action_due = _next_action_due
   WHERE id = _lead_id
  RETURNING * INTO _row;

  IF _row.id IS NULL THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;

  INSERT INTO public.lead_events (lead_id, event_type, description, created_by)
  VALUES (_lead_id, 'operator_update', _event_description, auth.uid());

  RETURN _row;
END;
$$;

REVOKE ALL ON FUNCTION public.operator_update_lead(uuid, public.lead_stage, text, text, date, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.operator_update_lead(uuid, public.lead_stage, text, text, date, text) TO authenticated;
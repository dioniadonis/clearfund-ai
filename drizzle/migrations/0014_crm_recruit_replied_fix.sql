CREATE OR REPLACE FUNCTION public.crm_check_stage_type() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR NEW.stage IS DISTINCT FROM OLD.stage OR NEW.lead_type IS DISTINCT FROM OLD.lead_type)
     AND NOT public.crm_stage_ok(NEW.lead_type, NEW.stage) THEN
    -- Automatic reply detection moves clients to Replied; recruits keep their stage.
    IF NEW.lead_type = 'partner' AND NEW.stage = 'Replied' THEN
      NEW.stage := CASE WHEN TG_OP = 'INSERT' THEN 'New' ELSE OLD.stage END;
    ELSE RAISE EXCEPTION 'stage % not allowed for this lead type', NEW.stage; END IF;
  END IF;
  RETURN NEW;
END $$;
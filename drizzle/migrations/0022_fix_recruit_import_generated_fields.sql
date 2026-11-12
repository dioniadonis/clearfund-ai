CREATE OR REPLACE FUNCTION public.crm_import_recruits(_rows jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _preview jsonb; _item jsonb; _r jsonb; _added integer := 0; _duplicate integer := 0; _invalid integer := 0;
BEGIN
  _preview := public.crm_preview_recruit_import(_rows);
  FOR _item IN SELECT value FROM jsonb_array_elements(_preview) LOOP
    IF _item->>'status'='new' THEN
      _r := _item->'row';
      BEGIN
        INSERT INTO public.crm_leads(lead_type,firm,contact_name,email,phone,website,city,state,sector,source_url,stage,source,found_by,found_at)
        VALUES('recruit',_r->>'firm',_r->>'contact',_r->>'email',_r->>'phone',_r->>'website',_r->>'city',_r->>'state',_r->>'sector',_r->>'source_url','new','csv','csv',now());
        _added := _added+1;
      EXCEPTION WHEN unique_violation THEN _duplicate := _duplicate+1; END;
    ELSIF _item->>'status'='duplicate' THEN _duplicate := _duplicate+1;
    ELSE _invalid := _invalid+1; END IF;
  END LOOP;
  RETURN jsonb_build_object('added',_added,'duplicate',_duplicate,'invalid',_invalid);
END $$;
REVOKE ALL ON FUNCTION public.crm_import_recruits(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_import_recruits(jsonb) TO authenticated;
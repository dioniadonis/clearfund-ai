import { supabase } from "@/integrations/supabase/client";
import { getAgentReferral } from "@/lib/agentProgram";

export const QUALIFIER_PATH = "/get-started";

export const logCtaClick = (cta: string, leadId?: string) => {
  void supabase.rpc("log_cta_click", {
    _cta: cta.slice(0, 80), _page: window.location.pathname.slice(0, 300),
    _destination: QUALIFIER_PATH, _lead_id: leadId ?? null, _agent_code: getAgentReferral(),
  }).then(({ error }) => { if (error) console.warn("Click logging unavailable"); });
};

// Public funding CTAs always start with ClearFund's own qualifier.
export const openApplication = (cta = "unknown") => {
  logCtaClick(cta);
  window.location.assign(`${QUALIFIER_PATH}?cta=${encodeURIComponent(cta.slice(0, 60))}`);
};

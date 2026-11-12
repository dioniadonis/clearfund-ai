import { supabase } from "@/integrations/supabase/client";

// David Allen Capital replicated site: credits applications to ClearFund's broker account.
export const DAC_APPLY_URL = "https://www.davidallencapital.com/clearfund";

// Best-effort click log; never blocks or delays the link.
export const logDacClick = (cta: string) => {
  try {
    void supabase.from("cta_clicks").insert({ cta: cta.slice(0, 80), page: window.location.pathname.slice(0, 200), destination: "dac" }).then(() => {}, () => {});
  } catch { /* ignore */ }
};

export const openDacApply = (cta = "unknown") => {
  logDacClick(cta);
  window.open(DAC_APPLY_URL, "_blank", "noopener,noreferrer");
};

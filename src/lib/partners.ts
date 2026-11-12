export const QUALIFIER_PATH = "/get-started";

// Public funding CTAs always start with ClearFund's own qualifier.
export const openApplication = (cta = "unknown") => {
  window.location.assign(`${QUALIFIER_PATH}?cta=${encodeURIComponent(cta.slice(0, 60))}`);
};

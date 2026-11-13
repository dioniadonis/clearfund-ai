export type Site = "ai" | "general";

const OVERRIDE_KEY = "clearfund_site_override";

export function siteForHostname(hostname: string): Site {
  const host = hostname.toLowerCase();
  return host === "clearfundai.com" || host === "www.clearfundai.com" ? "ai" : "general";
}

export function getSite(): Site {
  const requested = new URLSearchParams(window.location.search).get("site");
  if (requested === "ai" || requested === "general") {
    try { window.sessionStorage.setItem(OVERRIDE_KEY, requested); } catch { /* Preview override still works for this page. */ }
    return requested;
  }
  try {
    const stored = window.sessionStorage.getItem(OVERRIDE_KEY);
    if (stored === "ai" || stored === "general") return stored;
  } catch { /* Fall back to the hostname when storage is unavailable. */ }
  return siteForHostname(window.location.hostname);
}

export function backofficeRedirect(hostname: string, pathname: string, search = "", hash = ""): string | null {
  const host = hostname.toLowerCase();
  const generalHost = host === "myclearfund.com" || host === "www.myclearfund.com";
  const backoffice = pathname === "/crm" || pathname.startsWith("/crm/") || pathname === "/operator" || pathname.startsWith("/operator/");
  return generalHost && backoffice ? `https://clearfundai.com${pathname}${search}${hash}` : null;
}

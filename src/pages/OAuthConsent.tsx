import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useOperatorAuth } from "@/hooks/useOperatorAuth";
import { supabaseOAuth, type OAuthAuthorizationDetails } from "@/lib/supabase-oauth";

const identityScope = (scope: string) => {
  if (scope === "openid") return "Confirm your ClearFund identity";
  if (scope === "email") return "Share your email address";
  if (scope === "profile") return "Share your basic profile";
  return `Additional permission requested: ${scope}`;
};

const OAuthConsent: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const authorizationId = params.get("authorization_id") ?? "";
  const { session, sessionLoading } = useOperatorAuth();
  const [details, setDetails] = useState<OAuthAuthorizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "Connect an AI assistant | ClearFund AI";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => { meta.remove(); };
  }, []);

  useEffect(() => {
    let active = true;
    const sessionId = session?.user.id;

    if (!authorizationId) {
      setError("This connection request is missing its authorization ID. Ask the AI assistant to reconnect.");
      return;
    }
    if (sessionLoading) return;
    if (!session) {
      const next = window.location.pathname + window.location.search;
      navigate(`/crm?next=${encodeURIComponent(next)}`, { replace: true });
      return;
    }

    setDetails(null);
    setError(null);
    supabaseOAuth.getAuthorizationDetails(authorizationId).then(({ data, error: requestError }) => {
      if (!active || sessionId !== session.user.id) return;
      if (requestError) {
        setError("This connection request is invalid or has expired. Ask the AI assistant to reconnect.");
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.assign(immediate);
        return;
      }
      if (!data) {
        setError("The authorization service returned no connection details. Ask the AI assistant to reconnect.");
        return;
      }
      setDetails(data);
    }).catch(() => {
      if (active) setError("Could not load this connection request. Check your connection and try again.");
    });

    return () => { active = false; };
  }, [authorizationId, navigate, session, sessionLoading]);

  async function decide(approve: boolean) {
    if (!authorizationId || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { data, error: decisionError } = approve
        ? await supabaseOAuth.approveAuthorization(authorizationId)
        : await supabaseOAuth.denyAuthorization(authorizationId);
      if (decisionError) {
        setError(`${approve ? "Approval" : "Cancellation"} failed. Ask the AI assistant to start a new connection request.`);
        setBusy(false);
        return;
      }
      const target = data?.redirect_url ?? data?.redirect_to;
      if (!target) {
        setError("The authorization service did not provide a return address. Ask the AI assistant to reconnect.");
        setBusy(false);
        return;
      }
      window.location.assign(target);
    } catch {
      setError("The connection could not be completed. Check your connection and try again.");
      setBusy(false);
    }
  }

  const clientName = details?.client?.name ?? "this AI assistant";
  const redirectUri = details?.redirect_uri ?? details?.client?.redirect_uris?.[0] ?? details?.client?.redirect_uri;
  const scopes = (details?.scope ?? "openid email profile").split(/\s+/).filter(Boolean);

  return (
    <main className="min-h-screen bg-background px-4 py-10 flex items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Connect {clientName} to ClearFund AI</CardTitle>
          <CardDescription>Review this request before allowing access.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Connection unavailable</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!details && !error ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading connection request…
            </div>
          ) : details ? (
            <>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Signed in as:</span> {session?.user.email}</p>
                {redirectUri && <p className="break-all"><span className="font-medium">Returns to:</span> {redirectUri}</p>}
              </div>
              <p className="text-sm">This lets {clientName} use ClearFund AI as you.</p>
              <section aria-labelledby="identity-access" className="space-y-2">
                <h2 id="identity-access" className="text-sm font-medium">Identity information</h2>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  {scopes.map((scope) => <li key={scope}>{identityScope(scope)}</li>)}
                </ul>
              </section>
              <section aria-labelledby="crm-access" className="space-y-2">
                <h2 id="crm-access" className="text-sm font-medium">ClearFund capabilities</h2>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Search CRM leads visible to your account</li>
                  <li>Read lead details and recent activity</li>
                </ul>
                <p className="text-sm text-muted-foreground">No editing, sending, deleting, or publishing access is included.</p>
              </section>
              <p className="text-xs text-muted-foreground">This does not bypass ClearFund AI permissions or backend policies.</p>
              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                <Button type="button" variant="outline" disabled={busy} onClick={() => decide(false)}>Cancel connection</Button>
                <Button type="button" disabled={busy} onClick={() => decide(true)}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}Approve connection
                </Button>
              </div>
            </>
          ) : (
            <Button type="button" variant="outline" onClick={() => navigate("/crm", { replace: true })}>Return to CRM</Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
};

export default OAuthConsent;

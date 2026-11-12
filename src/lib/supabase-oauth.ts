import { supabase } from "@/integrations/supabase/client";

export interface OAuthAuthorizationDetails {
  client?: {
    name?: string;
    redirect_uris?: string[];
    redirect_uri?: string;
  };
  scope?: string;
  redirect_url?: string;
  redirect_to?: string;
}

interface OAuthDecision {
  redirect_url?: string;
  redirect_to?: string;
}

interface SupabaseOAuthApi {
  getAuthorizationDetails(id: string): Promise<{
    data: OAuthAuthorizationDetails | null;
    error: Error | null;
  }>;
  approveAuthorization(id: string): Promise<{ data: OAuthDecision | null; error: Error | null }>;
  denyAuthorization(id: string): Promise<{ data: OAuthDecision | null; error: Error | null }>;
}

// Supabase's OAuth methods are currently beta and are not present in every
// installed auth-js type revision. Keep the small typed boundary in one place.
export const supabaseOAuth = (supabase.auth as unknown as { oauth: SupabaseOAuthApi }).oauth;

import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listCrmLeadsTool from "./tools/list-crm-leads";
import getCrmLeadTool from "./tools/get-crm-lead";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "clearfund-ai",
  title: "clearfund-ai",
  version: "0.1.0",
  instructions: "Read-only tools for ClearFund AI CRM leads. Use list_crm_leads to find visible leads and get_crm_lead for details and activity. Every query uses the signed-in user's existing CRM permissions.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
    requireOAuthClientClaim: true,
  }),
  tools: [listCrmLeadsTool, getCrmLeadTool],
});

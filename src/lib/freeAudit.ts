export * from "../../supabase/functions/_shared/freeAuditScoring";
export { AUDIT_TERMS_TEXT, AUDIT_PHONE_TEXT } from "./auditConsent";

export const COMPLIANCE_TEXT =
  "These figures are estimates based on the answers you provided and are for informational purposes only. They are not financial, legal, or tax advice. Funding is subject to lender review and approval.";

export const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

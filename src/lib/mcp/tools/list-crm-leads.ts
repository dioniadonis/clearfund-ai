import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

const stages = [
  "New",
  "Contacted",
  "Replied",
  "Interested",
  "Applied",
  "Submitted to funder",
  "Funded",
  "Lost",
] as const;

export default defineTool({
  name: "list_crm_leads",
  title: "List CRM leads",
  description: "List the signed-in admin or agent's visible CRM leads, optionally filtered by stage.",
  inputSchema: {
    stage: z.enum(stages).optional().describe("Only return leads in this pipeline stage."),
    limit: z.number().int().min(1).max(50).default(25).describe("Maximum number of recent leads to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ stage, limit }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("crm_leads")
      .select("id, firm, contact_name, email, phone, agency, stage, source, assigned_to, next_follow_up, do_not_contact, state, sector, need_score, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (stage) query = query.eq("stage", stage);

    const { data, error } = await query;
    if (error) throw new ToolError("Could not load CRM leads");
    const leads = (data ?? []).map((lead) => ({
      id: lead.id,
      firm: lead.firm,
      contact_name: lead.contact_name,
      email: lead.email,
      phone: lead.phone,
      agency: lead.agency,
      stage: lead.stage,
      source: lead.source,
      assigned_to: lead.assigned_to,
      next_follow_up: lead.next_follow_up,
      do_not_contact: lead.do_not_contact,
      state: lead.state,
      sector: lead.sector,
      need_score: lead.need_score,
      created_at: lead.created_at,
    }));

    return {
      content: [{ type: "text", text: leads.length ? `Returned ${leads.length} visible CRM leads.` : "No visible CRM leads matched." }],
      structuredContent: { leads },
    };
  },
});

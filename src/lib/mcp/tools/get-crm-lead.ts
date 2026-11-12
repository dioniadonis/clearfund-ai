import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_crm_lead",
  title: "Get CRM lead details",
  description: "Get one visible CRM lead and its recent activity history using the signed-in admin or agent's permissions.",
  inputSchema: {
    lead_id: z.string().uuid().describe("The CRM lead UUID returned by list_crm_leads."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ lead_id }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const supabase = supabaseForUser(ctx);
    const { data: lead, error: leadError } = await supabase
      .from("crm_leads")
      .select("id, firm, contact_name, email, phone, agency, award_amount, award_date, stage, source, assigned_to, next_follow_up, notes, lead_ref, lead_type, state, sector, website, need_score, do_not_contact, dnc_reason, found_by, created_at, updated_at")
      .eq("id", lead_id)
      .maybeSingle();

    if (leadError) throw new ToolError("Could not load this CRM lead");
    if (!lead) throw new ToolError("Lead not found or not available to this account");

    const { data: activityRows, error: activityError } = await supabase
      .from("crm_activities")
      .select("id, type, body, created_at")
      .eq("lead_id", lead_id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (activityError) throw new ToolError("Could not load lead activity");

    const activities = (activityRows ?? []).map((activity) => ({
      id: activity.id,
      type: activity.type,
      body: activity.body,
      created_at: activity.created_at,
    }));

    return {
      content: [{ type: "text", text: `Loaded ${lead.firm ?? lead.contact_name ?? "the requested lead"} with ${activities.length} recent activities.` }],
      structuredContent: {
        lead: {
          id: lead.id,
          firm: lead.firm,
          contact_name: lead.contact_name,
          email: lead.email,
          phone: lead.phone,
          agency: lead.agency,
          award_amount: lead.award_amount,
          award_date: lead.award_date,
          stage: lead.stage,
          source: lead.source,
          assigned_to: lead.assigned_to,
          next_follow_up: lead.next_follow_up,
          notes: lead.notes,
          lead_ref: lead.lead_ref,
          lead_type: lead.lead_type,
          state: lead.state,
          sector: lead.sector,
          website: lead.website,
          need_score: lead.need_score,
          do_not_contact: lead.do_not_contact,
          dnc_reason: lead.dnc_reason,
          found_by: lead.found_by,
          created_at: lead.created_at,
          updated_at: lead.updated_at,
        },
        activities,
      },
    };
  },
});

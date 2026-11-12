import { useWebMCP } from "use-webmcp-tool";
import { leadLabel, type CrmLead } from "@/lib/crm";
import { runWebMCPTool } from "@/lib/webmcp-telemetry";

interface CrmWebToolsProps {
  activeTab: string;
  filteredLeads: CrmLead[];
  loading: boolean;
  onChangeTab: (tab: string) => void;
  onFilterStage: (stage: string) => void;
}

/** Browser-local read/view tools for the CRM screen. No writes or external calls. */
export default function CrmWebTools({ activeTab, filteredLeads, loading, onChangeTab, onFilterStage }: CrmWebToolsProps) {
  useWebMCP({
    name: "list_crm_view_leads",
    description: "List up to 25 lead IDs and names currently visible on the CRM Leads view; open that view first if needed.",
    enabled: !loading,
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute: () => runWebMCPTool("list_crm_view_leads", () => {
      if (activeTab !== "leads") return "The Leads view is not open. Use show_crm_leads first.";
      if (!filteredLeads.length) return "No leads match the current CRM filters.";
      const shown = filteredLeads.slice(0, 25);
      const lines = shown.map((lead) => `${lead.id}: ${leadLabel(lead)} — ${lead.stage}`);
      return `${lines.join("\n")}${filteredLeads.length > shown.length ? `\n${filteredLeads.length - shown.length} more leads match.` : ""}`;
    }),
  });

  useWebMCP({
    name: "show_crm_leads",
    description: "Open the CRM Leads view and optionally filter it by one exact pipeline stage.",
    enabled: !loading,
    inputSchema: {
      type: "object",
      properties: {
        stage: {
          type: "string",
          enum: ["New", "Contacted", "Replied", "Interested", "Applied", "Submitted to funder", "Funded", "Lost"],
          description: "Optional exact stage to show; omit it to show every stage.",
        },
      },
    },
    annotations: { untrustedContentHint: false },
    execute: (args: { stage?: string }) => runWebMCPTool("show_crm_leads", () => {
      const allowed = ["New", "Contacted", "Replied", "Interested", "Applied", "Submitted to funder", "Funded", "Lost"];
      if (args.stage !== undefined && (typeof args.stage !== "string" || !allowed.includes(args.stage))) {
        throw new Error("Unknown stage; use one of the exact CRM stage names or omit stage.");
      }
      onChangeTab("leads");
      onFilterStage(args.stage ?? "");
      return `Showing ${args.stage ?? "all stage"} leads.`;
    }),
  });

  return null;
}

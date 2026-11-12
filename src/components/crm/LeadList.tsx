import React from "react";
import { Ban } from "lucide-react";
import { stagesFor, fmtMoney, leadLabel, todayIso, type CrmLead } from "@/lib/crm";

type Props = { leads: CrmLead[]; onOpen: (id: string) => void; onMove: (id: string, stage: string) => void };

const LeadList: React.FC<Props> = ({ leads, onOpen, onMove }) => {
  const today = todayIso();
  if (leads.length === 0) return <p className="text-muted-foreground py-8 text-center">No leads match.</p>;
  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {leads.map((l) => {
        const overdue = l.next_follow_up && l.next_follow_up < today;
        return (
          <li key={l.id} className="border rounded-lg p-3 space-y-2 min-w-0 bg-card">
            <button type="button" className="w-full text-left min-h-[44px]" onClick={() => onOpen(l.id)}>
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium break-words min-w-0">{leadLabel(l)}</span>
                {l.lead_type === "partner" && <span className="shrink-0 rounded-full bg-primary/10 text-primary text-xs px-2 py-0.5">Partner</span>}
                {l.warm_reason && <span className="shrink-0 rounded-full bg-primary/10 text-primary text-xs px-2 py-0.5">Warm · {l.warm_reason}</span>}
                {l.do_not_contact && (
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-destructive/10 text-destructive text-xs px-2 py-0.5"><Ban className="h-3 w-3" />Do not contact</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground break-words">
                {[l.contact_name !== leadLabel(l) && l.contact_name, l.agency, fmtMoney(l.award_amount), l.source].filter(Boolean).join(" · ")}
              </p>
              {l.next_follow_up && (
                <p className={`text-xs ${overdue ? "text-destructive" : l.next_follow_up === today ? "text-primary font-medium" : "text-muted-foreground"}`}>
                  Follow up {l.next_follow_up}{overdue ? " (overdue)" : l.next_follow_up === today ? " (today)" : ""}
                </p>
              )}
            </button>
            <select aria-label={`Stage for ${leadLabel(l)}`} className="h-11 w-full rounded-md border border-input bg-background px-3 text-base"
              value={l.stage} onChange={(e) => onMove(l.id, e.target.value)}>
              {stagesFor(l.lead_type).map((s) => <option key={s}>{s}</option>)}
            </select>
          </li>
        );
      })}
    </ul>
  );
};

export default LeadList;

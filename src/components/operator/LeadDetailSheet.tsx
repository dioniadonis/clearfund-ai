import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type LeadStage = Database["public"]["Enums"]["lead_stage"];
type Lead = Database["public"]["Tables"]["leads"]["Row"];

const STAGES: LeadStage[] = [
  "new",
  "qualification",
  "nurture",
  "application",
  "documents",
  "submitted",
  "conditions",
  "funded",
  "declined",
  "lost",
];

interface Props {
  leadId: string | null;
  onOpenChange: (open: boolean) => void;
}

const LeadDetailSheet: React.FC<Props> = ({ leadId, onOpenChange }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [stage, setStage] = useState<LeadStage>("new");
  const [notes, setNotes] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [nextActionDue, setNextActionDue] = useState("");

  const leadQuery = useQuery({
    queryKey: ["operator", "lead", leadId],
    enabled: !!leadId,
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").eq("id", leadId!).single();
      if (error) throw error;
      return data as Lead;
    },
  });

  const eventsQuery = useQuery({
    queryKey: ["operator", "lead", leadId, "events"],
    enabled: !!leadId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_events")
        .select("id, event_type, description, created_at")
        .eq("lead_id", leadId!)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const lead = leadQuery.data;
    if (!lead) return;
    setStage(lead.stage);
    setNotes(lead.notes ?? "");
    setNextAction(lead.next_action ?? "");
    setNextActionDue(lead.next_action_due ?? "");
  }, [leadQuery.data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!leadId) throw new Error("No lead selected");
      if (notes.length > 5000 || nextAction.length > 300) {
        throw new Error("Notes or next action is too long");
      }

      const { data, error } = await supabase.rpc("operator_update_lead", {
        _lead_id: leadId,
        _stage: stage,
        _notes: notes.trim() || null,
        _next_action: nextAction.trim() || null,
        _next_action_due: nextActionDue || null,
        _event_description: `Stage set to ${stage}${
          nextAction.trim() ? `; next action: ${nextAction.trim()}` : ""
        }`,
      } as never);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Lead saved" });
      queryClient.invalidateQueries({ queryKey: ["operator"] });
    },
    onError: (e: unknown) => {
      toast({
        title: "Could not save",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <Sheet open={!!leadId} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{leadQuery.data?.business_name ?? "Lead"}</SheetTitle>
        </SheetHeader>

        {leadQuery.isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground pt-6">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading lead…
          </div>
        ) : leadQuery.isError ? (
          <p className="pt-6 text-sm text-destructive">Could not load this lead.</p>
        ) : leadQuery.data ? (
          <div className="space-y-5 pt-6">
            <div className="text-sm text-muted-foreground space-y-1">
              <p>{leadQuery.data.full_name}</p>
              <p>{leadQuery.data.email}</p>
              <p>{leadQuery.data.phone}</p>
              <p>Service: {leadQuery.data.service_interest.replace(/_/g, " ")}</p>
              <p>Entry CTA: {leadQuery.data.entry_cta ?? "—"}</p>
            </div>

            <div className="space-y-2">
              <Label>Stage</Label>
              <Select value={stage} onValueChange={(v) => setStage(v as LeadStage)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="next-action">Next action</Label>
              <Input
                id="next-action"
                value={nextAction}
                maxLength={300}
                onChange={(e) => setNextAction(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="next-action-due">Next action due</Label>
              <Input
                id="next-action-due"
                type="date"
                value={nextActionDue}
                onChange={(e) => setNextActionDue(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={5}
                maxLength={5000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save changes
            </Button>

            <div className="pt-4 space-y-2">
              <h3 className="text-sm font-medium">History</h3>
              {eventsQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : eventsQuery.isError ? (
                <p className="text-sm text-destructive">Could not load history.</p>
              ) : (eventsQuery.data?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">No history yet.</p>
              ) : (
                <ul className="space-y-2">
                  {eventsQuery.data!.map((ev) => (
                    <li key={ev.id} className="text-sm">
                      <span className="text-muted-foreground">
                        {new Date(ev.created_at).toLocaleString()} —{" "}
                      </span>
                      {ev.description ?? ev.event_type}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
};

export default LeadDetailSheet;

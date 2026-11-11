import React from "react";
import { DndContext, pointerWithin, rectIntersection, type CollisionDetection, useDraggable, useDroppable, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { CRM_STAGES, fmtMoney, leadLabel, todayIso, type CrmLead } from "@/lib/crm";

const Card: React.FC<{ lead: CrmLead; onOpen: () => void }> = ({ lead, onOpen }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });
  const due = lead.next_follow_up && lead.next_follow_up <= todayIso();
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...listeners}
      {...attributes}
      onClick={onOpen}
      style={transform ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 50 } : undefined}
      className={`w-full text-left rounded-lg border bg-card p-3 min-h-[56px] touch-manipulation ${isDragging ? "shadow-lg opacity-90" : ""}`}
    >
      <p className="font-medium break-words">{leadLabel(lead)}</p>
      <p className="text-xs text-muted-foreground break-words">{[lead.agency, fmtMoney(lead.award_amount)].filter(Boolean).join(" · ")}</p>
      {lead.next_follow_up && <p className={`text-xs mt-1 ${due ? "text-destructive font-medium" : "text-muted-foreground"}`}>Follow up {lead.next_follow_up}</p>}
    </button>
  );
};

const Column: React.FC<{ stage: string; leads: CrmLead[]; onOpen: (l: CrmLead) => void }> = ({ stage, leads, onOpen }) => {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <section ref={setNodeRef} aria-label={stage} className={`snap-start shrink-0 w-[80vw] max-w-[300px] min-h-[60vh] rounded-xl border p-2 space-y-2 ${isOver ? "bg-accent" : "bg-muted/40"}`}>
      <h3 className="font-semibold px-1 flex justify-between"><span>{stage}</span><span className="text-muted-foreground">{leads.length}</span></h3>
      {leads.map((l) => <Card key={l.id} lead={l} onOpen={() => onOpen(l)} />)}
    </section>
  );
};

const collide: CollisionDetection = (args) => { const hits = pointerWithin(args); return hits.length ? hits : rectIntersection(args); };

const CrmBoard: React.FC<{ leads: CrmLead[]; onOpen: (l: CrmLead) => void; onMove: (id: string, stage: string) => void }> = ({ leads, onOpen, onMove }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );
  const end = (e: DragEndEvent) => {
    const to = e.over?.id as string | undefined;
    const lead = leads.find((l) => l.id === e.active.id);
    if (to && lead && lead.stage !== to) onMove(lead.id, to);
  };
  return (
    <DndContext sensors={sensors} collisionDetection={collide} onDragEnd={end}>
      <p className="text-xs text-muted-foreground mb-2">Press and hold a card, then drag it to another column. Scroll sideways to see all stages.</p>
      <div className="flex gap-3 overflow-x-auto snap-x pb-4 -mx-4 px-4">
        {CRM_STAGES.map((s) => <Column key={s} stage={s} leads={leads.filter((l) => l.stage === s)} onOpen={onOpen} />)}
      </div>
    </DndContext>
  );
};

export default CrmBoard;

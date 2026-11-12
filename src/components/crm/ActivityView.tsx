import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw, MessageSquareReply, MousePointerClick, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { countEvents, dayStart, leadLabel, weekStart, type CrmLead, type EmailEvent } from "@/lib/crm";

type Props = { leads: CrmLead[]; isAdmin: boolean; onOpen: (id: string) => void; userId: string };
type Item = { key: string; at: string; leadId: string | null; title: string; detail?: string | null };

const fmtTime = (iso: string) => new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

const ActivityView: React.FC<Props> = ({ leads, isAdmin, onOpen, userId }) => {
  const since = new Date(Math.min(weekStart().getTime(), Date.now() - 7 * 864e5));
  const q = useQuery({
    queryKey: ["crm_activity_feed", userId],
    queryFn: async () => {
      const [ev, visits] = await Promise.all([
        supabase.from("email_events").select("*").gte("occurred_at", since.toISOString()).order("occurred_at", { ascending: false }).limit(5000),
        supabase.from("crm_activities").select("id, lead_id, created_at, body").eq("type", "note").like("body", "Opened the /awarded%")
          .gte("created_at", since.toISOString()).order("created_at", { ascending: false }).limit(500),
      ]);
      if (ev.error) throw ev.error;
      if (visits.error) throw visits.error;
      return { events: ev.data as EmailEvent[], visits: visits.data };
    },
  });
  const byId = new Map(leads.map((l) => [l.id, l]));
  const name = (id: string | null, email?: string | null) => (id && byId.get(id) ? leadLabel(byId.get(id)!) : email || "Unmatched sender event");

  if (q.isLoading) return <Loader2 className="h-6 w-6 animate-spin" />;
  if (q.error) return <p className="text-destructive">Couldn't load activity: {(q.error as Error).message}</p>;
  const { events, visits } = q.data!;
  const t = countEvents(events, dayStart()), w = countEvents(events, weekStart());
  const today0 = dayStart();

  const replies = events.filter((e) => e.event === "replied");
  const repliesToday = replies.filter((e) => new Date(e.occurred_at) >= today0);
  const repliesEarlier = replies.filter((e) => new Date(e.occurred_at) < today0);
  const toItem = (e: EmailEvent): Item => ({ key: e.id, at: e.occurred_at, leadId: e.lead_id, title: name(e.lead_id, e.recipient_email),
    detail: [e.campaign, e.step && `step ${e.step}`].filter(Boolean).join(" · ") + (e.snippet ? ` — “${e.snippet}”` : "") });
  const engaged: Item[] = [
    ...events.filter((e) => e.event === "clicked").map((e) => ({ ...toItem(e), title: `${name(e.lead_id, e.recipient_email)} clicked`, detail: e.campaign })),
    ...visits.map((v) => ({ key: v.id, at: v.created_at, leadId: v.lead_id, title: `${name(v.lead_id)} visited /awarded` })),
  ].sort((a, b) => b.at.localeCompare(a.at));
  const lost = events.filter((e) => e.event === "bounced" || e.event === "unsubscribed")
    .map((e) => ({ ...toItem(e), title: `${name(e.lead_id, e.recipient_email)} ${e.event}` }));
  const unmatched = isAdmin ? events.filter((e) => !e.lead_id).length : 0;

  const Section: React.FC<{ title: string; icon: React.ReactNode; items: Item[]; empty: string; tone?: string }> = ({ title, icon, items, empty, tone }) => (
    <section className="space-y-2">
      <h2 className={`font-semibold flex items-center gap-2 ${tone ?? ""}`}>{icon}{title} <span className="text-muted-foreground font-normal">({items.length})</span></h2>
      {items.length === 0 ? <p className="text-sm text-muted-foreground">{empty}</p> : (
        <ul className="border rounded-lg divide-y">
          {items.slice(0, 50).map((i) => (
            <li key={i.key}>
              <button type="button" disabled={!i.leadId} onClick={() => i.leadId && onOpen(i.leadId)}
                className="w-full text-left p-3 min-h-[56px] hover:bg-muted/50 disabled:cursor-default">
                <div className="flex justify-between gap-2"><span className="font-medium break-words min-w-0">{i.title}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{fmtTime(i.at)}</span></div>
                {i.detail && <p className="text-sm text-muted-foreground break-words">{i.detail}</p>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Email events from your sending tool, plus /awarded visits.</p>
        <Button variant="outline" className="h-11 shrink-0" onClick={() => q.refetch()} disabled={q.isFetching}>
          <RefreshCw className={`h-4 w-4 mr-1 ${q.isFetching ? "animate-spin" : ""}`} />Refresh</Button>
      </div>
      <section aria-label="Email counts" className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {([["Sent", "sent"], ["Opened", "opened"], ["Replied", "replied"], ["Bounced", "bounced"]] as const).map(([label, k]) => (
          <div key={k} className="rounded-lg border p-3 min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{t[k]} <span className="text-sm font-normal text-muted-foreground">today</span></p>
            <p className="text-sm text-muted-foreground">{w[k]} this week</p>
          </div>
        ))}
      </section>
      {unmatched > 0 && <p className="text-sm text-muted-foreground">{unmatched} event(s) this week didn't match any lead and were stored without one.</p>}
      <Section title="Needs action: replies today" tone="text-primary" icon={<MessageSquareReply className="h-4 w-4" />} items={repliesToday.map(toItem)} empty="No replies yet today." />
      {repliesEarlier.length > 0 && <Section title="Earlier replies (last 7 days)" icon={<MessageSquareReply className="h-4 w-4" />} items={repliesEarlier.map(toItem)} empty="" />}
      <Section title="Clicks and page visits" icon={<MousePointerClick className="h-4 w-4" />} items={engaged} empty="No clicks or visits in the last 7 days." />
      <Section title="Bounces and unsubscribes" tone="text-destructive" icon={<Ban className="h-4 w-4" />} items={lost} empty="None in the last 7 days." />
      <p className="text-xs text-muted-foreground">Opens are shown but unreliable (some mail apps open every email automatically); nothing is automated from them.</p>
    </div>
  );
};

export default ActivityView;

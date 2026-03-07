import { Link } from "react-router-dom";
import {
  FileText,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Calculator,
  CalendarPlus,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { addDays, format, startOfDay, parseISO, isFuture, isAfter } from "date-fns";
import { useData } from "../context/DataContext";
import type { Campaign, Post } from "../types/data";

function useCountdown(target: Date | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  if (!target) return { d: 0, h: 0, m: 0, s: 0 };
  const diff = Math.max(0, target.getTime() - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s };
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: color + "20" }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <p className="text-2xl font-heading font-bold">{value}</p>
          <p className="text-xs text-foreground-muted">{label}</p>
        </div>
      </div>
    </div>
  );
}

function HeatmapView({ posts }: { posts: Post[] }) {
  const cells = useMemo(() => {
    const today = startOfDay(new Date());
    // Count posts per day from scheduledDate
    const counts: Record<string, number> = {};
    for (const p of posts) {
      if (p.scheduledDate) {
        const key = p.scheduledDate.slice(0, 10); // yyyy-MM-dd
        counts[key] = (counts[key] || 0) + 1;
      }
    }
    const result = [];
    for (let i = 89; i >= 0; i--) {
      const d = addDays(today, -i);
      const key = format(d, "yyyy-MM-dd");
      result.push({ date: key, count: counts[key] || 0 });
    }
    return result;
  }, [posts]);

  const max = Math.max(...cells.map((c) => c.count), 1);

  function getColor(count: number) {
    if (count === 0) return "var(--color-charcoal)";
    const r = count / max;
    if (r < 0.33) return "#D6246E40";
    if (r < 0.66) return "#E8652B80";
    return "#F2A922";
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <h3 className="font-heading text-sm font-semibold mb-3 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-gold shrink-0" />
        Content Density (90 days)
      </h3>
      <div className="flex flex-wrap gap-1">
        {cells.map((c) => (
          <div key={c.date} className="w-3 h-3 rounded-sm" style={{ backgroundColor: getColor(c.count) }} title={`${c.date}: ${c.count}`} />
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs text-foreground-muted">
        <span>Less</span>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: getColor(i) }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

/** Find the next upcoming campaign (soonest future date). */
function getNextCampaign(campaigns: Campaign[]): Campaign | null {
  const now = new Date();
  return campaigns
    .filter((c) => {
      try { return isFuture(parseISO(c.date)); } catch { return false; }
    })
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())[0] ?? null;
}

/** Get posts scheduled within the next 7 days. */
function getUpcomingPosts(posts: Post[]): Post[] {
  const today = startOfDay(new Date());
  const weekOut = addDays(today, 7);
  return posts
    .filter((p) => {
      if (!p.scheduledDate) return false;
      try {
        const d = parseISO(p.scheduledDate);
        return isAfter(d, today) && !isAfter(d, weekOut);
      } catch { return false; }
    })
    .sort((a, b) => parseISO(a.scheduledDate).getTime() - parseISO(b.scheduledDate).getTime());
}

/** Find scheduling conflicts: multiple posts on same platform + date + time. */
function getConflicts(posts: Post[]): { platform: string; date: string; time: string; titles: string[] }[] {
  const groups: Record<string, string[]> = {};
  for (const p of posts) {
    if (p.scheduledDate && p.scheduledTime) {
      const key = `${p.platform}|${p.scheduledDate}|${p.scheduledTime}`;
      (groups[key] ??= []).push(p.title);
    }
  }
  return Object.entries(groups)
    .filter(([, titles]) => titles.length > 1)
    .map(([key, titles]) => {
      const [platform, date, time] = key.split("|");
      return { platform, date, time, titles };
    });
}

const STATUS_META: { key: string; label: string; color: string }[] = [
  { key: "posted", label: "Posted", color: "#22C55E" },
  { key: "approved", label: "Approved", color: "#10B981" },
  { key: "editing", label: "Editing", color: "#E8652B" },
  { key: "allocated", label: "Allocated", color: "#F59E0B" },
  { key: "idea", label: "Idea", color: "#8B5CF6" },
];

export default function AdminDashboard() {
  const { campaigns, posts } = useData();

  const nextCampaign = useMemo(() => getNextCampaign(campaigns), [campaigns]);
  const eventDate = useMemo(() => (nextCampaign ? parseISO(nextCampaign.date) : null), [nextCampaign]);
  const cd = useCountdown(eventDate);

  const campaignPosts = useMemo(
    () => (nextCampaign ? posts.filter((p) => p.campaignId === nextCampaign.id) : []),
    [nextCampaign, posts],
  );

  const statusSegments = useMemo(() => {
    const total = campaignPosts.length || 1;
    return STATUS_META.map((s) => {
      const count = campaignPosts.filter((p) => p.status === s.key).length;
      return { ...s, count, pct: Math.round((count / total) * 100) };
    }).filter((s) => s.count > 0);
  }, [campaignPosts]);

  const needApproval = useMemo(
    () => campaignPosts.filter((p) => p.status === "editing").length,
    [campaignPosts],
  );

  const upcomingPosts = useMemo(() => getUpcomingPosts(posts), [posts]);
  const conflicts = useMemo(() => getConflicts(posts), [posts]);

  const totalPosts = posts.length;
  const postedCount = posts.filter((p) => p.status === "posted").length;
  const editingCount = posts.filter((p) => p.status === "editing" || p.status === "allocated").length;
  const upcomingCount = posts.filter((p) => p.status === "approved" || p.status === "idea").length;

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">Dashboard</h1>

      {/* Next Event Banner */}
      {nextCampaign ? (
        <div className="relative bg-surface border border-border rounded-xl p-6 mb-6">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_80%_50%,rgba(214,36,110,0.06),transparent_70%)] pointer-events-none rounded-xl" />
          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div className="min-w-0">
                <p className="text-xs font-heading font-semibold uppercase tracking-wider text-foreground-muted mb-1">Next Event</p>
                <h2 className="font-heading text-xl font-bold">{nextCampaign.name}</h2>
                <p className="text-sm text-foreground-muted mt-1">
                  {format(parseISO(nextCampaign.date), "MMMM d, yyyy")}
                  {nextCampaign.venue !== "TBD" ? ` @ ${nextCampaign.venue}` : ""}
                  {nextCampaign.city ? ` — ${nextCampaign.city}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                {[
                  { v: cd.d, l: "d" },
                  { v: cd.h, l: "h" },
                  { v: cd.m, l: "m" },
                  { v: cd.s, l: "s" },
                ].map((t, i) => (
                  <span key={i}>
                    <span className="font-heading text-2xl font-bold gradient-text">{String(t.v).padStart(2, "0")}</span>
                    <span className="text-xs text-slate ml-0.5">{t.l}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-ink/50 border border-border rounded-lg p-5">
                <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-3">Content Status</h3>
                {campaignPosts.length > 0 ? (
                  <>
                    <p className="text-sm mb-2"><span className="font-bold text-foreground">{campaignPosts.length}</span> <span className="text-foreground-muted">posts planned</span></p>
                    <div className="flex gap-0.5 h-2.5 rounded-full overflow-hidden bg-ink mb-3">
                      {statusSegments.map((s) => (
                        <div key={s.label} className="h-full" style={{ backgroundColor: s.color, width: s.pct + "%" }} title={`${s.label}: ${s.count}`} />
                      ))}
                    </div>
                    {needApproval > 0 && <p className="text-xs text-coral mb-3">{needApproval} in editing</p>}
                  </>
                ) : (
                  <p className="text-sm text-foreground-muted">No posts linked to this event yet.</p>
                )}
                <Link to="/admin/pipeline" className="text-xs font-heading font-medium text-magenta hover:text-magenta/80 flex items-center gap-1">
                  Open Pipeline
                </Link>
              </div>

              <div className="bg-ink/50 border border-border rounded-lg p-5">
                <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-3">Financial Snapshot</h3>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Budget</span>
                    <span className="font-bold">${nextCampaign.budget.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Tickets sold</span>
                    <span className="font-bold">{nextCampaign.ticketsSold} / {nextCampaign.ticketGoal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Headcount</span>
                    <span className="font-bold">{nextCampaign.headcount}</span>
                  </div>
                </div>
                <Link to="/admin/calculator" className="text-xs font-heading font-medium text-magenta hover:text-magenta/80 flex items-center gap-1">
                  Open Calculator <Calculator className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl p-8 mb-6 text-center">
          <CalendarPlus className="w-10 h-10 text-foreground-muted mx-auto mb-3" />
          <p className="font-heading text-lg font-semibold mb-1">No upcoming events</p>
          <p className="text-sm text-foreground-muted mb-4">Create an event to see the countdown and content status here.</p>
          <Link to="/admin/events" className="text-sm font-heading font-medium text-magenta hover:text-magenta/80">
            + Add Event
          </Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={FileText} label="Total Posts" value={totalPosts} color="#8B5CF6" />
        <StatCard icon={Clock} label="Upcoming" value={upcomingCount} color="#3B82F6" />
        <StatCard icon={TrendingUp} label="In Production" value={editingCount} color="#F59E0B" />
        <StatCard icon={CheckCircle} label="Posted" value={postedCount} color="#22C55E" />
      </div>

      {/* Heatmap + Conflicts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <HeatmapView posts={posts} />
        <div className="bg-surface border border-border rounded-xl p-5" style={conflicts.length > 0 ? { borderColor: "rgba(248,113,113,0.3)" } : {}}>
          <h3 className="font-heading text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: conflicts.length > 0 ? "var(--color-coral, #F87171)" : "inherit" }}>
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Scheduling Conflicts ({conflicts.length})
          </h3>
          {conflicts.length > 0 ? (
            <div className="space-y-2">
              {conflicts.map((c, i) => (
                <div key={i} className="text-sm text-foreground-muted">
                  <span className="text-coral font-medium">{c.platform}</span> — {c.date} at {c.time}: {c.titles.map((t) => `"${t}"`).join(", ")}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-foreground-muted">No scheduling conflicts found.</p>
          )}
        </div>
      </div>

      {/* Upcoming Posts */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <h3 className="font-heading text-sm font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400 shrink-0" />
          Upcoming Posts (Next 7 Days)
        </h3>
        {upcomingPosts.length > 0 ? (
          <div className="space-y-2">
            {upcomingPosts.map((p) => {
              const platformColors: Record<string, string> = { Instagram: "#E1306C", TikTok: "#00F2EA", X: "#FFFFFF", Reddit: "#FF4500" };
              const statusColors: Record<string, string> = { approved: "#10B981", idea: "#8B5CF6", editing: "#E8652B", allocated: "#F59E0B", posted: "#22C55E" };
              return (
                <div key={p.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer">
                  <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: platformColors[p.platform] || "#fff" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.title}</p>
                    <p className="text-xs text-foreground-muted mt-0.5">
                      {p.platform} &middot; {format(parseISO(p.scheduledDate), "MMM d")}
                      {p.scheduledTime ? ` at ${p.scheduledTime}` : ""}
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full border shrink-0 whitespace-nowrap" style={{ borderColor: statusColors[p.status], color: statusColors[p.status] }}>
                    {p.status}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-foreground-muted">No posts scheduled in the next 7 days.</p>
        )}
      </div>
    </div>
  );
}

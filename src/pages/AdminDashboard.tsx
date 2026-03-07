import { Link } from "react-router-dom";
import {
  FileText,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Calculator,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { addDays, format, startOfDay } from "date-fns";

function useCountdown(target: Date) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
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

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function HeatmapView() {
  const cells = useMemo(() => {
    const today = startOfDay(new Date());
    const rng = seededRandom(42);
    const result = [];
    for (let i = 89; i >= 0; i--) {
      const d = addDays(today, -i);
      const count = rng() > 0.6 ? Math.floor(rng() * 4) + 1 : 0;
      result.push({ date: format(d, "yyyy-MM-dd"), count });
    }
    return result;
  }, []);

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

export default function AdminDashboard() {
  const eventDate = new Date("2026-05-01T20:00:00-07:00");
  const cd = useCountdown(eventDate);

  const statusSegments = [
    { label: "Posted", color: "#22C55E", pct: 25 },
    { label: "Approved", color: "#10B981", pct: 17 },
    { label: "Editing", color: "#E8652B", pct: 17 },
    { label: "In Production", color: "#F59E0B", pct: 8 },
    { label: "Scripted", color: "#6366F1", pct: 8 },
    { label: "Idea", color: "#8B5CF6", pct: 25 },
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">Dashboard</h1>

      {/* Next Event Banner */}
      <div className="relative bg-surface border border-border rounded-xl p-6 mb-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_80%_50%,rgba(214,36,110,0.06),transparent_70%)] pointer-events-none rounded-xl" />
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div className="min-w-0">
              <p className="text-xs font-heading font-semibold uppercase tracking-wider text-foreground-muted mb-1">Next Event</p>
              <h2 className="font-heading text-xl font-bold">BEYOND THE RHYTHM — San Diego</h2>
              <p className="text-sm text-foreground-muted mt-1">May 1, 2026 @ FIT Social</p>
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
              <p className="text-sm mb-2"><span className="font-bold text-foreground">12</span> <span className="text-foreground-muted">posts planned</span></p>
              <div className="flex gap-0.5 h-2.5 rounded-full overflow-hidden bg-ink mb-3">
                {statusSegments.map((s) => (
                  <div key={s.label} className="h-full" style={{ backgroundColor: s.color, width: s.pct + "%" }} title={`${s.label}: ${s.pct}%`} />
                ))}
              </div>
              <p className="text-xs text-coral mb-3">3 need approval</p>
              <span className="text-xs font-heading font-medium text-magenta/50 flex items-center gap-1 cursor-default">
                Pipeline — coming soon
              </span>
            </div>

            <div className="bg-ink/50 border border-border rounded-lg p-5">
              <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-3">Financial Snapshot</h3>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-foreground-muted">Budget</span>
                  <span className="font-bold">$9,100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-muted">Ticket target</span>
                  <span className="font-bold gradient-text">$109.20</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-muted">Margin</span>
                  <span className="font-bold">20%</span>
                </div>
              </div>
              <Link to="/admin/calculator" className="text-xs font-heading font-medium text-magenta hover:text-magenta/80 flex items-center gap-1">
                Open Calculator <Calculator className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={FileText} label="Total Posts" value={47} color="#8B5CF6" />
        <StatCard icon={Clock} label="Upcoming" value={8} color="#3B82F6" />
        <StatCard icon={TrendingUp} label="In Production" value={5} color="#F59E0B" />
        <StatCard icon={CheckCircle} label="Posted" value={34} color="#22C55E" />
      </div>

      {/* Heatmap + Conflicts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <HeatmapView />
        <div className="bg-surface border border-coral/30 rounded-xl p-5">
          <h3 className="font-heading text-sm font-semibold mb-3 flex items-center gap-2 text-coral">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Scheduling Conflicts (2)
          </h3>
          <div className="space-y-2">
            <div className="text-sm text-foreground-muted">
              <span className="text-coral font-medium">Instagram</span> — May 1 at 10:00 AM: "Event Teaser", "Countdown Post"
            </div>
            <div className="text-sm text-foreground-muted">
              <span className="text-coral font-medium">TikTok</span> — May 3 at 2:00 PM: "Artist Spotlight", "Venue Tour"
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Posts */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <h3 className="font-heading text-sm font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400 shrink-0" />
          Upcoming Posts (Next 7 Days)
        </h3>
        <div className="space-y-2">
          {[
            { title: "Event Teaser Reel", platform: "Instagram", status: "approved", date: "Mar 7" },
            { title: "Lineup Announcement", platform: "TikTok", status: "scheduled", date: "Mar 8" },
            { title: "Ticket Giveaway", platform: "X", status: "approved", date: "Mar 9" },
            { title: "BTS Venue Setup", platform: "Instagram", status: "scheduled", date: "Mar 10" },
          ].map((p) => {
            const platformColors: Record<string, string> = { Instagram: "#E1306C", TikTok: "#00F2EA", X: "#FFFFFF", Reddit: "#FF4500" };
            const statusColors: Record<string, string> = { approved: "#10B981", scheduled: "#3B82F6", editing: "#E8652B" };
            return (
              <div key={p.title} className="flex items-center gap-4 p-3 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer">
                <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: platformColors[p.platform] || "#fff" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.title}</p>
                  <p className="text-xs text-foreground-muted mt-0.5">{p.platform} &middot; {p.date}</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full border shrink-0 whitespace-nowrap" style={{ borderColor: statusColors[p.status], color: statusColors[p.status] }}>
                  {p.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

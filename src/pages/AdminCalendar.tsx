import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from "date-fns";
import { useData } from "../context/DataContext";
import { useIsViewer } from "../context/RoleContext";
import EditPostModal, { type PostData, type AssetOption } from "../components/EditPostModal";
import type { Post, PostStatus } from "../types/data";

const platformColors: Record<string, string> = {
  Instagram: "#E1306C",
  TikTok: "#00F2EA",
  X: "#FFFFFF",
  Reddit: "#FF4500",
  YouTube: "#FF0000",
};

const STATUS_COLORS: Record<PostStatus, string> = {
  idea: "#9CA3AF",
  allocated: "#3B82F6",
  editing: "#E8652B",
  approved: "#10B981",
  posted: "#22C55E",
};

/** Parse scheduledDate string (MM/DD/YYYY or YYYY-MM-DD) into a Date */
function parseScheduledDate(d: string): Date | null {
  if (!d) return null;
  // MM/DD/YYYY
  const slash = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) return new Date(+slash[3], +slash[1] - 1, +slash[2]);
  // YYYY-MM-DD
  const iso = d.match(/^\d{4}-\d{2}-\d{2}/);
  if (iso) return parseISO(d);
  // Display format "May 1, 2026"
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
}

const STATUS_OPTIONS = Object.entries(STATUS_COLORS).map(([key, color]) => ({
  key, label: key.charAt(0).toUpperCase() + key.slice(1), color, bg: color + "26",
}));

export default function AdminCalendar() {
  const isViewer = useIsViewer();
  const { posts, assets, campaigns, teamMembers, updatePost, deletePost } = useData();
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editing, setEditing] = useState<Post | null>(null);

  const eventOptions = useMemo(() => [
    { value: "", label: "None" },
    ...campaigns.map((c) => ({ value: c.name, label: c.name })),
  ], [campaigns]);

  const availableAssets: AssetOption[] = useMemo(
    () => assets.map((a) => ({ id: a.id, name: a.name, type: a.type, thumbnail: a.thumbnail })),
    [assets]
  );

  const assigneeOptions = useMemo(
    () => teamMembers.filter((m) => m.role !== "viewer").map((m) => ({ value: m.name, label: m.name })),
    [teamMembers]
  );

  const handleSaveEdit = (updated: PostData) => {
    if (!editing) return;
    updatePost(editing.id, {
      title: updated.title, platform: updated.platform, postType: updated.postType,
      status: updated.status as PostStatus, priority: updated.priority, assignee: updated.assignee,
      event: updated.event, scheduledDate: updated.scheduledDate, scheduledTime: updated.scheduledTime,
      caption: updated.caption, notes: updated.notes, tags: updated.tags, linkedAssetIds: updated.linkedAssetIds,
    });
    setEditing(null);
  };

  const handleDeletePost = () => {
    if (!editing) return;
    deletePost(editing.id);
    setEditing(null);
  };

  // Parse all posts into calendar-ready items with resolved dates
  const calendarPosts = useMemo(
    () =>
      posts
        .map((p) => ({ ...p, _date: parseScheduledDate(p.scheduledDate) }))
        .filter((p): p is typeof p & { _date: Date } => p._date !== null),
    [posts]
  );

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const start = startOfWeek(monthStart);
    const end = endOfWeek(monthEnd);

    const days: Date[] = [];
    let day = start;
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const postsForDate = (date: Date) =>
    calendarPosts.filter((p) => isSameDay(p._date, date));

  const selectedPosts = selectedDate ? postsForDate(selectedDate) : [];

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">Content Calendar</h1>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Calendar Grid */}
        <div className="flex-1 min-w-0">
          <div className="bg-surface border border-border rounded-xl p-5">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-foreground-muted" />
              </button>
              <h2 className="font-heading text-lg font-semibold">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-foreground-muted" />
              </button>
            </div>

            {/* Day headers */}
            <div className="hidden sm:grid grid-cols-7 gap-1 mb-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="text-center text-xs text-foreground-muted font-heading font-semibold py-2">
                  {d}
                </div>
              ))}
            </div>
            {/* Mobile day headers (abbreviated) */}
            <div className="grid sm:hidden grid-cols-7 gap-0.5 mb-1">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div key={i} className="text-center text-[10px] text-foreground-muted font-heading font-semibold py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
              {calendarDays.map((day) => {
                const dayPosts = postsForDate(day);
                const inMonth = isSameMonth(day, currentMonth);
                const today = isToday(day);
                const selected = selectedDate && isSameDay(day, selectedDate);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`relative p-1 sm:p-2 min-h-[48px] sm:min-h-[80px] rounded-lg text-left transition-colors flex flex-col ${
                      !inMonth ? "opacity-30" : ""
                    } ${selected ? "bg-magenta/15 border border-magenta/40" : "hover:bg-surface-hover border border-transparent"}`}
                  >
                    <span
                      className={`text-[10px] sm:text-xs font-medium ${
                        today
                          ? "bg-magenta text-white w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px]"
                          : "text-foreground-muted"
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                    {/* Desktop: show post titles */}
                    <div className="hidden sm:flex flex-wrap gap-0.5 mt-1">
                      {dayPosts.slice(0, 3).map((p) => (
                        <div
                          key={p.id}
                          className="w-full truncate text-[10px] px-1 py-0.5 rounded"
                          style={{
                            backgroundColor: (platformColors[p.platform] ?? "#9CA3AF") + "20",
                            color: platformColors[p.platform] ?? "#9CA3AF",
                          }}
                        >
                          {p.title}
                        </div>
                      ))}
                      {dayPosts.length > 3 && (
                        <span className="text-[10px] text-foreground-muted">+{dayPosts.length - 3} more</span>
                      )}
                    </div>
                    {/* Mobile: show dot indicators */}
                    {dayPosts.length > 0 && (
                      <div className="flex sm:hidden gap-0.5 mt-1 justify-center">
                        {dayPosts.slice(0, 3).map((p) => (
                          <div
                            key={p.id}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: platformColors[p.platform] ?? "#9CA3AF" }}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Detail Sidebar */}
        <div className="w-full xl:w-80 xl:shrink-0">
          <div className="xl:sticky xl:top-4 bg-surface border border-border rounded-xl p-5">
            <h3 className="font-heading text-sm font-semibold mb-4">
              {selectedDate ? format(selectedDate, "EEEE, MMM d, yyyy") : "Select a date"}
            </h3>

            {selectedDate && selectedPosts.length === 0 && (
              <p className="text-sm text-foreground-muted">No posts scheduled for this day.</p>
            )}

            <div className="space-y-3">
              {selectedPosts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setEditing(p)}
                  className="w-full text-left bg-ink/50 border border-border rounded-lg p-4 hover:border-magenta/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: platformColors[p.platform] ?? "#9CA3AF" }} />
                    <span className="text-xs text-foreground-muted">{p.platform}</span>
                    <span
                      className="ml-auto text-xs px-2 py-0.5 rounded-full border"
                      style={{ borderColor: STATUS_COLORS[p.status], color: STATUS_COLORS[p.status] }}
                    >
                      {p.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{p.title}</p>
                  {p.scheduledTime && <p className="text-xs text-foreground-muted mt-1">{p.scheduledTime}</p>}
                </button>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs font-heading font-semibold text-foreground-muted mb-3">Platforms</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(platformColors).map(([name, color]) => (
                  <span key={name} className="flex items-center gap-1.5 text-xs text-foreground-muted">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <EditPostModal
          post={{
            title: editing.title, platform: editing.platform, postType: editing.postType,
            status: editing.status, priority: editing.priority, assignee: editing.assignee,
            event: editing.event, scheduledDate: editing.scheduledDate,
            scheduledTime: editing.scheduledTime, caption: editing.caption,
            notes: editing.notes, tags: editing.tags, linkedAssetIds: editing.linkedAssetIds,
          }}
          statusOptions={STATUS_OPTIONS}
          onSave={handleSaveEdit}
          onDelete={handleDeletePost}
          onClose={() => setEditing(null)}
          availableAssets={availableAssets}
          eventOptions={eventOptions}
          assigneeOptions={assigneeOptions}
          readOnly={isViewer}
        />
      )}
    </div>
  );
}

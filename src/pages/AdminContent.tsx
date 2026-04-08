import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths,
  format, isSameMonth, isSameDay, isToday, parseISO, differenceInCalendarDays,
} from "date-fns";
import { useData } from "../context/DataContext";
import { useIsViewer } from "../context/RoleContext";
import EditPostModal, { type PostData, type AssetOption, emptyPost } from "../components/EditPostModal";
import type { Post, PostStatus, CampaignPhase } from "../types/data";

// ── Status config (3 states) ──

const STATUS_CONFIG: { key: PostStatus; label: string; color: string }[] = [
  { key: "idea", label: "Idea", color: "#9CA3AF" },
  { key: "editing", label: "Editing", color: "#E8652B" },
  { key: "posted", label: "Posted", color: "#22C55E" },
];

const STATUS_OPTIONS = STATUS_CONFIG.map((s) => ({
  key: s.key, label: s.label, color: s.color, bg: `${s.color}26`,
}));

const platformEmoji: Record<string, string> = {
  Instagram: "📸", TikTok: "🎵", X: "✖", Reddit: "🔴", YouTube: "▶",
};

// ── Helpers ──

function parseScheduledDate(d: string): Date | null {
  if (!d) return null;
  const slash = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) return new Date(+slash[3], +slash[1] - 1, +slash[2]);
  const iso = d.match(/^\d{4}-\d{2}-\d{2}/);
  if (iso) return parseISO(d);
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/** Use the phase color directly with alpha for cell backgrounds */
function phaseBg(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},0.25)`;
}

/** Use the phase color at full strength for text */
function phaseText(hex: string): string {
  return hex;
}

// ── Component ──

export default function AdminContent() {
  const isViewer = useIsViewer();
  const { posts, assets, folders, campaigns, campaignPhases, campaignFlags, teamMembers, updatePost, addPost, deletePost } = useData();
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editing, setEditing] = useState<Post | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  // Build options for modals
  const eventOptions = useMemo(() => [
    { value: "", label: "None" },
    ...campaigns.map((c) => ({ value: c.name, label: c.name })),
  ], [campaigns]);

  const assigneeOptions = useMemo(() => {
    const names = new Set(teamMembers.filter((m) => m.role !== "viewer").map((m) => m.name));
    names.add("Archer");
    return [...names].map((n) => ({ value: n, label: n }));
  }, [teamMembers]);

  const availableAssets: AssetOption[] = useMemo(() =>
    assets.map((a) => ({ id: a.id, name: a.name, type: a.type, thumbnail: a.thumbnail, folderId: a.folderId ?? null })),
  [assets]);


  // Map posts to dates
  const calendarPosts = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const p of posts) {
      const d = parseScheduledDate(p.scheduledDate);
      if (!d) continue;
      const key = format(d, "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    }
    return map;
  }, [posts]);

  // Phase lookup
  const phaseMap = useMemo(() => {
    const m = new Map<string, CampaignPhase>();
    for (const p of campaignPhases) m.set(p.id, p);
    return m;
  }, [campaignPhases]);

  // Get phase for a day (from first post with a phase)
  const getDayPhase = (dayKey: string): CampaignPhase | null => {
    const dayPosts = calendarPosts.get(dayKey);
    if (!dayPosts) return null;
    for (const p of dayPosts) {
      if (p.phaseId) {
        const phase = phaseMap.get(p.phaseId);
        if (phase) return phase;
      }
    }
    return null;
  };

  // Get flags for a day
  const getDayFlags = (dayKey: string): string[] => {
    const dayPosts = calendarPosts.get(dayKey);
    if (!dayPosts) return [];
    return dayPosts.map((p) => p.flag).filter(Boolean);
  };

  // Calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days: Date[] = [];
  let d = gridStart;
  while (d <= gridEnd) { days.push(d); d = addDays(d, 1); }

  // Phase legend: all phases from campaigns with posts in this month
  const visiblePhases = useMemo(() => {
    const phaseIds = new Set<string>();
    for (const [key, dayPosts] of calendarPosts) {
      const date = parseISO(key);
      if (isSameMonth(date, currentMonth)) {
        for (const p of dayPosts) {
          if (p.phaseId) phaseIds.add(p.phaseId);
        }
      }
    }
    return campaignPhases.filter((p) => phaseIds.has(p.id));
  }, [calendarPosts, campaignPhases, currentMonth]);

  // Selected day posts
  const selectedDayKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const selectedPosts = selectedDayKey ? (calendarPosts.get(selectedDayKey) ?? []) : [];
  const selectedPhase = selectedDayKey ? getDayPhase(selectedDayKey) : null;
  const selectedFlags = selectedDayKey ? getDayFlags(selectedDayKey) : [];

  // Countdown to nearest event
  const getCountdown = () => {
    if (!selectedDate) return null;
    for (const c of campaigns) {
      if (c.type !== "event") continue;
      const eventDate = parseScheduledDate(c.date);
      if (!eventDate) continue;
      const diff = differenceInCalendarDays(eventDate, selectedDate);
      if (diff >= 0) return { days: diff, name: c.name };
    }
    return null;
  };

  // Handlers
  const handleSaveEdit = (data: PostData) => {
    if (!editing) return;
    const matched = campaigns.find((c) => c.name === data.event);
    updatePost(editing.id, {
      ...data,
      status: data.status as PostStatus,
      campaignId: matched?.id ?? null,
      phaseId: data.phaseId || null,
    });
    setEditing(null);
  };

  const handleCreatePost = (data: PostData) => {
    if (!data.title.trim()) return;
    const matched = campaigns.find((c) => c.name === data.event);
    addPost({
      ...data,
      status: data.status as PostStatus,
      campaignId: matched?.id ?? null,
      phaseId: data.phaseId || null,
    } as Omit<Post, "id">);
    setShowNew(false);
  };

  const handleInlineStatus = (postId: string, newStatus: PostStatus) => {
    updatePost(postId, { status: newStatus });
  };

  const newPostForDay = (): PostData => {
    const base = emptyPost();
    if (selectedDate) base.scheduledDate = format(selectedDate, "yyyy-MM-dd");
    return base;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h1 className="font-heading text-2xl font-bold">Content</h1>
      </div>

      {/* Phase Legend */}
      {visiblePhases.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {visiblePhases.map((p) => (
            <span
              key={p.id}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: phaseBg(p.color), color: phaseText(p.color) }}
            >
              {p.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-0 flex-1 min-h-0">
        {/* Calendar */}
        <div className={`flex-1 min-w-0 ${selectedDate ? "max-w-[60%]" : ""} transition-all`}>
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 rounded hover:bg-surface-hover text-foreground-muted hover:text-foreground transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="font-heading text-lg font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 rounded hover:bg-surface-hover text-foreground-muted hover:text-foreground transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((h) => (
              <div key={h} className="text-center text-[10px] font-medium text-foreground-muted py-1">{h}</div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const dayKey = format(day, "yyyy-MM-dd");
              const inMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);
              const selected = selectedDate && isSameDay(day, selectedDate);
              const dayPostList = calendarPosts.get(dayKey) ?? [];
              const phase = getDayPhase(dayKey);
              const flags = getDayFlags(dayKey);

              // Get unique phase colors for dots
              const dotColors: string[] = [];
              for (const p of dayPostList) {
                if (p.phaseId) {
                  const ph = phaseMap.get(p.phaseId);
                  if (ph && !dotColors.includes(ph.color)) dotColors.push(ph.color);
                }
              }

              return (
                <button
                  key={dayKey}
                  onClick={() => setSelectedDate(selected ? null : day)}
                  className={`relative rounded-lg p-1.5 min-h-[56px] text-left transition-all border
                    ${!inMonth ? "opacity-30" : ""}
                    ${selected ? "border-magenta ring-1 ring-magenta" : "border-transparent hover:border-border"}
                    ${today && !selected ? "ring-1 ring-foreground-muted/30" : ""}
                  `}
                  style={phase && inMonth ? {
                    backgroundColor: phaseBg(phase.color),
                  } : undefined}
                >
                  <div
                    className="text-[11px] font-medium mb-0.5"
                    style={phase && inMonth ? { color: phaseText(phase.color) } : undefined}
                  >
                    {format(day, "d")}
                  </div>
                  {dayPostList.length > 0 && inMonth && (
                    <div
                      className="text-[8px] leading-tight line-clamp-2"
                      style={phase ? { color: phaseText(phase.color), opacity: 0.85 } : { opacity: 0.6 }}
                    >
                      {dayPostList[0].title}
                    </div>
                  )}
                  {/* Flag badge */}
                  {flags.length > 0 && inMonth && (
                    <div className="absolute top-1 right-1 text-[8px]">{flags[0].split(" ")[0]}</div>
                  )}
                  {/* Post count dots */}
                  {dotColors.length > 0 && inMonth && (
                    <div className="absolute bottom-1.5 right-1.5 flex gap-[2px]">
                      {dotColors.slice(0, 4).map((c, i) => (
                        <div key={i} className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  )}
                  {dayPostList.length > 1 && inMonth && dotColors.length === 0 && (
                    <div className="absolute bottom-1.5 right-1.5 text-[8px] text-foreground-muted font-medium">
                      {dayPostList.length}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Slide-out detail panel */}
        {selectedDate && (
          <div className="w-[40%] max-w-[440px] min-w-[300px] border-l border-border ml-2 pl-4 overflow-y-auto">
            {/* Panel header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                {selectedPhase && (
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full inline-block mb-2"
                    style={{ backgroundColor: phaseBg(selectedPhase.color), color: phaseText(selectedPhase.color) }}
                  >
                    {selectedPhase.name}
                  </span>
                )}
                <div className="text-lg font-heading font-semibold">
                  {format(selectedDate, "MMM d")}
                </div>
                <div className="text-xs text-foreground-muted mt-0.5">
                  {selectedPosts.length} post{selectedPosts.length !== 1 ? "s" : ""}
                  {selectedFlags.length > 0 && ` · ${selectedFlags[0]}`}
                </div>
              </div>
              <div className="flex items-start gap-3">
                {(() => {
                  const countdown = getCountdown();
                  if (!countdown) return null;
                  return (
                    <div className="text-right">
                      <div className="text-2xl font-medium">{countdown.days}</div>
                      <div className="text-[9px] text-foreground-muted">
                        {countdown.days === 0 ? "event day" : countdown.days === 1 ? "day to go" : "days to go"}
                      </div>
                    </div>
                  );
                })()}
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-1 rounded hover:bg-surface-hover text-foreground-muted hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Posts for this day */}
            <div className="space-y-2">
              {selectedPosts.map((post) => {
                const phase = post.phaseId ? phaseMap.get(post.phaseId) : null;
                const expanded = expandedPostId === post.id;
                const statusConf = STATUS_CONFIG.find((s) => s.key === post.status) ?? STATUS_CONFIG[0];

                return (
                  <div
                    key={post.id}
                    className="bg-surface border border-border rounded-lg p-3 transition-all"
                  >
                    {/* Top row: platform + title + status dropdown */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <button
                        onClick={() => setExpandedPostId(expanded ? null : post.id)}
                        className="flex items-center gap-2 min-w-0 flex-1 text-left"
                      >
                        <span className="text-sm shrink-0">{platformEmoji[post.platform] ?? "📝"}</span>
                        <span className="text-sm font-medium truncate">{post.title}</span>
                      </button>
                      {/* Status dropdown */}
                      <select
                        value={post.status}
                        onChange={(e) => handleInlineStatus(post.id, e.target.value as PostStatus)}
                        disabled={isViewer}
                        className="appearance-none text-[10px] font-medium px-2 py-0.5 rounded-full border-none cursor-pointer focus:outline-none"
                        style={{
                          backgroundColor: statusConf.color + "26",
                          color: statusConf.color,
                        }}
                      >
                        {STATUS_CONFIG.map((s) => (
                          <option key={s.key} value={s.key}>{s.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-1.5 text-[10px] text-foreground-muted flex-wrap">
                      {phase && (
                        <>
                          <span
                            className="px-1.5 py-0.5 rounded font-medium"
                            style={{ backgroundColor: phaseBg(phase.color), color: phaseText(phase.color) }}
                          >
                            {phase.name}
                          </span>
                          <span>·</span>
                        </>
                      )}
                      {post.assignee && <span>👤 {post.assignee}</span>}
                      {post.priority && post.priority !== "medium" && (
                        <>
                          <span>·</span>
                          <span className={post.priority === "high" ? "text-amber-400" : post.priority === "urgent" ? "text-red-400" : ""}>
                            ● {post.priority.charAt(0).toUpperCase() + post.priority.slice(1)}
                          </span>
                        </>
                      )}
                      {post.flag && (
                        <>
                          <span>·</span>
                          <span>{post.flag}</span>
                        </>
                      )}
                    </div>

                    {/* Expanded: brief fields or caption */}
                    {expanded && (
                      <div className="mt-3 pt-3 border-t border-border space-y-2">
                        {post.briefMode ? (
                          <>
                            {post.setting && (
                              <div>
                                <div className="text-[9px] font-semibold text-foreground-muted uppercase tracking-wider mb-0.5">Setting</div>
                                <div className="text-xs leading-relaxed">{post.setting}</div>
                              </div>
                            )}
                            {post.hook && (
                              <div>
                                <div className="text-[9px] font-semibold text-foreground-muted uppercase tracking-wider mb-0.5">Opening Hook</div>
                                <div className="text-xs leading-relaxed">{post.hook}</div>
                              </div>
                            )}
                            {post.body && (
                              <div>
                                <div className="text-[9px] font-semibold text-foreground-muted uppercase tracking-wider mb-0.5">Body</div>
                                <div className="text-xs leading-relaxed">{post.body}</div>
                              </div>
                            )}
                            {post.closingHook && (
                              <div className="border-l-2 border-border pl-2">
                                <div className="text-[9px] font-semibold text-foreground-muted uppercase tracking-wider mb-0.5">Closing Hook</div>
                                <div className="text-xs leading-relaxed">{post.closingHook}</div>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            {post.caption && (
                              <div>
                                <div className="text-[9px] font-semibold text-foreground-muted uppercase tracking-wider mb-0.5">Caption</div>
                                <div className="text-xs leading-relaxed">{post.caption}</div>
                              </div>
                            )}
                            {post.notes && (
                              <div>
                                <div className="text-[9px] font-semibold text-foreground-muted uppercase tracking-wider mb-0.5">Notes</div>
                                <div className="text-xs leading-relaxed">{post.notes}</div>
                              </div>
                            )}
                          </>
                        )}
                        {!isViewer && (
                          <button
                            onClick={() => setEditing(post)}
                            className="text-xs text-magenta hover:text-magenta/80 font-medium transition-colors"
                          >
                            Edit full post →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* New post button */}
              {!isViewer && (
                <button
                  onClick={() => setShowNew(true)}
                  className="w-full py-3 border border-dashed border-border rounded-lg text-xs font-medium text-foreground-muted hover:text-foreground hover:border-foreground-muted transition-colors"
                >
                  + New Post
                </button>
              )}

              {selectedPosts.length === 0 && (
                <div className="text-center py-8 text-sm text-foreground-muted">
                  No posts scheduled for this day
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <EditPostModal
          post={{
            title: editing.title, platform: editing.platform, postType: editing.postType,
            status: editing.status, priority: editing.priority, assignee: editing.assignee,
            event: editing.event, scheduledDate: editing.scheduledDate, scheduledTime: editing.scheduledTime,
            caption: editing.caption, notes: editing.notes, tags: editing.tags,
            linkedAssetIds: editing.linkedAssetIds, phaseId: editing.phaseId ?? "",
            briefMode: editing.briefMode, setting: editing.setting, hook: editing.hook,
            body: editing.body, closingHook: editing.closingHook, flag: editing.flag,
          }}
          statusOptions={STATUS_OPTIONS}
          onSave={handleSaveEdit}
          onDelete={() => { deletePost(editing.id); setEditing(null); }}
          onClose={() => setEditing(null)}
          availableAssets={availableAssets}
          folders={folders}
          eventOptions={eventOptions}
          assigneeOptions={assigneeOptions}
          allPhases={campaignPhases}
          allFlags={campaignFlags}
          campaigns={campaigns}
          readOnly={isViewer}
        />
      )}

      {/* New post modal */}
      {showNew && !isViewer && (
        <EditPostModal
          post={newPostForDay()}
          statusOptions={STATUS_OPTIONS}
          onSave={handleCreatePost}
          onClose={() => setShowNew(false)}
          modalTitle="New Post"
          saveLabel="Create Post"
          availableAssets={availableAssets}
          folders={folders}
          eventOptions={eventOptions}
          assigneeOptions={assigneeOptions}
          allPhases={campaignPhases}
          allFlags={campaignFlags}
          campaigns={campaigns}
        />
      )}
    </div>
  );
}

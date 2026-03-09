import { useState, useMemo } from "react";
import { GripVertical, Plus } from "lucide-react";
import EditPostModal, { type PostData, type AssetOption, emptyPost } from "../components/EditPostModal";
import { useData } from "../context/DataContext";
import { useIsViewer } from "../context/RoleContext";
import type { Post, PostStatus } from "../types/data";

type Stage = PostStatus;

const STAGE_CONFIG: { key: Stage; label: string; color: string }[] = [
  { key: "idea", label: "Idea", color: "#8B5CF6" },
  { key: "allocated", label: "Allocated", color: "#3B82F6" },
  { key: "editing", label: "Editing", color: "#E8652B" },
  { key: "approved", label: "Approved", color: "#10B981" },
  { key: "posted", label: "Posted", color: "#22C55E" },
];

const STATUS_OPTIONS = STAGE_CONFIG.map((s) => ({
  key: s.key,
  label: s.label,
  color: s.color,
  bg: `${s.color}26`,
}));

const platformColors: Record<string, string> = {
  Instagram: "#E1306C", TikTok: "#00F2EA", X: "#FFFFFF", Reddit: "#FF4500", YouTube: "#FF0000",
};

const priorityColors: Record<string, string> = {
  low: "#6B5E73", medium: "#3B82F6", high: "#F59E0B", urgent: "#EF4444",
};

export default function AdminPipeline() {
  const isViewer = useIsViewer();
  const { posts, assets, campaigns, teamMembers, updatePost, addPost, deletePost } = useData();

  const [dragItem, setDragItem] = useState<{ post: Post; from: Stage } | null>(null);
  const [editing, setEditing] = useState<Post | null>(null);
  const [showNew, setShowNew] = useState(false);

  // Group posts by stage
  const pipeline = useMemo(() => {
    const grouped: Record<Stage, Post[]> = { idea: [], allocated: [], editing: [], approved: [], posted: [] };
    for (const p of posts) {
      if (grouped[p.status]) grouped[p.status].push(p);
    }
    return grouped;
  }, [posts]);

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

  const handleDragStart = (post: Post, from: Stage) => setDragItem({ post, from });

  const handleDrop = (to: Stage) => {
    if (!dragItem || dragItem.from === to) { setDragItem(null); return; }
    updatePost(dragItem.post.id, { status: to });
    setDragItem(null);
  };

  const handleSaveEdit = (updated: PostData) => {
    if (!editing) return;
    const matched = campaigns.find((c) => c.name === updated.event);
    updatePost(editing.id, {
      title: updated.title, platform: updated.platform, postType: updated.postType,
      status: updated.status as PostStatus, priority: updated.priority, assignee: updated.assignee,
      event: updated.event, scheduledDate: updated.scheduledDate, scheduledTime: updated.scheduledTime,
      caption: updated.caption, notes: updated.notes, tags: updated.tags, linkedAssetIds: updated.linkedAssetIds,
      campaignId: matched?.id ?? null,
    });
    setEditing(null);
  };

  const handleDeletePost = () => {
    if (!editing) return;
    deletePost(editing.id);
    setEditing(null);
  };

  const handleCreatePost = (data: PostData) => {
    if (!data.title.trim()) return;
    const matched = campaigns.find((c) => c.name === data.event);
    addPost({
      title: data.title, platform: data.platform, postType: data.postType,
      status: data.status as PostStatus, priority: data.priority, assignee: data.assignee,
      event: data.event, scheduledDate: data.scheduledDate, scheduledTime: data.scheduledTime,
      caption: data.caption, notes: data.notes, tags: data.tags, linkedAssetIds: data.linkedAssetIds,
      campaignId: matched?.id ?? null,
    });
    setShowNew(false);
  };

  const totalPosts = posts.length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="font-heading text-2xl font-bold">Content Pipeline</h1>
        <div className="flex items-center gap-3">
          <p className="text-sm text-foreground-muted">{totalPosts} posts across {STAGE_CONFIG.length} stages</p>
          {!isViewer && (
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-2 bg-magenta hover:bg-magenta/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" /> New Post
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGE_CONFIG.map(({ key, label, color }) => (
          <div
            key={key}
            className="min-w-[240px] w-[240px] shrink-0"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(key)}
          >
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="font-heading text-sm font-semibold">{label}</span>
              <span className="ml-auto text-xs text-foreground-muted bg-ink/50 px-2 py-0.5 rounded-full">
                {pipeline[key].length}
              </span>
            </div>
            <div className="bg-ink/50 border border-border rounded-xl p-2 min-h-[200px] space-y-2">
              {pipeline[key].map((item) => (
                <div
                  key={item.id}
                  draggable={!isViewer}
                  onDragStart={() => !isViewer && handleDragStart(item, key)}
                  onClick={() => setEditing(item)}
                  className={`bg-surface border border-border rounded-lg p-3 hover:border-magenta/30 transition-colors ${isViewer ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"}`}
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="w-3 h-3 text-foreground-muted/40 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: priorityColors[item.priority] }} />
                        <p className="text-sm font-medium truncate">{item.title}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="flex items-center gap-1 text-[10px] text-foreground-muted">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: platformColors[item.platform] ?? "#fff" }} />
                          {item.platform}
                        </span>
                        <span className="text-[10px] text-foreground-muted capitalize">{item.postType}</span>
                      </div>
                      <p className="text-[10px] text-foreground-muted mt-1">{item.assignee}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
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

      {showNew && !isViewer && (
        <EditPostModal
          post={emptyPost()}
          statusOptions={STATUS_OPTIONS}
          onSave={handleCreatePost}
          onClose={() => setShowNew(false)}
          modalTitle="New Post"
          saveLabel="Create Post"
          availableAssets={availableAssets}
          eventOptions={eventOptions}
          assigneeOptions={assigneeOptions}
        />
      )}
    </div>
  );
}

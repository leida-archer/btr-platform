import { useState } from "react";
import { X, Trash2, Image, Film, FileText, Music, Grid, List, Check, Plus } from "lucide-react";
import Dropdown from "./Dropdown";

export interface PostData {
  title: string;
  platform: string;
  postType: string;
  status: string;
  priority: string;
  assignee: string;
  event: string;
  scheduledDate: string;
  scheduledTime: string;
  caption: string;
  notes: string;
  tags: string[];
  linkedAssetIds: string[];
}

export interface AssetOption {
  id: string;
  name: string;
  type: "image" | "video" | "document" | "audio";
  thumbnail?: string;
}

interface StatusOption {
  key: string;
  label: string;
  color: string;
  bg: string;
}

interface EditPostModalProps {
  post: PostData;
  statusOptions: StatusOption[];
  onSave: (updated: PostData) => void;
  onDelete?: () => void;
  onClose: () => void;
  modalTitle?: string;
  saveLabel?: string;
  availableAssets?: AssetOption[];
  eventOptions?: { value: string; label: string }[];
  assigneeOptions?: { value: string; label: string }[];
  readOnly?: boolean;
}

const PLATFORM_OPTIONS = [
  { value: "Instagram", label: "Instagram" },
  { value: "TikTok", label: "TikTok" },
  { value: "X", label: "X" },
  { value: "Reddit", label: "Reddit" },
  { value: "YouTube", label: "YouTube" },
];

const POST_TYPE_OPTIONS = [
  { value: "reel", label: "Reel" },
  { value: "carousel", label: "Carousel" },
  { value: "story", label: "Story" },
  { value: "static", label: "Static" },
  { value: "text", label: "Text" },
  { value: "comment", label: "Comment" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const DEFAULT_ASSIGNEE_OPTIONS = [
  { value: "Archer", label: "Archer" },
];

const assetTypeIcons = { image: Image, video: Film, document: FileText, audio: Music };
const assetTypeColors: Record<string, string> = { image: "#E1306C", video: "#00F2EA", document: "#F2A922", audio: "#8B5CF6" };

const inputClass = "w-full bg-ink/50 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-magenta";

export function emptyPost(): PostData {
  return {
    title: "", platform: "Instagram", postType: "reel", status: "idea", priority: "medium",
    assignee: "Archer", event: "", scheduledDate: "", scheduledTime: "", caption: "", notes: "",
    tags: [], linkedAssetIds: [],
  };
}

export default function EditPostModal({
  post, statusOptions, onSave, onDelete, onClose, modalTitle = "Edit Post", saveLabel = "Save",
  availableAssets, eventOptions, assigneeOptions, readOnly,
}: EditPostModalProps) {
  const ASSIGNEE_OPTIONS = assigneeOptions ?? DEFAULT_ASSIGNEE_OPTIONS;
  const [title, setTitle] = useState(post.title);
  const [platform, setPlatform] = useState(post.platform);
  const [postType, setPostType] = useState(post.postType);
  const [status, setStatus] = useState(post.status);
  const [priority, setPriority] = useState(post.priority);
  const [assignee, setAssignee] = useState(post.assignee);
  const [event, setEvent] = useState(post.event);
  const [scheduledDate, setScheduledDate] = useState(post.scheduledDate);
  const [scheduledTime, setScheduledTime] = useState(post.scheduledTime);
  const [caption, setCaption] = useState(post.caption);
  const [notes, setNotes] = useState(post.notes);
  const [tags, setTags] = useState<string[]>(post.tags);
  const [newTag, setNewTag] = useState("");
  const [linkedAssetIds, setLinkedAssetIds] = useState<string[]>(post.linkedAssetIds);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [assetPickerView, setAssetPickerView] = useState<"grid" | "list">("grid");
  const [assetSearch, setAssetSearch] = useState("");

  const currentStatus = statusOptions.find((s) => s.key === post.status);
  const statusDropdownOptions = statusOptions.map((s) => ({ value: s.key, label: s.label }));
  const eventDropdownOptions = eventOptions ?? [{ value: "", label: "None" }];

  const linked = availableAssets?.filter((a) => linkedAssetIds.includes(a.id)) ?? [];

  const [titleError, setTitleError] = useState(false);

  const handleSave = () => {
    if (!title.trim()) { setTitleError(true); return; }
    setTitleError(false);
    onSave({ title, platform, postType, status, priority, assignee, event, scheduledDate, scheduledTime, caption, notes, tags, linkedAssetIds });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col max-sm:max-w-none max-sm:max-h-none max-sm:h-full max-sm:rounded-none">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-lg font-semibold">{modalTitle}</h2>
            {currentStatus && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: currentStatus.bg, color: currentStatus.color }}
              >
                {currentStatus.label}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-foreground-muted hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">Title</label>
            <input type="text" value={title} onChange={(e) => { setTitle(e.target.value); if (titleError) setTitleError(false); }} placeholder="Post title..." className={inputClass + (titleError ? " ring-1 ring-red-500 border-red-500" : "")} disabled={readOnly} />
            {titleError && <p className="text-xs text-red-500 mt-1">Title is required</p>}
          </div>

          {/* Platform + Post Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">Platform</label>
              <Dropdown label="Platform" options={PLATFORM_OPTIONS} value={platform} onChange={setPlatform} fullWidth disabled={readOnly} />
            </div>
            <div>
              <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">Post Type</label>
              <Dropdown label="Post Type" options={POST_TYPE_OPTIONS} value={postType} onChange={setPostType} fullWidth disabled={readOnly} />
            </div>
          </div>

          {/* Stage + Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">Stage</label>
              <Dropdown label="Stage" options={statusDropdownOptions} value={status} onChange={setStatus} fullWidth disabled={readOnly} />
            </div>
            <div>
              <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">Priority</label>
              <Dropdown label="Priority" options={PRIORITY_OPTIONS} value={priority} onChange={setPriority} fullWidth disabled={readOnly} />
            </div>
          </div>

          {/* Assignee + Event */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">Assignee</label>
              <Dropdown label="Assignee" options={ASSIGNEE_OPTIONS} value={assignee} onChange={setAssignee} fullWidth disabled={readOnly} />
            </div>
            <div>
              <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">Event</label>
              <Dropdown label="Event" options={eventDropdownOptions} value={event} onChange={setEvent} fullWidth disabled={readOnly} />
            </div>
          </div>

          {/* Scheduled Date + Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">Scheduled Date</label>
              <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className={inputClass + " [color-scheme:dark]"} disabled={readOnly} />
            </div>
            <div>
              <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">Scheduled Time</label>
              <input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className={inputClass + " [color-scheme:dark]"} disabled={readOnly} />
            </div>
          </div>

          {/* Caption */}
          <div>
            <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">Caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Post caption / copy..."
              rows={3}
              className={inputClass + " resize-none"}
              disabled={readOnly}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes..."
              rows={2}
              className={inputClass + " resize-none"}
              disabled={readOnly}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 text-xs bg-ink/50 border border-border rounded-full px-2.5 py-1 text-foreground-muted">
                  #{tag}
                  {!readOnly && <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))} className="hover:text-coral">
                    <X className="w-3 h-3" />
                  </button>}
                </span>
              ))}
              {tags.length === 0 && <span className="text-xs text-foreground-muted">No tags</span>}
            </div>
            {!readOnly && (
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const tag = newTag.trim().toLowerCase();
                      if (tag && !tags.includes(tag)) setTags([...tags, tag]);
                      setNewTag("");
                    }
                  }}
                  placeholder="Add tag..."
                  className="flex-1 bg-ink/50 border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-magenta"
                />
                <button
                  type="button"
                  onClick={() => {
                    const tag = newTag.trim().toLowerCase();
                    if (tag && !tags.includes(tag)) setTags([...tags, tag]);
                    setNewTag("");
                  }}
                  className="text-foreground-muted hover:text-foreground border border-border rounded-lg px-2 py-1.5"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Linked Assets */}
          {availableAssets && availableAssets.length > 0 && (
            <div>
              <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">
                Linked Assets ({linked.length})
              </label>
              {linked.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {linked.map((a) => {
                    const Icon = assetTypeIcons[a.type] ?? FileText;
                    return (
                      <span
                        key={a.id}
                        className="inline-flex items-center gap-1.5 text-xs bg-ink/50 border border-border rounded-lg px-2.5 py-1.5 text-foreground-muted"
                      >
                        {a.thumbnail ? (
                          <img src={a.thumbnail} alt="" className="w-4 h-4 rounded object-cover" />
                        ) : (
                          <Icon className="w-3.5 h-3.5" style={{ color: assetTypeColors[a.type] }} />
                        )}
                        <span className="truncate max-w-[120px]">{a.name}</span>
                        {!readOnly && <button onClick={() => setLinkedAssetIds(linkedAssetIds.filter((id) => id !== a.id))} className="hover:text-coral ml-0.5">
                          <X className="w-3 h-3" />
                        </button>}
                      </span>
                    );
                  })}
                </div>
              )}
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => { setShowAssetPicker(true); setAssetSearch(""); }}
                  className="flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground border border-border rounded-lg px-3 py-2 w-full justify-center transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Manage Assets
                </button>
              )}
            </div>
          )}

          {/* Actions */}
          {!readOnly && (
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                className="flex-1 bg-magenta hover:bg-magenta/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {saveLabel}
              </button>
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="flex items-center gap-1.5 text-foreground-muted hover:text-coral border border-border rounded-lg px-3 py-2 text-sm transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Asset Picker Popup */}
      {showAssetPicker && availableAssets && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={() => setShowAssetPicker(false)} />
          <div className="relative bg-surface border border-border rounded-xl w-full max-w-xl max-h-[80vh] flex flex-col max-sm:max-w-none max-sm:max-h-none max-sm:h-full max-sm:rounded-none">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              <h3 className="font-heading text-sm font-semibold">Select Assets</h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setAssetPickerView("grid")}
                    className={`p-1.5 rounded-lg transition-colors ${assetPickerView === "grid" ? "bg-magenta/15 text-magenta" : "text-foreground-muted hover:text-foreground"}`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setAssetPickerView("list")}
                    className={`p-1.5 rounded-lg transition-colors ${assetPickerView === "list" ? "bg-magenta/15 text-magenta" : "text-foreground-muted hover:text-foreground"}`}
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button onClick={() => setShowAssetPicker(false)} className="text-foreground-muted hover:text-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="px-4 pt-3 pb-2 shrink-0">
              <input
                type="text"
                placeholder="Search assets..."
                value={assetSearch}
                onChange={(e) => setAssetSearch(e.target.value)}
                className="w-full bg-ink/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-magenta"
              />
            </div>

            {/* Asset List/Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {(() => {
                const filtered = availableAssets.filter((a) =>
                  !assetSearch || a.name.toLowerCase().includes(assetSearch.toLowerCase())
                );

                if (assetPickerView === "grid") {
                  return (
                    <div className="grid grid-cols-3 gap-3">
                      {filtered.map((a) => {
                        const isLinked = linkedAssetIds.includes(a.id);
                        const Icon = assetTypeIcons[a.type] ?? FileText;
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => setLinkedAssetIds(isLinked ? linkedAssetIds.filter((id) => id !== a.id) : [...linkedAssetIds, a.id])}
                            className={`relative bg-ink/30 border rounded-xl overflow-hidden text-left transition-colors ${
                              isLinked ? "border-magenta" : "border-border hover:border-magenta/30"
                            }`}
                          >
                            <div className="aspect-square bg-ink/50 flex items-center justify-center overflow-hidden">
                              {a.thumbnail ? (
                                <img src={a.thumbnail} alt={a.name} className="w-full h-full object-cover" />
                              ) : (
                                <Icon className="w-8 h-8" style={{ color: assetTypeColors[a.type], opacity: 0.5 }} />
                              )}
                            </div>
                            <div className="p-2">
                              <p className="text-xs font-medium truncate">{a.name}</p>
                              <span className="text-[10px] text-foreground-muted capitalize">{a.type}</span>
                            </div>
                            {isLinked && (
                              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-magenta flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                }

                return (
                  <div className="border border-border rounded-xl overflow-hidden">
                    {filtered.map((a, i) => {
                      const isLinked = linkedAssetIds.includes(a.id);
                      const Icon = assetTypeIcons[a.type] ?? FileText;
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => setLinkedAssetIds(isLinked ? linkedAssetIds.filter((id) => id !== a.id) : [...linkedAssetIds, a.id])}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                            i > 0 ? "border-t border-border" : ""
                          } ${isLinked ? "bg-magenta/5" : "hover:bg-ink/30"}`}
                        >
                          <div className="w-9 h-9 rounded-lg bg-ink/50 flex items-center justify-center shrink-0 overflow-hidden">
                            {a.thumbnail ? (
                              <img src={a.thumbnail} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Icon className="w-4 h-4" style={{ color: assetTypeColors[a.type], opacity: 0.6 }} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{a.name}</p>
                            <span className="text-[10px] text-foreground-muted capitalize">{a.type}</span>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isLinked ? "bg-magenta border-magenta" : "border-border"
                          }`}>
                            {isLinked && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border shrink-0">
              <p className="text-xs text-foreground-muted">{linkedAssetIds.length} asset{linkedAssetIds.length !== 1 ? "s" : ""} linked</p>
              <button
                onClick={() => setShowAssetPicker(false)}
                className="bg-magenta hover:bg-magenta/90 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

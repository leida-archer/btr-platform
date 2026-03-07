import { useState } from "react";
import { X } from "lucide-react";
import Dropdown from "./Dropdown";

interface NewPostModalProps {
  open: boolean;
  onClose: () => void;
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

const STATUS_OPTIONS = [
  { value: "idea", label: "Idea" },
  { value: "editing", label: "Editing" },
  { value: "approved", label: "Approved" },
  { value: "posted", label: "Posted" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const ASSIGNEE_OPTIONS = [
  { value: "Archer", label: "Archer" },
  { value: "Jordan", label: "Jordan" },
  { value: "Riley", label: "Riley" },
];

const EVENT_OPTIONS = [
  { value: "", label: "None" },
  { value: "BtR San Diego", label: "BtR San Diego" },
  { value: "BtR Los Angeles", label: "BtR Los Angeles" },
  { value: "BtR Seattle", label: "BtR Seattle" },
  { value: "BtR Portland", label: "BtR Portland" },
];

const inputClass = "w-full bg-ink/50 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-magenta";

export default function NewPostModal({ open, onClose }: NewPostModalProps) {
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [postType, setPostType] = useState("reel");
  const [status, setStatus] = useState("idea");
  const [priority, setPriority] = useState("medium");
  const [assignee, setAssignee] = useState("Archer");
  const [event, setEvent] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [caption, setCaption] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setTitle(""); setPlatform("Instagram"); setPostType("reel"); setStatus("idea");
      setPriority("medium"); setAssignee("Archer"); setEvent("");
      setScheduledDate(""); setScheduledTime(""); setCaption(""); setNotes("");
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <h2 className="font-heading text-lg font-semibold">New Post</h2>
          <button onClick={onClose} className="text-foreground-muted hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-10 text-center">
            <p className="font-heading text-lg font-semibold text-magenta mb-2">Post Created</p>
            <p className="text-sm text-foreground-muted">"{title}" has been added to the pipeline.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
            <div>
              <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Post title..." required className={inputClass} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">Platform</label>
                <Dropdown label="Platform" options={PLATFORM_OPTIONS} value={platform} onChange={setPlatform} fullWidth />
              </div>
              <div>
                <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">Post Type</label>
                <Dropdown label="Post Type" options={POST_TYPE_OPTIONS} value={postType} onChange={setPostType} fullWidth />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">Stage</label>
                <Dropdown label="Stage" options={STATUS_OPTIONS} value={status} onChange={setStatus} fullWidth />
              </div>
              <div>
                <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">Priority</label>
                <Dropdown label="Priority" options={PRIORITY_OPTIONS} value={priority} onChange={setPriority} fullWidth />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">Assignee</label>
                <Dropdown label="Assignee" options={ASSIGNEE_OPTIONS} value={assignee} onChange={setAssignee} fullWidth />
              </div>
              <div>
                <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">Event</label>
                <Dropdown label="Event" options={EVENT_OPTIONS} value={event} onChange={setEvent} fullWidth />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">Scheduled Date</label>
                <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className={inputClass + " [color-scheme:dark]"} />
              </div>
              <div>
                <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">Scheduled Time</label>
                <input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className={inputClass + " [color-scheme:dark]"} />
              </div>
            </div>

            <div>
              <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">Caption</label>
              <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Post caption / copy..." rows={3} className={inputClass + " resize-none"} />
            </div>

            <div>
              <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes..." rows={2} className={inputClass + " resize-none"} />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-foreground-muted hover:text-foreground transition-colors">Cancel</button>
              <button type="submit" className="bg-magenta hover:bg-magenta/90 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">Create Post</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

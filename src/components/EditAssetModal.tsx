import { useState, useRef } from "react";
import { X, Trash2, Download, RefreshCw, Plus, Image, Film, FileText, Music } from "lucide-react";
import Dropdown from "./Dropdown";

export interface AssetData {
  name: string;
  type: "image" | "video" | "document" | "audio";
  size?: string;
  date?: string;
  tags?: string[];
  thumbnail?: string;
}

interface EditAssetModalProps {
  asset: AssetData;
  onSave: (updated: { name: string; tags: string[] }) => void;
  onDelete: () => void;
  onClose: () => void;
  onReplace?: (file: File) => void;
  readOnly?: boolean;
}

const typeConfig = {
  image: { icon: Image, color: "#E1306C", bg: "rgba(225,48,108,0.15)" },
  video: { icon: Film, color: "#00F2EA", bg: "rgba(0,242,234,0.15)" },
  document: { icon: FileText, color: "#F2A922", bg: "rgba(242,169,34,0.15)" },
  audio: { icon: Music, color: "#8B5CF6", bg: "rgba(139,92,246,0.15)" },
};

const TYPE_OPTIONS = [
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
  { value: "document", label: "Document" },
  { value: "audio", label: "Audio" },
];

const inputClass = "w-full bg-ink/50 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-magenta";

export default function EditAssetModal({ asset, onSave, onDelete, onClose, onReplace, readOnly }: EditAssetModalProps) {
  const [name, setName] = useState(asset.name);
  const [type, setType] = useState(asset.type);
  const [tags, setTags] = useState(asset.tags ?? []);
  const [newTag, setNewTag] = useState("");
  const replaceRef = useRef<HTMLInputElement>(null);

  const tc = typeConfig[type];
  const TypeIcon = tc.icon;

  const addTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !tags.includes(tag)) setTags([...tags, tag]);
    setNewTag("");
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const handleDownload = async () => {
    const url = asset.thumbnail;
    if (!url) return;
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = asset.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch {
      // Fallback: open in new tab
      window.open(url, "_blank");
    }
  };

  const handleReplace = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onReplace) onReplace(file);
    e.target.value = "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-xl w-full max-w-md max-h-[90vh] flex flex-col max-sm:max-w-none max-sm:max-h-none max-sm:h-full max-sm:rounded-none">
        {/* Preview */}
        <div className="relative aspect-video bg-ink/50 flex items-center justify-center overflow-hidden shrink-0 rounded-t-xl">
          {asset.thumbnail && type === "video" ? (
            <video src={asset.thumbnail} className="w-full h-full object-cover" controls muted />
          ) : asset.thumbnail && type === "image" ? (
            <img src={asset.thumbnail} alt={asset.name} className="w-full h-full object-cover" />
          ) : (
            <TypeIcon className="w-12 h-12" style={{ color: tc.color, opacity: 0.5 }} />
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-ink/60 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-ink/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: tc.bg, color: tc.color }}
            >
              {type}
            </span>
            <button onClick={onClose} className="text-foreground-muted hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} disabled={readOnly} />
          </div>

          {/* Type + Meta */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">Type</label>
              <Dropdown label="Type" options={TYPE_OPTIONS} value={type} onChange={(v) => setType(v as AssetData["type"])} fullWidth disabled={readOnly} />
            </div>
            {asset.size && (
              <div>
                <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1">Size</label>
                <p className="text-sm mt-2">{asset.size}</p>
              </div>
            )}
          </div>

          {asset.date && (
            <div>
              <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1">Uploaded</label>
              <p className="text-sm">{asset.date}</p>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 text-xs bg-ink/50 border border-border rounded-full px-2.5 py-1 text-foreground-muted">
                  #{tag}
                  {!readOnly && <button onClick={() => removeTag(tag)} className="hover:text-coral"><X className="w-3 h-3" /></button>}
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
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="Add tag..."
                  className="flex-1 bg-ink/50 border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-magenta"
                />
                <button onClick={addTag} className="text-foreground-muted hover:text-foreground border border-border rounded-lg px-2 py-1.5">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <input ref={replaceRef} type="file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.zip" onChange={handleReplace} className="hidden" />
          <div className="flex gap-2 pt-2">
            {!readOnly && (
              <button onClick={() => onSave({ name, tags })} className="flex-1 bg-magenta hover:bg-magenta/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Save
              </button>
            )}
            {asset.thumbnail && (
              <button onClick={handleDownload} className={`flex items-center gap-1.5 text-foreground-muted hover:text-foreground border border-border rounded-lg px-3 py-2 text-sm transition-colors${readOnly ? " flex-1 justify-center" : ""}`} title="Download">
                <Download className="w-3.5 h-3.5" /> Download
              </button>
            )}
            {!readOnly && onReplace && (
              <button onClick={() => replaceRef.current?.click()} className="flex items-center gap-1.5 text-foreground-muted hover:text-foreground border border-border rounded-lg px-3 py-2 text-sm transition-colors" title="Replace file">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
            {!readOnly && (
              <button onClick={onDelete} className="flex items-center gap-1.5 text-foreground-muted hover:text-coral border border-border rounded-lg px-3 py-2 text-sm transition-colors" title="Delete">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

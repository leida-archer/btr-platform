import { useState, useRef } from "react";
import { Upload, Grid, List, Search, Filter, Image, Film, FileText, Music } from "lucide-react";
import EditAssetModal from "../components/EditAssetModal";
import { useData } from "../context/DataContext";
import type { AssetType } from "../types/data";

const typeConfig = {
  image: { icon: Image, color: "#E1306C", bg: "rgba(225,48,108,0.15)" },
  video: { icon: Film, color: "#00F2EA", bg: "rgba(0,242,234,0.15)" },
  document: { icon: FileText, color: "#F2A922", bg: "rgba(242,169,34,0.15)" },
  audio: { icon: Music, color: "#8B5CF6", bg: "rgba(139,92,246,0.15)" },
};

export default function AdminAssets() {
  const { assets, addAsset, updateAsset, deleteAsset } = useData();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selected = selectedId ? assets.find((a) => a.id === selectedId) ?? null : null;

  const filtered = assets.filter((a) => {
    if (filterType !== "all" && a.type !== filterType) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.tags.some((t) => t.includes(search.toLowerCase()))) return false;
    return true;
  });

  const stats = {
    total: assets.length,
    images: assets.filter((a) => a.type === "image").length,
    videos: assets.filter((a) => a.type === "video").length,
    documents: assets.filter((a) => a.type === "document").length,
    audio: assets.filter((a) => a.type === "audio").length,
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((f) => {
      let type: AssetType = "document";
      if (f.type.startsWith("image/")) type = "image";
      else if (f.type.startsWith("video/")) type = "video";
      else if (f.type.startsWith("audio/")) type = "audio";
      const sizeMB = (f.size / 1024 / 1024).toFixed(1);
      addAsset({
        name: f.name, type, size: `${sizeMB} MB`,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        tags: ["uploaded"],
        thumbnail: type === "image" ? URL.createObjectURL(f) : undefined,
      });
    });
    e.target.value = "";
  };

  const handleSave = (updated: { name: string; tags: string[] }) => {
    if (!selected) return;
    updateAsset(selected.id, { name: updated.name, tags: updated.tags });
    setSelectedId(null);
  };

  const handleDelete = () => {
    if (!selected) return;
    deleteAsset(selected.id);
    setSelectedId(null);
  };

  const handleReplace = (file: File) => {
    if (!selected) return;
    let type: AssetType = "document";
    if (file.type.startsWith("image/")) type = "image";
    else if (file.type.startsWith("video/")) type = "video";
    else if (file.type.startsWith("audio/")) type = "audio";
    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    const thumbnail = type === "image" ? URL.createObjectURL(file) : undefined;
    updateAsset(selected.id, { name: file.name, type, size: `${sizeMB} MB`, date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }), thumbnail });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="font-heading text-2xl font-bold">Assets</h1>
        <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.zip" onChange={handleUpload} className="hidden" />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 bg-magenta hover:bg-magenta/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0"
        >
          <Upload className="w-4 h-4" /> Upload
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        {[
          { label: "Total", value: stats.total, color: "#FFF8F0" },
          { label: "Images", value: stats.images, color: "#E1306C" },
          { label: "Videos", value: stats.videos, color: "#00F2EA" },
          { label: "Documents", value: stats.documents, color: "#F2A922" },
          { label: "Audio", value: stats.audio, color: "#8B5CF6" },
        ].map((s) => (
          <div key={s.label} className="bg-surface border border-border rounded-xl p-4">
            <p className="text-2xl font-heading font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-foreground-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted pointer-events-none" />
            <input type="text" placeholder="Search assets..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-ink/50 border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-magenta" />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="w-4 h-4 text-foreground-muted" />
            {["all", "image", "video", "document", "audio"].map((t) => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterType === t ? "bg-magenta/15 text-magenta" : "text-foreground-muted hover:text-foreground"}`}>
                {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1) + "s"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <button onClick={() => setView("grid")} className={`p-2 rounded-lg transition-colors ${view === "grid" ? "bg-magenta/15 text-magenta" : "text-foreground-muted hover:text-foreground"}`}>
              <Grid className="w-4 h-4" />
            </button>
            <button onClick={() => setView("list")} className={`p-2 rounded-lg transition-colors ${view === "list" ? "bg-magenta/15 text-magenta" : "text-foreground-muted hover:text-foreground"}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((asset) => {
            const tc = typeConfig[asset.type];
            const TypeIcon = tc.icon;
            return (
              <div key={asset.id} onClick={() => setSelectedId(asset.id)}
                className="bg-surface border border-border rounded-xl overflow-hidden hover:border-magenta/30 transition-colors cursor-pointer">
                <div className="aspect-square bg-ink/50 flex items-center justify-center overflow-hidden">
                  {asset.thumbnail ? <img src={asset.thumbnail} alt={asset.name} className="w-full h-full object-cover" />
                    : <TypeIcon className="w-10 h-10" style={{ color: tc.color, opacity: 0.5 }} />}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium truncate">{asset.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-foreground-muted">{asset.size}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: tc.bg, color: tc.color }}>{asset.type}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {filtered.map((asset, i) => {
            const tc = typeConfig[asset.type];
            const TypeIcon = tc.icon;
            return (
              <div key={asset.id} onClick={() => setSelectedId(asset.id)}
                className={`flex items-center gap-4 px-5 py-3 hover:bg-surface-hover transition-colors cursor-pointer ${i > 0 ? "border-t border-border" : ""}`}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: tc.bg }}>
                  <TypeIcon className="w-5 h-5" style={{ color: tc.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{asset.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {asset.tags.map((t) => <span key={t} className="text-[10px] text-foreground-muted">#{t}</span>)}
                  </div>
                </div>
                <span className="text-xs text-foreground-muted shrink-0">{asset.size}</span>
                <span className="text-xs text-foreground-muted shrink-0">{asset.date}</span>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <EditAssetModal
          asset={{ name: selected.name, type: selected.type, size: selected.size, date: selected.date, tags: selected.tags, thumbnail: selected.thumbnail }}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setSelectedId(null)}
          onReplace={handleReplace}
        />
      )}
    </div>
  );
}

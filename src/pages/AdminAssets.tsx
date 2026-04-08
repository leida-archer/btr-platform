import { useState, useRef, useMemo } from "react";
import { Upload, Grid, List, Search, Filter, Image, Film, FileText, Music, Calendar, X, FolderInput } from "lucide-react";
import { put } from "@vercel/blob/client";
import EditAssetModal from "../components/EditAssetModal";
import Dropdown from "../components/Dropdown";
import FolderTree from "../components/FolderTree";
import { useData } from "../context/DataContext";
import { useIsViewer } from "../context/RoleContext";
import type { AssetType } from "../types/data";

const typeConfig = {
  image: { icon: Image, color: "#E1306C", bg: "rgba(225,48,108,0.15)" },
  video: { icon: Film, color: "#00F2EA", bg: "rgba(0,242,234,0.15)" },
  document: { icon: FileText, color: "#F2A922", bg: "rgba(242,169,34,0.15)" },
  audio: { icon: Music, color: "#8B5CF6", bg: "rgba(139,92,246,0.15)" },
};

export default function AdminAssets() {
  const isViewer = useIsViewer();
  const {
    assets, addAsset, updateAsset, deleteAsset, moveAssetsToFolder,
    folders, addFolder, renameFolder, moveFolder, deleteFolder,
    posts, campaigns,
  } = useData();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterEvent, setFilterEvent] = useState<string>("all");
  const [filterPost, setFilterPost] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [multiSelect, setMultiSelect] = useState<Set<string>>(() => new Set());
  const [moveMenuOpen, setMoveMenuOpen] = useState(false);
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selected = selectedId ? assets.find((a) => a.id === selectedId) ?? null : null;

  // Build asset→event mapping from posts (posts have event + linkedAssetIds)
  const assetEventMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const post of posts) {
      if (!post.event) continue;
      for (const assetId of post.linkedAssetIds) {
        if (!map.has(assetId)) map.set(assetId, new Set());
        map.get(assetId)!.add(post.event);
      }
    }
    return map;
  }, [posts]);

  // Collect unique event names for the dropdown
  const eventOptions = useMemo(() => {
    const names = new Set<string>();
    campaigns.forEach((c) => names.add(c.name));
    posts.forEach((p) => { if (p.event) names.add(p.event); });
    return Array.from(names).sort();
  }, [campaigns, posts]);

  // Build asset→post mapping (posts have linkedAssetIds)
  const assetPostMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const post of posts) {
      for (const assetId of post.linkedAssetIds) {
        if (!map.has(assetId)) map.set(assetId, new Set());
        map.get(assetId)!.add(post.id);
      }
    }
    return map;
  }, [posts]);

  // Posts filtered by selected event
  const postOptions = useMemo(() => {
    if (filterEvent === "all") return [];
    return posts
      .filter((p) => p.event === filterEvent)
      .map((p) => ({ value: p.id, label: p.title }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [posts, filterEvent]);

  const handleEventChange = (val: string) => {
    setFilterEvent(val);
    setFilterPost("all");
  };

  // Count assets per folder (unfiltered totals) for sidebar display
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of assets) {
      if (a.folderId) counts[a.folderId] = (counts[a.folderId] ?? 0) + 1;
    }
    return counts;
  }, [assets]);

  const filtered = assets.filter((a) => {
    // Folder scope: null = show assets with no folder (root). Otherwise strict match.
    if (currentFolderId === null) {
      if (a.folderId) return false;
    } else {
      if (a.folderId !== currentFolderId) return false;
    }
    if (filterType !== "all" && a.type !== filterType) return false;
    if (filterEvent !== "all") {
      const events = assetEventMap.get(a.id);
      if (!events || !events.has(filterEvent)) return false;
    }
    if (filterPost !== "all") {
      const postIds = assetPostMap.get(a.id);
      if (!postIds || !postIds.has(filterPost)) return false;
    }
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.tags.some((t) => t.includes(search.toLowerCase()))) return false;
    return true;
  });

  const handleAssetClick = (e: React.MouseEvent, id: string) => {
    const isMulti = e.metaKey || e.ctrlKey;
    const isRange = e.shiftKey;
    if (isMulti) {
      e.preventDefault();
      setMultiSelect((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      setLastClickedId(id);
      return;
    }
    if (isRange && lastClickedId) {
      e.preventDefault();
      const ids = filtered.map((a) => a.id);
      const from = ids.indexOf(lastClickedId);
      const to = ids.indexOf(id);
      if (from >= 0 && to >= 0) {
        const [lo, hi] = from < to ? [from, to] : [to, from];
        setMultiSelect((prev) => {
          const next = new Set(prev);
          for (let i = lo; i <= hi; i++) next.add(ids[i]);
          return next;
        });
      }
      return;
    }
    // Plain click: if multi-select active, clear + open. Otherwise open edit modal.
    if (multiSelect.size > 0) {
      setMultiSelect(new Set());
    }
    setSelectedId(id);
    setLastClickedId(id);
  };

  const handleDragStartAsset = (e: React.DragEvent, assetId: string) => {
    // If dragging one of the multi-selected, drag them all. Otherwise drag just this one.
    const ids = multiSelect.has(assetId) && multiSelect.size > 0 ? Array.from(multiSelect) : [assetId];
    e.dataTransfer.setData("application/x-btr-assets", JSON.stringify(ids));
    e.dataTransfer.effectAllowed = "move";
  };

  const clearSelection = () => setMultiSelect(new Set());

  const bulkMoveTo = (folderId: string | null) => {
    if (multiSelect.size === 0) return;
    moveAssetsToFolder(Array.from(multiSelect), folderId);
    clearSelection();
    setMoveMenuOpen(false);
  };

  const stats = {
    total: assets.length,
    images: assets.filter((a) => a.type === "image").length,
    videos: assets.filter((a) => a.type === "video").length,
    documents: assets.filter((a) => a.type === "document").length,
    audio: assets.filter((a) => a.type === "audio").length,
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const f of Array.from(files)) {
      let type: AssetType = "document";
      if (f.type.startsWith("image/")) type = "image";
      else if (f.type.startsWith("video/")) type = "video";
      else if (f.type.startsWith("audio/")) type = "audio";
      const sizeMB = (f.size / 1024 / 1024).toFixed(1);
      const date = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });

      // 1. Get a client token from our API
      let thumbnail: string | undefined;
      try {
        const tokenRes = await fetch(`/api/upload?filename=${encodeURIComponent(f.name)}`, {
          method: "POST",
        });
        if (!tokenRes.ok) throw new Error("Failed to get upload token");
        const { clientToken } = await tokenRes.json();

        // 2. Upload directly from browser to Vercel Blob (no size limit)
        const blob = await put(f.name, f, {
          access: "public",
          token: clientToken,
          multipart: f.size > 4 * 1024 * 1024, // use multipart for files > 4MB
        });

        // 3. Use public blob URL directly (no proxy needed)
        thumbnail = blob.url;
      } catch (err) {
        console.error("Upload failed:", err);
      }

      addAsset({
        name: f.name, type, size: `${sizeMB} MB`, date,
        tags: ["uploaded"],
        thumbnail,
        folderId: currentFolderId,
      });
    }
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

  const handleReplace = async (file: File) => {
    if (!selected) return;
    let type: AssetType = "document";
    if (file.type.startsWith("image/")) type = "image";
    else if (file.type.startsWith("video/")) type = "video";
    else if (file.type.startsWith("audio/")) type = "audio";
    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    let thumbnail: string | undefined;
    try {
      const tokenRes = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, { method: "POST" });
      if (!tokenRes.ok) throw new Error("Failed to get upload token");
      const { clientToken } = await tokenRes.json();
      const blob = await put(file.name, file, {
        access: "public",
        token: clientToken,
        multipart: file.size > 4 * 1024 * 1024,
      });
      thumbnail = blob.url;
    } catch (err) {
      console.error("Replace upload failed:", err);
    }
    updateAsset(selected.id, { name: file.name, type, size: `${sizeMB} MB`, date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }), thumbnail });
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="font-heading text-2xl font-bold">
          Assets{" "}
          <span className="text-sm font-normal text-foreground-muted">
            ({(() => {
              const totalMB = assets.reduce((sum, a) => {
                const s = a.size || "";
                const match = s.match(/([\d.]+)\s*(MB|KB|GB)/i);
                if (!match) return sum;
                const val = parseFloat(match[1]);
                const unit = match[2].toUpperCase();
                if (unit === "GB") return sum + val * 1024;
                if (unit === "KB") return sum + val / 1024;
                return sum + val;
              }, 0);
              const maxMB = 1024; // 1GB Hobby plan
              const pct = Math.min(100, Math.round((totalMB / maxMB) * 100));
              return `${pct}%`;
            })()})
          </span>
        </h1>
        <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.zip" onChange={handleUpload} className="hidden" />
        {!isViewer && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-magenta hover:bg-magenta/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0"
          >
            <Upload className="w-4 h-4" /> Upload
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-6">
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
          <div className="relative flex-1 min-w-[160px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted pointer-events-none" />
            <input type="text" placeholder="Search assets..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-ink/50 border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-magenta" />
          </div>
          {eventOptions.length > 0 && (
            <div className="flex items-center gap-1.5 shrink-0">
              <Calendar className="w-4 h-4 text-foreground-muted shrink-0" />
              <Dropdown
                label=""
                options={[{ value: "all", label: "All Events" }, ...eventOptions.map((e) => ({ value: e, label: e }))]}
                value={filterEvent}
                onChange={handleEventChange}
              />
            </div>
          )}
          {filterEvent !== "all" && postOptions.length > 0 && (
            <div className="flex items-center gap-1.5 shrink-0">
              <FileText className="w-4 h-4 text-foreground-muted shrink-0" />
              <Dropdown
                label=""
                options={[{ value: "all", label: "All Posts" }, ...postOptions]}
                value={filterPost}
                onChange={setFilterPost}
              />
            </div>
          )}
          <div className="flex items-center gap-1 ml-auto shrink-0 overflow-x-auto">
            <Filter className="w-4 h-4 text-foreground-muted" />
            {["all", "image", "video", "document", "audio"].map((t) => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${filterType === t ? "bg-magenta/15 text-magenta" : "text-foreground-muted hover:text-foreground"}`}>
                {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1) + "s"}
              </button>
            ))}
            {/* Desktop: view toggle inline */}
            <span className="hidden sm:block w-px h-5 bg-border mx-1" />
            <button onClick={() => setView("grid")} className={`hidden sm:block p-2 rounded-lg transition-colors ${view === "grid" ? "bg-magenta/15 text-magenta" : "text-foreground-muted hover:text-foreground"}`}>
              <Grid className="w-4 h-4" />
            </button>
            <button onClick={() => setView("list")} className={`hidden sm:block p-2 rounded-lg transition-colors ${view === "list" ? "bg-magenta/15 text-magenta" : "text-foreground-muted hover:text-foreground"}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
        {/* Mobile: view toggle on separate row */}
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border sm:hidden">
          <span className="text-xs text-foreground-muted mr-auto">View</span>
          <button onClick={() => setView("grid")} className={`p-2 rounded-lg transition-colors ${view === "grid" ? "bg-magenta/15 text-magenta" : "text-foreground-muted hover:text-foreground"}`}>
            <Grid className="w-4 h-4" />
          </button>
          <button onClick={() => setView("list")} className={`p-2 rounded-lg transition-colors ${view === "list" ? "bg-magenta/15 text-magenta" : "text-foreground-muted hover:text-foreground"}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bulk-select toolbar */}
      {multiSelect.size > 0 && !isViewer && (
        <div className="flex items-center gap-3 mb-4 px-4 py-2 bg-magenta/10 border border-magenta/30 rounded-xl">
          <span className="text-sm font-medium text-magenta">{multiSelect.size} selected</span>
          <div className="relative ml-auto">
            <button
              onClick={() => setMoveMenuOpen((v) => !v)}
              className="flex items-center gap-1.5 bg-magenta hover:bg-magenta/90 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            >
              <FolderInput className="w-3.5 h-3.5" /> Move to…
            </button>
            {moveMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMoveMenuOpen(false)} />
                <div className="absolute right-0 top-9 z-50 bg-surface border border-border rounded-lg shadow-lg p-2 min-w-[220px] max-h-[320px] overflow-y-auto">
                  <FolderTree
                    folders={folders}
                    currentFolderId={null}
                    onSelect={(id) => bulkMoveTo(id)}
                    totalCount={undefined}
                    rootLabel="All Assets (root)"
                  />
                </div>
              </>
            )}
          </div>
          <button
            onClick={clearSelection}
            className="text-foreground-muted hover:text-foreground transition-colors"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Folder sidebar */}
        <aside className="hidden md:block w-56 shrink-0">
          <div className="bg-surface border border-border rounded-xl p-3 sticky top-4">
            <FolderTree
              folders={folders}
              currentFolderId={currentFolderId}
              onSelect={(id) => { setCurrentFolderId(id); clearSelection(); }}
              onDropAssets={(folderId, ids) => { moveAssetsToFolder(ids, folderId); clearSelection(); }}
              onDropFolder={(id, parentId) => moveFolder(id, parentId)}
              editable={!isViewer}
              onCreate={(parentId, name) => addFolder(name, parentId)}
              onRename={(id, name) => renameFolder(id, name)}
              onDelete={(id) => deleteFolder(id)}
              totalCount={assets.filter((a) => !a.folderId).length}
              counts={folderCounts}
            />
          </div>
        </aside>

        {/* Asset grid/list */}
        <div className="flex-1 min-w-0">
          {/* Mobile folder dropdown */}
          <div className="md:hidden mb-4">
            <Dropdown
              label=""
              options={[
                { value: "__root__", label: `All Assets (${assets.filter((a) => !a.folderId).length})` },
                ...folders.map((f) => ({ value: f.id, label: `${f.name} (${folderCounts[f.id] ?? 0})` })),
              ]}
              value={currentFolderId ?? "__root__"}
              onChange={(v) => { setCurrentFolderId(v === "__root__" ? null : v); clearSelection(); }}
            />
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-sm text-foreground-muted">
              {currentFolderId ? "This folder is empty." : "No assets match the current filters."}
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((asset) => {
                const tc = typeConfig[asset.type];
                const TypeIcon = tc.icon;
                const isSelected = multiSelect.has(asset.id);
                return (
                  <div
                    key={asset.id}
                    draggable={!isViewer}
                    onDragStart={(e) => handleDragStartAsset(e, asset.id)}
                    onClick={(e) => handleAssetClick(e, asset.id)}
                    className={`bg-surface border rounded-xl overflow-hidden hover:border-magenta/30 transition-colors cursor-pointer ${
                      isSelected ? "border-magenta ring-1 ring-magenta" : "border-border"
                    }`}
                  >
                    <div className="aspect-square bg-ink/50 flex items-center justify-center overflow-hidden">
                      {asset.thumbnail && asset.type === "video" ? (
                        <video src={asset.thumbnail} className="w-full h-full object-cover" muted playsInline />
                      ) : asset.thumbnail && asset.type === "image" ? (
                        <img src={asset.thumbnail} alt={asset.name} className="w-full h-full object-cover" />
                      ) : (
                        <TypeIcon className="w-10 h-10" style={{ color: tc.color, opacity: 0.5 }} />
                      )}
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
                const isSelected = multiSelect.has(asset.id);
                return (
                  <div
                    key={asset.id}
                    draggable={!isViewer}
                    onDragStart={(e) => handleDragStartAsset(e, asset.id)}
                    onClick={(e) => handleAssetClick(e, asset.id)}
                    className={`flex items-center gap-4 px-5 py-3 hover:bg-surface-hover transition-colors cursor-pointer ${i > 0 ? "border-t border-border" : ""} ${isSelected ? "bg-magenta/10" : ""}`}
                  >
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
        </div>
      </div>

      {selected && (
        <EditAssetModal
          asset={{ name: selected.name, type: selected.type, size: selected.size, date: selected.date, tags: selected.tags, thumbnail: selected.thumbnail }}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setSelectedId(null)}
          onReplace={handleReplace}
          readOnly={isViewer}
        />
      )}
    </div>
  );
}

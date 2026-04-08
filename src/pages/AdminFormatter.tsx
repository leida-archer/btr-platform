import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Download, AlertTriangle, X, Grid, List, Image, Film, Volume2, VolumeX } from "lucide-react";
import { useData } from "../context/DataContext";
import FolderTree from "../components/FolderTree";
import type { Folder } from "../types/data";

// ── Format definitions (from instagram-layout.md) ──

const FORMATS = [
  { id: "ig-post" as const, label: "Instagram Post", width: 1080, height: 1080 },
  { id: "ig-reel" as const, label: "Reel / Story", width: 1080, height: 1920 },
];

type FormatId = (typeof FORMATS)[number]["id"];

// ── Logo shape groups: square (300px wide) and rectangular (550px wide) ──
// Heights derived from native aspect ratio — no distortion

type LogoShape = "square" | "rect";

const OVERLAYS = [
  { id: "acro-tree-black", label: "Tree Black", src: "/overlays/AcroTreeBlack.png", shape: "square" as LogoShape, nativeRatio: 0.94 },
  { id: "acro-tree-white", label: "Tree White", src: "/overlays/AcroTreeWhite.png", shape: "square" as LogoShape, nativeRatio: 0.94 },
  { id: "black-stacked", label: "Stacked Black", src: "/overlays/BlackStackedWordmark.png", shape: "square" as LogoShape, nativeRatio: 0.71 },
  { id: "black-wordmark", label: "Wordmark Black", src: "/overlays/BlackWordMark.png", shape: "rect" as LogoShape, nativeRatio: 0.18 },
  { id: "stacked-tree-black", label: "Stacked Tree Black", src: "/overlays/StackedTreeBlack.png", shape: "square" as LogoShape, nativeRatio: 0.94 },
  { id: "stacked-tree-white", label: "Stacked Tree White", src: "/overlays/StackedTreeWhite.png", shape: "square" as LogoShape, nativeRatio: 0.94 },
  { id: "tree-black", label: "Tree Black", src: "/overlays/TreeBlack.png", shape: "square" as LogoShape, nativeRatio: 0.94 },
  { id: "white-stacked", label: "Stacked White", src: "/overlays/WhiteStackedWordmark.png", shape: "square" as LogoShape, nativeRatio: 0.71 },
  { id: "white-wordmark", label: "Wordmark White", src: "/overlays/WhiteWordMark.png", shape: "rect" as LogoShape, nativeRatio: 0.18 },
];

const SHAPE_WIDTH: Record<LogoShape, number> = { square: 300, rect: 550 };

function getLogoSize(overlay: typeof OVERLAYS[number]): { w: number; h: number } {
  const w = SHAPE_WIDTH[overlay.shape];
  const h = Math.round(w * overlay.nativeRatio);
  return { w, h };
}

// ── Safe-zone positions per format ──
// Computed dynamically based on logo size. 9:16 has no BR.

const MARGIN = 48;

type PosId = "TL" | "TC" | "TR" | "BL" | "BC" | "BR";

interface PosConfig { x: number; y: number; label: string }

function getPositions(formatId: FormatId, lw: number, lh: number): Record<PosId, PosConfig> & { available: PosId[] } {
  if (formatId === "ig-reel") {
    const positions: Record<string, PosConfig> = {
      TL: { x: MARGIN, y: 260, label: "Top Left" },
      TC: { x: Math.round((1080 - lw) / 2), y: 260, label: "Top Center" },
      TR: { x: 1080 - MARGIN - lw, y: 260, label: "Top Right" },
      BL: { x: MARGIN, y: 1920 - 270 - lh, label: "Bottom Left" },
      BC: { x: Math.round((1080 - lw) / 2), y: 1920 - 270 - lh, label: "Bottom Center" },
      BR: { x: 0, y: 0, label: "Bottom Right" }, // placeholder, not available
    };
    return { ...positions, available: ["TL", "TC", "TR", "BL", "BC"] } as Record<PosId, PosConfig> & { available: PosId[] };
  }
  // 1:1 post — all 6 positions
  const positions: Record<string, PosConfig> = {
    TL: { x: MARGIN, y: MARGIN, label: "Top Left" },
    TC: { x: Math.round((1080 - lw) / 2), y: MARGIN, label: "Top Center" },
    TR: { x: 1080 - MARGIN - lw, y: MARGIN, label: "Top Right" },
    BL: { x: MARGIN, y: 1080 - MARGIN - lh, label: "Bottom Left" },
    BC: { x: Math.round((1080 - lw) / 2), y: 1080 - MARGIN - lh, label: "Bottom Center" },
    BR: { x: 1080 - MARGIN - lw, y: 1080 - MARGIN - lh, label: "Bottom Right" },
  };
  return { ...positions, available: ["TL", "TC", "TR", "BL", "BC", "BR"] } as Record<PosId, PosConfig> & { available: PosId[] };
}


// ── Asset picker popup ──

interface AssetPickerProps {
  assets: { id: string; name: string; type: string; thumbnail?: string; folderId?: string | null }[];
  folders: Folder[];
  onSelect: (id: string) => void;
  onClose: () => void;
}

function AssetPicker({ assets, folders, onSelect, onClose }: AssetPickerProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of assets) {
      if (a.type !== "image") continue;
      if (a.folderId) counts[a.folderId] = (counts[a.folderId] ?? 0) + 1;
    }
    return counts;
  }, [assets]);

  const filtered = useMemo(() => {
    const media = assets.filter((a) => {
      if (a.type !== "image") return false;
      if (currentFolderId === null) {
        if (a.folderId) return false;
      } else {
        if (a.folderId !== currentFolderId) return false;
      }
      return true;
    });
    if (!search.trim()) return media;
    const q = search.toLowerCase();
    return media.filter((a) => a.name.toLowerCase().includes(q));
  }, [assets, search, currentFolderId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h3 className="font-heading text-sm font-semibold">Select Source Asset</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-magenta/15 text-magenta" : "text-foreground-muted hover:text-foreground"}`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-magenta/15 text-magenta" : "text-foreground-muted hover:text-foreground"}`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button onClick={onClose} className="text-foreground-muted hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-2 shrink-0">
          <input
            type="text"
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-ink/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-magenta"
          />
        </div>

        {/* Body: folder sidebar + asset list */}
        <div className="flex flex-1 min-h-0">
          <aside className="w-48 shrink-0 border-r border-border p-3 overflow-y-auto">
            <FolderTree
              folders={folders}
              currentFolderId={currentFolderId}
              onSelect={(id) => setCurrentFolderId(id)}
              totalCount={assets.filter((a) => a.type === "image" && !a.folderId).length}
              counts={folderCounts}
            />
          </aside>
        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 && (
            <p className="text-sm text-foreground-muted text-center py-8">No photo assets found</p>
          )}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-3 gap-3">
              {filtered.map((a) => {
                const TypeIcon = a.type === "video" ? Film : Image;
                return (
                  <button
                    key={a.id}
                    onClick={() => { onSelect(a.id); }}
                    className="relative bg-ink/30 border border-border rounded-xl overflow-hidden text-left transition-colors hover:border-magenta/30"
                  >
                    <div className="aspect-square bg-ink/50 flex items-center justify-center overflow-hidden">
                      {a.thumbnail ? (
                        <img src={a.thumbnail} alt={a.name} className="w-full h-full object-cover" />
                      ) : (
                        <TypeIcon className="w-8 h-8 text-foreground-muted/30" />
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium truncate">{a.name}</p>
                      <span className="text-[10px] text-foreground-muted capitalize">{a.type}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden">
              {filtered.map((a, i) => {
                const TypeIcon = a.type === "video" ? Film : Image;
                return (
                  <button
                    key={a.id}
                    onClick={() => { onSelect(a.id); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-ink/30 ${i > 0 ? "border-t border-border" : ""}`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-ink/50 flex items-center justify-center shrink-0 overflow-hidden">
                      {a.thumbnail ? (
                        <img src={a.thumbnail} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <TypeIcon className="w-4 h-4 text-foreground-muted/60" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.name}</p>
                      <span className="text-[10px] text-foreground-muted capitalize">{a.type}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ──

export default function AdminFormatter() {
  const { assets, addAsset, folders } = useData();

  const [sourceId, setSourceId] = useState("");
  const [formatId, setFormatId] = useState<FormatId>("ig-post");
  const [overlayId, setOverlayId] = useState(OVERLAYS[0].id);
  const [posId, setPosId] = useState<PosId>("BC");
  const [fadeEnabled, setFadeEnabled] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportingRef = useRef(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showPicker, setShowPicker] = useState(false);
  const [previewMuted, setPreviewMuted] = useState(true);

  // Crop offset (0–1)
  const [cropX, setCropX] = useState(0.5);
  const [cropY, setCropY] = useState(0.5);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, cx: 0, cy: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const animFrameRef = useRef<number>(0);

  const [sourceImg, setSourceImg] = useState<HTMLImageElement | null>(null);
  const [overlayImg, setOverlayImg] = useState<HTMLImageElement | null>(null);
  const [sourceVideoUrl, setSourceVideoUrl] = useState("");
  const [videoDuration, setVideoDuration] = useState(0);

  const source = assets.find((a) => a.id === sourceId);
  const isVideo = source?.type === "video";
  const format = FORMATS.find((f) => f.id === formatId)!;
  const overlay = OVERLAYS.find((o) => o.id === overlayId)!;
  const logoSize = getLogoSize(overlay);
  const positions = getPositions(formatId, logoSize.w, logoSize.h);

  // If current position is not available in this format, reset
  useEffect(() => {
    if (!positions.available.includes(posId)) {
      setPosId(positions.available[positions.available.length - 1]);
    }
  }, [formatId, posId, positions.available]);

  // Load source image
  useEffect(() => {
    if (!source || source.type === "video") { setSourceImg(null); return; }
    const url = source.thumbnail || "";
    if (!url) { setSourceImg(null); return; }
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setSourceImg(img);
    img.onerror = () => setSourceImg(null);
    img.src = url;
  }, [source]);

  // Load source video
  useEffect(() => {
    if (!source || source.type !== "video") { setSourceVideoUrl(""); return; }
    setSourceVideoUrl(source.thumbnail || "");
  }, [source]);

  // Load overlay
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setOverlayImg(img);
    img.src = overlay.src;
  }, [overlay.src]);

  // Video duration
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const onMeta = () => setVideoDuration(vid.duration);
    vid.addEventListener("loadedmetadata", onMeta);
    return () => vid.removeEventListener("loadedmetadata", onMeta);
  }, [sourceVideoUrl]);

  // ── Draw frame ──

  const drawFrame = useCallback(
    (ctx: CanvasRenderingContext2D, sourceEl: HTMLImageElement | HTMLVideoElement, canvasW: number, canvasH: number, fadeAlpha?: number) => {
      const outRatio = format.width / format.height;

      const srcW = sourceEl instanceof HTMLVideoElement ? sourceEl.videoWidth : sourceEl.naturalWidth;
      const srcH = sourceEl instanceof HTMLVideoElement ? sourceEl.videoHeight : sourceEl.naturalHeight;
      if (!srcW || !srcH) return;

      const srcRatio = srcW / srcH;
      const scale = canvasW / format.width; // ratio of canvas to full output

      // Cover-fit crop (computed in source space)
      let sw: number, sh: number, sx: number, sy: number;
      if (srcRatio > outRatio) {
        sh = srcH; sw = srcH * outRatio;
        sx = (srcW - sw) * cropX; sy = 0;
      } else {
        sw = srcW; sh = srcW / outRatio;
        sx = 0; sy = (srcH - sh) * cropY;
      }

      ctx.clearRect(0, 0, canvasW, canvasH);
      ctx.drawImage(sourceEl, sx, sy, sw, sh, 0, 0, canvasW, canvasH);

      // Logo overlay — scaled to canvas size
      if (overlayImg && overlayImg.complete) {
        const pos = positions[posId];
        ctx.drawImage(overlayImg, pos.x * scale, pos.y * scale, logoSize.w * scale, logoSize.h * scale);
      }

      // Fade
      if (fadeAlpha !== undefined && fadeAlpha > 0) {
        ctx.fillStyle = `rgba(0,0,0,${fadeAlpha})`;
        ctx.fillRect(0, 0, canvasW, canvasH);
      }
    },
    [format, cropX, cropY, overlayImg, posId, positions, logoSize],
  );

  // ── Preview loop ──

  // Preview sizing
  const previewMaxH = 500;
  const aspectRatio = format.width / format.height;
  const previewW = Math.min(400, previewMaxH * aspectRatio);
  const previewH = previewW / aspectRatio;

  // Preview canvas at display size (not full export res) for smooth rendering
  const previewCanvasW = Math.round(previewW * 2); // 2x for retina sharpness
  const previewCanvasH = Math.round(previewH * 2);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = previewCanvasW;
    canvas.height = previewCanvasH;
  }, [previewCanvasW, previewCanvasH]);

  // Preview loop — separate from canvas init to avoid resetting during export
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (isVideo && videoRef.current) {
      const vid = videoRef.current;
      // Only reset video if not exporting
      if (!exportingRef.current) {
        vid.currentTime = 0;
        vid.play();
      }
      const fadeDur = 0.5;
      const loop = () => {
        if (vid.ended && !exportingRef.current) {
          vid.currentTime = 0;
          vid.play();
        }
        if (vid.readyState >= 2) {
          let fadeAlpha: number | undefined;
          if (fadeEnabled) {
            const t = vid.currentTime;
            const dur = vid.duration || 1;
            if (t < fadeDur) fadeAlpha = 1 - t / fadeDur;
            else if (t > dur - fadeDur) fadeAlpha = (t - (dur - fadeDur)) / fadeDur;
          }
          drawFrame(ctx, vid, previewCanvasW, previewCanvasH, fadeAlpha);
        }
        animFrameRef.current = requestAnimationFrame(loop);
      };
      loop();
      return () => cancelAnimationFrame(animFrameRef.current);
    } else if (sourceImg) {
      drawFrame(ctx, sourceImg, previewCanvasW, previewCanvasH);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#666";
      ctx.font = "24px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Select a source asset", canvas.width / 2, canvas.height / 2);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVideo, sourceImg, format, drawFrame, sourceVideoUrl, fadeEnabled]);

  // Redraw photo on settings change
  useEffect(() => {
    if (isVideo || !sourceImg) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawFrame(ctx, sourceImg, previewCanvasW, previewCanvasH);
  }, [cropX, cropY, posId, overlayImg, formatId, isVideo, sourceImg, drawFrame, previewCanvasW, previewCanvasH]);

  // ── Crop drag ──

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, cx: cropX, cy: cropY };
  };

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dx = (e.clientX - dragStart.current.x) / rect.width;
      const dy = (e.clientY - dragStart.current.y) / rect.height;
      setCropX(Math.max(0, Math.min(1, dragStart.current.cx - dx)));
      setCropY(Math.max(0, Math.min(1, dragStart.current.cy - dy)));
    };
    const handleUp = () => setDragging(false);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => { window.removeEventListener("mousemove", handleMove); window.removeEventListener("mouseup", handleUp); };
  }, [dragging]);

  // ── Export photo ──

  const exportPhoto = () => {
    if (!sourceImg) return;
    const canvas = document.createElement("canvas");
    canvas.width = format.width;
    canvas.height = format.height;
    const ctx = canvas.getContext("2d")!;
    drawFrame(ctx, sourceImg, format.width, format.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      saveExport(blob, "png");
    }, "image/png");
  };

  // ── Export video ──
  // Offscreen full-res canvas, frame-by-frame via seeked events.
  // No real-time pressure — each frame is rendered perfectly before advancing.

  const exportVideo = async () => {
    const vid = videoRef.current;
    if (!vid) return;

    setExporting(true);
    exportingRef.current = true;
    setExportProgress(0);

    // Create offscreen canvas at full export resolution
    const expCanvas = document.createElement("canvas");
    expCanvas.width = format.width;
    expCanvas.height = format.height;
    const ctx = expCanvas.getContext("2d")!;

    // Pause video and seek to start
    vid.pause();
    vid.currentTime = 0;
    await new Promise<void>((r) => {
      const handler = () => { vid.removeEventListener("seeked", handler); r(); };
      vid.addEventListener("seeked", handler);
      setTimeout(r, 300);
    });

    const duration = vid.duration;
    const fps = 30;
    const frameTime = 1 / fps;
    const totalFrames = Math.ceil(duration * fps);
    const fadeDur = 0.5;

    // Capture stream from offscreen canvas
    const stream = expCanvas.captureStream(fps);

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : MediaRecorder.isTypeSupported("video/mp4")
          ? "video/mp4"
          : "";

    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 12_000_000 })
      : new MediaRecorder(stream, { videoBitsPerSecond: 12_000_000 });

    const isMP4 = recorder.mimeType.includes("mp4");
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

    recorder.start(100);

    // Render frame by frame, paced at real-time to sync with captureStream
    const frameMs = Math.round(frameTime * 1000); // ~33ms per frame at 30fps
    for (let i = 0; i < totalFrames; i++) {
      const t = i * frameTime;
      vid.currentTime = Math.min(t, duration - 0.01);

      // Wait for the frame to be ready
      await new Promise<void>((r) => {
        const onSeeked = () => { vid.removeEventListener("seeked", onSeeked); r(); };
        vid.addEventListener("seeked", onSeeked);
        setTimeout(r, 100); // fallback
      });

      // Draw this frame at full resolution
      let fadeAlpha: number | undefined;
      if (fadeEnabled) {
        if (t < fadeDur) fadeAlpha = 1 - t / fadeDur;
        else if (t > duration - fadeDur) fadeAlpha = (t - (duration - fadeDur)) / fadeDur;
      }
      drawFrame(ctx, vid, format.width, format.height, fadeAlpha);

      // Wait real-time frame duration so captureStream records correct timing
      await new Promise((r) => setTimeout(r, frameMs));

      // Update progress (every 10 frames to avoid re-render overhead)
      if (i % 10 === 0) {
        setExportProgress(Math.min(99, Math.round((i / totalFrames) * 100)));
      }
    }

    // Stop recorder and save
    recorder.stop();
    await new Promise<void>((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType });
        saveExport(blob, isMP4 ? "mp4" : "webm");
        setExporting(false);
        exportingRef.current = false;
        setExportProgress(100);
        // Restart preview
        vid.currentTime = 0;
        vid.play();
        resolve();
      };
    });
  };

  // ── Save ──

  const saveExport = (blob: Blob, ext: string) => {
    const originalName = source?.name?.replace(/\.[^.]+$/, "") ?? "untitled";
    const fileName = `formatted-${originalName}-${formatId}.${ext}`;
    const url = URL.createObjectURL(blob);
    addAsset({
      name: fileName,
      type: ext === "webm" ? "video" : "image",
      size: `${(blob.size / 1024 / 1024).toFixed(1)} MB`,
      tags: ["formatted", formatId],
      thumbnail: ext !== "webm" ? url : undefined,
    });
    const a = document.createElement("a");
    a.href = url; a.download = fileName; a.click();
    setExporting(false);
  };

  const handleExport = () => { if (isVideo) exportVideo(); else exportPhoto(); };

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">Photo Formatter</h1>


      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Preview */}
        <div className="flex-1 min-w-0">
          {/* Source selector button */}
          <div className="mb-4">
            <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-1.5">
              Source Asset
            </label>
            <button
              onClick={() => setShowPicker(true)}
              className="w-full flex items-center gap-3 bg-ink/50 border border-border rounded-lg px-4 py-2.5 text-sm text-left hover:border-foreground-muted transition-colors"
            >
              {source ? (
                <>
                  {source.thumbnail ? (
                    <img src={source.thumbnail} alt="" className="w-8 h-8 rounded object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-ink/50 flex items-center justify-center">
                      {source.type === "video" ? <Film className="w-4 h-4 text-foreground-muted" /> : <Image className="w-4 h-4 text-foreground-muted" />}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{source.name}</p>
                    <p className="text-[10px] text-foreground-muted capitalize">{source.type}</p>
                  </div>
                </>
              ) : (
                <span className="text-foreground-muted">Select an asset...</span>
              )}
            </button>
          </div>

          {/* Canvas preview */}
          <div
            className="relative bg-ink/50 border border-border rounded-lg overflow-hidden flex items-center justify-center"
            style={{ minHeight: previewH + 40 }}
          >
            <canvas
              ref={canvasRef}
              style={{ width: previewW, height: previewH, cursor: source ? "grab" : "default" }}
              className={dragging ? "cursor-grabbing" : ""}
              onMouseDown={source ? handleMouseDown : undefined}
            />
            {source && (
              <div className="absolute bottom-2 left-2 text-[10px] text-foreground-muted bg-ink/70 px-2 py-1 rounded">
                Drag to reposition crop
              </div>
            )}
            {isVideo && (
              <button
                onClick={() => {
                  setPreviewMuted(!previewMuted);
                  if (videoRef.current) videoRef.current.muted = !previewMuted;
                }}
                className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-ink/70 text-foreground-muted hover:text-foreground transition-colors"
                title={previewMuted ? "Unmute" : "Mute"}
              >
                {previewMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            )}
          </div>

          {isVideo && sourceVideoUrl && (
            <video ref={videoRef} src={sourceVideoUrl} muted={previewMuted} autoPlay playsInline crossOrigin="anonymous" className="hidden" />
          )}

          {videoDuration > 60 && isVideo && (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 mt-2 text-xs text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              Video is {Math.round(videoDuration)}s — export may be slow for videos over 60s.
            </div>
          )}
        </div>

        {/* Right: Controls */}
        <div className="w-full lg:w-80 shrink-0 space-y-5">
          {/* Format */}
          <div>
            <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-2">Format</label>
            <div className="flex gap-2">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormatId(f.id)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    formatId === f.id
                      ? "bg-magenta/15 border-magenta text-magenta"
                      : "bg-surface border-border text-foreground-muted hover:text-foreground hover:border-foreground-muted"
                  }`}
                >
                  {f.label}
                  <div className="text-[10px] mt-0.5 opacity-60">{f.width}×{f.height}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Logo overlay picker */}
          <div>
            <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-2">Logo Overlay</label>
            <div className="grid grid-cols-5 gap-1.5">
              {OVERLAYS.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setOverlayId(o.id)}
                  className={`flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-colors ${
                    overlayId === o.id
                      ? "bg-magenta/15 border-magenta"
                      : "bg-surface border-border hover:border-foreground-muted"
                  }`}
                  title={o.label}
                >
                  <img src={o.src} alt={o.label} className="w-10 h-10 object-contain" />
                  <span className="text-[8px] text-foreground-muted leading-tight text-center truncate w-full">{o.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Position picker */}
          <div>
            <label className="text-xs font-heading font-semibold text-foreground-muted uppercase tracking-wider block mb-2">Logo Position</label>
            <div className="relative border border-border rounded-lg overflow-hidden" style={{ aspectRatio: `${format.width}/${format.height}`, maxHeight: 200 }}>
              <div className="absolute inset-0 bg-ink/30" />
              {formatId === "ig-reel" && (
                <>
                  <div className="absolute top-0 left-0 right-0 bg-red-500/10 border-b border-red-500/20" style={{ height: `${(250 / 1920) * 100}%` }} />
                  <div className="absolute bottom-0 left-0 right-0 bg-red-500/10 border-t border-red-500/20" style={{ height: `${(270 / 1920) * 100}%` }} />
                  <div className="absolute bg-red-500/10 border-l border-red-500/20" style={{ right: 0, top: `${(800 / 1920) * 100}%`, height: `${(700 / 1920) * 100}%`, width: `${(120 / 1080) * 100}%` }} />
                </>
              )}
              {positions.available.map((p) => {
                const pos = positions[p];
                const pctX = ((pos.x + logoSize.w / 2) / format.width) * 100;
                const pctY = ((pos.y + logoSize.h / 2) / format.height) * 100;
                return (
                  <button
                    key={p}
                    onClick={() => setPosId(p)}
                    className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 transition-all ${
                      posId === p
                        ? "bg-magenta border-magenta scale-110"
                        : "bg-surface/80 border-foreground-muted/50 hover:border-magenta hover:scale-105"
                    }`}
                    style={{ left: `${pctX}%`, top: `${pctY}%` }}
                    title={pos.label}
                  />
                );
              })}
            </div>
            <p className="text-[10px] text-foreground-muted mt-1">
              {positions[posId].label} · {positions[posId].x},{positions[posId].y} · {logoSize.w}×{logoSize.h}px ({overlay.shape})
              {formatId === "ig-reel" && <span className="text-red-400/60 ml-1">Red = IG UI zones · No BR</span>}
            </p>
          </div>

          {/* Fade (video only) */}
          {isVideo && (
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={fadeEnabled}
                onChange={(e) => setFadeEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-border bg-ink/50 text-magenta focus:ring-magenta"
              />
              <span className="text-sm font-medium">Fade In/Out</span>
              <span className="text-[10px] text-foreground-muted">0.5s black fade</span>
            </label>
          )}

          {/* Export */}
          <div className="pt-2">
            <button
              onClick={handleExport}
              disabled={!source || exporting}
              className="w-full flex items-center justify-center gap-2 bg-magenta hover:bg-magenta/90 disabled:bg-magenta/30 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              {exporting ? (
                <>Exporting... {exportProgress}%</>
              ) : (
                <><Download className="w-4 h-4" /> Export to Library</>
              )}
            </button>
            {source && (
              <p className="text-[10px] text-foreground-muted mt-1.5 text-center">
                Output: {format.width}×{format.height} {isVideo ? "WebM" : "PNG"} — saved to library + downloaded
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Asset picker popup */}
      {showPicker && (
        <AssetPicker
          assets={assets}
          folders={folders}
          onSelect={(id) => { setSourceId(id); setCropX(0.5); setCropY(0.5); setShowPicker(false); }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}

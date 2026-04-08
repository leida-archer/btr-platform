# Media Formatter — Session State (2026-03-31)

## Status: In Progress — video export quality needs work

## What's Built & Working
- `src/pages/AdminFormatter.tsx` — full page with:
  - Asset picker popup (grid/list view with search)
  - Format toggle: Instagram Post (1080x1080) / Reel (1080x1920)
  - 9 brand logo overlays (from `/public/overlays/`) with shape-based sizing:
    - Square logos: 300px wide (AcroTree, StackedTree, Stacked Wordmark, Tree)
    - Rectangular logos: 550px wide (Wordmarks)
  - 5-6 position picker per format (TL/TC/TR/BL/BC + BR for 1:1 only) with safe-zone visualization
  - Draggable crop repositioning
  - Fade In/Out checkbox (video only) with live preview
  - Mute/unmute speaker icon on video preview
  - Photo export: works perfectly — full 1080px res PNG
  - Video export: frame-by-frame offscreen rendering at 30fps, 12Mbps bitrate
  - Safari MP4 fallback (auto-detects mimeType)
  - Video duration warning (>60s)
  - Export saves to asset library + triggers download
- Route: `/admin/formatter`
- Nav: "Media Formatter" in sidebar under Events
- Asset page: shows storage capacity percentage next to title

## Known Issue: Video Export Quality
Video export is still laggy/glitchy. Root cause: the frame-by-frame approach (seek → draw → wait 33ms → repeat) has timing inconsistencies because:
1. `seeked` event timing varies per frame (10-100ms)
2. `captureStream` captures at its own clock, not synced to our draw calls
3. The 33ms wait per frame is approximate — real frame pacing drifts

### Potential solutions not yet tried:
- **FFmpeg.wasm**: client-side video encoding with precise frame control. Heavy (~25MB wasm binary) but produces perfect output. Would replace the entire `captureStream`/`MediaRecorder` pipeline.
- **Real-time playback capture**: revert to playing the video in real-time but use the small preview canvas approach (already done for preview). The lag was from rendering at full 1080px res in real-time. Could try: play video real-time → draw to offscreen full-res canvas → capture. The preview canvas is now small so the browser has more budget for the offscreen one.
- **Server-side FFmpeg**: add a `/api/format-video` endpoint that accepts the source video + parameters and returns the formatted output. Most reliable but requires server infrastructure and would exceed the 12-function Vercel limit.
- **WebCodecs API**: modern browser API for frame-by-frame video encoding. Precise control, good performance, but Chrome-only (no Firefox/Safari).

## What's NOT Deployed
- Media Formatter is local only. Not pushed to Vercel or GitHub.
- The content calendar pipeline IS deployed (see `3-31-deployment.md`).

## Pending User Input
- User will provide finalized logo overlay files if any changes needed
- Video export quality decision — which approach to pursue

## Logo Setup
- 10 brand PNGs in `/public/overlays/` (Hand Pulse removed from UI, file still exists)
- StackedTreeWhite.png: re-exported from SVG with ring opacity gradient (0.35/0.25/0.18/0.12)
- StackedTreeBlack.png: re-exported from SVG with full opacity rings
- Gradient ring SVG source: `/Users/archer/Desktop/Media Edit Logos/SVG/tree_rings_gradient.svg`
- Layout spec: `/Users/archer/Desktop/instagram-layout.md` (updated with final sizing rules)

## Files Changed (not committed, on top of deployed content calendar)
### New
- `src/pages/AdminFormatter.tsx`
- `public/overlays/*.png` (10 brand logos)
- `docs/superpowers/specs/2026-03-31-media-formatter-design.md`

### Modified
- `src/App.tsx` — added `/admin/formatter` route
- `src/components/AdminShell.tsx` — added Media Formatter to sidebar nav
- `src/pages/AdminAssets.tsx` — added storage % next to title

## How to Resume
```bash
cd /Users/archer/Desktop/btr-platform

# Start API server
npx vercel dev --listen 3001 &

# Start Vite (proxies /api to 3001, auth bypassed on localhost)
npx vite --port 3000

# Open http://localhost:3000/admin/formatter
```

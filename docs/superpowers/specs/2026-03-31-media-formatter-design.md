# Media Formatter — Design Spec

**Date:** 2026-03-31
**Status:** Approved
**Platform:** Beyond the Rhythm team portal (`/Users/archer/Desktop/btr-platform`)

## Summary

A new page in the team portal that crops photos and videos to Instagram format sizes and composites a selectable brand logo overlay at a user-chosen grid position. Output saves back to the asset library. Videos optionally get a 0.5s fade in/out from black.

## Workflow

1. **Select source** — user picks an existing asset from the platform's asset library (photo or video).
2. **Pick format** — Instagram Post (1080×1080, 1:1) or Instagram Reel/Story (1080×1920, 9:16).
3. **Crop** — a live preview shows the asset in the selected aspect ratio. User drags to reposition the crop region within the source.
4. **Logo overlay** — user selects from 3–4 preset logo images (stored as static files). Then picks a placement from a 3×3 grid (TL, TC, TR, ML, MC, MR, BL, BC, BR). Logo dimensions and anchor point are pre-configured per format type.
5. **Fade In/Out** (video only) — a checkbox labeled "Fade In/Out". When checked, the entire output (video + logo composite) fades in from black over 0.5s at the start and fades out to black over 0.5s at the end.
6. **Preview** — user sees the final composite before exporting.
7. **Export** — saves the formatted output as a new asset in the library. Original asset is untouched.

## Format Definitions

| Format | Dimensions | Aspect Ratio | Use |
|--------|-----------|-------------|-----|
| Instagram Post | 1080×1080 | 1:1 | Feed posts |
| Instagram Reel/Story | 1080×1920 | 9:16 | Reels, Stories |

Each format defines its own logo scale and anchor offset, stored as constants in the component. Example:

```ts
const FORMATS = {
  "ig-post": { width: 1080, height: 1080, logoScale: 0.15 },
  "ig-reel": { width: 1080, height: 1920, logoScale: 0.12 },
};
```

`logoScale` is the logo width as a fraction of the output width. The logo is rendered at that width, maintaining its native aspect ratio, then positioned based on the selected grid cell with padding from the edges.

## Logo Overlay System

### Preset Logos
- 3–4 PNG files with transparency, stored in `/public/overlays/` (e.g., `logo-white.png`, `logo-dark.png`, `logo-icon.png`).
- Managed manually (placed in the directory by the user, not uploaded through the UI).
- Displayed as a thumbnail row in the formatter UI for selection.

### Placement Grid
A 3×3 clickable grid representing 9 positions:

```
TL  TC  TR
ML  MC  MR
BL  BC  BR
```

Each cell places the logo's center point at a fixed offset from the corresponding edge/center of the output frame. Edge padding is a constant (e.g., 5% of output width).

### Per-Format Sizing
Logo scale is defined per format in the `FORMATS` constant. The logo is always rendered at `outputWidth * logoScale` width, height derived from the logo's native aspect ratio.

## Fade In/Out (Video Only)

- A checkbox labeled **"Fade In/Out"** appears only when the source asset is a video.
- When checked, the entire canvas output (video frame + logo composite) fades:
  - **In**: from solid black to full visibility over the first 0.5 seconds.
  - **Out**: from full visibility to solid black over the final 0.5 seconds.
- Implementation: during the canvas render loop, draw a black rectangle over the entire canvas with alpha interpolated linearly — `alpha = 1.0` at t=0, `alpha = 0.0` at t=0.5s for fade-in; inverse for fade-out using the video's total duration.

## Processing

### Photos
- **Client-side only** using the Canvas API.
- Steps: draw source image cropped to format dimensions → draw selected logo at grid position → export canvas as PNG or JPG.
- No server round-trip needed.

### Videos
- **Client-side** using `<canvas>` + `<video>` element + `MediaRecorder` API.
- Steps: play video offscreen → on each animation frame, draw the cropped video frame to canvas → draw logo overlay → if fade enabled, draw black overlay with interpolated alpha → `MediaRecorder` captures the canvas stream.
- Output format: WebM (MediaRecorder default). Acceptable quality for social media.
- Audio: captured from the video element's audio track via `AudioContext` and merged into the `MediaRecorder` stream.

## Output & Asset Library Integration

- The exported file is uploaded to Vercel Blob via the existing `/api/upload` endpoint.
- A new asset record is created in the library via the existing `addAsset` function in DataContext.
- Naming convention: `formatted-{originalName}-{format}.{ext}` (e.g., `formatted-beach-sunset-ig-post.png`).
- The new asset is tagged with `["formatted", formatId]` for easy filtering.
- The original source asset is never modified.

## UI Layout

### Page Structure
- **Route:** `/admin/formatter`
- **Nav:** new sidebar item "Media Formatter" under the Events group, below Ticket Calculator. Icon: `ImagePlus` from lucide-react.

### Layout (single page, no modals)

```
┌─────────────────────────────────────────────────┐
│  Media Formatter                                │
├────────────────────────┬────────────────────────┤
│                        │  Format: [Post] [Reel] │
│                        │                        │
│   Preview Canvas       │  Logo:                 │
│   (crop-draggable)     │  [thumb] [thumb] [thumb]│
│                        │                        │
│                        │  Position:             │
│                        │  [TL][TC][TR]          │
│                        │  [ML][MC][MR]          │
│                        │  [BL][BC][BR]          │
│                        │                        │
│                        │  ☐ Fade In/Out (video) │
│                        │                        │
│                        │  [Export to Library]    │
├────────────────────────┴────────────────────────┤
│  Source: [Select from Asset Library ▾]          │
└─────────────────────────────────────────────────┘
```

- **Left:** live preview canvas showing the cropped source with logo overlay. User can drag to reposition the crop.
- **Right:** controls panel — format toggle, logo picker (thumbnail row), position grid (3×3 buttons), fade checkbox (video only), export button.
- **Bottom:** asset selector dropdown/picker to choose the source.

## Files to Create/Modify

### New Files
- `src/pages/AdminFormatter.tsx` — the formatter page component (preview canvas, controls, export logic).

### Modified Files
- `src/App.tsx` — add route `/admin/formatter` → `AdminFormatter`.
- `src/components/AdminShell.tsx` — add "Media Formatter" to `EVENTS_NAV` (sidebar only, not mobile bottom nav to avoid crowding).

### Static Assets (manual)
- `/public/overlays/*.png` — 3–4 brand logo files placed manually.

### No Database Changes
- No new Prisma models. Format definitions and logo presets are constants/static files.
- Output assets use the existing Asset model and upload flow.

## Edge Cases

- **Safari:** show a toast warning on Safari that video export may not work; photo export is unaffected.
- **Video duration:** show a warning banner if source video exceeds 60 seconds, but do not hard-block.
- **Undersized sources:** sources smaller than the output dimensions are scaled up to fill; no crop drag is available.
- **Output format:** WebM is the only MediaRecorder output on Chrome/Firefox. Show a note in the UI: "Output: WebM — convert to MP4 externally if needed."

## Constraints

- **Vercel Hobby plan:** currently at 12/12 serverless functions. No new API endpoints. All processing is client-side. Asset saving uses existing `/api/upload` and `/api/assets` endpoints.
- **Video length:** client-side canvas rendering is CPU-intensive. Practical limit ~30–60 seconds of video before the browser struggles. Acceptable for social media clips.
- **Browser support:** MediaRecorder + Canvas API. Works in Chrome, Edge, Firefox. Safari has partial MediaRecorder support — toast warning shown, not blocked.

## Out of Scope

- Video trimming
- Custom logo upload through the UI (managed via `/public/overlays/`)
- Batch processing (one asset at a time)
- Formats beyond Instagram Post and Reel/Story
- Server-side FFmpeg processing
- Canva API integration (evaluated, not needed for this scope)

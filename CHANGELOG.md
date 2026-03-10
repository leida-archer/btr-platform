# BtR Platform — Changelog

## 2026-03-10 — Landing Page Refresh

### Changes Made

| Time (PST) | Change |
|------------|--------|
| ~2:35 PM | Swapped hero logo to `logo_gradient_ripple_tree_btr.svg` (golden ratio'd stacked logo with ripple arcs + tree + BtR text) |
| ~2:36 PM | Removed dark background rect from hero logo SVG — now transparent |
| ~2:38 PM | Greyed out General Admission ticket card (matching Standard card style — "Coming Soon" badge, "Not Yet Available" button) |
| ~2:39 PM | Changed ticket prices from $65/$80 to "TBD" on both ticket cards |
| ~2:40 PM | Changed BtR San Diego event card button from "Get Tickets" to "Not Yet Available" (greyed out, "Coming Soon" badge) |
| ~2:42 PM | Fixed gallery layout — swapped wide/square slots to match actual image aspect ratios (square photos in square slots, landscape in wide slots) |
| ~2:44 PM | Hidden "Stay in the Loop" newsletter section (commented out for future use) |
| ~2:45 PM | Added CSS image sharpening to gallery (contrast boost, saturation, optimize-contrast rendering) |
| ~2:52 PM | AI-upscaled gallery images with Pillow 2x Lanczos + unsharp mask |
| ~3:07 PM | AI-upscaled gallery images with Real-ESRGAN (4x from original resolution) |
| ~3:35 PM | Softened IMG_9559 (top-left gallery photo) with Gaussian blur to reduce over-sharpening |
| ~3:40 PM | Updated tagline from "Where sound becomes feeling" to "The power of music has the power to heal" (hero + footer) |

### Tagged Version

- `v1-legacy` — state of the site before these changes (Mar 8 remote latest)

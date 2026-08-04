# BtR Platform — Changelog

## 2026-08-04 — Hollywood Event Cycle: Gallery, Countdown, Headliners

### Summary

Rolled the landing page over from the (past) San Diego event to BtR Hollywood: new SD post-event gallery, Hollywood countdown/event card with Coming Soon state, two confirmed headliners, and all ticket CTAs muted until the new ticket link exists.

### Changes Made

| File | Change |
|------|--------|
| `src/pages/LandingPage.tsx` | Gallery: replaced 4 Seattle photos with 5 SD '26 photos (`sd26-*.jpg`), added full-width panorama slot, captions → "San Diego 2026" |
| `src/pages/LandingPage.tsx` | Countdown target → `2026-09-05T20:00:00-07:00`; title/details → BtR Hollywood, September 5, 2026, Los Angeles, CA |
| `src/pages/LandingPage.tsx` | Event card: `BtR_Hollywood.jpg` thumbnail, badge → Coming Soon, ticket button disabled |
| `src/pages/LandingPage.tsx` | Lineup: "Hollywood Headliners", 2 cards — SoDown (Thunderdome shot), Manic Focus (promo portrait) |
| `src/pages/LandingPage.tsx` | All Get Tickets CTAs (desktop/mobile nav, mobile menu, event card) → muted inactive spans; old SD bit.ly links removed |
| `src/index.css` | Added `.gallery__item--pano` (8/3, responsive 2/1 and 16/9) and `.btn--muted`; removed one-off `.btn--disabled` |
| `public/images/` | Added `gallery/sd26-*.jpg` (5), `venue/BtR_Hollywood.jpg`, `artists/SoDown.jpg`, `artists/Manic_Focus.jpg` — all web-resized with sips (no upscaling needed; source photos 4–7K) |
| `NOTES.md` | New ideas/notes file (Past Events strip idea parked; ticket-link reactivation checklist) |
| `.gitignore` / `dist/` | Untracked the stale committed `dist/` build (already gitignored; Vercel builds from source); ignored `.reports/` |

### Notes

- Old Seattle gallery and SD artist images remain in `public/images/` untouched (unreferenced) — candidates for cleanup.
- Reactivating tickets: swap `btn--muted` spans back to anchors with the new URL; card badge → `--onsale`.

---

## 2026-05-31 — About Section: Count In Form + F&F Logo

### Summary

Replaced the "Fesser and Friends" outline button and ripple graphic in the About section with a "Join the Movement" contact signup card and a processed F&F logo.

### Changes Made

| File | Change |
|------|--------|
| `src/pages/LandingPage.tsx` | Replaced About section right column (ripple SVG + F&F button) with Count In form card (Formspree-powered: name, email, phone, Instagram, preferred contact, comments) |
| `src/pages/LandingPage.tsx` | Added F&F logo below stats on left column as clickable link to fesserandfriends.org with "click to learn more" caption |
| `src/pages/LandingPage.tsx` | Added `useEffect` canvas processing: converts F&F logo green circle to psychedelic gradient, makes white areas transparent |
| `src/index.css` | Added `.count-in` card styles (gradient top border, form fields, select dropdown, textarea, responsive breakpoints) |
| `src/index.css` | Updated `.about` layout to `align-items: stretch` with flexbox text column and form card |
| `src/index.css` | Added `.about__ff-caption` italic caption style, `.about__ripple` hover scale + breathing animation |
| `public/images/fesser-logo.png` | Added Fesser & Friends logo (green circle, white tree/schoolhouse silhouette) |

### Design Decisions

- Card header: "Join the Movement" (ties into "The Movement" section label)
- Submit button: "Count Me In"
- Form submits to Formspree (`mredqgpp`) — same endpoint as the original sample landing page
- F&F logo processed at runtime via canvas: green → psychedelic gradient, white → transparent cutout
- Comments textarea sized to fill remaining card space; button spaced with 20px bottom padding
- Responsive: form fields stack to single column on mobile, F&F logo scales down

### Commit

- `ba7b7eb` — pushed to `main`, auto-deployed to Vercel

---

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

# Content Calendar Pipeline — Deployment Notes

## Summary

Replaced the separate Pipeline (Kanban) and Calendar pages with a unified calendar-centered content pipeline. The calendar IS the pipeline.

## What Changed

### New Files
- `api/campaign-phases.ts` — CRUD API for campaign phase tags (name + color per campaign)
- `api/campaign-flags.ts` — CRUD API for campaign flags (label per campaign)
- `prisma.config.ts` — Prisma 7 config required for migrations
- `src/pages/AdminContent.tsx` — New calendar-centered content page (replaces Pipeline + Calendar)

### Modified Files
- `.gitignore` — Added `.superpowers/`
- `prisma/schema.prisma` — Added `CampaignPhase` model, `CampaignFlag` model, new Post fields (`briefMode`, `setting`, `hook`, `body`, `closingHook`, `flag`, `phaseId`)
- `src/types/data.ts` — Added `CampaignPhase` and `CampaignFlag` interfaces, reduced `PostStatus` to 3 states: `idea | editing | posted` (removed `allocated` and `approved`)
- `src/App.tsx` — Removed Calendar + Pipeline route imports, added Content route at `/admin/content`
- `src/components/AdminShell.tsx` — Sidebar nav: "Content" (CalendarDays icon) replaces "Calendar" + "Pipeline". Bottom mobile nav updated. Search index points to `/admin/content`
- `src/components/EditPostModal.tsx` — Added Phase Tag dropdown, Flag dropdown, Content Brief toggle (setting/hook/body/closingHook fields). Phase and flag options dynamically update when Event dropdown changes. Accepts `allPhases`, `allFlags`, `campaigns` props for dynamic filtering
- `src/context/DataContext.tsx` — Added `campaignPhases` and `campaignFlags` state, CRUD methods, and API fetching
- `src/hooks/useAuth.ts` — Added localhost auth bypass (auto-authenticates as admin on localhost/127.0.0.1)
- `src/pages/AdminCampaigns.tsx` — Campaign edit modal now has Phase Tags and Flags management sections (add/delete inline)
- `src/pages/AdminDashboard.tsx` — Updated status references from 5 states to 3 (`idea`, `editing`, `posted`)
- `vite.config.ts` — Added dev proxy: `/api` requests forwarded to `http://localhost:3001`

### Deleted Files
- `src/pages/AdminCalendar.tsx` — Replaced by AdminContent
- `src/pages/AdminPipeline.tsx` — Removed entirely (no Kanban view)
- `src/components/NewPostModal.tsx` — Unused (EditPostModal handles both create and edit)

### Database Schema Changes
Run `prisma db push` after deployment to apply:
- New table: `CampaignPhase` (id, name, color, campaignId, createdAt)
- New table: `CampaignFlag` (id, label, campaignId, createdAt)
- Post table additions: `briefMode` (Boolean), `setting`, `hook`, `body`, `closingHook`, `flag` (all String), `phaseId` (FK to CampaignPhase, nullable)
- Post `status` field: old values `allocated` and `approved` no longer used in UI (existing DB rows with those values won't break but will show as unrecognized)

## Untouched Files (verified identical to deployed HEAD)
- All auth API routes (`api/auth/*`)
- `api/posts.ts`, `api/campaigns.ts`, `api/assets.ts`, `api/calculator.ts`, `api/team.ts`, `api/upload.ts`
- `src/pages/LandingPage.tsx`, `LoginPage.tsx`, `SetupPage.tsx`, `AdminAssets.tsx`, `AdminCalculator.tsx`, `AdminSettings.tsx`
- `src/components/Dropdown.tsx`, `EditAssetModal.tsx`, `ProfileModal.tsx`
- `src/context/FilterContext.tsx`, `RoleContext.tsx`
- `lib/prisma.ts`

## How to Run Locally
```bash
cd /Users/archer/Desktop/btr-platform

# Start Vercel dev server for API (port 3001)
npx vercel dev --listen 3001

# In another terminal, start Vite (port 3000, proxies /api to 3001)
npx vite --port 3000

# Open http://localhost:3000 — auth is bypassed on localhost
```

## How to Deploy
```bash
# Push schema changes to production DB
npx prisma db push --url "$DATABASE_URL"

# Commit and push
git add .gitignore prisma.config.ts prisma/schema.prisma \
  src/types/data.ts src/App.tsx src/context/DataContext.tsx \
  src/components/AdminShell.tsx src/components/EditPostModal.tsx \
  src/hooks/useAuth.ts src/pages/AdminContent.tsx \
  src/pages/AdminCampaigns.tsx src/pages/AdminDashboard.tsx \
  api/campaign-phases.ts api/campaign-flags.ts \
  vite.config.ts
git rm src/pages/AdminCalendar.tsx src/pages/AdminPipeline.tsx src/components/NewPostModal.tsx
git commit -m "feat: calendar-centered content pipeline with phase tags, flags, and content briefs"
git push
```

## Design Decisions
- **Calendar is the pipeline** — no Kanban view, no toggle. Days are the organizing unit.
- **Phase tags are campaign-scoped** — each campaign defines its own phases (name + color). Posts pick from their linked campaign's phases.
- **Flags are campaign-scoped** — same pattern as phases. Dropdown in post edit modal.
- **3 statuses** — `idea → editing → posted`. Simplified from 5. Status changed via dropdown in the day detail panel.
- **Content Brief toggle** — per-post. When off: freeform caption/notes. When on: structured fields (setting, hook, body, closingHook).
- **Slide-out day panel** — clicking a calendar day opens a right panel (~40% width) showing all posts for that day. Calendar stays visible.
- **Post creation only from day panel** — no floating button. Must select a day first, then use the dashed "+ New Post" button.

# Memory / Changelog

## 2026-08-15 — Entry 1
- **What changed**: PRD v2.0 received and committed. All project documentation scaffolded from scratch.
- **Why**: User provided the complete PRD v2.0 text and requested the project knowledge base to be initialized.
- **Files touched**: `prd.md`, `phases.md`, `architecture.md`, `database.md`, `design.md`, `test.md`, `memory.md`

---

## 2026-08-15 — Entry 4
- **What changed**: Scaffolded the internal structures and dependencies for Phase 1.
- **Why**: User requested backend, tastifyyApp, and website setup to begin Phase 1 implementation.
- **Details**:
  - **backend**: Installed Express, Socket.io, TypeScript, Prisma. Created `src/index.ts` entry point and full `prisma/schema.prisma` derived from `database.md`.
  - **website**: Configured Tailwind CSS v4 and React Router (for `/restaurant` and `/admin`). Added Axios and Zustand.
  - **tastifyyApp**: Added directories (`api`, `store`, `types`, `utils`) and installed Axios, Socket.io-client, and Zustand.
- **Files touched**: `memory.md`, `backend/*`, `website/*`, `tastifyyApp/*`

---

## 2026-08-15 — Entry 3
- **What changed**: Architecture restructured from planned pnpm monorepo to flat independent folders. `architecture.md` updated to match actual build.
- **Why**: User scaffolded `tastifyyApp/` (Expo SDK 54), `website/` (React+Vite), and `backend/` (npm init) directly in the root as flat folders and chose to keep this structure.
- **Key decisions**:
  - `tastifyyApp/` handles both Customer and Delivery Partner flows (role-based navigation)
  - `website/` handles both Restaurant Partner Panel and Admin Panel (role-based routing)
  - `backend/` is the single Node.js API server
  - Monorepo/pnpm workspace plan dropped in favour of flat structure
- **Files touched**: `architecture.md`, `memory.md`

---

## 2026-08-15 — Entry 2
- **What changed**: Tech stack finalized and locked into `architecture.md`. Full Phase 1 database schema written into `database.md`.
- **Why**: User confirmed the tech stack choices. Architecture and schema-first rules require documentation before any code is written.
- **Decision details**:
  - **Customer App & Delivery App**: React Native (Expo)
  - **Restaurant Panel & Admin Panel**: React (Vite) — web dashboards
  - **Backend**: Node.js + Express (TypeScript)
  - **Database**: Supabase (PostgreSQL) with Prisma ORM
  - **Push Notifications**: Firebase Cloud Messaging (FCM)
  - **Messaging/OTP Service**: TBD (abstracted behind notification service interface)
  - **Payments**: Razorpay (PRD §74.11)
  - **Maps**: Google Maps API
  - **File Storage**: Cloudinary
  - **Deployment**: Render (backend), Vercel (web panels), Supabase (database), Expo EAS (mobile builds)
  - **Monorepo**: pnpm workspaces
- **Files touched**: `architecture.md`, `database.md`, `memory.md`

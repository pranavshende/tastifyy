# Memory / Changelog

## 2026-08-16 — Entry 18
- **What changed**: Built the Web Customer Portal Dashboard.
- **Why**: The user explicitly requested to start building the customer portal dashboard.
- **Details**:
  - Replaced `website/src/pages/customer/Placeholder.tsx` with a fully functional `Home.tsx`.
  - Updated React Router in `App.tsx` to point `/customer/home` to the new page.
  - Built a premium dashboard UI featuring a sticky glassmorphism header, an animated Hero search section, and a responsive CSS grid of restaurant cards.
  - Integrated the `GET /api/restaurants` backend route so the dashboard dynamically fetches the seeded restaurants (e.g., "The Spice Grill").
- **Files touched**: `website/src/App.tsx`, `website/src/pages/customer/Home.tsx`

---
## 2026-08-16 — Entry 16
- **What changed**: Executed Part 1 of the Global UI/UX Redesign (Website Overhaul).
- **Why**: The user requested a global redesign to meet the premium, modern aesthetic outlined in `design.md`.
- **Details**:
  - Injected Tailwind v4 theme variables in `website/src/index.css` for brand colors (`#E86A22`, `#C1531A`, `#171717`) and animations.
  - Rewrote `Landing.tsx` into a high-conversion marketing page featuring glassmorphism and animated gradients.
  - Redesigned `customer/Login.tsx`, `restaurant/Login.tsx`, and `admin/Login.tsx` to use the new email/password Supabase Auth routes with premium UI.
  - Rebuilt the Restaurant Dashboard Layout (`DashboardLayout.tsx`) with a sticky sidebar and polished top bar.
- **Files touched**: `website/src/index.css`, `website/src/pages/Landing.tsx`, `website/src/pages/customer/Login.tsx`, `website/src/pages/restaurant/Login.tsx`, `website/src/pages/admin/Login.tsx`, `website/src/pages/restaurant/DashboardLayout.tsx`

---
## 2026-08-16 — Entry 17
- **What changed**: Reset and seeded the database.
- **Why**: The user requested a database wipe and seed to start fresh for testing the new Auth system.
- **Details**:
  - Configured `backend/package.json` and `backend/prisma.config.ts` to use a custom seed script (`tsx prisma/seed.ts`).
  - Created a robust seed script that clears orphaned users from Supabase Auth (via Admin API), then recreates standard test users (`admin`, `customer`, `partner`).
  - The seed script then injects a full test restaurant ("The Spice Grill") into the database with menu categories and items.
  - Executed `npx prisma db push --force-reset` followed by `npx prisma db seed`.
- **Files touched**: `backend/package.json`, `backend/prisma.config.ts`, `backend/prisma/seed.ts`

---
## 2026-08-16 — Entry 15
- **What changed**: Migrated Authentication to Supabase Auth & Passport.js.
- **Why**: The user requested a robust session-based system that natively prevents duplicate emails and handles passwords securely without custom bcrypt logic.
- **Details**:
  - Removed `password_hash` from `User` table (now handled by Supabase `auth.users`).
  - Rewrote `POST /api/auth/register` and `POST /api/auth/login` to use `@supabase/supabase-js`.
  - Added `passport` and `passport-jwt` to Express to validate Supabase JWT sessions using `jwks-rsa`.
  - Checked off completed modules in the new 2,100-line `phases.md` implementation plan.
- **Files touched**: `backend/src/controllers/auth.controller.ts`, `backend/src/middlewares/auth.ts`, `backend/src/config/passport.ts`, `backend/prisma/schema.prisma`, `Project/phases.md`

---
## 2026-08-15 — Entry 14
- **What changed**: Adopted PRD v2.1 (Unified App & Unified Website Architecture) and fully deduplicated the project documentation.
- **Why**: The user released PRD v2.1 and accidentally overwrote `architecture.md` with the entire PRD text. This violated the strict `single-source-of-truth-per-domain.md` rule.
- **Details**:
  - Restored `architecture.md` to a concise, 50-line technical document covering the System Ecosystem, Repository Structure, Data Flow, and Tech Stack.
  - Aligned `phases.md`, `design.md`, and `test.md` to remove legacy terminology ("Customer App", "Admin Panel") in favor of PRD v2.1's "Unified Mobile Application" and "Unified Website" role-based experiences.
- **Files touched**: `Project/architecture.md`, `Project/phases.md`, `Project/design.md`, `Project/test.md`, `Project/memory.md`

---
## 2026-08-15 — Entry 13
- **What changed**: Implemented strict role isolation in the authentication flow.
- **Why**: Prevent cross-role logins (e.g., a Customer using their phone number to log into the Restaurant portal).
- **Details**: 
  - Added `delivery_partner` and `restaurant_partner` to the `Role` enum in `schema.prisma` and `database.md`.
  - Synced database via Prisma `db push`.
  - Updated `/auth/verify-otp` controller to explicitly verify that a user's database role matches the role portal they are attempting to log into, throwing a `403 Forbidden` if there is a mismatch. Auto-registration now dynamically applies the correct role.
- **Files touched**: `backend/prisma/schema.prisma`, `Project/database.md`, `backend/src/controllers/auth.controller.ts`

---
## 2026-08-15 — Entry 12
- **What changed**: Expanded the Customer role to the React Web App.
- **Why**: User requested the ability for customers to log in via the Web Portal in addition to the Mobile App.
- **Details**: 
  - Updated `architecture.md` to formally document that the `website` project now serves the Customer role.
  - Built a web-based OTP Customer Login page (`/customer/login`).
  - Added a Placeholder landing screen (`/customer/home`) instructing users that full web features are under development while the mobile app holds the MVP.
- **Files touched**: `architecture.md`, `website/src/pages/Landing.tsx`, `website/src/pages/customer/Login.tsx`, `website/src/pages/customer/Placeholder.tsx`, `website/src/App.tsx`

---
## 2026-08-15 — Entry 11
- **What changed**: Overhauled platform navigation and implemented unified, role-based login screens across Web and Mobile.
- **Why**: User requested clear navigation flows and a unified way to log in as Customer, Delivery, Restaurant, or Admin on both platforms.
- **Details**: 
  - **Web**: Created a universal landing page (`/`) bridging into Admin and Restaurant portals. Added a dedicated Restaurant OTP login screen.
  - **Mobile**: Built a "Super Login Screen" allowing selection of all 4 roles. Customers and Delivery route to their respective dashboards; Admins and Restaurants route to a placeholder screen instructing them to use the Web Portal.
- **Files touched**: `tastifyyApp/app/index.tsx`, `tastifyyApp/app/web-portal.tsx`, `website/src/App.tsx`, `website/src/pages/Landing.tsx`, `website/src/pages/restaurant/Login.tsx`

---
## 2026-08-15 — Entry 1
- **What changed**: PRD v2.0 received and committed. All project documentation scaffolded from scratch.
- **Why**: User provided the complete PRD v2.0 text and requested the project knowledge base to be initialized.
- **Files touched**: `prd.md`, `phases.md`, `architecture.md`, `database.md`, `design.md`, `test.md`, `memory.md`

---

## 2026-08-15 — Entry 10
- **What changed**: Added "Application Flow (End-to-End)" section to `architecture.md`.
- **Why**: Requested by user to explicitly document the real-time interaction flow between Customer, Restaurant, Delivery Partner, and the Backend.
- **Details**: Documented the 5-step lifecycle: Discovery & Cart, Checkout & Payment, Restaurant Acceptance, Delivery Assignment, and Post-Order.
- **Files touched**: `architecture.md`

---

## 2026-08-15 — Entry 9
- **What changed**: Fixed Vite compile error in `website/src/pages/restaurant/Dashboard.tsx`.
- **Why**: An invalid import (`useAuthStore`) meant for the React Native mobile app was accidentally added to the React web app during Iteration 5, crashing the Vite dev server.
- **Details**: Removed the invalid import; the dashboard now connects to sockets dynamically using the fetched restaurant ID.
- **Files touched**: `website/src/pages/restaurant/Dashboard.tsx`

---

## 2026-08-15 — Entry 8
- **What changed**: Completed Iterations 4, 5, and 6 of Phase 1 (Checkout, Real-time Sockets, Ratings).
- **Why**: Finalizing Phase 1 MVP implementation per user request.
- **Details**:
  - Backend: Added Razorpay checkout & verify, Socket.io initialization, dynamic order status API, and Ratings API.
  - Restaurant Web: Updated Dashboard to use WebSockets for live order management.
  - Mobile App: Built Customer Checkout screen, Delivery Partner live dashboard, and Order Rating screens.
- **Files touched**: `backend/src/controllers/order.controller.ts`, `backend/src/routes/order.routes.ts`, `backend/src/socket.ts`, `backend/src/index.ts`, `tastifyyApp/app/(customer)/checkout.tsx`, `tastifyyApp/app/(customer)/rate/[orderId].tsx`, `tastifyyApp/app/(delivery)/home.tsx`, `tastifyyApp/components/CustomerOrderTracking.tsx`, `website/src/pages/restaurant/Dashboard.tsx`

---

## 2026-08-15 — Entry 7
- **What changed**: Completed Iteration 3 of Phase 1 (Customer Discovery & Cart).
- **Why**: Planned execution of MVP implementation step 3.
- **Details**:
  - Backend: Created geospatial restaurant search (Haversine formula) and full-menu fetching APIs.
  - Mobile App: Set up Zustand Cart store, Customer Home screen for nearby restaurants, detailed Restaurant Menu view, and Floating Cart UI.
- **Files touched**: `backend/src/controllers/restaurant.controller.ts`, `backend/src/routes/restaurant.routes.ts`, `tastifyyApp/store/cartStore.ts`, `tastifyyApp/app/(customer)/home.tsx`, `tastifyyApp/app/(customer)/restaurant/[id].tsx`, `tastifyyApp/components/FloatingCart.tsx`

---

## 2026-08-15 — Entry 6
- **What changed**: Completed Iteration 2 of Phase 1 (Restaurant Onboarding & Menu Management).
- **Why**: Planned execution of MVP implementation step 2.
- **Details**:
  - Backend: Created restaurant registration, active restaurant fetching, and menu categories/items CRUD APIs.
  - Web App: Built the Restaurant Registration UI, Restaurant Dashboard layout, and Menu Management screen.
- **Files touched**: `backend/src/controllers/restaurant.controller.ts`, `backend/src/routes/restaurant.routes.ts`, `backend/src/controllers/menu.controller.ts`, `backend/src/routes/menu.routes.ts`, `backend/src/index.ts`, `website/src/pages/restaurant/*`, `website/src/App.tsx`

---

## 2026-08-15 — Entry 5
- **What changed**: Completed Iteration 1 of Phase 1 (Core Auth & Admin Foundation).
- **Why**: Planned execution of MVP implementation step 1.
- **Details**:
  - Backend: JWT utilities, Role-based middleware, Mock OTP endpoints, and Admin login endpoint.
  - Web App: Admin Login UI, Admin Dashboard shell, and Axios JWT interceptor.
  - Mobile App: OTP Login UI, Role-based router redirection (Customer vs Delivery), and AsyncStorage Axios interceptor.
- **Files touched**: `backend/src/utils/*`, `backend/src/middlewares/*`, `backend/src/controllers/*`, `backend/src/routes/*`, `website/src/pages/admin/*`, `website/src/App.tsx`, `website/src/api/axios.ts`, `tastifyyApp/app/index.tsx`, `tastifyyApp/api/axios.ts`

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

## 2026-08-16
- **What Changed**: Established the Unified Mobile App Foundation (tastifyyApp) based on the Master Implementation Plan. Built Universal Login, Zustand Auth Store, Axios API client, and strict role-based routing guards in Expo Router.
- **Why**: To align the mobile application with the PRD v2.1 requirement for a single unified app controlling all roles (Customer, Restaurant, Delivery, Admin) against the real Node.js backend.
- **Files Touched**: `tastifyyApp/app/_layout.tsx`, `tastifyyApp/app/(auth)/login.tsx`, `tastifyyApp/store/authStore.ts`, `tastifyyApp/api/axios.ts`, and dummy dashboard roots.

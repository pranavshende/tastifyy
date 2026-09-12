# Memory / AI Engineering Context — Tastifyy

```
Last Updated: 2026-09-12
Purpose: Quick context for AI agents and new developers
```

---

## What is Tastifyy?

A food delivery platform (like Swiggy/Zomato) built in India. It connects Customers, Restaurants, and Delivery Partners on a single platform. Live at https://www.tastifyy.in.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Website | React 19 + Vite 8 + TypeScript, React Router v7, Zustand |
| Mobile App | Expo SDK 54, React Native, expo-router, Zustand |
| Backend | Node.js + Express (TypeScript), Socket.io |
| ORM | Prisma 7 |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth (user creation) + custom HS256 JWT (sessions) |
| Google OAuth | `google-auth-library` (server-side ID token verification) |
| Payments | Razorpay (checkout + Route + webhooks) |
| Push Notifications | Firebase FCM (partial production) |
| SMS | BlackSMS (OTP) |
| File Storage | Supabase Storage |
| Maps / Distance | Haversine formula (in-code, no Maps API currently) |
| Deployment | Render (backend), Vercel (website), Expo EAS (mobile) |

---

## Repository Structure

```
tastifyy/
├── backend/          → API server. Entry: src/index.ts. Compiled to dist/. Render runs dist/index.js
├── website/          → React web app. Entry: src/main.tsx. Deployed to Vercel.
├── tastifyyApp/      → Expo mobile app. Entry: app/_layout.tsx.
└── Project/          → THIS FOLDER. All documentation.
```

---

## Key Architectural Decisions

1. **Auth tokens:** Custom HS256 JWTs signed with `JWT_SECRET`. Supabase creates the user, but we issue our own JWT. Raw Supabase tokens are NOT sent to clients.
2. **Trust proxy:** `app.set('trust proxy', 1)` — required for Render (not `true`, use `1`)
3. **CORS + Google OAuth popup:** `crossOriginOpenerPolicy: same-origin-allow-popups` in Helmet
4. **Google login:** If user exists → sign in. If not → return 404 + `GOOGLE_USER_NOT_REGISTERED` → frontend redirects to register page
5. **Restaurant partner resolution:** Auth middleware stores `user.id`. Menu/order routes find the restaurant by `RestaurantPartner.phone === user.phone`
6. **Delivery assignment:** Haversine-based proximity matching, forced assignment (no partner consent in MVP)
7. **Payment flow:** Order creation → Razorpay order → client checkout → `/verify-payment` → auto-confirm → restaurant accepts → assignment
8. **OTP storage:** In-memory Map (NOT Redis) — lost on server restart (known issue)
9. **dist/ is committed** — Render cannot run `tsc` at build time in current config, so compiled JS must be committed

---

## Important File Locations

| File | Purpose |
|---|---|
| `backend/src/index.ts` | Server setup, middleware, route registration |
| `backend/src/config/passport.ts` | JWT strategy (HS256 + RS256 dual support) |
| `backend/src/middlewares/auth.ts` | authenticate, authorizeRole |
| `backend/src/routes/auth.routes.ts` | All auth endpoints |
| `backend/src/routes/order.routes.ts` | Order lifecycle (huge file) |
| `backend/src/controllers/auth.controller.ts` | Login, register, Google login |
| `backend/src/controllers/payment.controller.ts` | Razorpay Route, refunds, payouts |
| `backend/src/services/assignment.service.ts` | Delivery partner assignment |
| `backend/src/services/notification.service.ts` | FCM push |
| `backend/src/services/sms.service.ts` | BlackSMS OTP |
| `backend/src/socket.ts` | Socket.io init + room management |
| `backend/prisma/schema.prisma` | Database schema (source of truth) |
| `website/src/App.tsx` | All web routes + GoogleOAuthProvider wrapper |
| `website/src/store/authStore.ts` | Zustand auth state for website |
| `tastifyyApp/app/_layout.tsx` | Root layout + role-based routing for mobile |

---

## Current Known Issues (as of 2026-09-12)

| Issue | Severity | Status |
|---|---|---|
| OTP stored in-memory — not durable | HIGH | Known, not fixed |
| FCM push needs FIREBASE_SERVICE_ACCOUNT_KEY in production | HIGH | Missing from Render env |
| No restaurant order timeout/auto-cancel/auto-refund | HIGH | NOT IMPLEMENTED |
| Google auth fix (email_exists 422) applied | MEDIUM | Applied, needs prod verification |
| Delivery partner payout not automated | MEDIUM | DB ready, not triggered |
| Orphaned orders from failed payments never cleaned | MEDIUM | NOT IMPLEMENTED |
| COD payment_status never updated to reflect collection | LOW | Known gap |
| Notifications table exists but no frontend inbox | LOW | NOT IMPLEMENTED |

---

## Development Workflow

```
1. Edit TypeScript source in backend/src/
2. Run: cd backend && npm run build   (outputs to dist/)
3. Commit dist/ along with src/ changes
4. git push → triggers Render auto-deploy
5. Render runs: node dist/index.js
```

Website: Vercel auto-deploys from git push. No build step needed to commit.
Mobile: Built with EAS Build. OTA updates via Expo.

---

## Environment Variables Required

Backend (on Render):
- DATABASE_URL, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY, SUPABASE_JWKS_URL
- JWT_SECRET
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, RAZORPAYX_ACCOUNT_NUMBER
- BLACKSMS_AUTH_KEY, BLACKSMS_SENDER_ID
- CORS_ORIGIN
- FIREBASE_SERVICE_ACCOUNT_KEY (Added for production)
- REDIS_URL (Added for BullMQ and OTP)

Website (on Vercel):
- VITE_GOOGLE_CLIENT_ID
- VITE_API_URL (backend URL)

---

## Changelog Summary (Recent)

| Date | Change |
|---|---|
| 2026-09-13 | Implemented Redis + BullMQ infrastructure for background jobs |
| 2026-09-13 | Migrated OTP storage from in-memory Map to Redis for durability |
| 2026-09-13 | Fixed FCM push notifications production issue (using modular admin SDK) |
| 2026-09-13 | Added automatic order timeout cancellation and refund using BullMQ |
| 2026-09-13 | Automated delivery partner payouts on order delivery |
| 2026-09-13 | Built Customer Notification Inbox UI (bell + dropdown) |
| 2026-09-12 | Decided Redis + BullMQ for background job parallelization |
| 2026-09-12 | Fixed 401 errors: all auth flows now issue HS256 JWTs with JWT_SECRET |
| 2026-09-12 | Fixed Google login: returns 404 for new users instead of calling createUser() |
| 2026-09-12 | Set trust proxy: 1 to fix ERR_ERL_PERMISSIVE_TRUST_PROXY on Render |
| 2026-09-12 | Added /customer/register page + login/signup split on website |
| 2026-09-05 | Synced database.md with latest schema.prisma |
| 2026-08-29 | Fixed TypeScript test configuration (Jest types) |
| 2026-08-16 | Built customer web portal dashboard (Home.tsx) |
| 2026-08-15 | Full system implemented (Auth, Menu, Orders, Payments, Delivery, Admin) |

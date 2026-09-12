# Architecture — Tastifyy

```
Last Updated: 2026-09-12
Source of Truth: Current codebase
Status: Current
```

---

## System Overview

Tastifyy is a food delivery platform built on a centralized monolith backend with two client surfaces: a web app and a mobile app.

```
Customer / Restaurant / Delivery / Admin
          |
   +------+------+
   |              |
Website           Android App
(React + Vite)    (Expo / React Native)
   |              |
   +------+-------+
          |
    Backend API
    (Express + TypeScript)
          |
    Controllers / Services
          |
    Prisma ORM
          |
    PostgreSQL (Supabase)
```

---

## Repository Structure

```
tastifyy/
├── backend/          # Node.js Express API (TypeScript)
│   ├── src/
│   │   ├── index.ts          # Entry point
│   │   ├── config/           # passport.ts (JWT strategy)
│   │   ├── controllers/      # auth, menu, payment, restaurant
│   │   ├── middlewares/      # auth.ts (authenticate, authorizeRole)
│   │   ├── routes/           # All route files
│   │   ├── services/         # assignment, notification, sms, storage
│   │   ├── sockets/
│   │   ├── socket.ts         # Socket.io server
│   │   └── utils/            # prisma, supabase, jwt, storage
│   ├── prisma/
│   │   └── schema.prisma     # Source of truth for DB schema
│   └── dist/                 # Compiled JS (committed, Render runs this)
├── website/          # React 19 + Vite + TypeScript
│   └── src/
│       ├── App.tsx            # Router setup + Google OAuth provider
│       ├── api/axios.ts       # Axios instance with Bearer token interceptor
│       ├── store/authStore.ts # Zustand auth state
│       ├── api/socket.ts      # Socket.io client
│       ├── pages/
│       │   ├── Landing.tsx
│       │   ├── admin/
│       │   ├── customer/
│       │   ├── delivery/
│       │   ├── onboarding/
│       │   └── restaurant/
│       └── components/
├── tastifyyApp/      # Expo SDK / React Native
│   ├── app/          # expo-router file-based routes
│   │   ├── _layout.tsx
│   │   ├── (auth)/
│   │   ├── (customer)/
│   │   ├── (delivery)/
│   │   ├── (restaurant)/
│   │   ├── (admin)/
│   │   └── onboarding/
│   ├── store/        # authStore, cartStore (Zustand)
│   └── api/          # axios.ts
└── Project/          # Documentation (single source of truth)
```

---

## Backend Architecture

### Express Server (`src/index.ts`)
- `app.set('trust proxy', 1)` — Required for Render (single proxy hop)
- CORS configured from `CORS_ORIGIN` env var, always includes `tastifyy.in` and `www.tastifyy.in`
- Helmet with `crossOriginOpenerPolicy: same-origin-allow-popups` (for Google OAuth popup)
- Rate limiting: 100 req/15min global, 20 req/15min on `/api/auth`
- Socket.io initialized on same HTTP server

### Authentication Flow
```
Client Request with Bearer Token
        |
Passport JWT Strategy (passport.ts)
        |
customSecretProvider()
  ├── alg=HS256 → JWT_SECRET (custom tokens)
  └── alg=RS256 → jwks-rsa (Supabase JWKS endpoint)
        |
prisma.user.findUnique({ where: { id: jwt_payload.sub } })
        |
req.user = dbUser
```

**Token issuance:** All auth flows (email/password login, register, OTP verify, Google login) now issue HS256 JWTs signed with `JWT_SECRET`. No raw Supabase tokens are passed to clients.

### RBAC Middleware
- `authenticate` — validates JWT, populates `req.user`
- `authorizeRole(['role1', 'role2'])` — checks `req.user.role`

---

## Frontend Architecture (Website)

### Tech Stack
- React 19, Vite 8, TypeScript
- React Router v7 (BrowserRouter)
- Zustand for auth state
- Axios with Bearer token interceptor
- `@react-oauth/google` for Google One-Tap login
- Socket.io-client for real-time events

### Route Structure
```
/ (Landing)
/customer/login       — Public (redirects to /customer/home if logged in)
/customer/register    — Public (Google signup flow redirects here)
/customer/home        — Protected [customer]
/customer/search      — Protected [customer]
/customer/restaurants — Protected [customer]
/customer/restaurants/:id — Protected [customer]
/customer/checkout    — Protected [customer]
/customer/orders      — Protected [customer]
/customer/orders/:id  — Protected [customer]
/customer/profile     — Protected [customer]
/customer/cuisines    — Protected [customer]
/customer/offers      — Protected [customer]
/customer/about       — Protected [customer]
/restaurant           — Public (Restaurant registration landing)
/restaurant/login     — Public
/restaurant/dashboard — Protected [restaurant_partner]
/restaurant/menu      — Protected [restaurant_partner]
/restaurant/profile   — Protected [restaurant_partner]
/restaurant/transactions — Protected [restaurant_partner]
/delivery/login       — Public
/delivery/dashboard   — Protected [delivery_partner]
/delivery/profile     — Protected [delivery_partner]
/admin                — Public (Admin login)
/admin/dashboard      — Protected [admin]
/onboarding/customer  — Protected [customer]
/onboarding/restaurant — Protected [restaurant_partner]
/onboarding/delivery  — Protected [delivery_partner]
/onboarding/status    — Protected [restaurant_partner, delivery_partner]
```

### Auth State Persistence
- Token stored in `localStorage` under key `token`
- On mount: `initAuth()` calls `GET /api/auth/me` to validate session
- On 401/403: `clearAuth()` removes token and redirects

---

## Mobile Architecture (tastifyyApp)

### Tech Stack
- Expo SDK 54, React Native
- expo-router (file-based routing)
- Zustand (`authStore`, `cartStore`)
- Axios with Bearer token interceptor

### Route Structure
```
/                   → index (redirects based on role)
/(auth)/login       — OTP + Google OAuth login
/(auth)/register-restaurant
/(customer)/home    — Restaurant discovery
/(customer)/cart    — Cart + checkout flow
/(customer)/orders  — Order history
/(customer)/profile — Profile management
/(customer)/search  — Search
/(customer)/support
/(customer)/Assistant — AI recommendations
/(customer)/restaurant/[id] — Restaurant + menu
/(customer)/order/[id] — Order detail
/(delivery)/home    — Delivery partner dashboard
/(delivery)/profile
/(restaurant)/dashboard — Restaurant dashboard (mobile)
/(admin)/dashboard  — Admin (mobile shell)
/(auth)/register-restaurant
onboarding/*
```

### Guest Browsing
Unauthenticated users are sent to `/(customer)/home` (not to login), allowing browsing without auth. Auth is required at checkout.

---

## Real-time Architecture (Socket.io)

### Rooms
```
customer_<userId>         — Customer receives order status updates
restaurant_<userId>       — Restaurant receives order events
restaurant_<restaurantId> — Restaurant receives orders for their specific restaurant
delivery_<partnerId>      — Delivery partner receives assignment
admin                     — Admin receives all events
```

### Events Emitted by Backend
```
order:created             → restaurant room + admin
order:restaurant_confirmed → restaurant room + admin
order:preparing           → customer + admin
order:ready               → customer + admin
order:rider_assigned      → customer + admin
order:picked_up           → customer + admin
order:out_for_delivery    → customer + admin
order:delivered           → customer + admin
order:cancelled           → customer + admin
order:rejected            → customer + admin
delivery:assigned         → delivery partner room
order:rider_assigned      → restaurant room (rider info)
rider_location_update     → customer room (live location)
```

### Events Emitted by Clients
```
join                      — Join role-specific room
join_restaurant           — Join restaurant-specific room
update_location           — Delivery partner sends GPS coordinates
```

---

## Integrations

| Service | Purpose | Status |
|---|---|---|
| Supabase Auth | User identity, email/password auth | Active (Supabase creates user, app issues own JWT) |
| Supabase PostgreSQL | Primary database via Prisma | Active |
| Supabase Storage | File storage (profile photos, restaurant assets, documents) | Active |
| Google OAuth | Google sign-in (ID token verified server-side via google-auth-library) | Active |
| Razorpay | Payment gateway, Route (splits), RazorpayX (payouts) | Active (Live keys) |
| BlackSMS | OTP and delivery OTP via SMS | Active |
| Firebase FCM | Push notifications | PARTIAL — sends if FIREBASE_SERVICE_ACCOUNT_KEY set, otherwise logs to console |
| Render | Backend hosting | Active (Node.js) |
| Vercel | Website hosting | Active |
| Expo EAS | Mobile builds | Active |

---

## Deployment Architecture

```
tastifyy.in / www.tastifyy.in  → Vercel (website/)
tastifyy.onrender.com          → Render (backend/dist/index.js)
Supabase                       → PostgreSQL + Auth + Storage
```

### Environment Variables (Backend)
```
DATABASE_URL              — Supabase PostgreSQL connection string
SUPABASE_URL              — Supabase project URL
SUPABASE_PUBLISHABLE_KEY  — Supabase anon key
SUPABASE_SECRET_KEY       — Supabase service role key (admin operations)
SUPABASE_JWKS_URL         — JWKS endpoint for RS256 token verification
JWT_SECRET                — HS256 signing secret for custom JWTs
GOOGLE_CLIENT_ID          — Google OAuth client ID
GOOGLE_CLIENT_SECRET      — Google OAuth client secret
RAZORPAY_KEY_ID           — Razorpay live key ID
RAZORPAY_KEY_SECRET       — Razorpay live key secret
RAZORPAY_WEBHOOK_SECRET   — Webhook HMAC secret
RAZORPAYX_ACCOUNT_NUMBER  — RazorpayX source account
BLACKSMS_AUTH_KEY         — BlackSMS access token
BLACKSMS_SENDER_ID        — BlackSMS sender ID
CORS_ORIGIN               — Comma-separated allowed origins
PORT                      — Server port (default 5000)
FIREBASE_SERVICE_ACCOUNT_KEY — FCM (not yet set in production)
REDIS_URL                 — Redis connection (planned, not yet implemented)
```

---

## Background Job Architecture (Planned)

> **Status: PLANNED — Not yet implemented in codebase**

Queues to be implemented with BullMQ + Redis:
- `notificationQueue` — SMS OTPs, FCM Push Notifications
- `assignmentQueue` — Geographic delivery partner matching

Currently these run synchronously on the Express thread or fire-and-forget (`.catch()`).

---

## Payment Architecture

```
Customer → POST /api/orders (creates Razorpay order + DB Order record, status=pending)
         → Client opens Razorpay Checkout SDK
         → Payment complete
         → POST /api/orders/verify-payment (HMAC signature check)
         → payment_status=success, order status=restaurant_confirmed
         → Restaurant accepts via PUT /api/orders/:id/status
         → Delivery partner assigned (assignDeliveryPartner service)
         → Order fulfilled → status=delivered
         → Razorpay Route transfer released to restaurant
         → Delivery partner earnings calculated (pending manual payout)
```

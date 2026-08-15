# Architecture

*Cross-reference: System structure, modules, data flow, and tech stack decisions.*

## System Ecosystem
Tastifyy is composed of three independent apps and four logical interfaces, all backed by a single backend platform:

1. **Mobile App (`tastifyyApp/`)** — React Native (Expo SDK 54). Single app with role-based navigation handling both **Customer** and **Delivery Partner** flows. Uses `expo-router` file-based routing.
2. **Web App (`website/`)** — React 19 + Vite 8 + TypeScript. Single web app with role-based routing handling both **Restaurant Partner Panel** and **Admin Panel** as separate route segments.
3. **Backend (`backend/`)** — Node.js (Express + TypeScript). Central API server handling all ordering logic, Razorpay payments, Socket.io realtime, Firebase push notifications, and Prisma DB access.

## Repository Structure (Flat — Independent Apps)
```
tastifyy/
├── tastifyyApp/          # React Native (Expo SDK 54) — Customer + Delivery Partner
│   ├── app/              # expo-router file-based routes
│   ├── components/
│   ├── constants/
│   ├── hooks/
│   └── assets/
├── website/              # React 19 + Vite — Restaurant Panel + Admin Panel
│   └── src/
├── backend/              # Node.js — REST API + Socket.io + Prisma
├── Project/              # Documentation (single source of truth)
└── .agents/              # Agent rules
```

## Data Flow
- `[ tastifyyApp (Customer) ]` → places order → `[ backend API ]` → routes order → `[ website (Restaurant Panel) ]`
- `[ backend API ]` → assigns delivery → `[ tastifyyApp (Delivery Partner) ]` → live updates via Socket.io → `[ tastifyyApp (Customer) ]`
- `[ website (Admin Panel) ]` ⇄ oversees & configures ⇄ `[ backend API ]`

## Confirmed Tech Stack

### Client Interfaces
| Interface | App | Technology | Notes |
| :--- | :--- | :--- | :--- |
| Customer App | `tastifyyApp/` | React Native (Expo SDK 54) | Role-based nav, file-based routing via expo-router |
| Delivery Partner App | `tastifyyApp/` | React Native (Expo SDK 54) | Same app, different role/navigation stack |
| Restaurant Partner Panel | `website/` | React 19 + Vite 8 + TypeScript | Role-based routing |
| Admin Panel | `website/` | React 19 + Vite 8 + TypeScript | Same app, separate route segment |

### Backend
| Layer | Technology | Notes |
| :--- | :--- | :--- |
| API Server | Node.js + Express (TypeScript) | REST API, role-based authorization |
| Realtime | Socket.io | Live order tracking, restaurant order events |
| ORM | Prisma | Type-safe DB client, migration tracking |
| Database | Supabase (PostgreSQL) | Managed Postgres, ACID-compliant |
| Authentication | JWT (access + refresh) + OTP | OTP-first per PRD §12.1 |
| Payments | Razorpay | PRD §74.11 — no raw card data stored |
| Push Notifications | Firebase Cloud Messaging (FCM) | Android priority per PRD §59 |
| Messaging Service | **TBD** | SMS/OTP provider to be confirmed |
| File Storage | Cloudinary | Food images, restaurant photos, partner documents |
| Maps | Google Maps API | Location, restaurant markers, live tracking |

### Deployment
| Service | Platform | Notes |
| :--- | :--- | :--- |
| Backend API | Render | Node.js hosting |
| Web App (Restaurant + Admin) | Vercel | React/Vite hosting |
| Database | Supabase | Managed PostgreSQL |
| Mobile App | Expo EAS Build | Cloud builds for Android/iOS |

## Deviation from Planned Structure
**Original plan**: pnpm workspaces monorepo with `apps/` and `packages/` folders.
**Actual structure**: Flat independent folders (`tastifyyApp/`, `website/`, `backend/`).
**Reason**: User chose to keep the flat structure that was manually created. Role consolidation (Customer + Delivery into one Expo app; Restaurant Panel + Admin into one React app) reduces the number of independent apps from 4 to 3.
**Accepted**: 2026-08-15. `architecture.md` updated to reflect the actual build.

## Key Architecture Rules
- All financial values (commission, fees, coupon limits, coin value, ad pricing) are stored in `admin_config` table and read dynamically — never hardcoded.
- No raw card data is stored on Tastifyy servers. Razorpay handles PCI-sensitive data; only order/payment references are persisted.
- Role-based access enforced at the API layer. No cross-role data leakage.
- All Admin Panel sensitive actions are logged in `admin_audit_log`.
- Customer location is shared with delivery partner only for the duration of an active order.
- Messaging service (OTP/SMS) provider is TBD — architecture accommodates any provider via an abstracted notification service interface.

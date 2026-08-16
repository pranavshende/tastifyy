# Architecture

*Cross-reference: System structure, modules, data flow, and tech stack decisions. (Aligned with PRD v2.1)*

## System Ecosystem
Tastifyy is built on a **Centralized Platform + Role-Based Experiences** architecture. It is composed of a single mobile app and a single web app, all backed by a single central platform:

1. **Unified Mobile App (`tastifyyApp/`)** — React Native (Expo SDK 54). A single app containing Customer, Delivery Partner, Restaurant, and Admin experiences. The active role determines the navigation/dashboard shown. Uses `expo-router` file-based routing.
2. **Unified Web App (`website/`)** — React 19 + Vite 8 + TypeScript. A single web app containing Customer, Restaurant Partner Panel, and Admin Panel experiences via role-based route segments.
3. **Backend Central Platform (`backend/`)** — Node.js (Express + TypeScript). Central API server acting as the single source of truth for all modules, real-time events, and business rules.

## Repository Structure (Flat — Independent Apps)
```
tastifyy/
├── tastifyyApp/          # React Native (Expo SDK 54) — Unified Mobile App
│   ├── app/              # expo-router file-based routes
│   ├── components/
│   ├── constants/
│   ├── hooks/
│   └── assets/
├── website/              # React 19 + Vite — Unified Web App
│   └── src/
├── backend/              # Node.js — REST API + Socket.io + Prisma
├── Project/              # Documentation (single source of truth)
└── .agents/              # Agent rules
```

## Data Flow
- `[ Unified Mobile/Web App ]` → User authenticates and role is resolved → `[ Backend API ]`
- `[ Backend API ]` → Retrieves role-specific data (e.g. Menu for Restaurant, Nearby places for Customer) → `[ Unified Mobile/Web App ]`
- `[ Backend API ]` → assigns delivery → `[ Delivery Experience ]` → live updates via Socket.io → `[ Customer Experience ]`

## Confirmed Tech Stack

### Client Interfaces
| Interface | App | Technology | Notes |
| :--- | :--- | :--- | :--- |
| Unified Mobile App | `tastifyyApp/` | React Native (Expo SDK 54) | Role-based navigation via `expo-router` |
| Unified Web App | `website/` | React 19 + Vite 8 + TypeScript | Role-based routing |

### Backend Platform
| Layer | Technology | Notes |
| :--- | :--- | :--- |
| API Server | Node.js + Express (TypeScript) | REST API, strict RBAC authorization |
| Realtime | Socket.io | Live order tracking, restaurant order events |
| ORM | Prisma | Type-safe DB client, migration tracking |
| Database | Supabase (PostgreSQL) | Managed Postgres, ACID-compliant |
| Authentication | Custom JWT + OTP | Stateless JWT (access + refresh), OTP-first per PRD §12.1 |
| Payments | Razorpay | No raw card data stored |
| Push Notifications | Firebase Cloud Messaging (FCM) | Android priority |
| File Storage | Cloudinary | Food images, restaurant photos |
| Maps | Google Maps API | Location, restaurant markers, live tracking |

### Deployment
| Service | Platform | Notes |
| :--- | :--- | :--- |
| Backend API | Render | Node.js hosting |
| Unified Web App | Vercel | Static frontend hosting |
| Unified Mobile App | Expo EAS | Cloud builds & OTA updates |
| Database | Supabase | Managed Postgres |

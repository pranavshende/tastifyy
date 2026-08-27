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

## Payment & Money Flow (Razorpay)

### System Structure
1. **Order Creation (Backend):** When a customer initiates checkout, the backend creates an `Order` in the Supabase database with status `pending`. It calculates the total amount (item subtotal + delivery + platform fee + taxes - discount) and calls the Razorpay API to create a `razorpay_order_id`.
2. **Client Checkout (Frontend):** The unified web or mobile app uses the `razorpay_order_id` to initialize the Razorpay Checkout SDK. The customer completes the payment directly through Razorpay's secure UI.
3. **Payment Verification (Backend):** Upon successful payment, Razorpay returns a `razorpay_payment_id` and `razorpay_signature` to the client. The client forwards these to the backend's `/verify-payment` endpoint. The backend validates the HMAC SHA256 signature using the Razorpay API secret and updates the order status to `restaurant_confirmed`.

### Money Flow (Settlements & Payouts)
1. **Collection:** The customer pays the full `total_amount` via Razorpay. The funds are captured and held in Tastifyy's central Razorpay merchant account (or Nodal account).
2. **Distribution & Splits:** 
   - **Restaurant Partner:** Receives `[Item Subtotal] - [Tastifyy Commission %]`. This can be settled automatically via **Razorpay Route** (split payments at the time of transaction) or batched weekly via **RazorpayX** payouts.
   - **Delivery Partner:** Receives their per-order delivery earnings. This is typically batched and paid out weekly/daily via **RazorpayX** to their registered bank accounts.
   - **Tastifyy (Platform):** Retains the `Platform Fee`, the `Restaurant Commission`, and any margin kept from the `Delivery Fee`.

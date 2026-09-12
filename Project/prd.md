# Product Requirements Document — Tastifyy

```
Last Updated: 2026-09-12
Source of Truth: Current codebase + original PRD v2.1
Status: Current (reflects what is actually built)
```

---

## Product Overview

Tastifyy is a premium food delivery platform for India. It enables customers to discover restaurants, order food online, and track real-time delivery. It provides restaurant partners with a complete order management and menu system. Delivery partners receive automatic job assignments. Admins have full platform oversight.

**Live product:** https://www.tastifyy.in (website) | Mobile via Expo

---

## Problem Statement

Indian food delivery is dominated by Swiggy and Zomato. Tastifyy aims to differentiate through:
- A restaurant-first approach (lower commissions, better tooling)
- A delivery partner experience designed for earnings transparency
- A premium customer UI focused on food discovery

---

## Platform Strategy

```
Single Backend API (tastifyy.onrender.com)
    |
    |---- Website (tastifyy.in / www.tastifyy.in)
    |     - Customer portal (order food)
    |     - Restaurant partner panel
    |     - Delivery partner panel
    |     - Admin panel
    |
    +---- Android/iOS App (Expo)
          - Customer experience
          - Delivery partner experience
          - Restaurant experience (basic)
          - Admin (shell)
```

---

## Target Users

| Role | Platform | Purpose |
|---|---|---|
| Customer | Website + Mobile | Browse restaurants, order food, track delivery |
| Restaurant Partner | Website (primary) + Mobile (basic) | Manage menu, accept orders, view earnings |
| Delivery Partner | Mobile (primary) + Website | Accept deliveries, mark completion, earn |
| Admin | Website | Approve partners, manage platform, handle support |

---

## Current Product (IMPLEMENTED)

### Customer
- Registration via email/password or Google OAuth
- OTP login via phone (mobile)
- Restaurant discovery and search
- Full menu browsing with customizations
- Cart and checkout (Razorpay online + COD)
- Coupon application
- Real-time order tracking via Socket.io
- Delivery OTP confirmation
- Order history and details
- Ratings and reviews
- Support ticket creation
- Basic AI food recommendations (mock NLP)

### Restaurant Partner
- Multi-step onboarding with document uploads
- Admin approval workflow
- Real-time order dashboard (Socket.io)
- Accept/reject orders with automatic refund on rejection
- Menu CRUD (categories, items, customizations, images)
- Stock management
- Profile and operating hours management
- Toggle open/closed status
- Razorpay Route onboarding for payout splits
- Transaction history

### Delivery Partner
- Onboarding with document verification
- Online/offline toggle
- Automatic proximity-based order assignment
- Real-time location sharing to customer
- Delivery OTP confirmation
- Earnings tracking

### Admin
- Full platform dashboard with KPIs and revenue chart
- User management (activate/suspend)
- Restaurant approval/suspension
- Delivery partner approval
- Coupon management
- Platform fee configuration
- Support ticket resolution
- Immutable audit logs for all admin actions

---

## Payment Model

- **Customer pays:** item price + delivery fee (Rs20-25) + platform fee (capped Rs5) + 5% tax - discount
- **Restaurant receives:** item subtotal - Tastifyy commission (default 15%) - restaurant's discount share
- **Delivery partner receives:** delivery fee (gross, payout not yet automated)
- **Tastifyy earns:** platform fee + commission from restaurants

Payment flow uses Razorpay Standard Checkout with Razorpay Route for automatic splits.

---

## Order Lifecycle

```
Customer places order (PENDING)
      ↓
Payment verified (RESTAURANT_CONFIRMED) [online] OR stays PENDING [COD]
      ↓
Restaurant marks PREPARING → triggers delivery partner assignment
      ↓
Delivery partner assigned (RIDER_ASSIGNED)
      ↓
Rider picks up (PICKED_UP) → SMS OTP sent to customer
      ↓
Out for delivery (OUT_FOR_DELIVERY)
      ↓
Delivered (customer enters OTP)
```

Cancellation at any stage triggers automatic refund if payment was captured.

---

## Notifications

| Type | Channel | Status |
|---|---|---|
| Auth OTP | BlackSMS SMS | IMPLEMENTED |
| Delivery OTP | BlackSMS SMS | IMPLEMENTED |
| Order status updates | Socket.io | IMPLEMENTED |
| Push notifications (order events) | FCM | PARTIAL (needs production credential) |
| In-app notification inbox | — | NOT IMPLEMENTED |

---

## Known Platform Gaps (Current Product vs Ideal)

| Gap | Priority |
|---|---|
| Restaurant order timeout with auto-refund | HIGH |
| OTP durability (Redis) | HIGH |
| FCM push in production (missing key) | HIGH |
| Customer order cancellation | MEDIUM |
| Automated delivery payout | MEDIUM |
| Notification inbox UI | MEDIUM |
| Real LLM for AI recommendations | LOW |

---

## Future Product / Roadmap

These are NOT implemented in any form:

- **Tastifyy Coins** — Loyalty/rewards program
- **Group Orders** — Multiple customers, one order
- **Subscription Plans** — Monthly customer passes
- **Advanced AI** — Real LLM-powered recommendations (Gemini/OpenAI)
- **Tastifyy Pay** — Integrated wallet
- **Multi-language** — Hindi + regional languages
- **Dark Mode** — UI theme
- **Advanced Analytics** — Restaurant-level detailed analytics dashboard

---

## Non-Functional Requirements

| Requirement | Target | Status |
|---|---|---|
| API response time | < 500ms (p95) | Not measured |
| Uptime | 99.5%+ | Render free tier limitations |
| Concurrent WebSocket connections | 1000+ | Not load tested |
| File upload size | 5MB max | IMPLEMENTED |
| Rate limiting | 100 req/15min/IP | IMPLEMENTED |

---

## Security Requirements

| Requirement | Status |
|---|---|
| HTTPS enforced | YES (Render + Vercel) |
| JWT authentication on all protected routes | YES |
| RBAC enforcement | YES |
| Payment signature verification | YES |
| Webhook HMAC verification | YES |
| No raw card data stored | YES |
| Input validation | YES (basic) |
| XSS protection | PARTIAL (no explicit sanitization) |
| SQL injection protection | YES (Prisma parameterized) |
| CORS configured | YES |
| Rate limiting | YES |

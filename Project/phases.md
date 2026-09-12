# Phases — Tastifyy Development Roadmap

```
Last Updated: 2026-09-12
Source of Truth: Current codebase + implementation audit
Status: Current
```

---

## Phase Status Legend
- COMPLETE — Fully implemented, in production
- PARTIAL — Core implemented, some gaps remain
- IN PROGRESS — Actively being worked on
- PLANNED — Decided but not started
- NOT STARTED — Not begun

---

## Phase A — Authentication & Sessions
**Status: COMPLETE**

| Feature | Status |
|---|---|
| Email/password registration | COMPLETE |
| Email/password login | COMPLETE |
| Custom JWT issuance (HS256, JWT_SECRET) | COMPLETE |
| Google OAuth (ID token → server verify) | COMPLETE |
| OTP send/verify (BlackSMS) | COMPLETE |
| FCM token registration | COMPLETE |
| GET /auth/me (session validation) | COMPLETE |
| Role-based middleware (RBAC) | COMPLETE |
| Passport-JWT strategy (HS256 + RS256) | COMPLETE |
| Trust proxy: 1 for Render | COMPLETE |
| Rate limiting on auth routes | COMPLETE |

Known Issues:
- OTP stored in-memory — not durable across server restarts

---

## Phase B — Customer Experience
**Status: COMPLETE (minor gaps)**

| Feature | Status |
|---|---|
| Customer registration/login (web + mobile) | COMPLETE |
| Google login flow | COMPLETE |
| Profile view + edit + photo | COMPLETE |
| Address management (add, delete, default) | COMPLETE |
| Restaurant discovery | COMPLETE |
| Restaurant search (web + mobile) | COMPLETE |
| Restaurant detail + full menu | COMPLETE |
| Cart (Zustand) | COMPLETE |
| Checkout (Razorpay + COD) | COMPLETE |
| Coupon application | COMPLETE |
| Order history | COMPLETE |
| Order detail + real-time status | COMPLETE |
| Delivery OTP confirmation | COMPLETE |
| Order rating + review | COMPLETE |
| Support ticket creation | COMPLETE |
| AI recommendation (mock NLP) | PARTIAL — no LLM, regex only |
| Cuisines/Offers pages | PARTIAL — pages exist, static content |
| Notification inbox | NOT IMPLEMENTED |

---

## Phase C — Restaurant Partner Experience
**Status: COMPLETE (payouts partial)**

| Feature | Status |
|---|---|
| Restaurant onboarding (multi-step) | COMPLETE |
| Document upload (FSSAI, PAN, etc.) | COMPLETE |
| Admin approval workflow | COMPLETE |
| Live order dashboard (Socket.io) | COMPLETE |
| Accept / reject orders | COMPLETE |
| Order status updates | COMPLETE |
| Menu category + item CRUD | COMPLETE |
| Menu item image upload | COMPLETE |
| Item customizations | COMPLETE |
| Stock management (auto-decrement) | COMPLETE |
| Restaurant profile + hours | COMPLETE |
| Toggle open/closed | COMPLETE |
| Transactions/earnings view | PARTIAL — mock 7-day payout logic |
| Razorpay Route onboarding | COMPLETE |
| Actual payout tracking | PARTIAL — DB fields exist, no automation |

---

## Phase D — Delivery Partner Experience
**Status: COMPLETE (payout not automated)**

| Feature | Status |
|---|---|
| Delivery onboarding (web + mobile) | COMPLETE |
| Document upload (license, RC, ID) | COMPLETE |
| Admin approval | COMPLETE |
| Toggle online/offline | COMPLETE |
| View active order | COMPLETE |
| Automatic proximity assignment (Haversine) | COMPLETE |
| Real-time location relay via Socket.io | COMPLETE |
| Order status updates (pickup → delivery) | COMPLETE |
| Delivery OTP entry | COMPLETE |
| Earnings view | COMPLETE |
| Automatic payout via RazorpayX | PARTIAL — DB ready, not triggered |

---

## Phase E — Admin
**Status: COMPLETE**

| Feature | Status |
|---|---|
| Admin login | COMPLETE |
| KPI dashboard + revenue chart | COMPLETE |
| User management (activate/suspend) | COMPLETE |
| Restaurant management (approve/reject/suspend) | COMPLETE |
| Delivery partner management | COMPLETE |
| Order management | COMPLETE |
| Coupon management | COMPLETE |
| Platform config management | COMPLETE |
| Support ticket management | COMPLETE |
| Admin audit log (immutable) | COMPLETE |
| Manual refund trigger | COMPLETE |

---

## Phase F — Payments (Razorpay Full Integration)
**Status: PARTIAL**

| Feature | Status |
|---|---|
| Razorpay online payment | COMPLETE |
| Payment signature verification | COMPLETE |
| Route transfer (splits) | COMPLETE |
| COD orders | COMPLETE |
| Automatic refunds on cancellation | COMPLETE |
| Idempotent refunds | COMPLETE |
| Razorpay webhook handler | COMPLETE |
| Delivery partner payout (RazorpayX) | PARTIAL |
| Restaurant response timeout + auto-refund | NOT IMPLEMENTED |
| Orphaned order cleanup (failed payments) | NOT IMPLEMENTED |

---

## Phase G — Real-time & Notifications
**Status: PARTIAL**

| Feature | Status |
|---|---|
| Socket.io order event broadcasting | COMPLETE |
| Live delivery location relay | COMPLETE |
| BlackSMS OTP (auth + delivery) | COMPLETE |
| FCM push notifications (backend) | PARTIAL — needs production credential |
| Notification inbox UI | NOT IMPLEMENTED |

---

## Phase H — Infrastructure Enhancements
**Status: IN PROGRESS**

| Feature | Status |
|---|---|
| Render deployment | COMPLETE |
| trust proxy: 1 configuration | COMPLETE |
| CORS configuration | COMPLETE |
| Rate limiting | COMPLETE |
| Redis + BullMQ background jobs | PLANNED — queues for SMS, FCM, assignment |

---

## Phase I — Testing
**Status: PARTIAL**

| Feature | Status |
|---|---|
| Jest + Supertest test suite (backend) | PARTIAL — suites written, production not re-run |
| TypeScript config for tests | COMPLETE |
| Production auth flow testing | NOT COMPLETED |
| Payment flow end-to-end testing | NOT COMPLETED |

---

## Phase J — Future Roadmap (NOT STARTED)

- AI food recommendations using real LLM (Gemini/OpenAI)
- Tastifyy Coins / loyalty program
- Group orders
- Subscription plans for customers
- Advanced restaurant analytics
- Multi-language support
- Tastifyy Pay (wallet)

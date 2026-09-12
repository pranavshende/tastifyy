# Test Plan — Tastifyy

```
Last Updated: 2026-09-12
Source of Truth: backend/tests/, manual testing, production observations
Status: Partially Current
```

Legend: [x] Verified | [ ] Not tested | [!] Failing | [-] Not applicable

---

## Authentication Tests

| Test Case | Status | Notes |
|---|---|---|
| Register with email+password creates user | [ ] Not tested in prod | |
| Register with duplicate email returns 400 | [ ] Not tested | |
| Register with duplicate phone returns 400 | [ ] Not tested | |
| Login with correct email+password returns JWT | [ ] Not tested | |
| Login with wrong password returns 401 | [ ] Not tested | |
| Login with suspended account returns 403 | [ ] Not tested | |
| Google login with existing account signs in (no duplicate create) | [!] Was failing (email_exists 422) — fix applied, needs re-verification | |
| Google login with new account returns GOOGLE_USER_NOT_REGISTERED | [ ] Not tested | |
| Google login → redirect to /customer/register with pre-filled data | [ ] Not tested | |
| OTP send via BlackSMS | [ ] Not tested in prod (credentials needed) | |
| OTP verify creates new user if not exists | [ ] Not tested | |
| OTP expires after 5 minutes | [ ] Not tested | |
| GET /auth/me returns user for valid JWT | [ ] Not tested | |
| GET /auth/me returns 401 for expired/invalid JWT | [ ] Not tested | |
| FCM token registration | [ ] Not tested | |
| Logout clears frontend session | [ ] Not tested | |

---

## Protected Route / RBAC Tests

| Test Case | Status |
|---|---|
| Customer can access /api/customer/* | [ ] |
| Restaurant partner cannot access /api/customer/* | [ ] |
| Delivery partner cannot access /api/admin/* | [ ] |
| Admin can access all endpoints | [ ] |
| Unauthenticated request returns 401 | [ ] |
| ProtectedRoute on website redirects to login if not authenticated | [ ] |

---

## Customer Flow Tests

| Test Case | Status |
|---|---|
| Customer can view profile | [ ] |
| Customer can update profile | [ ] |
| Customer can upload/delete profile photo | [ ] |
| Customer can add address | [ ] |
| Customer can delete address (soft delete) | [ ] |
| Customer can set default address | [ ] |
| Restaurant list loads on home page | [ ] |
| Search returns relevant restaurants | [ ] |
| Restaurant menu loads with categories | [ ] |
| Cart adds/removes items correctly | [ ] |
| Checkout with online payment creates Razorpay order | [ ] |
| Checkout with COD creates order without Razorpay | [ ] |
| Coupon applied correctly reduces total | [ ] |
| Invalid coupon returns error | [ ] |
| Stock insufficient → order creation fails | [ ] |
| Order outside service radius → order creation fails | [ ] |
| Payment verification with valid signature → order confirmed | [ ] |
| Payment verification with invalid signature → 400 | [ ] |
| Orders page shows order history | [ ] |
| Order detail shows all items and status | [ ] |
| Rating submission for delivered order | [ ] |
| Rating on non-delivered order returns 400 | [ ] |
| Duplicate rating returns 400 | [ ] |
| Support ticket creation | [ ] |
| Support ticket listing | [ ] |

---

## Restaurant Partner Flow Tests

| Test Case | Status |
|---|---|
| Restaurant onboarding creates restaurant + partner record | [ ] |
| Document upload stores files in Supabase Storage | [ ] |
| Restaurant status starts as pending | [ ] |
| Restaurant active orders load in real-time | [ ] |
| Accept order → status=restaurant_confirmed, delivery assigned | [ ] |
| Reject order with online payment → refund issued | [ ] |
| Reject order where refund fails → status rolled back | [ ] |
| Menu category CRUD works correctly | [ ] |
| Menu item CRUD with image upload | [ ] |
| Toggle item availability | [ ] |
| Toggle restaurant open/closed | [ ] |
| Transactions list loads | [ ] |

---

## Delivery Partner Flow Tests

| Test Case | Status |
|---|---|
| Delivery onboarding creates partner record | [ ] |
| Toggle online/offline updates is_online | [ ] |
| Auto-assignment selects closest available partner | [ ] |
| Partner receives Socket.io delivery:assigned event | [ ] |
| Status update picked_up → out_for_delivery → delivered | [ ] |
| Delivered requires valid OTP | [ ] |
| Delivered with wrong OTP returns 400 | [ ] |
| Live location update relayed to customer | [ ] |

---

## Admin Flow Tests

| Test Case | Status |
|---|---|
| KPI dashboard loads with real data | [ ] |
| Revenue chart shows last 30 days | [ ] |
| Approve restaurant → status=active | [ ] |
| Suspend restaurant | [ ] |
| Approve delivery partner | [ ] |
| Coupon create/update/delete | [ ] |
| Platform config update | [ ] |
| Support ticket resolution | [ ] |
| Admin audit log written for refunds | [ ] |

---

## Payment Tests

| Test Case | Status | Notes |
|---|---|---|
| Online payment creates Razorpay order | [ ] | |
| Payment verification succeeds with correct signature | [ ] | |
| Payment verification fails with wrong signature → 400 | [ ] | |
| Restaurant rejection triggers auto-refund | [ ] | |
| Restaurant rejection where refund fails → status rollback | [ ] | |
| COD order created without Razorpay | [ ] | |
| Duplicate refund blocked (idempotency) | [ ] | |
| Webhook: payment.captured updates order | [ ] | |
| Webhook: payment.failed updates order | [ ] | |
| Webhook with invalid signature rejected | [ ] | |
| Route transfer with on_hold created at order time | [ ] | |
| Restaurant without active Route account → no transfer | [ ] | |

---

## Real-time / Socket.io Tests

| Test Case | Status |
|---|---|
| Client connects and joins role room | [ ] |
| order:created emitted to restaurant on order placement | [ ] |
| order:restaurant_confirmed emitted after payment verify | [ ] |
| Order status change emits correct event to customer room | [ ] |
| delivery:assigned emitted to delivery partner | [ ] |
| rider_location_update relayed to customer | [ ] |

---

## Infrastructure / Production Tests

| Test Case | Status | Notes |
|---|---|---|
| Backend starts on Render without errors | [x] Verified | |
| trust proxy: 1 resolves ERR_ERL_PERMISSIVE_TRUST_PROXY | [x] Verified | |
| CORS allows tastifyy.in and www.tastifyy.in | [x] Verified | |
| Google OAuth popup not blocked by COOP | [x] Verified (same-origin-allow-popups) | |
| Rate limiting works on auth routes | [ ] Not verified | |
| Environment variables set correctly on Render | [x] Verified (most) | FIREBASE_SERVICE_ACCOUNT_KEY missing |
| HTTPS enforced | [x] Verified (Render + Vercel) | |
| dist/ compiled and committed before deploy | [x] Verified process | |

---

## Backend Unit / Integration Tests (Jest + Supertest)

| Suite | Status | Notes |
|---|---|---|
| Auth controller tests | [ ] Not run in prod | Written but needs prod validation |
| Order creation tests | [ ] | |
| Payment verification tests | [ ] | |
| Refund logic tests | [ ] | |
| Rate limiting tests | [ ] | |

Test infrastructure fixed (2026-08-29):
- backend/tests/tsconfig.json — standalone with jest types
- backend/tsconfig.test.json — composite for ts-jest
- backend/jest.config.js — points to tsconfig.test.json
- Tests use `npm test` — `node --experimental-vm-modules jest`

---

## Known Test Gaps

| Gap | Priority |
|---|---|
| Google auth flow needs production verification after fix | HIGH |
| OTP durability test (restart server, OTP invalidated) | HIGH |
| FCM push notification end-to-end | HIGH |
| Restaurant timeout / auto-cancel test | MEDIUM |
| Razorpay webhook end-to-end | MEDIUM |
| Route transfer on-hold and release | MEDIUM |
| Delivery partner auto-assignment with real partners | MEDIUM |

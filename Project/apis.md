# API Reference — Tastifyy

```
Last Updated: 2026-09-12
Source of Truth: Current codebase (backend/src/routes/, backend/src/controllers/)
Status: Current
```

---

## Global Conventions

- **Base URL:** `https://tastifyy.onrender.com/api`
- **Auth Header:** `Authorization: Bearer <JWT>` (Custom HS256 JWT, signed with JWT_SECRET)
- **Content-Type:** `application/json` (except file uploads: `multipart/form-data`)
- **Response Format:**
  ```json
  { "success": true, "data": {...} }
  { "success": false, "error": { "code": "ERROR_CODE", "message": "Human readable" } }
  ```
- **Rate Limiting:** Global: 100 req / 15 min / IP. Auth routes: 20 req / 15 min / IP.

---

## Authentication (`/api/auth`)

| Method | Path | Auth | Role | Purpose |
|---|---|---|---|---|
| POST | `/auth/register` | No | — | Email/password registration |
| POST | `/auth/login` | No | — | Email/password login |
| POST | `/auth/google` | No | — | Google OAuth login / signup redirect |
| POST | `/auth/otp/send` | No | — | Send OTP to phone via BlackSMS |
| POST | `/auth/otp/verify` | No | — | Verify OTP and get JWT |
| GET | `/auth/me` | Yes | Any | Get current user profile |
| POST | `/auth/logout` | No | — | Invalidate session |
| POST | `/auth/fcm-token` | Yes | Any | Register FCM push token |

### POST `/auth/register`
- **Body:** `{ email, password, phone, name, role, dob?, profile_photo? (file) }`
- **Roles allowed in body:** `customer`, `restaurant_partner`, `delivery_partner` (NOT `admin`)
- **Returns:** `{ success, user, session: { access_token } }`
- **Errors:** `400 VALIDATION_ERROR`, `400 DUPLICATE`, `500 INTERNAL_ERROR`
- **Note:** Token is HS256, signed with JWT_SECRET. NOT raw Supabase token.

### POST `/auth/login`
- **Body:** `{ email, password }`
- **Returns:** `{ success, user, session: { access_token } }`
- **Errors:** `401 AUTH_FAILED`, `404 NOT_FOUND`, `403 ACCOUNT_SUSPENDED`
- **Note:** Token is HS256, signed with JWT_SECRET. NOT raw Supabase token.

### POST `/auth/google`
- **Body:** `{ credential }` (Google ID token)
- **Returns (existing user):** `{ success: true, user, session: { access_token } }`
- **Returns (new user):** `{ success: false, error: { code: "GOOGLE_USER_NOT_REGISTERED" }, data: { email, name, picture } }`
- **Frontend behavior:** On 404 + GOOGLE_USER_NOT_REGISTERED, redirect to /customer/register with pre-filled state.

### POST `/auth/otp/send`
- **Body:** `{ phone, role? }`
- **OTP Storage:** In-memory Map (server restart clears all OTPs — NOT production-safe for distributed/restarting servers)
- **Expiry:** 5 minutes

### POST `/auth/otp/verify`
- **Body:** `{ phone, otp }`
- **Returns:** `{ success, user, session: { access_token } }`

---

## Customer Routes (`/api/customer`)

All require `Authorization: Bearer <JWT>` + `role: customer`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/customer/profile` | Get own profile |
| PUT | `/customer/profile` | Update name/phone/email/dob |
| POST | `/customer/profile/photo` | Upload profile photo (multipart) |
| DELETE | `/customer/profile/photo` | Delete profile photo |
| GET | `/customer/addresses` | List addresses (non-deleted) |
| POST | `/customer/addresses` | Create new address |
| DELETE | `/customer/addresses/:id` | Soft-delete address |
| PATCH | `/customer/addresses/:id/default` | Set as default address |
| GET | `/customer/restaurants` | List all active restaurants |
| GET | `/customer/restaurants/:id/menu` | Get restaurant + categorized menu |

---

## Order Routes (`/api/orders`)

All require authentication.

| Method | Path | Auth Role | Purpose |
|---|---|---|---|
| POST | `/orders` | customer | Create order (Razorpay or COD) |
| POST | `/orders/verify-payment` | customer | Verify Razorpay signature |
| GET | `/orders/my-orders` | customer | List all my orders |
| GET | `/orders/customer/:id` | customer | Get single order detail |
| POST | `/orders/:id/rate` | customer | Rate a delivered order |
| GET | `/orders/restaurant/active` | restaurant_partner | Active orders for my restaurant |
| GET | `/orders/restaurant/transactions` | restaurant_partner | Completed order transactions |
| PUT | `/orders/:id/status` | restaurant_partner / delivery_partner / admin | Update order status |

### Order State Machine
```
pending -> restaurant_confirmed | cancelled | rejected
restaurant_confirmed -> preparing | ready | cancelled
preparing -> ready | cancelled
ready -> rider_assigned | picked_up
rider_assigned -> picked_up
picked_up -> out_for_delivery | delivered
out_for_delivery -> delivered
delivered -> (terminal)
cancelled -> (terminal)
rejected -> (terminal)
```

- **Delivery OTP required** when transitioning to `delivered`
- **Refund auto-triggered** on `cancelled`/`rejected` if `payment_status === success`
- **Stock restored** on cancellation/rejection

### Pricing Logic
- **Delivery Fee:** Distance-based (<=2km: Rs20, 2-5km: Rs22, >5km: Rs25, max Rs25)
- **Tax:** 5% of item subtotal
- **Platform Fee:** Capped at Rs5
- **Idempotency:** `idempotency_key` enforced at DB level (unique constraint)

---

## Restaurant Routes (`/api/restaurants`) — Public

| Method | Path | Auth | Purpose |
|---|---|---|
| GET | `/restaurants` | No | List all active restaurants |
| GET | `/restaurants/nearby` | No | Nearby restaurants (Haversine) |
| GET | `/restaurants/search` | No | Search restaurants by query |
| GET | `/restaurants/:id/menu` | No | Get restaurant + menu |
| POST | `/restaurants` | No | Register new restaurant |
| PUT | `/restaurants/:id` | Yes | Update restaurant |

---

## Menu Routes (`/api/menu`)

All require `restaurant_partner` auth. Middleware auto-attaches `restaurant_id` from `RestaurantPartner` row linked to JWT user phone.

| Method | Path | Purpose |
|---|---|---|
| GET | `/menu/info` | Get restaurant info + ID |
| GET | `/menu/categories` | List categories |
| POST | `/menu/categories` | Create category |
| PATCH | `/menu/categories/:id` | Update category |
| DELETE | `/menu/categories/:id` | Delete category |
| GET | `/menu/items` | List all menu items |
| POST | `/menu/items` | Create menu item (supports image upload) |
| PUT | `/menu/items/:id` | Update menu item |
| DELETE | `/menu/items/:id` | Delete menu item |
| POST | `/menu/items/:id/image` | Upload item image |
| DELETE | `/menu/items/:id/image` | Delete item image |
| PATCH | `/menu/items/:id/availability` | Toggle availability |
| POST | `/menu/items/:id/customizations` | Add customization group |
| DELETE | `/menu/customizations/:id` | Delete customization group |

---

## Profile Routes (`/api/profile`)

Restaurant partner only. Manages restaurant profile, NOT user profile.

| Method | Path | Purpose |
|---|---|---|
| GET | `/profile` | Get restaurant profile |
| PUT | `/profile` | Update restaurant profile |
| PATCH | `/profile/accepting-orders` | Toggle is_open |
| POST | `/profile/logo` | Upload logo |
| DELETE | `/profile/logo` | Delete logo |
| POST | `/profile/cover` | Upload cover image |
| DELETE | `/profile/cover` | Delete cover image |
| PUT | `/profile/hours` | Set operating hours |

---

## Delivery Routes (`/api/delivery`)

All require `delivery_partner` auth.

| Method | Path | Purpose |
|---|---|---|
| GET | `/delivery/profile` | Get delivery partner profile |
| PUT | `/delivery/profile` | Update profile |
| POST | `/delivery/profile/photo` | Upload profile photo |
| PATCH | `/delivery/status` | Toggle online/offline |
| GET | `/delivery/orders/active` | Get currently active order |
| GET | `/delivery/earnings` | Get earnings summary |

---

## Onboarding Routes (`/api/onboarding`)

All require authentication (any role).

| Method | Path | Purpose |
|---|---|---|
| PATCH | `/onboarding/customer` | Save customer address + DOB |
| POST | `/onboarding/restaurant` | Create/update restaurant |
| POST | `/onboarding/restaurant/submit` | Submit for admin review |
| GET | `/onboarding/restaurant/status` | Check application status |
| POST | `/onboarding/restaurant/documents` | Upload FSSAI, PAN, logo, cover |
| POST | `/onboarding/delivery` | Create/update delivery partner |
| POST | `/onboarding/delivery/submit` | Submit for admin review |
| GET | `/onboarding/delivery/status` | Check application status |
| POST | `/onboarding/delivery/documents` | Upload ID proof, license, RC |

---

## Admin Routes (`/api/admin`)

All require `admin` role.

| Method | Path | Purpose |
|---|---|---|
| GET/PUT | `/admin/profile` | Admin profile CRUD |
| POST/DELETE | `/admin/profile/photo` | Admin profile photo |
| GET | `/admin/users` | List all users |
| GET/PATCH | `/admin/users/:id` | Get/toggle user status |
| GET | `/admin/restaurants` | List all restaurants |
| GET/PATCH | `/admin/restaurants/:id` | Get/approve/reject/suspend restaurant |
| GET/PATCH | `/admin/delivery-partners/:id` | Get/approve delivery partner |
| GET | `/admin/orders` | List all orders |
| GET/PUT | `/admin/config` | Platform config management |
| GET/POST/PATCH/DELETE | `/admin/coupons` | Coupon management |
| GET/PATCH | `/admin/support` | Support ticket management |

---

## Payment Routes (`/api/payments`)

Restaurant partner auth for linked account steps.

| Method | Path | Purpose |
|---|---|---|
| POST | `/payments/linked-account` | Create Razorpay Route linked account |
| POST | `/payments/stakeholder` | Add stakeholder |
| POST | `/payments/product-config` | Configure Route product |
| POST | `/payments/bank-account` | Add bank account |
| POST | `/payments/webhook` | Razorpay webhook handler (raw body) |

---

## Other Routes

| Method | Path | Auth | Purpose |
|---|---|---|
| GET | `/analytics/admin` | admin | KPIs + daily revenue chart (30 days) |
| POST | `/reviews` | customer | Submit review for delivered order |
| GET | `/support` | customer | List my support tickets |
| POST | `/support` | customer | Create support ticket |
| POST | `/ai/recommend` | Any | NLP-based food recommendation (mock parser, no LLM) |

---

## Known API Issues / Gaps

| Issue | Severity | Status |
|---|---|---|
| OTP stored in-memory — lost on server restart | HIGH | Known, not fixed |
| FCM push requires FIREBASE_SERVICE_ACCOUNT_KEY — currently logs to console only | HIGH | Needs production config |
| No GET for single support ticket | LOW | Missing endpoint |
| GET /restaurants (public) duplicates GET /customer/restaurants (auth) | LOW | Redundant |
| restaurant/transactions uses mock 7-day payout logic, not real payout tracking | MEDIUM | Not real |
| No coupon redemption count enforcement at order creation | MEDIUM | Potential abuse |

# Rules — Tastifyy

```
Last Updated: 2026-09-12
Source of Truth: Current codebase + business requirements
Status: Current
```

---

## Authentication Rules

### Login
- Email/password login returns a custom HS256 JWT signed with JWT_SECRET (not raw Supabase token)
- Login fails with 401 if Supabase cannot find the user or password is wrong
- Login fails with 403 if `user.is_active === false`
- Login fails with 404 if user exists in Supabase Auth but not in the Tastifyy `users` table

### Registration
- Email must be unique (enforced by Supabase Auth + Prisma unique constraint)
- Phone must be unique (enforced by Prisma unique constraint)
- Allowed roles on registration: `customer`, `restaurant_partner`, `delivery_partner`
- Role `admin` cannot be self-registered
- All registered users receive a custom HS256 JWT

### Google Login
- Google ID token is verified server-side using `google-auth-library`
- **If email already exists in Tastifyy DB:** Sign in the user, return JWT
- **If email does not exist:** Return 404 with code `GOOGLE_USER_NOT_REGISTERED` + user info (name, email, picture)
  - Frontend must redirect to `/customer/register` with pre-filled state
  - Do NOT call `createUser()` inside the Google login handler — this caused `email_exists 422` from Supabase
- **Never create a duplicate user** — check DB before creating

### OTP
- OTP is 6 digits, valid for 5 minutes
- OTP stored in-memory (`Map`) — server restart invalidates all OTPs
- OTP verify: creates user if not exists (auto-registration via phone)
- Role mismatch at OTP verify: 403 FORBIDDEN

### Session
- Token stored in `localStorage` under key `token`
- `initAuth()` on mount validates session via `GET /auth/me`
- On 401/403 from any API call: clear token, redirect to login
- Mobile: token stored in AsyncStorage

### Logout
- Backend: `POST /auth/logout` (currently just acknowledges — no server-side token blacklisting)
- Frontend: clears localStorage/AsyncStorage + Zustand state

---

## Role Rules

### Customer
- Can access: `/customer/*`, `/api/customer/*`, `/api/orders` (own orders only), `/api/reviews`, `/api/support`
- Cannot access restaurant, admin, or delivery endpoints

### Restaurant Partner
- Can access: `/restaurant/*`, `/api/menu/*`, `/api/orders/restaurant/*`, `/api/profile`, `/api/payments/linked-account`
- Restaurant is resolved by matching `RestaurantPartner.phone` to the logged-in user's phone
- Cannot see other restaurants' orders or menus

### Delivery Partner
- Can access: `/delivery/*`, `/api/delivery/*`
- Can only update orders assigned to them (`delivery_partner_id === partner.id`)
- Cannot update order status to states reserved for restaurant (e.g., `preparing`)

### Admin
- Can access all endpoints
- Admin role cannot be self-assigned
- All admin order cancellations/refunds are logged to `admin_audit_log`

---

## Order Rules

### Restaurant Acceptance
- Restaurant can transition: `pending → restaurant_confirmed | cancelled | rejected`
- `restaurant_confirmed` triggers delivery partner auto-assignment
- Only `restaurant_partner` or `admin` can accept/reject

### Rejection
- Restaurant can reject a pending order
- Rejection triggers automatic refund if payment was made online
- If refund fails: order status rolls back; 500 returned to restaurant

### Cancellation
- Customer cannot cancel via API (no customer-facing cancel endpoint implemented)
- Restaurant and admin can cancel
- Cancellation triggers automatic refund + stock restoration
- `cancelled_by` field records who cancelled

### Restaurant Timeout
- **NOT IMPLEMENTED** — No auto-cancel or auto-refund if restaurant does not respond

### Delivery
- `delivered` transition requires valid 4-digit OTP from customer's SMS
- Invalid OTP: 400 INVALID_OTP
- Only delivery partner or admin can mark as delivered

### Stock
- Stock decremented inside a DB transaction on order creation
- Insufficient stock raises error: order creation fails
- Stock restored on cancellation or rejection

### Idempotency
- Each order has an `idempotency_key` (unique DB constraint)
- Duplicate order creation returns 409 DUPLICATE_ORDER

---

## Payment Rules

### Payment Verification
- HMAC-SHA256 signature MUST be verified server-side before changing order status
- `razorpay_order_id|razorpay_payment_id` signed with `RAZORPAY_KEY_SECRET`
- Invalid signature: 400 INVALID_SIGNATURE

### Successful Payment
- payment_status = success, order status = restaurant_confirmed (skipping restaurant manual confirm for online pay)
- Razorpay Route transfer held (`on_hold: 1`) until released

### Failed Payment
- No action from backend (payment never verified)
- Orphaned order remains in DB with payment_status=processing (not cleaned up)

### Refund
- Triggered automatically on cancellation/rejection if payment_status === success
- Refund API called with full amount
- Idempotency: blocked if refund_status already set
- On failure: order rolled back to previous state

### Duplicate Payments
- Prevented by idempotency_key unique constraint
- Each Razorpay order ID is associated with one DB order

### Duplicate Refunds
- Blocked by checking refund_status is null before calling Razorpay

---

## Security Rules

### Authentication
- All protected routes require `Authorization: Bearer <JWT>`
- JWT is verified by Passport-JWT strategy before route handler runs
- `req.user` is always a DB user object, not a raw JWT payload

### Authorization
- `authorizeRole()` middleware checks `req.user.role` against allowed roles
- Restaurant ownership verified by looking up `RestaurantPartner.phone === user.phone`
- Delivery partner ownership verified by looking up `DeliveryPartner.user_id === user.id`

### Rate Limiting
- 100 requests / 15 minutes / IP (global)
- 20 requests / 15 minutes / IP (auth routes)
- `trust proxy: 1` required on Render (single hop)
- Setting `trust proxy: true` (boolean) causes `ERR_ERL_PERMISSIVE_TRUST_PROXY` — use integer `1`

### CORS
- Configured from `CORS_ORIGIN` env var
- Always includes `https://www.tastifyy.in` and `https://tastifyy.in`
- Credentials: true

### Google OAuth Popup
- `crossOriginOpenerPolicy: same-origin-allow-popups` required in Helmet config for Google One-Tap to work

### Secrets
- Never stored in code; all via environment variables
- No raw keys ever sent to client
- Razorpay webhook HMAC verified before processing any event

### Input Validation
- Required fields validated in route handlers (400 VALIDATION_ERROR)
- File uploads: 5MB max, MIME type checked
- Prisma handles SQL injection prevention (parameterized queries)

---

## Business Rules

### Service Radius
- Orders can only be placed if delivery address is within restaurant's `service_radius_km`
- Verified at order creation

### Delivery Fees
- Rs20 for <= 2km, Rs22 for 2-5km, Rs25 for > 5km (capped at Rs25)

### Commission
- Default: 15% of item_subtotal
- Configurable per restaurant

### Coupon
- max_uses_per_user enforced (default: 1 per user)
- min_order_value must be met
- max_discount_cap applied to percentage coupons
- Valid date range enforced

### Delivery Assignment
- Forced assignment — closest available, online delivery partner
- Partner must have status=active, is_online=true
- Partner must have no active assignment (status in [accepted, picked_up])
- Assignment created with status=accepted (no partner consent in current MVP)

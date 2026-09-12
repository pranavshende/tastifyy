# Open Questions — Tastifyy

```
Last Updated: 2026-09-12
Source of Truth: Codebase audit + production observations
Status: Current
```

These are unresolved questions identified from the current implementation. Answered questions have been removed.

---

## Authentication

**Q1: Is the Google auth fix verified in production?**
The backend previously returned 500 with `email_exists 422` when a Google user with an existing email tried to log in. The fix redirects new Google users to /customer/register instead of calling createUser(). This fix has been applied to code but not independently verified in production after deployment.

**Q2: What happens if the OTP server restarts mid-flow?**
OTPs are stored in an in-memory Map. If the server restarts (which happens on Render with auto-deploy), all pending OTPs are lost. Users mid-OTP-flow get a "invalid OTP" error. This is a known production issue for high-traffic or auto-deployed scenarios.
Proposed fix: Move OTPs to Redis (planned with BullMQ integration).

**Q3: Should Google login also support restaurant_partner and delivery_partner roles?**
Currently the Google login handler only creates/matches `customer` role users. Restaurant partners and delivery partners use email/password. Is this the intended design permanently?

**Q4: Is there a refresh token mechanism?**
Currently the JWT has a fixed expiry (from auth.controller.ts). There is no refresh token endpoint. When the token expires, the user is silently logged out on next `initAuth()` call. Should we add a refresh endpoint?

---

## Payment / Refund

**Q5: What happens when a restaurant never responds to an order?**
No timeout is implemented. The order stays in `pending` indefinitely. If the customer paid online, their money is held until manual admin intervention. This is a critical production gap.
Decision needed: Auto-cancel after N minutes? Who initiates? Auto-refund?

**Q6: Delivery partner payout automation?**
The DB schema supports payout tracking (payout_status, payout_reference_id). The payment controller has RazorpayX code. But payouts are not automatically triggered after delivery. Is this intended to be a manual admin action, or should it be automated post-delivery?

**Q7: How are COD orders handled on the payment side?**
COD orders are created with payment_status=pending. Currently there is no mechanism to mark them as paid (e.g., when rider collects cash). This means COD order payment_status stays `pending` even after delivery. Is a `cod_collected` status needed?

**Q8: If Route transfer fails to create (restaurant not onboarded), is the restaurant notified?**
Currently the order creation silently proceeds without a transfer if the restaurant's Route account is not ready. The restaurant earns money but it is not automatically split. There is no notification to the restaurant or admin.

---

## Order / Lifecycle

**Q9: Can a customer cancel their own order?**
There is no customer-facing cancel endpoint implemented. Customers can only cancel via support. Is this intentional? If customers should be able to cancel pending orders (before restaurant accepts), this needs to be added.

**Q10: What status should payment verification set?**
Currently `verify-payment` sets `order.status = restaurant_confirmed` directly (skipping restaurant manual confirmation). This is intentional for UX (online payment = auto-confirm) but means the restaurant gets a `restaurant_confirmed` order without explicitly accepting. Is this the intended business logic?

---

## Technical / Infrastructure

**Q11: Redis instance for BullMQ — where is it hosted?**
The decision to implement Redis + BullMQ was made but no Redis instance has been provisioned. Options:
- Render Redis (free tier available)
- Upstash Redis (free tier, serverless)
Decision needed before implementation can proceed.

**Q12: Should BullMQ workers run in the same process as Express or a separate Render service?**
Same process is cheaper but can cause CPU contention under high traffic. Separate service = extra cost. Decision needed.

**Q13: OTP in Redis vs separate OTP table in DB?**
When implementing Redis, should OTPs move to Redis (TTL-based, efficient) or to a dedicated `otps` table in PostgreSQL?

**Q14: FIREBASE_SERVICE_ACCOUNT_KEY is missing from production environment.**
FCM push notifications silently fall back to console.log in production. Is there a timeline to add the Firebase service account key to Render environment variables?

---

## UI / Known Bugs

**Q15: Mobile profile menu and sidebar behavior on website?**
Previous observations noted potential issues with mobile sidebar, profile menu, and Navbar buttons on website. These need manual verification on mobile browsers.

**Q16: Customer address #2 selection?**
A known issue was noted about selecting a non-default address for checkout. Is this resolved in the current checkout page?

**Q17: Notification inbox?**
The `notifications` table exists in the DB and notifications are being created by backend services, but no frontend displays them. Is a notification bell/drawer planned for the near term?

---

## Security

**Q18: JWT token expiry?**
What is the current token expiry on custom JWTs? If it is too short (e.g., 1 hour), users of the mobile app will be logged out frequently. If too long (e.g., 30 days), there is no revocation mechanism.

**Q19: Input sanitization?**
Prisma handles SQL injection. But is there any protection against XSS in user-provided text fields (review_text, special_instructions) that get rendered back in the UI?

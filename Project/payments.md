# Payments — Tastifyy

```
Last Updated: 2026-09-12
Source of Truth: backend/src/routes/order.routes.ts, backend/src/controllers/payment.controller.ts
Status: Current
```

---

## Overview

Tastifyy uses **Razorpay** for all online payment processing. The integration includes:
- **Standard Checkout** for customer payments
- **Razorpay Route** for automatic payment splits to restaurant linked accounts
- **Razorpay Webhook** for async payment confirmation and payout events
- **Manual Refunds** via Razorpay Refund API (triggered on cancellation/rejection)

---

## Complete Payment Flow

```
1. Customer builds cart and reaches checkout
       |
2. POST /api/orders
   - Validates address, items, stock, service radius
   - Calculates: item_subtotal, delivery_fee, tax(5%), platform_fee(cap Rs5), discount
   - Creates Razorpay Order (razorpay.orders.create) with total amount in paise
   - If restaurant has active Route account: adds transfer with on_hold=1
   - Creates Order record in DB (status=pending, payment_status=processing)
   - Emits order:created to restaurant + admin via Socket.io
   - Returns order.id + razorpay_order_id to frontend
       |
3. Frontend opens Razorpay Checkout SDK with razorpay_order_id
       |
4. Customer completes payment on Razorpay
   - Razorpay returns: razorpay_payment_id, razorpay_signature
       |
5. POST /api/orders/verify-payment
   - Verifies HMAC-SHA256 signature:
     sign = razorpay_order_id + "|" + razorpay_payment_id
     expectedSign = HMAC-SHA256(RAZORPAY_KEY_SECRET, sign)
   - On success: payment_status=success, order.status=restaurant_confirmed
   - Emits order:restaurant_confirmed via Socket.io
       |
6. Restaurant sees new order on dashboard (Socket.io push)
       |
7. Restaurant accepts: PUT /api/orders/:id/status { status: "preparing" }
   - triggers assignDeliveryPartner() fire-and-forget
   - DeliveryAssignment record created, assigned partner notified via Socket.io
       |
8. Delivery partner picks up: PUT /api/orders/:id/status { status: "picked_up" }
   - Customer FCM push: "Your order is on the way!"
   - SMS sent to customer with 4-digit delivery OTP
       |
9. PUT /api/orders/:id/status { status: "delivered", otp: "1234" }
   - OTP validated against order.delivery_otp
   - Order marked delivered
   - Customer FCM push: "Food arrived!"
       |
10. Razorpay releases on-hold transfer to restaurant account
    (manual or scheduled by Razorpay, not automated by Tastifyy)
```

---

## Fee Calculation

```
item_subtotal = sum(price * quantity + customization_costs) for each item
delivery_fee  = distance-based:
                <= 2km  → Rs20
                2-5km   → Rs22
                > 5km   → Rs25
                (max Rs25)
tax_amount    = item_subtotal * 0.05 (5% GST)
platform_fee  = min(PLATFORM_FEE config, Rs5)
discount      = coupon discount (if applicable)
total_amount  = item_subtotal + delivery_fee + platform_fee + tax_amount - discount
```

---

## COD Orders

- `payment_method: "cod"` → No Razorpay order created
- `payment_status: "pending"` on creation
- Order flows normally, no payment verification step required
- No automatic refund on cancellation (no payment captured)

---

## Scenario: Payment Succeeds + Restaurant Accepts

**Normal flow.** See above. Restaurant receives transfer via Razorpay Route.

---

## Scenario: Payment Succeeds + Restaurant Rejects

1. Restaurant calls `PUT /orders/:id/status { status: "rejected" }`
2. Backend checks: `payment_status === "success" && razorpay_payment_id exists`
3. `processRefund()` is called synchronously
4. On refund success: `payment_status = "refunded"`, admin audit log written
5. On refund failure: **order status is ROLLED BACK to previous state**; API returns 500 with REFUND_FAILED. Admin must intervene manually.

---

## Scenario: Payment Succeeds + Restaurant Does Not Respond

**NOT IMPLEMENTED.** There is no timeout mechanism. If a restaurant never accepts or rejects, the order stays in `pending` or `restaurant_confirmed` indefinitely. No auto-cancel, no auto-refund. This is a known production gap.

---

## Scenario: Payment Fails

- Razorpay Checkout SDK handles failure on client side
- If customer closes/abandons: `verify-payment` is never called
- DB Order record remains with `payment_status: "processing"` and `status: "pending"`
- **These orphaned orders are never cleaned up** (no background job)

---

## Refund Flow

**Trigger:** `PUT /orders/:id/status` with `status: cancelled | rejected` when `payment_status === success`

**Implementation:** `processRefund()` in `payment.controller.ts`

```
processRefund(orderId, reason):
  1. Fetch order by ID
  2. Check razorpay_payment_id exists
  3. Check no existing refund (refund_status == null)
  4. Call Razorpay Refunds API:
     POST https://api.razorpay.com/v1/payments/:payment_id/refund
     { amount: full_amount_in_paise, notes: { reason } }
  5. If Route transfer exists (razorpay_transfer_id):
     - Attempt Route transfer reversal
     - Store razorpay_reversal_id + reversal_status
  6. Update order:
     - razorpay_refund_id, refund_status=refunded, payment_status=refunded
  7. On failure:
     - refund_status=refund_failed, refund_failure_reason stored
     - Returns { success: false, error: ... }
     - Caller (order status update) rolls back order status
```

**Idempotency:** Refund is blocked if `refund_status` already exists (prevents duplicate refunds).

**Refund Status in DB:** `refund_pending` → `refunded` | `refund_failed`

**Customer UI:** Shows in order detail as "Payment Refunded" when `refund_status === refunded`

---

## Razorpay Route (Restaurant Payouts)

### Onboarding Steps (Restaurant)
1. `POST /api/payments/linked-account` — Create Route linked account (requires PAN)
2. `POST /api/payments/stakeholder` — Add business stakeholder
3. `POST /api/payments/product-config` — Enable Route product on account
4. `POST /api/payments/bank-account` — Add bank account as fund account
5. Admin approves on Razorpay dashboard → account becomes `activated`
6. 24-hour cooling period → auto-promoted to `active` on next order

### Transfer Logic
- Transfer is created with `on_hold: 1` at order creation (funds held until release)
- Release happens when payment verification succeeds
- **Restaurant must have `route_account_status === active` OR `activated` + 24h cooling passed**
- If not ready, order is created without a transfer (restaurant receives no Route payout for that order)

### Restaurant Commission
```
restaurant_transfer = item_subtotal - (item_subtotal * commission_rate%) - restaurant_discount_share
```
Default commission: 15%

---

## RazorpayX Payouts (Delivery Partners)

**PARTIALLY IMPLEMENTED.** The `DeliveryAssignment` table has `payout_status`, `payout_reference_id`, `payout_idempotency_key` fields. The `payment.controller.ts` has logic for RazorpayX payouts. However, **automatic delivery partner payout is not triggered in the order lifecycle**. Payouts must be manually initiated via admin or a batch job (not yet implemented).

---

## Webhook Handler

`POST /api/payment/webhook` — Raw body required for HMAC verification.

Handled events:
- `payment.captured` — Updates payment_status to success
- `payment.failed` — Updates payment_status to failed
- `route.transfer.processed` — Updates razorpay_transfer_id
- `route.transfer.reversed` — Updates reversal_status
- `payout.processed` — Updates delivery assignment payout_status
- `payout.failed` — Updates payout_failure_reason

**Signature verification:** `X-Razorpay-Signature` HMAC-SHA256 with `RAZORPAY_WEBHOOK_SECRET`

---

## Security

- No raw card data ever stored
- Payment signatures verified server-side before any order state change
- Webhook payloads verified via HMAC before processing
- Refund idempotency enforced at DB level (refund_status check)
- Razorpay secret keys never exposed to frontend

---

## Known Payment Gaps

| Gap | Severity | Status |
|---|---|---|
| No restaurant response timeout / auto-cancel | HIGH | NOT IMPLEMENTED |
| Orphaned orders (failed payments) never cleaned up | MEDIUM | NOT IMPLEMENTED |
| Delivery partner payout not automated | MEDIUM | PARTIAL |
| No customer-facing refund status notification (only DB update) | LOW | NOT IMPLEMENTED |
| Transfer not created if restaurant Route not ready (silent failure) | MEDIUM | KNOWN |

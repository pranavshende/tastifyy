# Functionality — Tastifyy

```
Last Updated: 2026-09-12
Source of Truth: Current codebase
Status: Current
```

Legend: IMPLEMENTED | PARTIAL | BROKEN | PLANNED

---

## Customer Functionality

| Feature | Status | Notes |
|---|---|---|
| **Registration** (email+password) | IMPLEMENTED | Via /auth/register |
| **Login** (email+password) | IMPLEMENTED | Returns custom JWT |
| **Google Login** | IMPLEMENTED | Existing user: signs in. New user: redirects to /customer/register with pre-filled email/name |
| **OTP Login** (phone) | IMPLEMENTED (mobile only) | In-memory store — not durable across restarts |
| **Logout** | IMPLEMENTED | Clears localStorage token |
| **Session Persistence** | IMPLEMENTED | initAuth() validates token on mount via GET /auth/me |
| **Profile View** | IMPLEMENTED | Name, phone, email, DOB, photo |
| **Profile Edit** | IMPLEMENTED | Name, phone, email, DOB |
| **Profile Photo Upload** | IMPLEMENTED | Upload to Supabase Storage |
| **Profile Photo Delete** | IMPLEMENTED | |
| **Address List** | IMPLEMENTED | Shows non-deleted addresses, default first |
| **Add Address** | IMPLEMENTED | With optional GPS coordinates |
| **Delete Address** | IMPLEMENTED | Soft-delete, re-assigns default if needed |
| **Set Default Address** | IMPLEMENTED | |
| **Restaurant Discovery** | IMPLEMENTED | Sorted by created_at, active restaurants only |
| **Restaurant Search** | IMPLEMENTED | Search by name/cuisine across both website and mobile |
| **Restaurant Detail + Menu** | IMPLEMENTED | Grouped by category, customizations, images |
| **Cart** | IMPLEMENTED | Zustand store (website + mobile), quantity management |
| **Checkout** | IMPLEMENTED | Razorpay online + COD, address confirmation required |
| **Coupon Application** | IMPLEMENTED | Validates against DB, applies discount |
| **Order Placement** | IMPLEMENTED | Idempotency key enforced, stock decremented |
| **Payment Verification** | IMPLEMENTED | HMAC signature check |
| **COD Orders** | IMPLEMENTED | payment_status=pending on creation |
| **Order History** | IMPLEMENTED | All orders with status |
| **Order Detail** | IMPLEMENTED | Full breakdown, tracking events |
| **Real-time Order Tracking** | IMPLEMENTED | Socket.io events for status changes |
| **Delivery OTP Confirmation** | IMPLEMENTED | 4-digit OTP sent via SMS when out_for_delivery |
| **Order Rating** | IMPLEMENTED | Food, restaurant, delivery ratings after delivery |
| **Review Submission** | IMPLEMENTED | Via /api/reviews |
| **Support Ticket** | IMPLEMENTED | Create and list tickets |
| **AI Recommendations** | PARTIAL | Mock NLP (regex, no LLM). Mobile only (Assistant screen) |
| **Cuisines Page** | PARTIAL | Page exists, limited data |
| **Offers Page** | PARTIAL | Page exists, limited data |
| **About Page** | IMPLEMENTED | Static info page |
| **FCM Push Notifications** | PARTIAL | Backend sends if FIREBASE_SERVICE_ACCOUNT_KEY set, otherwise console log |

---

## Restaurant Partner Functionality

| Feature | Status | Notes |
|---|---|---|
| **Registration/Onboarding** | IMPLEMENTED | Multi-step via website |
| **Document Upload** | IMPLEMENTED | FSSAI, PAN, logo, cover via Supabase Storage |
| **Admin Approval** | IMPLEMENTED | Admin reviews and activates |
| **Login** | IMPLEMENTED | Email/password |
| **Restaurant Profile Edit** | IMPLEMENTED | Name, description, contact, location, hours |
| **Logo/Cover Upload** | IMPLEMENTED | Supabase Storage |
| **Operating Hours** | IMPLEMENTED | Day-by-day open/close times |
| **Toggle Open/Closed** | IMPLEMENTED | is_open toggle |
| **Menu Category CRUD** | IMPLEMENTED | Create, rename, delete, reorder |
| **Menu Item CRUD** | IMPLEMENTED | Create, edit, delete, toggle availability |
| **Menu Item Image Upload** | IMPLEMENTED | Supabase Storage |
| **Menu Customizations** | IMPLEMENTED | Groups + options with prices |
| **Stock Management** | IMPLEMENTED | Optional stock_quantity, auto-decrements on order |
| **Live Order Dashboard** | IMPLEMENTED | Socket.io real-time feed of pending/active orders |
| **Accept Order** | IMPLEMENTED | Sets status to restaurant_confirmed → triggers delivery assignment |
| **Reject Order** | IMPLEMENTED | Triggers automatic refund if payment was made |
| **Update Order Status** | IMPLEMENTED | preparing, ready transitions |
| **Transactions/Earnings** | PARTIAL | Lists delivered orders, mock 7-day payout logic (not real Razorpay settlement tracking) |
| **Razorpay Route Onboarding** | IMPLEMENTED | Linked account, stakeholder, product config, bank account steps |

---

## Delivery Partner Functionality

| Feature | Status | Notes |
|---|---|---|
| **Onboarding** | IMPLEMENTED | Via website + mobile |
| **Document Upload** | IMPLEMENTED | ID proof, driving license, RC |
| **Admin Approval** | IMPLEMENTED | |
| **Login** | IMPLEMENTED | Email/password (website) / OTP (mobile) |
| **Toggle Online/Offline** | IMPLEMENTED | is_online flag |
| **View Active Order** | IMPLEMENTED | Currently assigned order |
| **Delivery Assignment** | IMPLEMENTED | Automatic proximity-based (Haversine), forced assignment |
| **Live Location Update** | IMPLEMENTED | Socket.io update_location event → relayed to customer |
| **Order Status Update** | IMPLEMENTED | picked_up → out_for_delivery → delivered |
| **Delivery OTP Entry** | IMPLEMENTED | Required to mark as delivered |
| **Earnings View** | IMPLEMENTED | Basic earnings summary |
| **Profile Management** | IMPLEMENTED | |

---

## Admin Functionality

| Feature | Status | Notes |
|---|---|---|
| **Login** | IMPLEMENTED | Email/password |
| **Dashboard KPIs** | IMPLEMENTED | Revenue, orders, AOV, estimated commission |
| **Revenue Chart** | IMPLEMENTED | 30-day daily chart |
| **User Management** | IMPLEMENTED | List, view, activate/suspend users |
| **Restaurant Management** | IMPLEMENTED | List, view, approve/reject/suspend |
| **Delivery Partner Management** | IMPLEMENTED | List, approve/reject |
| **Order Management** | IMPLEMENTED | View all orders, update status |
| **Coupon Management** | IMPLEMENTED | Create, edit, delete coupons |
| **Platform Config** | IMPLEMENTED | Edit PLATFORM_FEE, DELIVERY fees |
| **Support Ticket Management** | IMPLEMENTED | View and resolve tickets |
| **Audit Log** | IMPLEMENTED | Immutable log of admin actions (refunds, cancellations) |
| **Manual Refund Trigger** | IMPLEMENTED | Admin can trigger refund via status update |

---

## Cross-Platform Feature Matrix

| Feature | Website | Mobile App |
|---|---|---|
| Customer Login | YES | YES |
| Customer Google Login | YES | YES (mobile OAuth flow) |
| Restaurant Discovery | YES | YES |
| Cart + Checkout | YES | YES |
| Order Tracking | YES | YES |
| Delivery Partner Dashboard | YES | YES |
| Restaurant Dashboard | YES | PARTIAL (basic) |
| Admin Dashboard | YES | PARTIAL (shell only) |
| AI Assistant | NO | YES |
| OTP Login | YES | YES |

---

## Known Broken/Untested Features

| Feature | Status | Notes |
|---|---|---|
| OTP durability across server restarts | BROKEN | In-memory store |
| FCM push in production | UNTESTED | Needs FIREBASE_SERVICE_ACCOUNT_KEY |
| Coupon per-user limit enforcement | PARTIAL | max_uses_per_user exists in DB but not checked at order creation |
| Real payout tracking for restaurants | PARTIAL | Mock logic based on order age |
| Notification inbox for customers | NOT IMPLEMENTED | DB table exists but no UI |
| Restaurant-side order expiry/timeout | NOT IMPLEMENTED | No auto-cancel if restaurant doesn't respond |

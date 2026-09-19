# Database Schema — Tastifyy

```
Last Updated: 2026-09-12
Source of Truth: backend/prisma/schema.prisma
Status: Current (fully synced with schema)
ORM: Prisma | Database: Supabase PostgreSQL
```

---

## Enums

| Enum | Values |
|---|---|
| `Role` | `customer`, `admin`, `delivery_partner`, `restaurant_partner` |
| `AddressLabel` | `home`, `work`, `other` |
| `RestaurantType` | `restaurant`, `cloud_kitchen`, `home_kitchen` |
| `RestaurantStatus` | `pending`, `active`, `suspended`, `rejected` |
| `SubscriptionPlan` | `starter`, `growth`, `pro` |
| `DayOfWeek` | `mon`, `tue`, `wed`, `thu`, `fri`, `sat`, `sun` |
| `PartnerRole` | `owner`, `manager` |
| `AvailabilityType` | `full_time`, `part_time` |
| `PartnerStatus` | `pending`, `active`, `suspended`, `rejected` |
| `OrderStatus` | `pending`, `restaurant_confirmed`, `preparing`, `ready`, `rider_assigned`, `picked_up`, `out_for_delivery`, `delivered`, `cancelled`, `rejected` |
| `PaymentMethod` | `upi`, `card`, `net_banking`, `wallet`, `cod` |
| `PaymentStatus` | `pending`, `processing`, `success`, `failed`, `refunded` |
| `RefundStatus` | `refund_pending`, `refunded`, `refund_failed` |
| `PayoutStatus` | `pending`, `processing`, `success`, `failed`, `reversed` |
| `ReversalStatus` | `pending`, `success`, `failed` |
| `CancelledBy` | `customer`, `restaurant`, `admin` |
| `DiscountType` | `percentage`, `flat` |
| `FundedBy` | `restaurant`, `platform`, `shared` |
| `RouteAccountStatus` | `not_started`, `account_created`, `stakeholder_pending`, `product_config_pending`, `verification_pending`, `activated`, `active`, `suspended`, `rejected`, `failed` |
| `RecipientType` | `customer`, `restaurant_partner`, `delivery_partner`, `admin` |
| `TicketCategory` | `missing_item`, `wrong_item`, `payment_issue`, `delivery_issue`, `restaurant_issue`, `account_issue` |
| `TicketStatus` | `open`, `in_progress`, `resolved`, `closed` |

---

## Data Model Hierarchy

```
User (id = Supabase auth.users.id)
 ├── Address[]               (user delivery addresses)
 ├── Order[]                 (as customer)
 ├── CouponRedemption[]
 ├── Rating[]
 ├── SupportTicket[]
 ├── AdminConfig[]           (only if admin)
 └── AdminAuditLog[]         (only if admin)

Restaurant
 ├── RestaurantOperatingHour[]
 ├── RestaurantDocument[]
 ├── RestaurantPartner[]     (links to staff/owners - separate from User)
 ├── MenuCategory[]
 ├── MenuItem[]
 ├── Order[]
 ├── Coupon[]
 └── Rating[]

DeliveryPartner (links to User via user_id)
 ├── DeliveryPartnerAvailability[]
 ├── DeliveryPartnerDocument[]
 ├── Order[]
 ├── Rating[]
 └── DeliveryAssignment[]
```

---

## Models

### `users` — Core User Table
| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, gen_random_uuid() | Matches Supabase auth.users.id |
| `name` | VARCHAR(255) | NOT NULL | |
| `phone` | VARCHAR(15) | UNIQUE NOT NULL | |
| `email` | VARCHAR(255) | UNIQUE NULLABLE | |
| `role` | Role enum | NOT NULL | |
| `profile_photo_url` | TEXT | NULLABLE | Storage path, resolved to public URL |
| `dob` | DATE | NULLABLE | |
| `fcm_token` | VARCHAR(500) | NULLABLE | Firebase push token |
| `is_active` | BOOLEAN | DEFAULT true | |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT now(), auto-update | |

---

### `addresses` — Customer Delivery Addresses
| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | |
| `user_id` | UUID | FK → users.id CASCADE DELETE | |
| `label` | AddressLabel enum | NOT NULL | |
| `custom_label` | VARCHAR(100) | NULLABLE | |
| `address_line` | TEXT | NOT NULL | |
| `city` | VARCHAR(100) | NOT NULL | |
| `state` | VARCHAR(100) | NOT NULL | |
| `pincode` | VARCHAR(10) | NOT NULL | |
| `latitude` | DECIMAL(10,8) | NOT NULL | |
| `longitude` | DECIMAL(11,8) | NOT NULL | |
| `is_default` | BOOLEAN | DEFAULT false | |
| `is_deleted` | BOOLEAN | DEFAULT false | Soft delete |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |

---

### `restaurants`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK | |
| `name` | VARCHAR(255) | NOT NULL | |
| `type` | RestaurantType enum | NOT NULL | |
| `owner_name` | VARCHAR(255) | NOT NULL | |
| `phone` | VARCHAR(15) | NOT NULL | |
| `email` | VARCHAR(255) | NULLABLE | |
| `address_line` | TEXT | NOT NULL | |
| `city/state/pincode` | VARCHAR | NOT NULL | |
| `latitude/longitude` | DECIMAL | NOT NULL | |
| `service_radius_km` | DECIMAL(5,2) | NOT NULL | |
| `logo_url` | TEXT | NULLABLE | Storage path |
| `cover_image_url` | TEXT | NULLABLE | Storage path |
| `photo_gallery_urls` | String[] | DEFAULT [] | |
| `is_pure_veg` | BOOLEAN | DEFAULT false | |
| `cuisine_tags` | String[] | DEFAULT [] | |
| `status` | RestaurantStatus | DEFAULT pending | |
| `is_open` | BOOLEAN | DEFAULT false | Real-time toggle |
| `commission_rate` | DECIMAL(5,2) | NOT NULL | Default 15% |
| `subscription_plan` | SubscriptionPlan | DEFAULT starter | |
| `avg_preparation_time_mins` | INT | NULLABLE | |
| `razorpay_account_id` | TEXT | NULLABLE | Razorpay Route |
| `razorpay_stakeholder_id` | TEXT | NULLABLE | |
| `route_account_status` | RouteAccountStatus | DEFAULT not_started | |
| `route_activated_at` | TIMESTAMPTZ | NULLABLE | |
| `bank_account_number` | TEXT | NULLABLE | |
| `ifsc_code` | VARCHAR(20) | NULLABLE | |
| `bank_beneficiary_name` | TEXT | NULLABLE | |
| `pan_number` | VARCHAR(10) | NULLABLE | |
| `created_at/updated_at` | TIMESTAMPTZ | DEFAULT/auto | |

---

### `restaurant_partners`
Links restaurant staff to their restaurant. Separate from `users` table.
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `restaurant_id` | UUID FK → restaurants.id | |
| `name/phone/email` | VARCHAR | phone UNIQUE |
| `password_hash` | TEXT NULLABLE | Legacy field, not used in current auth |
| `role` | PartnerRole (owner/manager) | |
| `is_active` | BOOLEAN DEFAULT true | |

> **Note:** Auth for restaurant partners is done via `users` table. The `restaurant_partners` table is queried by phone to resolve which restaurant a logged-in user manages.

---

### `menu_categories`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `restaurant_id` | UUID FK → restaurants.id | |
| `name` | VARCHAR(255) | |
| `display_order` | INT DEFAULT 0 | |
| `is_active` | BOOLEAN DEFAULT true | |

---

### `menu_items`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `restaurant_id` | UUID FK → restaurants.id | |
| `category_id` | UUID FK → menu_categories.id | |
| `name` | VARCHAR(255) | |
| `description` | TEXT NULLABLE | |
| `price` | DECIMAL(10,2) | |
| `image_url` | TEXT NULLABLE | Storage path |
| `is_veg` | BOOLEAN | |
| `is_available` | BOOLEAN DEFAULT true | |
| `is_bestseller` | BOOLEAN DEFAULT false | |
| `stock_quantity` | INT NULLABLE | NULL = unlimited |
| `preparation_time_mins` | INT NULLABLE | |

---

### `menu_item_customizations` + `menu_item_customization_options`
Groups (e.g., "Size", "Toppings") and their options (e.g., "Large +₹50").

---

### `delivery_partners`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID UNIQUE FK → users.id | |
| `name/phone/email` | VARCHAR | phone UNIQUE |
| `vehicle_type/number/model` | VARCHAR NULLABLE | |
| `license_number` | VARCHAR NULLABLE | |
| `bank_account_number/ifsc_code/upi_id` | VARCHAR NULLABLE | |
| `razorpay_contact_id/fund_account_id` | TEXT NULLABLE | For RazorpayX payouts |
| `availability_type` | AvailabilityType | |
| `is_online` | BOOLEAN DEFAULT false | Real-time presence |
| `current_latitude/longitude` | DECIMAL NULLABLE | Live GPS |
| `status` | PartnerStatus DEFAULT pending | |

---

### `orders` — The Central Order Record
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `customer_id` | UUID FK → users.id | |
| `restaurant_id` | UUID FK → restaurants.id | |
| `delivery_partner_id` | UUID FK → delivery_partners.id NULLABLE | |
| `delivery_address_id` | UUID FK → addresses.id | |
| `status` | OrderStatus | State machine enforced |
| `item_subtotal` | DECIMAL(10,2) | |
| `delivery_fee` | DECIMAL(10,2) | |
| `platform_fee` | DECIMAL(10,2) | |
| `discount_amount` | DECIMAL(10,2) DEFAULT 0 | |
| `tax_amount` | DECIMAL(10,2) DEFAULT 0 | |
| `total_amount` | DECIMAL(10,2) | |
| `restaurant_discount_share` | DECIMAL(10,2) DEFAULT 0 | |
| `platform_discount_share` | DECIMAL(10,2) DEFAULT 0 | |
| `restaurant_commission` | DECIMAL(10,2) DEFAULT 0 | |
| `restaurant_transfer` | DECIMAL(10,2) DEFAULT 0 | Net amount owed to restaurant |
| `payment_method` | PaymentMethod | |
| `payment_status` | PaymentStatus | |
| `razorpay_order_id` | TEXT NULLABLE | |
| `razorpay_payment_id` | TEXT NULLABLE | |
| `razorpay_transfer_id` | TEXT NULLABLE | |
| `razorpay_refund_id` | TEXT NULLABLE | |
| `refund_status` | RefundStatus NULLABLE | |
| `refund_failure_reason` | TEXT NULLABLE | |
| `razorpay_reversal_id` | TEXT NULLABLE | For Route transfer reversal |
| `reversal_status` | ReversalStatus NULLABLE | |
| `idempotency_key` | TEXT UNIQUE | Prevents duplicate orders |
| `coupon_id` | UUID FK NULLABLE | |
| `special_instructions` | TEXT NULLABLE | |
| `cancelled_by` | CancelledBy NULLABLE | |
| `cancellation_reason` | TEXT NULLABLE | |
| `delivery_otp` | VARCHAR(4) NULLABLE | 4-digit OTP for delivery confirmation |
| `created_at/updated_at` | TIMESTAMPTZ | |

---

### `order_items`
Snapshot of item details at time of ordering (prevents menu price changes from affecting historical orders).
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `order_id` | UUID FK → orders.id | |
| `menu_item_id` | UUID FK → menu_items.id | |
| `name_snapshot` | VARCHAR(255) | |
| `price_snapshot` | DECIMAL(10,2) | |
| `quantity` | INT | |
| `customizations_snapshot` | JSON NULLABLE | Array of {name, price} |
| `subtotal` | DECIMAL(10,2) | |

---

### `coupons`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `code` | VARCHAR(50) UNIQUE | |
| `discount_type` | DiscountType (percentage/flat) | |
| `discount_value` | DECIMAL(10,2) | |
| `max_discount_cap` | DECIMAL NULLABLE | For percentage coupons |
| `min_order_value` | DECIMAL DEFAULT 0 | |
| `funded_by` | FundedBy | |
| `restaurant_id` | UUID FK NULLABLE | Restaurant-specific coupon |
| `max_uses_total` | INT NULLABLE | |
| `max_uses_per_user` | INT DEFAULT 1 | |
| `valid_from/until` | TIMESTAMPTZ | |
| `is_active` | BOOLEAN DEFAULT true | |

---

### `ratings`
One rating per delivered order.
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `order_id` | UUID UNIQUE FK → orders.id | 1 rating per order enforced |
| `customer_id` | UUID FK → users.id | |
| `restaurant_id` | UUID FK → restaurants.id | |
| `delivery_partner_id` | UUID FK NULLABLE | |
| `food_rating` | SMALLINT | |
| `restaurant_rating` | SMALLINT | |
| `delivery_rating` | SMALLINT NULLABLE | |
| `review_text` | TEXT NULLABLE | |
| `photo_urls` | String[] DEFAULT [] | |
| `tags` | String[] DEFAULT [] | |

---

### `support_tickets`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `customer_id` | UUID FK → users.id | |
| `order_id` | UUID FK → orders.id NULLABLE | |
| `category` | TicketCategory | |
| `description` | TEXT | |
| `status` | TicketStatus DEFAULT open | |
| `resolution_notes` | TEXT NULLABLE | |

---

### `admin_config`
Key-value store for platform configuration.
| Key | Purpose |
|---|---|
| `PLATFORM_FEE` | Platform fee per order (Rs) |
| `DELIVERY_BASE_FEE` | Base delivery fee |
| `DELIVERY_PER_KM_FEE` | Per km delivery fee |
| `PLATFORM_FEE_PERCENT` | Platform commission % (for analytics) |

---

### `admin_audit_log`
Immutable log of admin actions (cancellations, refunds, approvals).

---

### `delivery_assignments`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `order_id` | UUID UNIQUE FK → orders.id | 1 assignment per order |
| `partner_id` | UUID FK → delivery_partners.id | |
| `status` | VARCHAR(50) | accepted, picked_up, delivered, rejected |
| `earning_amount` | DECIMAL NULLABLE | |
| `pickup_distance_km` | DECIMAL NULLABLE | |
| `payout_status` | PayoutStatus NULLABLE | |
| `payout_reference_id/idempotency_key/failure_reason` | TEXT NULLABLE | |
| `payout_processed_at` | TIMESTAMPTZ NULLABLE | |

---

### `notifications`
Notification inbox (not currently displayed in frontend).
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `recipient_type` | RecipientType | |
| `recipient_id` | UUID | |
| `type/title/body` | VARCHAR/TEXT | |
| `data` | JSON NULLABLE | |
| `is_read` | BOOLEAN DEFAULT false | |

---

## Known Schema Issues / Concerns

| Issue | Severity |
|---|---|
| `restaurant_partners.password_hash` exists but is unused (auth is via `users` table) | LOW (legacy) |
| `notifications` table exists but frontend has no notification inbox UI | MEDIUM |
| `DeliveryPartnerAvailability` table exists but not displayed in delivery partner UI | LOW |
| OTP is stored in-memory, not in DB — lost on server restart | HIGH |
| No `preferences` column on User despite PRD mentioning dietary preferences | LOW |
| `custom_label` on Address is stored but not exposed in any frontend UI | LOW |

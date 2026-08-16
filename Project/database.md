# Database Schema

*Cross-reference: Data models, tables, fields, types, and relationships. All code changes to data models must be reflected here first.*

**ORM**: Prisma | **Database**: Supabase (PostgreSQL) | **Schema file**: `prisma/schema.prisma`

---

## Phase 1 — MVP Tables

### `users`
| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `name` | VARCHAR(255) | NOT NULL | |
| `phone` | VARCHAR(15) | UNIQUE, NOT NULL | Primary login identifier |
| `email` | VARCHAR(255) | UNIQUE, NULLABLE | |
| `role` | ENUM | NOT NULL | `customer`, `admin`, `delivery_partner`, `restaurant_partner` |
| `profile_photo_url` | TEXT | NULLABLE | |
| `dob` | DATE | NULLABLE | For birthday offers (Phase 2) |
| `is_active` | BOOLEAN | DEFAULT true | |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | |

---

### `addresses`
| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `user_id` | UUID | FK → users.id, ON DELETE CASCADE | |
| `label` | ENUM | NOT NULL | `home`, `work`, `other` |
| `custom_label` | VARCHAR(100) | NULLABLE | |
| `address_line` | TEXT | NOT NULL | |
| `city` | VARCHAR(100) | NOT NULL | |
| `state` | VARCHAR(100) | NOT NULL | |
| `pincode` | VARCHAR(10) | NOT NULL | |
| `latitude` | DECIMAL(10,8) | NOT NULL | |
| `longitude` | DECIMAL(11,8) | NOT NULL | |
| `is_default` | BOOLEAN | DEFAULT false | |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |

---

### `restaurants`
| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `name` | VARCHAR(255) | NOT NULL | |
| `type` | ENUM | NOT NULL | `restaurant`, `cloud_kitchen`, `home_kitchen` |
| `owner_name` | VARCHAR(255) | NOT NULL | |
| `phone` | VARCHAR(15) | NOT NULL | |
| `email` | VARCHAR(255) | NULLABLE | |
| `address_line` | TEXT | NOT NULL | |
| `city` | VARCHAR(100) | NOT NULL | |
| `state` | VARCHAR(100) | NOT NULL | |
| `pincode` | VARCHAR(10) | NOT NULL | |
| `latitude` | DECIMAL(10,8) | NOT NULL | |
| `longitude` | DECIMAL(11,8) | NOT NULL | |
| `service_radius_km` | DECIMAL(5,2) | NOT NULL | |
| `logo_url` | TEXT | NULLABLE | |
| `cover_image_url` | TEXT | NULLABLE | |
| `photo_gallery_urls` | TEXT[] | DEFAULT '{}' | |
| `is_pure_veg` | BOOLEAN | DEFAULT false | |
| `cuisine_tags` | TEXT[] | DEFAULT '{}' | |
| `status` | ENUM | DEFAULT `pending` | `pending`, `active`, `suspended`, `rejected` |
| `is_open` | BOOLEAN | DEFAULT false | Manual open/close toggle |
| `commission_rate` | DECIMAL(5,2) | NOT NULL | Admin-configurable per restaurant |
| `subscription_plan` | ENUM | DEFAULT `starter` | `starter`, `growth`, `pro` |
| `avg_preparation_time_mins` | INT | NULLABLE | |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | |

---

### `restaurant_operating_hours`
| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `restaurant_id` | UUID | FK → restaurants.id | |
| `day_of_week` | ENUM | NOT NULL | `mon`,`tue`,`wed`,`thu`,`fri`,`sat`,`sun` |
| `open_time` | TIME | NOT NULL | |
| `close_time` | TIME | NOT NULL | |
| `is_closed` | BOOLEAN | DEFAULT false | |

---

### `restaurant_documents`
| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `restaurant_id` | UUID | FK → restaurants.id | |
| `document_type` | VARCHAR(100) | NOT NULL | e.g., "FSSAI", "GST", "ID Proof" |
| `document_url` | TEXT | NOT NULL | |
| `verified` | BOOLEAN | DEFAULT false | |
| `uploaded_at` | TIMESTAMPTZ | DEFAULT now() | |

---

### `restaurant_partners`
*Login accounts for restaurant owners/managers.*
| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `restaurant_id` | UUID | FK → restaurants.id | |
| `name` | VARCHAR(255) | NOT NULL | |
| `phone` | VARCHAR(15) | UNIQUE, NOT NULL | |
| `email` | VARCHAR(255) | NULLABLE | |
| `role` | ENUM | NOT NULL | `owner`, `manager` |
| `is_active` | BOOLEAN | DEFAULT true | |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |

---

### `menu_categories`
| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `restaurant_id` | UUID | FK → restaurants.id | |
| `name` | VARCHAR(255) | NOT NULL | |
| `display_order` | INT | DEFAULT 0 | |
| `is_active` | BOOLEAN | DEFAULT true | |

---

### `menu_items`
| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `restaurant_id` | UUID | FK → restaurants.id | |
| `category_id` | UUID | FK → menu_categories.id | |
| `name` | VARCHAR(255) | NOT NULL | |
| `description` | TEXT | NULLABLE | |
| `price` | DECIMAL(10,2) | NOT NULL | |
| `image_url` | TEXT | NULLABLE | |
| `is_veg` | BOOLEAN | NOT NULL | |
| `is_available` | BOOLEAN | DEFAULT true | |
| `is_bestseller` | BOOLEAN | DEFAULT false | |
| `stock_quantity` | INT | NULLABLE | NULL = unlimited |
| `preparation_time_mins` | INT | NULLABLE | |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | |

---

### `menu_item_customizations`
| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `menu_item_id` | UUID | FK → menu_items.id | |
| `group_name` | VARCHAR(100) | NOT NULL | e.g., "Spice Level", "Add-ons" |
| `is_required` | BOOLEAN | DEFAULT false | |
| `is_multi_select` | BOOLEAN | DEFAULT false | |

---

### `menu_item_customization_options`
| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `customization_id` | UUID | FK → menu_item_customizations.id | |
| `label` | VARCHAR(100) | NOT NULL | e.g., "Mild", "Extra Cheese" |
| `additional_price` | DECIMAL(10,2) | DEFAULT 0 | |

---

### `delivery_partners`
| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `name` | VARCHAR(255) | NOT NULL | |
| `phone` | VARCHAR(15) | UNIQUE, NOT NULL | |
| `email` | VARCHAR(255) | NULLABLE | |
| `password_hash` | TEXT | NULLABLE | |
| `profile_photo_url` | TEXT | NULLABLE | |
| `vehicle_type` | VARCHAR(100) | NULLABLE | |
| `vehicle_number` | VARCHAR(50) | NULLABLE | |
| `bank_account_number` | TEXT | NULLABLE | Encrypted at rest |
| `bank_ifsc` | VARCHAR(20) | NULLABLE | |
| `availability_type` | ENUM | NOT NULL | `full_time`, `part_time` |
| `is_online` | BOOLEAN | DEFAULT false | |
| `current_latitude` | DECIMAL(10,8) | NULLABLE | Updated in realtime |
| `current_longitude` | DECIMAL(11,8) | NULLABLE | Updated in realtime |
| `status` | ENUM | DEFAULT `pending` | `pending`, `active`, `suspended`, `rejected` |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | |

---

### `delivery_partner_availability`
| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `partner_id` | UUID | FK → delivery_partners.id | |
| `day_of_week` | ENUM | NOT NULL | `mon`,`tue`,`wed`,`thu`,`fri`,`sat`,`sun` |
| `start_time` | TIME | NOT NULL | |
| `end_time` | TIME | NOT NULL | |

---

### `delivery_partner_documents`
| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `partner_id` | UUID | FK → delivery_partners.id | |
| `document_type` | VARCHAR(100) | NOT NULL | e.g., "Govt ID", "Driving License" |
| `document_url` | TEXT | NOT NULL | |
| `verified` | BOOLEAN | DEFAULT false | |
| `uploaded_at` | TIMESTAMPTZ | DEFAULT now() | |

---

### `orders`
| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `customer_id` | UUID | FK → users.id | |
| `restaurant_id` | UUID | FK → restaurants.id | |
| `delivery_partner_id` | UUID | FK → delivery_partners.id, NULLABLE | |
| `delivery_address_id` | UUID | FK → addresses.id | |
| `status` | ENUM | NOT NULL | `pending`, `restaurant_confirmed`, `preparing`, `ready`, `rider_assigned`, `picked_up`, `out_for_delivery`, `delivered`, `cancelled`, `rejected` |
| `item_subtotal` | DECIMAL(10,2) | NOT NULL | |
| `delivery_fee` | DECIMAL(10,2) | NOT NULL | |
| `platform_fee` | DECIMAL(10,2) | NOT NULL | |
| `discount_amount` | DECIMAL(10,2) | DEFAULT 0 | |
| `tax_amount` | DECIMAL(10,2) | DEFAULT 0 | |
| `total_amount` | DECIMAL(10,2) | NOT NULL | |
| `payment_method` | ENUM | NOT NULL | `upi`, `card`, `net_banking`, `wallet`, `cod` |
| `payment_status` | ENUM | NOT NULL | `pending`, `processing`, `success`, `failed`, `refunded` |
| `razorpay_order_id` | TEXT | NULLABLE | |
| `razorpay_payment_id` | TEXT | NULLABLE | |
| `idempotency_key` | TEXT | UNIQUE, NOT NULL | Duplicate-order prevention (Rule 4) |
| `coupon_id` | UUID | FK → coupons.id, NULLABLE | |
| `special_instructions` | TEXT | NULLABLE | |
| `cancelled_by` | ENUM | NULLABLE | `customer`, `restaurant`, `admin` |
| `cancellation_reason` | TEXT | NULLABLE | |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | |

---

### `order_items`
| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `order_id` | UUID | FK → orders.id | |
| `menu_item_id` | UUID | FK → menu_items.id | |
| `name_snapshot` | VARCHAR(255) | NOT NULL | Captured at order time |
| `price_snapshot` | DECIMAL(10,2) | NOT NULL | Captured at order time |
| `quantity` | INT | NOT NULL | |
| `customizations_snapshot` | JSONB | NULLABLE | Selected options at order time |
| `subtotal` | DECIMAL(10,2) | NOT NULL | |

---

### `coupons`
| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `code` | VARCHAR(50) | UNIQUE, NOT NULL | |
| `discount_type` | ENUM | NOT NULL | `percentage`, `flat` |
| `discount_value` | DECIMAL(10,2) | NOT NULL | |
| `max_discount_cap` | DECIMAL(10,2) | NULLABLE | For percentage coupons |
| `min_order_value` | DECIMAL(10,2) | DEFAULT 0 | |
| `funded_by` | ENUM | NOT NULL | `restaurant`, `platform`, `shared` |
| `restaurant_id` | UUID | FK → restaurants.id, NULLABLE | NULL = platform-wide |
| `max_uses_total` | INT | NULLABLE | |
| `max_uses_per_user` | INT | DEFAULT 1 | |
| `valid_from` | TIMESTAMPTZ | NOT NULL | |
| `valid_until` | TIMESTAMPTZ | NOT NULL | |
| `is_active` | BOOLEAN | DEFAULT true | |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |

---

### `coupon_redemptions`
| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `coupon_id` | UUID | FK → coupons.id | |
| `user_id` | UUID | FK → users.id | |
| `order_id` | UUID | FK → orders.id | |
| `redeemed_at` | TIMESTAMPTZ | DEFAULT now() | |

---

### `ratings`
| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `order_id` | UUID | FK → orders.id, UNIQUE | One rating per order |
| `customer_id` | UUID | FK → users.id | |
| `restaurant_id` | UUID | FK → restaurants.id | |
| `delivery_partner_id` | UUID | FK → delivery_partners.id, NULLABLE | |
| `food_rating` | SMALLINT | CHECK (1–5) | |
| `restaurant_rating` | SMALLINT | CHECK (1–5) | |
| `delivery_rating` | SMALLINT | CHECK (1–5), NULLABLE | |
| `review_text` | TEXT | NULLABLE | |
| `photo_urls` | TEXT[] | NULLABLE | |
| `tags` | TEXT[] | NULLABLE | e.g., "Great taste", "Late delivery" |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |

---

### `notifications`
| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `recipient_type` | ENUM | NOT NULL | `customer`, `restaurant_partner`, `delivery_partner`, `admin` |
| `recipient_id` | UUID | NOT NULL | References the relevant role table |
| `type` | VARCHAR(100) | NOT NULL | e.g., `order_confirmed`, `rider_assigned` |
| `title` | VARCHAR(255) | NOT NULL | |
| `body` | TEXT | NOT NULL | |
| `data` | JSONB | NULLABLE | Order ID, etc. |
| `is_read` | BOOLEAN | DEFAULT false | |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |

---

### `support_tickets`
| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `customer_id` | UUID | FK → users.id | |
| `order_id` | UUID | FK → orders.id, NULLABLE | |
| `category` | ENUM | NOT NULL | `missing_item`, `wrong_item`, `payment_issue`, `delivery_issue`, `restaurant_issue`, `account_issue` |
| `description` | TEXT | NOT NULL | |
| `status` | ENUM | DEFAULT `open` | `open`, `in_progress`, `resolved`, `closed` |
| `resolution_notes` | TEXT | NULLABLE | |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | |

---

### `admin_config`
*All configurable financial values. Never hardcoded per Rule 3.*
| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `key` | VARCHAR(100) | UNIQUE, NOT NULL | e.g., `default_commission_rate`, `platform_fee_flat`, `delivery_base_fee`, `delivery_per_km_fee`, `min_lmd_discount_pct` |
| `value` | TEXT | NOT NULL | Stored as string, typed at application layer |
| `description` | TEXT | NULLABLE | |
| `updated_by` | UUID | FK → users.id | Admin user who last changed this |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | |

---

### `admin_audit_log`
*Logs all sensitive Admin Panel actions per Rule 10.*
| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | |
| `admin_id` | UUID | FK → users.id | |
| `action` | TEXT | NOT NULL | e.g., `APPROVE_RESTAURANT`, `UPDATE_CONFIG`, `SUSPEND_USER` |
| `target_type` | VARCHAR(100) | NULLABLE | e.g., `restaurant`, `delivery_partner` |
| `target_id` | UUID | NULLABLE | |
| `details` | JSONB | NULLABLE | Before/after values |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |

---

## Phase 2 — Tables (To Be Defined Before Phase 2 Build Starts)
- `tastifyy_coins` / `coin_transactions`
- `referrals`
- `group_orders` / `group_order_participants`
- `split_bill_requests` / `split_bill_payments`
- `scheduled_orders`
- `last_minute_deals`

## Phase 3 — Tables (To Be Defined Before Phase 3 Build Starts)
- `advertisement_campaigns`
- `sponsored_listings`
- `community_polls` / `community_votes`
- `rent_earn_listings` *(Unfinalized — requires PRD confirmation before schema is written)*

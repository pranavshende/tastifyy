-- Non-destructive Restaurant workflow/location migration.
-- Legacy status is retained for compatibility while the new fields become authoritative.

DO $$ BEGIN
  CREATE TYPE "RestaurantApprovalStatus" AS ENUM ('pending', 'approved', 'rejected', 'changes_required', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "RestaurantAccountStatus" AS ENUM ('active', 'inactive');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "RestaurantOperatingStatus" AS ENUM ('open', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "RestaurantVisibilityStatus" AS ENUM ('visible', 'hidden');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "LocationChangeRequestStatus" AS ENUM ('pending', 'approved', 'rejected', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "restaurants"
  ADD COLUMN IF NOT EXISTS "approval_status" "RestaurantApprovalStatus" NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS "account_status" "RestaurantAccountStatus" NOT NULL DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS "operating_status" "RestaurantOperatingStatus" NOT NULL DEFAULT 'closed',
  ADD COLUMN IF NOT EXISTS "visibility_status" "RestaurantVisibilityStatus" NOT NULL DEFAULT 'hidden',
  ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT,
  ADD COLUMN IF NOT EXISTS "admin_notes" TEXT,
  ADD COLUMN IF NOT EXISTS "approved_by" UUID,
  ADD COLUMN IF NOT EXISTS "approved_at" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "formatted_address" TEXT,
  ADD COLUMN IF NOT EXISTS "area" TEXT,
  ADD COLUMN IF NOT EXISTS "district" TEXT,
  ADD COLUMN IF NOT EXISTS "location_verified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "location_source" VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "location_set_at" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "location_set_by" UUID;

-- Preserve existing marketplace behavior: legacy active rows become approved/active/visible.
UPDATE "restaurants"
SET
  "approval_status" = CASE
    WHEN "status"::text = 'active' THEN 'approved'::"RestaurantApprovalStatus"
    WHEN "status"::text = 'rejected' THEN 'rejected'::"RestaurantApprovalStatus"
    WHEN "status"::text = 'suspended' THEN 'suspended'::"RestaurantApprovalStatus"
    ELSE 'pending'::"RestaurantApprovalStatus"
  END,
  "account_status" = CASE WHEN "status"::text = 'active' THEN 'active'::"RestaurantAccountStatus" ELSE 'inactive'::"RestaurantAccountStatus" END,
  "operating_status" = CASE WHEN COALESCE("is_open", false) THEN 'open'::"RestaurantOperatingStatus" ELSE 'closed'::"RestaurantOperatingStatus" END,
  "visibility_status" = CASE WHEN "status"::text = 'active' THEN 'visible'::"RestaurantVisibilityStatus" ELSE 'hidden'::"RestaurantVisibilityStatus" END
WHERE true;

CREATE TABLE IF NOT EXISTS "restaurant_location_change_requests" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "restaurant_id" UUID NOT NULL,
  "requested_by" UUID NOT NULL,
  "reason" TEXT NOT NULL,
  "latitude" DECIMAL(10,8) NOT NULL,
  "longitude" DECIMAL(11,8) NOT NULL,
  "formatted_address" TEXT,
  "area" TEXT,
  "city" TEXT,
  "district" TEXT,
  "state" TEXT,
  "pincode" TEXT,
  "source" VARCHAR(20) NOT NULL,
  "status" "LocationChangeRequestStatus" NOT NULL DEFAULT 'pending',
  "reviewed_by" UUID,
  "reviewed_at" TIMESTAMPTZ,
  "review_notes" TEXT,
  "completed_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "restaurant_location_change_requests_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "restaurant_location_change_requests_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "restaurant_location_change_requests_restaurant_id_status_idx"
  ON "restaurant_location_change_requests"("restaurant_id", "status");

-- Prevent duplicate active primary requests for one restaurant at the database level.
CREATE UNIQUE INDEX IF NOT EXISTS "restaurant_location_change_requests_one_pending_idx"
  ON "restaurant_location_change_requests"("restaurant_id")
  WHERE "status" = 'pending';

-- ============================================================================
-- 002_FRESH_SCHEMA.SQL — Retrop SaaS: Complete multi-tenant database schema
-- ============================================================================
-- Single source of truth for the entire database.
-- Replaces all previous migrations 001 through 012.
-- Run in Supabase SQL Editor AFTER running 001_drop_all.sql
-- ============================================================================

-- ============================================================================
-- SECTION 1: RETROP SAAS CONTROL TABLES (Retrop-owned, not restaurant-visible)
-- ============================================================================

-- 1A. Retrop Restaurant Registry
CREATE TABLE retrop_restaurant (
  "restaurantId"  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "businessName"  VARCHAR(255) NOT NULL,
  "ownerName"     VARCHAR(255) NOT NULL,
  "gender"        VARCHAR(20) CHECK ("gender" IN ('Male', 'Female', 'Other')),
  "ownerMobile"   VARCHAR(20) NOT NULL,
  "isActive"      BOOLEAN DEFAULT true,
  "createdAt"     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1B. Product Keys (one active key per restaurant at a time)
CREATE TABLE product_key (
  "keyId"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "keyValue"      VARCHAR(50) UNIQUE NOT NULL,
  "restaurantId"  UUID NOT NULL REFERENCES retrop_restaurant("restaurantId") ON DELETE CASCADE,
  "isActive"      BOOLEAN DEFAULT true,
  "createdAt"     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_key_value      ON product_key("keyValue");
CREATE INDEX idx_product_key_restaurant ON product_key("restaurantId");

-- 1C. Retrop Super Admin Accounts (YOUR team only)
CREATE TABLE retrop_admin (
  "adminId"   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"      VARCHAR(255) NOT NULL,
  "email"     VARCHAR(255) UNIQUE NOT NULL,
  "password"  VARCHAR(255) NOT NULL,
  "isActive"  BOOLEAN DEFAULT true,
  "lastLogIn" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1D. Retrop Admin Sessions
CREATE TABLE retrop_admin_session (
  "sessionId"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "adminId"                UUID NOT NULL REFERENCES retrop_admin("adminId") ON DELETE CASCADE,
  "accessToken"            VARCHAR(500) NOT NULL,
  "refreshToken"           VARCHAR(500),
  "tokenExpiresAt"         TIMESTAMP WITH TIME ZONE NOT NULL,
  "refreshTokenExpiresAt"  TIMESTAMP WITH TIME ZONE,
  "ipAddress"              VARCHAR(50),
  "userAgent"              TEXT,
  "isActive"               BOOLEAN DEFAULT true,
  "createdAt"              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_retrop_session_adminId     ON retrop_admin_session("adminId");
CREATE INDEX idx_retrop_session_accessToken ON retrop_admin_session("accessToken");
CREATE INDEX idx_retrop_session_isActive    ON retrop_admin_session("isActive");

-- ============================================================================
-- SECTION 2: RESTAURANT STAFF TABLES (all tenant-scoped with restaurantId)
-- ============================================================================

-- 2A. Admin (restaurant manager/owner accounts)
CREATE TABLE admin (
  "adminId"       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "restaurantId"  UUID NOT NULL REFERENCES retrop_restaurant("restaurantId") ON DELETE CASCADE,
  "mobile"        VARCHAR(20) NOT NULL,
  "password"      VARCHAR(255) NOT NULL,
  "name"          VARCHAR(255) NOT NULL,
  "role"          VARCHAR(50) NOT NULL CHECK ("role" IN ('owner', 'manager')),
  "email"         VARCHAR(255),
  "isActive"      BOOLEAN DEFAULT true,
  "lastLogIn"     TIMESTAMP WITH TIME ZONE,
  "createdAt"     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("restaurantId", "mobile")
);

CREATE INDEX idx_admin_restaurant ON admin("restaurantId");
CREATE INDEX idx_admin_mobile     ON admin("mobile");
CREATE INDEX idx_admin_role       ON admin("role");

-- 2B. Admin Sessions
CREATE TABLE admin_session (
  "sessionId"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "adminId"                UUID NOT NULL REFERENCES admin("adminId") ON DELETE CASCADE,
  "restaurantId"           UUID NOT NULL REFERENCES retrop_restaurant("restaurantId") ON DELETE CASCADE,
  "accessToken"            VARCHAR(500) NOT NULL,
  "refreshToken"           VARCHAR(500),
  "tokenExpiresAt"         TIMESTAMP WITH TIME ZONE NOT NULL,
  "refreshTokenExpiresAt"  TIMESTAMP WITH TIME ZONE,
  "ipAddress"              VARCHAR(50),
  "userAgent"              TEXT,
  "isActive"               BOOLEAN DEFAULT true,
  "createdAt"              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_session_adminId      ON admin_session("adminId");
CREATE INDEX idx_admin_session_restaurantId ON admin_session("restaurantId");
CREATE INDEX idx_admin_session_accessToken  ON admin_session("accessToken");
CREATE INDEX idx_admin_session_isActive     ON admin_session("isActive");

-- 2C. Waiter
CREATE TABLE waiter (
  "waiterId"      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "restaurantId"  UUID NOT NULL REFERENCES retrop_restaurant("restaurantId") ON DELETE CASCADE,
  "waiterName"    VARCHAR(255) NOT NULL,
  "mobile"        VARCHAR(20) NOT NULL,
  "password"      VARCHAR(255) NOT NULL,
  "isActive"      BOOLEAN DEFAULT true,
  "lastLogIn"     TIMESTAMP WITH TIME ZONE,
  "fcmToken"      VARCHAR(500),
  "createdAt"     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("restaurantId", "mobile")
);

CREATE INDEX idx_waiter_restaurant ON waiter("restaurantId");
CREATE INDEX idx_waiter_mobile     ON waiter("mobile");

-- 2D. Waiter Session
CREATE TABLE waiter_session (
  "sessionId"      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "waiterId"       UUID UNIQUE NOT NULL REFERENCES waiter("waiterId") ON DELETE CASCADE,
  "restaurantId"   UUID NOT NULL REFERENCES retrop_restaurant("restaurantId") ON DELETE CASCADE,
  "socketId"       VARCHAR(255),
  "ipAddress"      VARCHAR(50),
  "userAgent"      TEXT,
  "lastActivityAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "isActive"       BOOLEAN DEFAULT true,
  "createdAt"      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_waiter_session_waiterId     ON waiter_session("waiterId");
CREATE INDEX idx_waiter_session_restaurantId ON waiter_session("restaurantId");
CREATE INDEX idx_waiter_session_isActive     ON waiter_session("isActive");
CREATE INDEX idx_waiter_session_socketId     ON waiter_session("socketId");

-- 2E. Waiter Daily Stats
CREATE TABLE waiter_daily_stats (
  "statsId"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "waiterId"         UUID NOT NULL REFERENCES waiter("waiterId") ON DELETE CASCADE,
  "restaurantId"     UUID NOT NULL REFERENCES retrop_restaurant("restaurantId") ON DELETE CASCADE,
  "statsDate"        DATE NOT NULL,
  "totalOrders"      INTEGER DEFAULT 0,
  "completedOrders"  INTEGER DEFAULT 0,
  "totalEarnings"    DECIMAL(10, 2) DEFAULT 0,
  "createdAt"        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("waiterId", "statsDate")
);

CREATE INDEX idx_waiter_daily_stats_waiterId     ON waiter_daily_stats("waiterId");
CREATE INDEX idx_waiter_daily_stats_restaurantId ON waiter_daily_stats("restaurantId");
CREATE INDEX idx_waiter_daily_stats_date         ON waiter_daily_stats("statsDate" DESC);

-- 2F. Kitchen
CREATE TABLE kitchen (
  "kitchenId"     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "restaurantId"  UUID NOT NULL REFERENCES retrop_restaurant("restaurantId") ON DELETE CASCADE,
  "kitchenName"   VARCHAR(255) NOT NULL,
  "mobile"        VARCHAR(20) NOT NULL,
  "password"      VARCHAR(255) NOT NULL,
  "isActive"      BOOLEAN DEFAULT true,
  "lastLogIn"     TIMESTAMP WITH TIME ZONE,
  "fcmToken"      VARCHAR(500),
  "createdAt"     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("restaurantId", "mobile")
);

CREATE INDEX idx_kitchen_restaurant ON kitchen("restaurantId");
CREATE INDEX idx_kitchen_mobile     ON kitchen("mobile");

-- 2G. Kitchen Session
CREATE TABLE kitchen_session (
  "sessionId"    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "kitchenId"    UUID UNIQUE NOT NULL REFERENCES kitchen("kitchenId") ON DELETE CASCADE,
  "restaurantId" UUID NOT NULL REFERENCES retrop_restaurant("restaurantId") ON DELETE CASCADE,
  "socketId"     VARCHAR(255),
  "ipAddress"    VARCHAR(50),
  "userAgent"    TEXT,
  "isActive"     BOOLEAN DEFAULT true,
  "createdAt"    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_kitchen_session_kitchenId    ON kitchen_session("kitchenId");
CREATE INDEX idx_kitchen_session_restaurantId ON kitchen_session("restaurantId");
CREATE INDEX idx_kitchen_session_isActive     ON kitchen_session("isActive");

-- 2H. Manager Session (for WebSocket tracking)
CREATE TABLE manager_session (
  "sessionId"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "adminId"           UUID NOT NULL REFERENCES admin("adminId") ON DELETE CASCADE,
  "restaurantId"      UUID NOT NULL REFERENCES retrop_restaurant("restaurantId") ON DELETE CASCADE,
  "socketId"          VARCHAR(255),
  "ipAddress"         VARCHAR(50),
  "userAgent"         TEXT,
  "lastActivityAt"    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "inactivityTimeout" INTEGER DEFAULT 1800,
  "isActive"          BOOLEAN DEFAULT true,
  "createdAt"         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_manager_session_adminId      ON manager_session("adminId");
CREATE INDEX idx_manager_session_restaurantId ON manager_session("restaurantId");
CREATE INDEX idx_manager_session_socketId     ON manager_session("socketId");
CREATE INDEX idx_manager_session_isActive     ON manager_session("isActive");

-- 2I. Login Attempt (rate limiting)
CREATE TABLE login_attempt (
  "attemptId"     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "restaurantId"  UUID REFERENCES retrop_restaurant("restaurantId") ON DELETE SET NULL,
  "mobile"        VARCHAR(20) NOT NULL,
  "ipAddress"     VARCHAR(50),
  "success"       BOOLEAN NOT NULL,
  "failureReason" VARCHAR(255),
  "createdAt"     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_login_attempt_restaurant ON login_attempt("restaurantId", "createdAt" DESC);
CREATE INDEX idx_login_attempt_mobile     ON login_attempt("mobile", "createdAt" DESC);
CREATE INDEX idx_login_attempt_ip         ON login_attempt("ipAddress", "createdAt" DESC);

-- ============================================================================
-- SECTION 3: RESTAURANT CONFIGURATION (one row per restaurant, not single-row)
-- ============================================================================

-- 3A. Restaurant Settings (replaces old INTEGER settingsId=1 single-row pattern)
CREATE TABLE restaurant_settings (
  "settingsId"       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "restaurantId"     UUID UNIQUE NOT NULL REFERENCES retrop_restaurant("restaurantId") ON DELETE CASCADE,
  "isRestaurantOpen" BOOLEAN NOT NULL DEFAULT false,
  "updatedAt"        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedBy"        UUID REFERENCES admin("adminId") ON DELETE SET NULL
);

CREATE INDEX idx_restaurant_settings_restaurantId ON restaurant_settings("restaurantId");

-- 3B. Restaurant Info (replaces old INTEGER infoId=1 single-row pattern)
CREATE TABLE restaurant_info (
  "infoId"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "restaurantId"   UUID UNIQUE NOT NULL REFERENCES retrop_restaurant("restaurantId") ON DELETE CASCADE,
  "restaurantName" VARCHAR(255),
  "address"        TEXT,
  "mobile"         VARCHAR(20),
  "isGST"          BOOLEAN DEFAULT false,
  "GSTIN"          VARCHAR(50),
  "taxes"          JSONB DEFAULT '[]'::jsonb,
  -- taxes format: [{"name": "CGST", "percent": 9}, {"name": "SGST", "percent": 9}]
  "taxType"        VARCHAR(20) DEFAULT 'exclusive' CHECK ("taxType" IN ('inclusive', 'exclusive')),
  "discounts"      JSONB DEFAULT '[]'::jsonb,
  -- discounts format: [{"name": "Happy Hour", "percent": 10, "isActive": true}]
  "createdAt"      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_restaurant_info_restaurantId ON restaurant_info("restaurantId");

-- ============================================================================
-- SECTION 4: MENU TABLE
-- ============================================================================

CREATE TABLE menu (
  "dishId"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "restaurantId"    UUID NOT NULL REFERENCES retrop_restaurant("restaurantId") ON DELETE CASCADE,
  "dishName"        VARCHAR(255) NOT NULL,
  "price"           DECIMAL(10, 2) NOT NULL,
  "isAvailable"     BOOLEAN DEFAULT true,
  "category"        VARCHAR(100),
  "description"     TEXT,
  "imageUrl"        VARCHAR(500),
  "preparationTime" INTEGER DEFAULT 15,
  "spicyLevel"      VARCHAR(50),
  "isVegetarian"    BOOLEAN DEFAULT false,
  "createdAt"       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_menu_restaurant ON menu("restaurantId");
CREATE INDEX idx_menu_category   ON menu("restaurantId", "category");
CREATE INDEX idx_menu_available  ON menu("restaurantId", "isAvailable");

-- ============================================================================
-- SECTION 5: TABLES & CUSTOMERS
-- ============================================================================

-- 5A. Restaurant Table (currentOrder FK added after orders table exists)
CREATE TABLE restaurant_table (
  "tableId"      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "restaurantId" UUID NOT NULL REFERENCES retrop_restaurant("restaurantId") ON DELETE CASCADE,
  "tableNo"      INTEGER NOT NULL,
  "capacity"     INTEGER DEFAULT 2,
  "isAvailable"  BOOLEAN DEFAULT true,
  "currentOrder" UUID,
  "createdAt"    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("restaurantId", "tableNo")
);

CREATE INDEX idx_restaurant_table_restaurant ON restaurant_table("restaurantId");
CREATE INDEX idx_restaurant_table_tableNo    ON restaurant_table("restaurantId", "tableNo");
CREATE INDEX idx_restaurant_table_available  ON restaurant_table("isAvailable");

-- 5B. Customer (composite PK: same phone can visit multiple restaurants)
CREATE TABLE "customer" (
  "mobile"       VARCHAR(20) NOT NULL,
  "restaurantId" UUID NOT NULL REFERENCES retrop_restaurant("restaurantId") ON DELETE CASCADE,
  "name"         VARCHAR(255) NOT NULL,
  "lastLogIn"    TIMESTAMP WITH TIME ZONE,
  "totalorders"  INTEGER DEFAULT 0,
  "isActive"     BOOLEAN DEFAULT true,
  "createdAt"    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("mobile", "restaurantId")
);

CREATE INDEX idx_customer_restaurant ON "customer"("restaurantId");
CREATE INDEX idx_customer_mobile     ON "customer"("mobile");

-- ============================================================================
-- SECTION 6: ORDERS TABLE (all columns from original migrations 001-012 merged)
-- ============================================================================

CREATE TABLE "orders" (
  -- Core identifiers
  "ordersId"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "restaurantId"           UUID NOT NULL REFERENCES retrop_restaurant("restaurantId") ON DELETE CASCADE,

  -- Parties
  "mobile"                 VARCHAR(20) NOT NULL,
  "waiterId"               UUID REFERENCES waiter("waiterId") ON DELETE SET NULL,
  "tableNo"                INTEGER,

  -- Status
  "orderStatus"            VARCHAR(50) DEFAULT 'ordering',
  -- Values: ordering | preparing | ready | serving | completed | cancelled

  -- Order content
  "ordersInfo"             JSONB NOT NULL DEFAULT '[]'::jsonb,
  "ordersUpdateInfo"       JSONB DEFAULT '[]'::jsonb,
  "lockedItems"            JSONB DEFAULT '[]'::jsonb,
  -- lockedItems: snapshot when order hits 'ready' — anti-fraud lock

  -- Billing
  "totalAmount"            DECIMAL(10, 2),
  "discountAmount"         DECIMAL(10, 2) DEFAULT 0,
  "discountBreakdown"      JSONB DEFAULT '[]'::jsonb,
  "taxBreakdown"           JSONB DEFAULT '[]'::jsonb,
  "gstAmount"              DECIMAL(10, 2) DEFAULT 0,
  "finalAmount"            DECIMAL(10, 2),

  -- Payment
  "isPaymentCompleted"     BOOLEAN DEFAULT false,
  "paymentMethod"          VARCHAR(50),

  -- Invoice & numbering
  "invoice"                VARCHAR(500),
  "invoiceNo"              VARCHAR(20),
  "dailyOrderNo"           INTEGER,
  "orderNumber"            VARCHAR(20),

  -- Customer re-scan token
  "customerToken"          VARCHAR(64),
  "tokenValidUntil"        TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  "preparationStartedAt"   TIMESTAMP WITH TIME ZONE,
  "readyAt"                TIMESTAMP WITH TIME ZONE,
  "servedAt"               TIMESTAMP WITH TIME ZONE,
  "completedAt"            TIMESTAMP WITH TIME ZONE,
  "cancellationReason"     TEXT,
  "createdAt"              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_restaurant    ON "orders"("restaurantId");
CREATE INDEX idx_orders_mobile        ON "orders"("mobile");
CREATE INDEX idx_orders_waiterId      ON "orders"("waiterId");
CREATE INDEX idx_orders_tableNo       ON "orders"("restaurantId", "tableNo");
CREATE INDEX idx_orders_status        ON "orders"("restaurantId", "orderStatus");
CREATE INDEX idx_orders_createdAt     ON "orders"("restaurantId", "createdAt" DESC);
CREATE INDEX idx_orders_dailyOrderNo  ON "orders"("restaurantId", "dailyOrderNo");
CREATE INDEX idx_orders_customerToken ON "orders"("customerToken");
CREATE INDEX idx_orders_invoiceNo     ON "orders"("invoiceNo");

-- ============================================================================
-- SECTION 7: DEFERRED FK — restaurant_table.currentOrder → orders
-- ============================================================================

ALTER TABLE restaurant_table
  ADD CONSTRAINT fk_restaurant_table_currentOrder
  FOREIGN KEY ("currentOrder") REFERENCES "orders"("ordersId") ON DELETE SET NULL;

ALTER TABLE "orders"
  ADD CONSTRAINT fk_orders_customer
  FOREIGN KEY ("mobile", "restaurantId") REFERENCES "customer"("mobile", "restaurantId") ON DELETE CASCADE;

-- ============================================================================
-- SECTION 8: SUPABASE STORAGE BUCKET (menu images)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'menu-images',
  'menu-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Public can view menu images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'menu-images');

CREATE POLICY "Service role can upload menu images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'menu-images');

CREATE POLICY "Service role can update menu images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'menu-images');

CREATE POLICY "Service role can delete menu images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'menu-images');

-- ============================================================================
-- DONE
-- ============================================================================
SELECT 'Retrop SaaS multi-tenant schema created successfully.' AS status;

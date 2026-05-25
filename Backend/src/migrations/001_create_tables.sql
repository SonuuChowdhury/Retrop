-- ============================================================================
-- Restaurant Automation System - Database Schema
-- ============================================================================
-- This migration creates the core database tables for the restaurant system
-- Run this in Supabase SQL Editor to initialize the database

-- ============================================================================
-- 1. WAITER TABLE
-- ============================================================================
-- Stores waiter/staff information
-- Primary Key: waiterId (UUID)
-- Unique Constraint: mobile (used for login)

CREATE TABLE IF NOT EXISTS waiter (
  "waiterId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "waiterName" VARCHAR(255) NOT NULL,
  "mobile" VARCHAR(20) UNIQUE NOT NULL,
  "password" VARCHAR(255) NOT NULL, -- Store hashed password only
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on mobile for faster lookups during login
CREATE INDEX IF NOT EXISTS idx_waiter_mobile ON waiter("mobile");

-- ============================================================================
-- 2. customer TABLE (Customers)
-- ============================================================================
-- Stores customer information
-- Primary Key: mobile (phone number serves as unique identifier)
-- Note: Each customer is identified by their mobile number

CREATE TABLE IF NOT EXISTS "customer" (
  "mobile" VARCHAR(20) PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "lastLogIn" TIMESTAMP WITH TIME ZONE,
  "totalorders" INTEGER DEFAULT 0, -- Cached count for analytics
  "fcmToken" VARCHAR(255), -- Firebase Cloud Messaging token for push notifications
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on mobile for lookups (if needed)
CREATE INDEX IF NOT EXISTS idx_customer_mobile ON "customer"("mobile");

-- ============================================================================
-- 3. MENU TABLE (Dishes)
-- ============================================================================
-- Stores menu items/dishes
-- Primary Key: dishId (UUID)
-- Tracks availability and preparation time

CREATE TABLE IF NOT EXISTS menu (
  "dishId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "dishName" VARCHAR(255) NOT NULL,
  "price" DECIMAL(10, 2) NOT NULL,
  "isAvailable" BOOLEAN DEFAULT true,
  "category" VARCHAR(100), -- e.g., 'Appetizer', 'Main Course', 'Dessert'
  "description" TEXT,
  "imageUrl" VARCHAR(500), -- URL to dish image
  "preparationTime" INTEGER DEFAULT 15, -- Time in minutes to prepare
  "spicyLevel" VARCHAR(50), -- e.g., 'Mild', 'Medium', 'Spicy'
  "isVegetarian" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on category for filtering
CREATE INDEX IF NOT EXISTS idx_menu_category ON menu("category");
CREATE INDEX IF NOT EXISTS idx_menu_isAvailable ON menu("isAvailable");

-- ============================================================================
-- 4. RESTAURANT_TABLE TABLE
-- ============================================================================
-- Stores restaurant table information
-- Primary Key: tableId (UUID)
-- Unique Constraint: tableNo (table number for quick reference)
-- NOTE: "currentOrder" FK constraint is added after orders table is created below

CREATE TABLE IF NOT EXISTS restaurant_table (
  "tableId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tableNo" INTEGER NOT NULL UNIQUE,
  "capacity" INTEGER DEFAULT 2, -- Number of seats at the table
  "isAvailable" BOOLEAN DEFAULT true,
  "currentOrder" UUID, -- FK to orders added below via ALTER TABLE
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on tableNo for faster lookups
CREATE INDEX IF NOT EXISTS idx_restaurant_table_tableNo ON restaurant_table("tableNo");
CREATE INDEX IF NOT EXISTS idx_restaurant_table_isAvailable ON restaurant_table("isAvailable");

-- ============================================================================
-- 5. orders TABLE
-- ============================================================================
-- Stores customer orders
-- Primary Key: ordersId (UUID)
-- Foreign Keys: mobile (references customer), waiterId (references waiter)

CREATE TABLE IF NOT EXISTS "orders" (
  "ordersId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "mobile" VARCHAR(20) NOT NULL REFERENCES "customer"("mobile") ON DELETE CASCADE,
  "waiterId" UUID REFERENCES waiter("waiterId") ON DELETE SET NULL,
  "tableNo" INTEGER REFERENCES restaurant_table("tableNo") ON DELETE SET NULL, -- Table where customer is sitting
  "orderStatus" VARCHAR(50) DEFAULT 'ordersing', -- Values: ordersing, preparing, served, completed, cancelled
  -- ordersInfo stores initial orders items in JSON format
  -- Structure: [{dishId: UUID, quantity: number, remarks: string}]
  "ordersInfo" JSONB NOT NULL,
  -- ordersUpdateInfo tracks additional items added during orders preparation
  -- Structure: [{timestamp: ISO string, action: string, items: [{dishId, quantity, remarks}]}]
  "ordersUpdateInfo" JSONB DEFAULT '[]'::jsonb,
  "totalAmount" DECIMAL(10, 2),
  "isPaymentCompleted" BOOLEAN DEFAULT false,
  "paymentMethod" VARCHAR(50), -- Values: 'cash', 'online', 'upi'
  "invoice" VARCHAR(500), -- URL/path to PDF invoice
  "servedAt" TIMESTAMP WITH TIME ZONE, -- When the orders was served
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_orders_mobile ON "orders"("mobile");
CREATE INDEX IF NOT EXISTS idx_orders_waiterId ON "orders"("waiterId");
CREATE INDEX IF NOT EXISTS idx_orders_tableNo ON "orders"("tableNo");
CREATE INDEX IF NOT EXISTS idx_orders_status ON "orders"("orderStatus");
CREATE INDEX IF NOT EXISTS idx_orders_createdAt ON "orders"("createdAt" DESC);

-- ============================================================================
-- 6. ADD DEFERRED FOREIGN KEY: restaurant_table.currentOrder -> orders
-- ============================================================================
-- This constraint couldn't be added during CREATE TABLE due to circular
-- dependency (restaurant_table <-> orders), so it is added here after
-- both tables exist.

ALTER TABLE restaurant_table
  ADD CONSTRAINT fk_restaurant_table_currentOrder
  FOREIGN KEY ("currentOrder") REFERENCES "orders"("ordersId") ON DELETE SET NULL;

-- ============================================================================
-- 7. WAITER_SESSION TABLE
-- ============================================================================
-- Tracks active waiter sessions with socket connections
-- Primary Key: sessionId (UUID)

CREATE TABLE IF NOT EXISTS waiter_session (
  "sessionId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "waiterId" UUID NOT NULL REFERENCES waiter("waiterId") ON DELETE CASCADE,
  "socketId" VARCHAR(255), -- Socket.io connection ID
  "ipAddress" VARCHAR(50),
  "userAgent" TEXT,
  "lastActivityAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for session lookups
CREATE INDEX IF NOT EXISTS idx_waiter_session_waiterId ON waiter_session("waiterId");
CREATE INDEX IF NOT EXISTS idx_waiter_session_isActive ON waiter_session("isActive");
CREATE INDEX IF NOT EXISTS idx_waiter_session_socketId ON waiter_session("socketId");

-- ============================================================================
-- 8. WAITER_DAILY_STATS TABLE
-- ============================================================================
-- Tracks daily statistics per waiter (orders, earnings)
-- Primary Key: statsId (UUID)

CREATE TABLE IF NOT EXISTS waiter_daily_stats (
  "statsId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "waiterId" UUID NOT NULL REFERENCES waiter("waiterId") ON DELETE CASCADE,
  "statsDate" DATE NOT NULL,
  "totalOrders" INTEGER DEFAULT 0,
  "completedOrders" INTEGER DEFAULT 0,
  "totalEarnings" DECIMAL(10, 2) DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("waiterId", "statsDate")
);

-- Create indexes for daily stats queries
CREATE INDEX IF NOT EXISTS idx_waiter_daily_stats_waiterId ON waiter_daily_stats("waiterId");
CREATE INDEX IF NOT EXISTS idx_waiter_daily_stats_date ON waiter_daily_stats("statsDate" DESC);

-- ============================================================================
-- 9. MANAGER_SESSION TABLE
-- ============================================================================
-- Tracks manager WebSocket sessions
-- Primary Key: sessionId (UUID)

CREATE TABLE IF NOT EXISTS manager_session (
  "sessionId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "adminId" UUID NOT NULL REFERENCES admin("adminId") ON DELETE CASCADE,
  "socketId" VARCHAR(255), -- Socket.io connection ID
  "ipAddress" VARCHAR(50),
  "userAgent" TEXT,
  "lastActivityAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "inactivityTimeout" INTEGER DEFAULT 1800, -- 30 minutes in seconds
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for manager session lookups
CREATE INDEX IF NOT EXISTS idx_manager_session_adminId ON manager_session("adminId");
CREATE INDEX IF NOT EXISTS idx_manager_session_socketId ON manager_session("socketId");
CREATE INDEX IF NOT EXISTS idx_manager_session_isActive ON manager_session("isActive");

-- ============================================================================
-- NOTES FOR DEVELOPERS
-- ============================================================================
-- 1. All timestamps are in UTC (WITH TIME ZONE)
-- 2. JSONB is used for flexible data storage (ordersInfo, ordersUpdateInfo)
-- 3. Password field should store bcrypt hashed values only
-- 4. Foreign key constraints ensure data integrity
-- 5. Indexes improve query performance for frequent lookups
-- 6. Use prepared statements to prevent SQL injection
-- 7. Mobile numbers are used as primary identifiers for customers
-- 8. waiter_session table tracks real-time waiter connections
-- 9. waiter_daily_stats is updated at order completion for analytics
-- 10. manager_session tracks WebSocket connections with inactivity timeout
-- ============================================================================
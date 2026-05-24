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
  waiterId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  waiterName VARCHAR(255) NOT NULL,
  mobile VARCHAR(20) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL, -- Store hashed password only
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on mobile for faster lookups during login
CREATE INDEX IF NOT EXISTS idx_waiter_mobile ON waiter(mobile);

-- ============================================================================
-- 2. USER TABLE (Customers)
-- ============================================================================
-- Stores customer information
-- Primary Key: mobile (phone number serves as unique identifier)
-- Note: Each customer is identified by their mobile number

CREATE TABLE IF NOT EXISTS "user" (
  mobile VARCHAR(20) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  lastLogIn TIMESTAMP WITH TIME ZONE,
  totalOrders INTEGER DEFAULT 0, -- Cached count for analytics
  fcmToken VARCHAR(255), -- Firebase Cloud Messaging token for push notifications
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for lookups (if needed)
CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);

-- ============================================================================
-- 3. MENU TABLE (Dishes)
-- ============================================================================
-- Stores menu items/dishes
-- Primary Key: dishId (UUID)
-- Tracks availability and preparation time

CREATE TABLE IF NOT EXISTS menu (
  dishId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dishName VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  isAvailable BOOLEAN DEFAULT true,
  category VARCHAR(100), -- e.g., 'Appetizer', 'Main Course', 'Dessert'
  description TEXT,
  imageUrl VARCHAR(500), -- URL to dish image
  preparationTime INTEGER DEFAULT 15, -- Time in minutes to prepare
  spicyLevel VARCHAR(50), -- e.g., 'Mild', 'Medium', 'Spicy'
  isVegetarian BOOLEAN DEFAULT false,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on category for filtering
CREATE INDEX IF NOT EXISTS idx_menu_category ON menu(category);
CREATE INDEX IF NOT EXISTS idx_menu_isAvailable ON menu(isAvailable);

-- ============================================================================
-- 4. ORDER TABLE
-- ============================================================================
-- Stores customer orders
-- Primary Key: orderId (UUID)
-- Foreign Keys: mobile (references user), waiterId (references waiter)

CREATE TABLE IF NOT EXISTS "order" (
  orderId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile VARCHAR(20) NOT NULL REFERENCES "user"(mobile) ON DELETE CASCADE,
  waiterId UUID NOT NULL REFERENCES waiter(waiterId) ON DELETE SET NULL,
  orderStatus VARCHAR(50) DEFAULT 'ordering', -- Values: ordering, preparing, served, completed, cancelled
  -- orderInfo stores initial order items in JSON format
  -- Structure: [{dishId: UUID, quantity: number, remarks: string}]
  orderInfo JSONB NOT NULL,
  -- orderUpdateInfo tracks additional items added during order preparation
  -- Structure: [{timestamp: ISO string, action: string, items: [{dishId, quantity, remarks}]}]
  orderUpdateInfo JSONB DEFAULT '[]'::jsonb,
  totalAmount DECIMAL(10, 2),
  isPaymentCompleted BOOLEAN DEFAULT false,
  paymentMethod VARCHAR(50), -- Values: 'cash', 'online', 'upi'
  invoice VARCHAR(500), -- URL/path to PDF invoice
  servedAt TIMESTAMP WITH TIME ZONE, -- When the order was served
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_order_mobile ON "order"(mobile);
CREATE INDEX IF NOT EXISTS idx_order_waiterId ON "order"(waiterId);
CREATE INDEX IF NOT EXISTS idx_order_status ON "order"(orderStatus);
CREATE INDEX IF NOT EXISTS idx_order_createdAt ON "order"(createdAt DESC);

-- ============================================================================
-- 5. Admins
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin (
  adminId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(50) NOT NULL, -- e.g., 'owner', 'manager'
  adminName VARCHAR(255) NOT NULL,
  mobile VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL, -- Store hashed password only
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================================
-- NOTES FOR DEVELOPERS
-- ============================================================================
-- 1. All timestamps are in UTC (WITH TIME ZONE)
-- 2. JSONB is used for flexible data storage (orderInfo, orderUpdateInfo)
-- 3. Password field should store bcrypt hashed values only
-- 4. Foreign key constraints ensure data integrity
-- 5. Indexes improve query performance for frequent lookups
-- 6. Use prepared statements to prevent SQL injection
-- 7. Mobile numbers are used as primary identifiers for customers
-- ============================================================================

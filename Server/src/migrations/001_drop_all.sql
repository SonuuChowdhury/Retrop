-- ============================================================================
-- 001_DROP_ALL.SQL — Retrop SaaS: Wipe existing schema for fresh start
-- ============================================================================
-- Run in Supabase SQL Editor FIRST before running 002_fresh_schema.sql
-- WARNING: This permanently deletes ALL data. There is no undo.
-- ============================================================================

-- Drop all custom indexes (most auto-drop with tables, but being explicit)
DROP INDEX IF EXISTS idx_waiter_mobile;
DROP INDEX IF EXISTS idx_waiter_restaurant;
DROP INDEX IF EXISTS idx_customer_mobile;
DROP INDEX IF EXISTS idx_customer_restaurant;
DROP INDEX IF EXISTS idx_menu_category;
DROP INDEX IF EXISTS idx_menu_available;
DROP INDEX IF EXISTS idx_menu_restaurant;
DROP INDEX IF EXISTS idx_restaurant_table_tableNo;
DROP INDEX IF EXISTS idx_restaurant_table_available;
DROP INDEX IF EXISTS idx_restaurant_table_restaurant;
DROP INDEX IF EXISTS idx_orders_mobile;
DROP INDEX IF EXISTS idx_orders_waiterId;
DROP INDEX IF EXISTS idx_orders_tableNo;
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_orders_createdAt;
DROP INDEX IF EXISTS idx_orders_dailyOrderNo;
DROP INDEX IF EXISTS idx_orders_customerToken;
DROP INDEX IF EXISTS idx_orders_invoiceNo;
DROP INDEX IF EXISTS idx_orders_restaurant;
DROP INDEX IF EXISTS idx_waiter_session_waiterId;
DROP INDEX IF EXISTS idx_waiter_session_isActive;
DROP INDEX IF EXISTS idx_waiter_session_socketId;
DROP INDEX IF EXISTS idx_waiter_session_restaurantId;
DROP INDEX IF EXISTS idx_waiter_daily_stats_waiterId;
DROP INDEX IF EXISTS idx_waiter_daily_stats_date;
DROP INDEX IF EXISTS idx_waiter_daily_stats_restaurantId;
DROP INDEX IF EXISTS idx_manager_session_adminId;
DROP INDEX IF EXISTS idx_manager_session_socketId;
DROP INDEX IF EXISTS idx_manager_session_isActive;
DROP INDEX IF EXISTS idx_manager_session_restaurantId;
DROP INDEX IF EXISTS idx_admin_mobile;
DROP INDEX IF EXISTS idx_admin_role;
DROP INDEX IF EXISTS idx_admin_restaurant;
DROP INDEX IF EXISTS idx_admin_session_adminId;
DROP INDEX IF EXISTS idx_admin_session_accessToken;
DROP INDEX IF EXISTS idx_admin_session_isActive;
DROP INDEX IF EXISTS idx_admin_session_restaurantId;
DROP INDEX IF EXISTS idx_login_attempt_mobile;
DROP INDEX IF EXISTS idx_login_attempt_ip;
DROP INDEX IF EXISTS idx_login_attempt_restaurant;
DROP INDEX IF EXISTS idx_kitchen_mobile;
DROP INDEX IF EXISTS idx_kitchen_restaurant;
DROP INDEX IF EXISTS idx_kitchen_session_kitchenId;
DROP INDEX IF EXISTS idx_kitchen_session_isActive;
DROP INDEX IF EXISTS idx_kitchen_session_restaurantId;
DROP INDEX IF EXISTS idx_product_key_value;
DROP INDEX IF EXISTS idx_product_key_restaurant;
DROP INDEX IF EXISTS idx_retrop_session_adminId;
DROP INDEX IF EXISTS idx_retrop_session_accessToken;
DROP INDEX IF EXISTS idx_retrop_session_isActive;
DROP INDEX IF EXISTS idx_restaurant_info_restaurantId;
DROP INDEX IF EXISTS idx_restaurant_settings_restaurantId;

-- Drop storage policies (prevent errors if they exist)
DROP POLICY IF EXISTS "Public can view menu images"    ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload menu images"  ON storage.objects;
DROP POLICY IF EXISTS "Service role can update menu images"  ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete menu images"  ON storage.objects;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS login_attempt            CASCADE;
DROP TABLE IF EXISTS admin_session            CASCADE;
DROP TABLE IF EXISTS manager_session          CASCADE;
DROP TABLE IF EXISTS waiter_daily_stats       CASCADE;
DROP TABLE IF EXISTS waiter_session           CASCADE;
DROP TABLE IF EXISTS kitchen_session          CASCADE;
DROP TABLE IF EXISTS "orders"                 CASCADE;
DROP TABLE IF EXISTS restaurant_table         CASCADE;
DROP TABLE IF EXISTS menu                     CASCADE;
DROP TABLE IF EXISTS "customer"               CASCADE;
DROP TABLE IF EXISTS kitchen                  CASCADE;
DROP TABLE IF EXISTS waiter                   CASCADE;
DROP TABLE IF EXISTS admin                    CASCADE;
DROP TABLE IF EXISTS restaurant_settings      CASCADE;
DROP TABLE IF EXISTS restaurant_info          CASCADE;
-- Retrop SaaS tables
DROP TABLE IF EXISTS product_key              CASCADE;
DROP TABLE IF EXISTS retrop_admin_session     CASCADE;
DROP TABLE IF EXISTS retrop_admin             CASCADE;
DROP TABLE IF EXISTS retrop_restaurant        CASCADE;

SELECT 'All tables dropped successfully. Ready for fresh schema.' AS status;

-- Migration 009_google_review_link.sql
-- Adds googleReviewLink column to restaurant_info table

ALTER TABLE restaurant_info
  ADD COLUMN IF NOT EXISTS "googleReviewLink" TEXT;

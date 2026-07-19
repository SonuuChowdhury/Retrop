-- Migration 011_website_analytics.sql
-- Creates website_analytics table for persistent traffic telemetry tracking

CREATE TABLE IF NOT EXISTS website_analytics (
  "session_id"        VARCHAR(255) PRIMARY KEY,
  "visitor_id"        VARCHAR(255) NOT NULL,
  "is_returning"      BOOLEAN DEFAULT false,
  "entry_page"        TEXT,
  "exit_page"         TEXT,
  "pages_visited"     JSONB DEFAULT '[]'::jsonb,
  "duration_seconds"  INTEGER DEFAULT 0,
  "device_type"       VARCHAR(50),
  "browser"           VARCHAR(50),
  "os"                VARCHAR(50),
  "screen_resolution" VARCHAR(50),
  "timezone"          VARCHAR(100),
  "network_type"      VARCHAR(50),
  "ip_address"        VARCHAR(50),
  "country"           VARCHAR(100),
  "state"             VARCHAR(100),
  "city"              VARCHAR(100),
  "isp"               VARCHAR(255),
  "traffic_source"    VARCHAR(100),
  "referrer_domain"   TEXT,
  "utm_data"          JSONB DEFAULT '{}'::jsonb,
  "created_at"        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updated_at"        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_website_analytics_visitor_id ON website_analytics("visitor_id");
CREATE INDEX IF NOT EXISTS idx_website_analytics_updated_at ON website_analytics("updated_at");

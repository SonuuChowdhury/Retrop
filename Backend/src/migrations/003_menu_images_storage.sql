-- ============================================================================
-- Menu Images Storage Bucket Setup
-- ============================================================================
-- Run this in Supabase SQL Editor after running 001 and 002 migrations.
-- This sets up the Supabase Storage bucket for dish/menu images.

-- ============================================================================
-- 1. CREATE STORAGE BUCKET: menu-images
-- ============================================================================
-- Public bucket so frontend can display images via their public URL directly.
-- File size limit: 5MB per image.
-- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'menu-images',
  'menu-images',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. STORAGE POLICIES (RLS)
-- ============================================================================

-- Allow public READ access (anyone can view menu images)
CREATE POLICY "Public can view menu images"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-images');

-- Allow authenticated service role to INSERT (upload)
CREATE POLICY "Service role can upload menu images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'menu-images');

-- Allow authenticated service role to UPDATE
CREATE POLICY "Service role can update menu images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'menu-images');

-- Allow authenticated service role to DELETE
CREATE POLICY "Service role can delete menu images"
ON storage.objects FOR DELETE
USING (bucket_id = 'menu-images');

-- ============================================================================
-- NOTES FOR DEVELOPERS
-- ============================================================================
-- 1. Images are stored in: menu-images/{dishId}/{filename}
-- 2. Public URL format: {SUPABASE_URL}/storage/v1/object/public/menu-images/{path}
-- 3. Backend uses service role key — all storage ops bypass RLS policies.
-- 4. File naming: use dishId as folder, timestamp as filename for uniqueness.
-- 5. When a dish is deleted, its image folder is also deleted from storage.
-- 6. When an image is replaced, the old image is deleted before uploading new.
-- ============================================================================
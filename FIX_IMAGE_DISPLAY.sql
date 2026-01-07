-- =============================================
-- QUICK FIX: Make Images Visible in Browser
-- =============================================
-- This makes the storage bucket PUBLIC so browsers
-- can load images directly. RLS policies still
-- control who can access which images.
-- =============================================

-- Step 1: Update bucket to be PUBLIC
UPDATE storage.buckets
SET public = true
WHERE id = 'blog-images';

-- Step 2: Verify the change
SELECT 
  id, 
  name, 
  public as is_public,
  file_size_limit,
  created_at
FROM storage.buckets 
WHERE id = 'blog-images';

-- Expected result:
-- id: blog-images
-- name: blog-images
-- is_public: true ✅
-- file_size_limit: 5242880

-- =============================================
-- DONE! ✅
-- =============================================
-- Your images should now be visible in the browser!
-- The storage policies still enforce room-based access.
--
-- If bucket doesn't exist yet, run SETUP_STORAGE_BUCKET.sql first
-- =============================================


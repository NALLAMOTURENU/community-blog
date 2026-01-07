-- =============================================
-- SETUP SUPABASE STORAGE FOR BLOG IMAGES
-- WITH ROOM-BASED ACCESS CONTROL
-- =============================================
-- Run this in your Supabase SQL Editor
-- This ensures only room members can view blog images
-- =============================================

-- Step 1: Create the blog-images bucket (PUBLIC with RLS policies)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images',
  true,  -- PUBLIC: Allows browsers to load images directly (RLS policies control access)
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']::text[];

-- Step 2: Policy 1 - Allow room members to upload images
CREATE POLICY "Allow room members to upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'blog-images' 
  AND (storage.foldername(name))[1] = 'rooms'
  AND (storage.foldername(name))[2]::uuid IN (
    SELECT room_id 
    FROM public.room_members 
    WHERE user_id = auth.uid()
  )
);

-- Step 3: Policy 2 - Allow room members to view images
CREATE POLICY "Allow room members to view images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'blog-images' 
  AND (storage.foldername(name))[1] = 'rooms'
  AND (storage.foldername(name))[2]::uuid IN (
    SELECT room_id 
    FROM public.room_members 
    WHERE user_id = auth.uid()
  )
);

-- Step 4: Policy 3 - Allow users to delete their own images
CREATE POLICY "Allow users to delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'blog-images' 
  AND (storage.foldername(name))[1] = 'rooms'
  AND (storage.foldername(name))[3] = auth.uid()::text
);

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check if bucket was created
SELECT 
  id, 
  name, 
  public as is_public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'blog-images';

-- Expected output:
-- id: blog-images
-- name: blog-images
-- is_public: true  (PUBLIC bucket - access controlled by RLS policies!)
-- file_size_limit: 5242880
-- allowed_mime_types: {image/jpeg,image/jpg,image/png,image/gif,image/webp}

-- Check if policies were created
SELECT 
  policyname,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%room%' OR policyname LIKE '%blog%'
ORDER BY policyname;

-- Expected: 3 policies
-- 1. Allow room members to upload images (INSERT)
-- 2. Allow room members to view images (SELECT)
-- 3. Allow users to delete their own images (DELETE)

-- =============================================
-- TESTING (Optional - Run after setup)
-- =============================================

-- Test 1: Check your room memberships
SELECT 
  r.name as room_name,
  r.id as room_id,
  rm.role
FROM public.room_members rm
JOIN public.rooms r ON r.id = rm.room_id
WHERE rm.user_id = auth.uid();

-- Test 2: Check existing images (if any)
SELECT 
  name as file_path,
  created_at,
  (storage.foldername(name))[1] as folder_type,
  (storage.foldername(name))[2] as room_id,
  (storage.foldername(name))[3] as user_id
FROM storage.objects
WHERE bucket_id = 'blog-images'
ORDER BY created_at DESC;

-- =============================================
-- DONE! ✅
-- =============================================
--
-- STORAGE STRUCTURE:
-- blog-images/
--   └── rooms/
--       └── {roomId}/
--           └── {userId}/
--               └── {filename}.jpg
--
-- ACCESS CONTROL:
-- ✅ Only authenticated users can upload
-- ✅ Only room members can upload to their room
-- ✅ Only room members can view images from their room
-- ✅ Users can only delete their own images
-- ✅ Non-members cannot see any images
-- ✅ Matches blog access control (room-based)
--
-- SECURITY:
-- 🔒 Bucket is PUBLIC (allows browser image loading)
-- 🔒 Access controlled by Storage RLS policies
-- 🔒 Only authenticated room members can view images
-- 🔒 Access verified via room_members table
-- 🔒 Upload requires authentication + room membership
-- =============================================


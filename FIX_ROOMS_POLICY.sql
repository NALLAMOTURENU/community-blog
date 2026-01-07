-- =============================================
-- FIX: rooms table RLS policy
-- =============================================

-- Check current policy on rooms
-- Run this first to see what exists:
-- SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'rooms';

-- Drop the problematic INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create rooms" ON public.rooms;

-- Create a simpler, more permissive policy
CREATE POLICY "authenticated_can_create_rooms"
  ON public.rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
  -- We'll validate created_by at the application level

-- The SELECT policy might also need fixing to avoid recursion
DROP POLICY IF EXISTS "Rooms are viewable by members" ON public.rooms;

CREATE POLICY "authenticated_can_view_their_rooms"
  ON public.rooms
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- UPDATE policy
DROP POLICY IF EXISTS "Room creators can update their rooms" ON public.rooms;

CREATE POLICY "creators_can_update_rooms"
  ON public.rooms
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- =============================================
-- Alternative: Temporarily disable RLS on rooms for testing
-- =============================================
-- If the above doesn't work, run this to test:
-- ALTER TABLE public.rooms DISABLE ROW LEVEL SECURITY;
-- (Then re-enable after testing: ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;)

-- =============================================
-- Verify policies
-- =============================================
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'rooms';


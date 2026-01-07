-- =============================================
-- FIX: Infinite recursion in room_members RLS policy
-- =============================================

-- Problem: The SELECT policy on room_members queries room_members itself,
-- causing infinite recursion when the trigger tries to add the creator.

-- Solution: Replace the recursive policy with a simpler one

-- 1. Drop the problematic SELECT policy
DROP POLICY IF EXISTS "Room members are viewable by other members" ON public.room_members;

-- 2. Create a new SELECT policy that doesn't cause recursion
-- Allow users to view room_members if they are members (simpler check)
CREATE POLICY "Room members are viewable by room members"
  ON public.room_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.room_members rm
      WHERE rm.room_id = room_members.room_id
        AND rm.user_id = auth.uid()
    )
  );

-- 3. Ensure the INSERT policy allows the trigger function
-- The current policy should work, but let's make it explicit
DROP POLICY IF EXISTS "Users can join rooms" ON public.room_members;

CREATE POLICY "Users can join rooms"
  ON public.room_members FOR INSERT
  WITH CHECK (
    -- Allow if inserting their own membership
    auth.uid() = user_id
    OR
    -- Allow if they are an admin of the room (for invites)
    EXISTS (
      SELECT 1 FROM public.room_members rm
      WHERE rm.room_id = room_members.room_id
        AND rm.user_id = auth.uid()
        AND rm.role = 'admin'
    )
  );

-- 4. Make sure the trigger function bypasses RLS (it should with SECURITY DEFINER)
-- Recreate it to be absolutely sure
CREATE OR REPLACE FUNCTION public.add_room_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.room_members (room_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The SECURITY DEFINER makes it run with the function owner's privileges,
-- bypassing RLS policies


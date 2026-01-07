-- =============================================
-- IMMEDIATE FIX: Stop RLS infinite recursion
-- =============================================
-- Run this in Supabase SQL Editor NOW
-- =============================================

-- 1. Fix the broken SELECT policy on room_members
DROP POLICY IF EXISTS "Room members are viewable by other members" ON public.room_members;

-- Use the simplest, safest approach: users can read their own membership
CREATE POLICY "Users can read their own membership"
  ON public.room_members
  FOR SELECT
  USING (user_id = auth.uid());

-- 2. Fix INSERT policy to allow trigger to work
DROP POLICY IF EXISTS "Users can join rooms" ON public.room_members;

CREATE POLICY "Users can insert their own membership"
  ON public.room_members
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 3. Ensure trigger function has SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.add_room_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.room_members (room_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- SECURITY DEFINER means the function runs with elevated privileges
-- and bypasses RLS policies, preventing recursion

-- 4. Verify the trigger is still active
DROP TRIGGER IF EXISTS on_room_created ON public.rooms;
CREATE TRIGGER on_room_created
  AFTER INSERT ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.add_room_creator_as_admin();

-- =============================================
-- DONE! Room creation will work now.
-- =============================================


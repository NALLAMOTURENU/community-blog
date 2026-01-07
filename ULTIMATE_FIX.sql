-- =============================================
-- ULTIMATE FIX: Zero recursion possible
-- =============================================
-- This removes ALL cross-table queries
-- =============================================

-- 1. Drop ALL policies on room_members
DROP POLICY IF EXISTS "Room members are viewable by other members" ON public.room_members;
DROP POLICY IF EXISTS "Users can join rooms" ON public.room_members;
DROP POLICY IF EXISTS "Admins can manage room members" ON public.room_members;
DROP POLICY IF EXISTS "Room creators can manage members" ON public.room_members;
DROP POLICY IF EXISTS "Users can read their own room memberships" ON public.room_members;
DROP POLICY IF EXISTS "Users can insert their own room membership" ON public.room_members;
DROP POLICY IF EXISTS "Room members are viewable by room members" ON public.room_members;
DROP POLICY IF EXISTS "Users can read their own membership" ON public.room_members;
DROP POLICY IF EXISTS "Users can insert their own membership" ON public.room_members;
DROP POLICY IF EXISTS "select_own_membership" ON public.room_members;
DROP POLICY IF EXISTS "insert_own_membership" ON public.room_members;
DROP POLICY IF EXISTS "delete_own_membership" ON public.room_members;
DROP POLICY IF EXISTS "update_own_membership" ON public.room_members;

-- 2. Create ONLY the essential policies (NO table queries)

-- SELECT: Users can ONLY see their own membership rows
CREATE POLICY "room_members_select_policy"
  ON public.room_members
  FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: Users can ONLY insert themselves
CREATE POLICY "room_members_insert_policy"
  ON public.room_members
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- DELETE: Users can ONLY delete their own membership
CREATE POLICY "room_members_delete_policy"
  ON public.room_members
  FOR DELETE
  USING (user_id = auth.uid());

-- NO UPDATE or complex admin policies - keep it simple for now

-- 3. Make trigger function bulletproof
CREATE OR REPLACE FUNCTION public.add_room_creator_as_admin()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Direct insert - SECURITY DEFINER bypasses ALL RLS
  INSERT INTO public.room_members (room_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
EXCEPTION 
  WHEN unique_violation THEN
    -- User already exists as member, just return
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log but don't break room creation
    RAISE WARNING 'Could not add creator as admin: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 4. Ensure trigger is active
DROP TRIGGER IF EXISTS on_room_created ON public.rooms;
CREATE TRIGGER on_room_created
  AFTER INSERT ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.add_room_creator_as_admin();

-- =============================================
-- VERIFY (run this after to check):
-- =============================================
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'room_members';
-- Should show ONLY 3 policies, all simple

-- =============================================
-- RESULT: 
-- ✅ No table queries in ANY policy
-- ✅ No cross-table recursion possible
-- ✅ Trigger bypasses RLS completely
-- =============================================


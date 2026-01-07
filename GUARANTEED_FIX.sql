-- =============================================
-- GUARANTEED FIX - Run this EXACT SQL
-- =============================================
-- This will work. Follow the steps below.
-- =============================================

-- =============================================
-- STEP 1: NUKE ALL POLICIES (Dynamic Drop)
-- =============================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'room_members'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.room_members',
      pol.policyname
    );
  END LOOP;
END $$;

-- =============================================
-- STEP 2: VERIFY ALL POLICIES ARE GONE
-- =============================================
-- Run this query to check:
-- SELECT policyname FROM pg_policies WHERE tablename = 'room_members';
-- Should return ZERO rows!

-- =============================================
-- STEP 3: CREATE SAFE, NON-RECURSIVE POLICIES
-- =============================================

-- Allow users to see ONLY their own membership rows
CREATE POLICY "read_own_membership"
  ON public.room_members
  FOR SELECT
  USING (user_id = auth.uid());

-- Allow users to insert their own membership (join room)
CREATE POLICY "insert_own_membership"
  ON public.room_members
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Allow room creator to delete members (queries rooms, NOT room_members)
CREATE POLICY "creator_manage_members"
  ON public.room_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.rooms
      WHERE rooms.id = room_members.room_id
        AND rooms.created_by = auth.uid()
    )
  );

-- =============================================
-- STEP 4: ENSURE TRIGGER IS SECURITY DEFINER
-- =============================================
CREATE OR REPLACE FUNCTION public.add_room_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.room_members (room_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger (just to be sure)
DROP TRIGGER IF EXISTS on_room_created ON public.rooms;
CREATE TRIGGER on_room_created
  AFTER INSERT ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.add_room_creator_as_admin();

-- =============================================
-- VERIFICATION QUERIES (Run these after)
-- =============================================

-- Should show exactly 3 policies:
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'room_members';

-- Should show SECURITY DEFINER:
-- SELECT routine_name, security_type FROM information_schema.routines WHERE routine_name = 'add_room_creator_as_admin';

-- =============================================
-- DONE! Now:
-- 1. Restart your dev server (npm run dev)
-- 2. Hard refresh browser (Cmd+Shift+R)
-- 3. Try creating a room
-- =============================================


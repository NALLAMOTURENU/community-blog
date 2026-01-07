-- =============================================
-- MIGRATION: Set join_code DEFAULT to auto-generate
-- This fixes the "Failed to generate join code" error
-- =============================================

-- Set the default value for join_code to automatically call the function
ALTER TABLE public.rooms
ALTER COLUMN join_code
SET DEFAULT public.generate_unique_join_code();

-- Now when you insert a room without specifying join_code,
-- Postgres will automatically generate a unique 4-digit code


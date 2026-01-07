-- =============================================
-- SUPABASE DATABASE SCHEMA
-- Multi-Blog Community Platform
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES TABLE
-- Extends auth.users with username
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
  CONSTRAINT username_format CHECK (username ~ '^[a-z0-9_-]+$')
);

-- Index for username lookups
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- =============================================
-- ROOMS TABLE
-- Community spaces where users collaborate
-- =============================================
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  join_code TEXT UNIQUE NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT name_length CHECK (char_length(name) >= 3 AND char_length(name) <= 100),
  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT join_code_format CHECK (join_code ~ '^[0-9]{4}$')
);

-- Indexes for rooms
CREATE INDEX idx_rooms_slug ON public.rooms(slug);
CREATE INDEX idx_rooms_join_code ON public.rooms(join_code);
CREATE INDEX idx_rooms_created_by ON public.rooms(created_by);

-- Enable Row Level Security
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Policies for rooms
CREATE POLICY "Rooms are viewable by members"
  ON public.rooms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.room_members
      WHERE room_members.room_id = rooms.id
      AND room_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create rooms"
  ON public.rooms FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Room creators can update their rooms"
  ON public.rooms FOR UPDATE
  USING (auth.uid() = created_by);

-- =============================================
-- ROOM_MEMBERS TABLE
-- Junction table for room membership
-- =============================================
CREATE TABLE public.room_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(room_id, user_id),
  CONSTRAINT valid_role CHECK (role IN ('admin', 'member'))
);

-- Indexes for room_members
CREATE INDEX idx_room_members_room_id ON public.room_members(room_id);
CREATE INDEX idx_room_members_user_id ON public.room_members(user_id);

-- Enable Row Level Security
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

-- Policies for room_members
CREATE POLICY "Room members are viewable by other members"
  ON public.room_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.room_members AS rm
      WHERE rm.room_id = room_members.room_id
      AND rm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join rooms"
  ON public.room_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage room members"
  ON public.room_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.room_members AS rm
      WHERE rm.room_id = room_members.room_id
      AND rm.user_id = auth.uid()
      AND rm.role = 'admin'
    )
  );

-- =============================================
-- BLOGS TABLE
-- Blog metadata (content stored in Sanity)
-- =============================================
CREATE TABLE public.blogs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  sanity_id TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(room_id, slug),
  CONSTRAINT title_length CHECK (char_length(title) >= 3 AND char_length(title) <= 200),
  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Indexes for blogs
CREATE INDEX idx_blogs_room_id ON public.blogs(room_id);
CREATE INDEX idx_blogs_author_id ON public.blogs(author_id);
CREATE INDEX idx_blogs_slug ON public.blogs(room_id, slug);
CREATE INDEX idx_blogs_sanity_id ON public.blogs(sanity_id);
CREATE INDEX idx_blogs_published ON public.blogs(published, published_at);

-- Enable Row Level Security
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- Policies for blogs
CREATE POLICY "Published blogs are viewable by room members"
  ON public.blogs FOR SELECT
  USING (
    published = true AND EXISTS (
      SELECT 1 FROM public.room_members
      WHERE room_members.room_id = blogs.room_id
      AND room_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Unpublished blogs are viewable by authors"
  ON public.blogs FOR SELECT
  USING (
    published = false AND auth.uid() = author_id
  );

CREATE POLICY "Room members can create blogs"
  ON public.blogs FOR INSERT
  WITH CHECK (
    auth.uid() = author_id AND EXISTS (
      SELECT 1 FROM public.room_members
      WHERE room_members.room_id = blogs.room_id
      AND room_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Authors can update their unpublished blogs"
  ON public.blogs FOR UPDATE
  USING (auth.uid() = author_id AND published = false);

CREATE POLICY "Authors can publish their blogs"
  ON public.blogs FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (
    (published = true AND published_at IS NOT NULL) OR
    (published = false)
  );

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id::text, 1, 8))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to generate unique join code
CREATE OR REPLACE FUNCTION public.generate_unique_join_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 4-digit code
    new_code := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- Check if code exists
    SELECT EXISTS(SELECT 1 FROM public.rooms WHERE join_code = new_code) INTO code_exists;
    
    -- If code doesn't exist, return it
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically add room creator as admin member
CREATE OR REPLACE FUNCTION public.add_room_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.room_members (room_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to add creator as admin
DROP TRIGGER IF EXISTS on_room_created ON public.rooms;
CREATE TRIGGER on_room_created
  AFTER INSERT ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.add_room_creator_as_admin();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_rooms_updated_at ON public.rooms;
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_blogs_updated_at ON public.blogs;
CREATE TRIGGER update_blogs_updated_at
  BEFORE UPDATE ON public.blogs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- VIEWS
-- =============================================

-- View for room members with user details
CREATE OR REPLACE VIEW public.room_members_with_profiles AS
SELECT 
  rm.id,
  rm.room_id,
  rm.user_id,
  rm.role,
  rm.joined_at,
  p.username,
  p.email,
  p.avatar_url
FROM public.room_members rm
JOIN public.profiles p ON rm.user_id = p.id;

-- View for blogs with author details
CREATE OR REPLACE VIEW public.blogs_with_authors AS
SELECT 
  b.id,
  b.room_id,
  b.author_id,
  b.title,
  b.slug,
  b.sanity_id,
  b.excerpt,
  b.published,
  b.published_at,
  b.created_at,
  b.updated_at,
  p.username AS author_username,
  p.avatar_url AS author_avatar
FROM public.blogs b
JOIN public.profiles p ON b.author_id = p.id;

-- =============================================
-- GRANTS
-- =============================================

-- Grant access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;


-- Initial Schema for Et SHop!

-- 1. Profiles (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Categories / Aisles (for auto-sorting)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Shopping Lists
CREATE TABLE IF NOT EXISTS public.shopping_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#1A365D',
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. List Members (for real-time sharing)
CREATE TABLE IF NOT EXISTS public.list_members (
  list_id UUID REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'editor', -- 'owner', 'editor', 'viewer'
  PRIMARY KEY (list_id, user_id)
);

-- 5. Items Catalog (for "Hop!" Autocompletion)
-- This table can grow as users add new items (learning system)
CREATE TABLE IF NOT EXISTS public.items_catalog (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Shopping List Items
CREATE TABLE IF NOT EXISTS public.shopping_list_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID REFERENCES public.shopping_lists(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity DECIMAL DEFAULT 1,
  unit TEXT DEFAULT 'pcs',
  price DECIMAL DEFAULT 0,
  is_checked BOOLEAN DEFAULT FALSE,
  added_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_catalog ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Simplified for now)
-- Profiles: Users can only read/update their own profile
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Lists: Users can view lists they own or are members of
CREATE POLICY "Users can view lists they belong to" ON public.shopping_lists
  FOR SELECT USING (
    owner_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.list_members WHERE list_id = id AND user_id = auth.uid())
  );

-- List Items: Users can view items of lists they belong to
CREATE POLICY "Users can manage items in their lists" ON public.shopping_list_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.shopping_lists l
      LEFT JOIN public.list_members m ON m.list_id = l.id
      WHERE l.id = shopping_list_items.list_id 
      AND (l.owner_id = auth.uid() OR m.user_id = auth.uid())
    )
  );

-- Categories & Catalog: Everyone can view
CREATE POLICY "Public read access for categories" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read access for items catalog" ON public.items_catalog FOR SELECT TO authenticated USING (true);

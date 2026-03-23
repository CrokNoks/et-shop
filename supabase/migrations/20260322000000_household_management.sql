-- Household Management Migration

-- 1. Create Households table
CREATE TABLE IF NOT EXISTS public.households (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Household Members table (Linking users to households)
CREATE TABLE IF NOT EXISTS public.household_members (
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- 'admin', 'member'
  PRIMARY KEY (household_id, user_id)
);

-- 3. Add household_id to existing tables
-- Categories
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES public.households(id) ON DELETE CASCADE;
-- Shopping Lists
ALTER TABLE public.shopping_lists ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES public.households(id) ON DELETE CASCADE;
-- Items Catalog
ALTER TABLE public.items_catalog ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES public.households(id) ON DELETE CASCADE;

-- 4. Update Unique Constraints for Data Isolation
-- Items Catalog: Name must be unique within a household
ALTER TABLE public.items_catalog DROP CONSTRAINT IF EXISTS items_catalog_name_key;
ALTER TABLE public.items_catalog ADD CONSTRAINT items_catalog_name_household_unique UNIQUE (name, household_id);

-- 5. Enable RLS on new tables
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;

-- 6. Updated RLS Policies for Household Isolation

-- Households: Members can view their households
CREATE POLICY "Members can view their households" ON public.households
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.household_members 
      WHERE household_id = id AND user_id = auth.uid()
    )
  );

-- Household Members: Members can view other members of their households
CREATE POLICY "Members can view household members" ON public.household_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.household_members m
      WHERE m.household_id = household_members.household_id AND m.user_id = auth.uid()
    )
  );

-- Categories: Isolated by household
DROP POLICY IF EXISTS "Public read access for categories" ON public.categories;
CREATE POLICY "Users can manage categories of their household" ON public.categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.household_members 
      WHERE household_id = categories.household_id AND user_id = auth.uid()
    )
  );

-- Items Catalog: Isolated by household
DROP POLICY IF EXISTS "Public read access for items catalog" ON public.items_catalog;
CREATE POLICY "Users can manage catalog of their household" ON public.items_catalog
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.household_members 
      WHERE household_id = items_catalog.household_id AND user_id = auth.uid()
    )
  );

-- Shopping Lists: Isolated by household
DROP POLICY IF EXISTS "Users can view lists they belong to" ON public.shopping_lists;
CREATE POLICY "Users can manage lists of their household" ON public.shopping_lists
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.household_members 
      WHERE household_id = shopping_lists.household_id AND user_id = auth.uid()
    )
  );

-- Shopping List Items: Inherit security from shopping_lists
DROP POLICY IF EXISTS "Users can manage items in their lists" ON public.shopping_list_items;
CREATE POLICY "Users can manage items in household lists" ON public.shopping_list_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.shopping_lists l
      JOIN public.household_members m ON m.household_id = l.household_id
      WHERE l.id = shopping_list_items.list_id AND m.user_id = auth.uid()
    )
  );

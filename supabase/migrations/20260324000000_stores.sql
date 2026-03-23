-- Migration: Add Stores and Store-specific Category Ordering

-- 1. Create Stores table
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Store Category Orders table (for custom sorting per store)
CREATE TABLE IF NOT EXISTS public.store_category_orders (
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  PRIMARY KEY (store_id, category_id)
);

-- 3. Add store_id to Shopping Lists
ALTER TABLE public.shopping_lists 
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL;

-- 4. Enable RLS
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_category_orders ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Stores: Members of the same household can manage stores
CREATE POLICY "Users can manage stores of their household" ON public.stores
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.household_members 
      WHERE household_id = stores.household_id AND user_id = auth.uid()
    )
  );

-- Store Category Orders: Members of the same household (via store) can manage orders
CREATE POLICY "Users can manage category orders of their stores" ON public.store_category_orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      JOIN public.household_members m ON m.household_id = s.household_id
      WHERE s.id = store_category_orders.store_id AND m.user_id = auth.uid()
    )
  );

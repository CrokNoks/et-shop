-- Migration: Refactor to Store-Centric Model
-- Hierarchy: Household -> Store -> Category -> Product

-- 1. Add store_id to categories and items_catalog
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE public.items_catalog ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;

-- 2. Data Migration: Create a default store for each household that has data but no store
DO $$
DECLARE
    h_id UUID;
    s_id UUID;
BEGIN
    FOR h_id IN SELECT id FROM public.households LOOP
        -- Check if household already has a store
        SELECT id INTO s_id FROM public.stores WHERE household_id = h_id LIMIT 1;
        
        -- If no store exists, create a default one
        IF s_id IS NULL THEN
            INSERT INTO public.stores (name, household_id)
            VALUES ('Magasin par défaut', h_id)
            RETURNING id INTO s_id;
        END IF;

        -- Link existing categories of this household to this store
        UPDATE public.categories SET store_id = s_id WHERE household_id = h_id AND store_id IS NULL;
        
        -- Link existing catalog items of this household to this store
        UPDATE public.items_catalog SET store_id = s_id WHERE household_id = h_id AND store_id IS NULL;
    END LOOP;
END $$;

-- 3. Make store_id NOT NULL after migration
ALTER TABLE public.categories ALTER COLUMN store_id SET NOT NULL;
ALTER TABLE public.items_catalog ALTER COLUMN store_id SET NOT NULL;

-- 4. Clean up: categories no longer need household_id directly (inherited via store)
-- We keep it for now to avoid breaking existing RLS until we update them
-- But we can remove the sorting table as sort_order is now store-specific by definition
DROP TABLE IF EXISTS public.store_category_orders;

-- 5. Update Unique Constraints
-- Categories: Name must be unique within a store
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_name_key;
ALTER TABLE public.categories ADD CONSTRAINT categories_name_store_unique UNIQUE (name, store_id);

-- Items Catalog: Name must be unique within a store
ALTER TABLE public.items_catalog DROP CONSTRAINT IF EXISTS items_catalog_name_household_unique;
ALTER TABLE public.items_catalog ADD CONSTRAINT items_catalog_name_store_unique UNIQUE (name, store_id);

-- 6. Update RLS Policies

-- Categories: Check access via store_id
DROP POLICY IF EXISTS "Users can manage categories of their household" ON public.categories;
CREATE POLICY "Users can manage categories of their stores" ON public.categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      JOIN public.household_members m ON m.household_id = s.household_id
      WHERE s.id = categories.store_id AND m.user_id = auth.uid()
    )
  );

-- Items Catalog: Check access via store_id
DROP POLICY IF EXISTS "Users can manage catalog of their household" ON public.items_catalog;
CREATE POLICY "Users can manage catalog of their stores" ON public.items_catalog
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      JOIN public.household_members m ON m.household_id = s.household_id
      WHERE s.id = items_catalog.store_id AND m.user_id = auth.uid()
    )
  );

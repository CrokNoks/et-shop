-- 20260325000000_fix_recursive_policy.sql
-- Final robust fix for household management with proper user identity propagation.

-- 1. Ensure owner_id exists
ALTER TABLE public.households ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id);

-- 2. Clean up everything to start fresh
DO $$
DECLARE
    trig record;
    pol record;
BEGIN
    FOR trig IN SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE event_object_schema = 'public' 
    AND event_object_table IN ('households', 'household_members') LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', trig.trigger_name, trig.event_object_table);
    END LOOP;

    FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' 
    AND tablename IN ('households', 'household_members', 'categories', 'items_catalog', 'shopping_lists', 'shopping_list_items', 'stores') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 3. Trigger to set owner_id and add creator as member
CREATE OR REPLACE FUNCTION public.handle_new_household()
RETURNS TRIGGER AS $$
BEGIN
  -- Set owner
  NEW.owner_id := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_new_household_membership()
RETURNS TRIGGER AS $$
BEGIN
  -- Add creator as admin member
  INSERT INTO public.household_members (household_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'admin')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_household_insert_before
  BEFORE INSERT ON public.households
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_household();

CREATE TRIGGER on_household_insert_after
  AFTER INSERT ON public.households
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_household_membership();

-- 4. Function to break RLS recursion for member checks
CREATE OR REPLACE FUNCTION public.get_my_households()
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY
  SELECT m.household_id 
  FROM public.household_members m
  WHERE m.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. New Policies

-- HOUSEHOLDS
CREATE POLICY "households_select" ON public.households FOR SELECT TO authenticated USING (owner_id = auth.uid() OR id IN (SELECT public.get_my_households()));
CREATE POLICY "households_insert" ON public.households FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "households_update" ON public.households FOR UPDATE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "households_delete" ON public.households FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- HOUSEHOLD_MEMBERS
CREATE POLICY "members_select" ON public.household_members FOR SELECT TO authenticated USING (household_id IN (SELECT public.get_my_households()));
CREATE POLICY "members_manage_self" ON public.household_members FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "admins_manage_members" ON public.household_members FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.households h WHERE h.id = household_members.household_id AND h.owner_id = auth.uid()));

-- 6. Other tables Isolation
CREATE POLICY "categories_all" ON public.categories FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = categories.store_id AND s.household_id IN (SELECT public.get_my_households())));

CREATE POLICY "items_catalog_all" ON public.items_catalog FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = items_catalog.store_id AND s.household_id IN (SELECT public.get_my_households())));

CREATE POLICY "shopping_lists_all" ON public.shopping_lists FOR ALL TO authenticated 
  USING (household_id IN (SELECT public.get_my_households()));

CREATE POLICY "shopping_list_items_all" ON public.shopping_list_items FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.shopping_lists l WHERE l.id = shopping_list_items.list_id AND l.household_id IN (SELECT public.get_my_households())));

CREATE POLICY "stores_all" ON public.stores FOR ALL TO authenticated 
  USING (household_id IN (SELECT public.get_my_households()));

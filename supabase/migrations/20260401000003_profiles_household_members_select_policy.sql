-- Lets a user read the profile of any other member of a household they belong to
-- (needed to show teammate names/avatars in the foyer view and "checked by X").
-- Additive: the existing "Users can view their own profile" policy (auth.uid() = id)
-- from 20260321000000_initial_schema.sql is untouched.
--
-- Reuses public.get_my_households() (introduced in 20260325000000_fix_recursive_policy.sql
-- specifically to break RLS recursion on household-scoped tables) rather than a direct
-- self-join on household_members, consistent with every other household-scoped policy
-- in this schema (categories_all, items_catalog_all, shopping_lists_all,
-- shopping_list_items_all, stores_all all follow this same "household_id IN
-- (SELECT get_my_households())" idiom). get_my_households() is SECURITY DEFINER and
-- queries household_members directly, so referencing it here does not re-trigger the
-- profiles policy being defined, and household_members' own RLS policy already resolves
-- through the same recursion-safe helper.
CREATE POLICY "Household members can view co-members profiles" ON public.profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.household_members hm
    WHERE hm.user_id = profiles.id
      AND hm.household_id IN (SELECT public.get_my_households())
  )
);

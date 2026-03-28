-- Migration: Add recipes and recipe_items tables
-- Feature: Recipes — reusable shopping list templates

-- 1. Create recipes table
CREATE TABLE IF NOT EXISTS public.recipes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  description TEXT,
  household_id UUID       NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create recipe_items table
CREATE TABLE IF NOT EXISTS public.recipe_items (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id       UUID         NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  catalog_item_id UUID         NOT NULL REFERENCES public.items_catalog(id) ON DELETE CASCADE,
  quantity        DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit            TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT recipe_items_recipe_catalog_unique UNIQUE (recipe_id, catalog_item_id)
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS recipes_household_id_idx ON public.recipes (household_id);
CREATE INDEX IF NOT EXISTS recipe_items_recipe_id_idx ON public.recipe_items (recipe_id);

-- 4. Enable RLS
ALTER TABLE public.recipes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_items ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies — recipes
--    Access granted to members of the recipe's household

CREATE POLICY "Household members can select recipes"
  ON public.recipes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = recipes.household_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Household members can insert recipes"
  ON public.recipes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = recipes.household_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Household members can update recipes"
  ON public.recipes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = recipes.household_id
        AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = recipes.household_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Household members can delete recipes"
  ON public.recipes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = recipes.household_id
        AND user_id = auth.uid()
    )
  );

-- 6. RLS Policies — recipe_items
--    Access granted if the user is a member of the household owning the parent recipe

CREATE POLICY "Household members can select recipe_items"
  ON public.recipe_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes r
      JOIN public.household_members m ON m.household_id = r.household_id
      WHERE r.id = recipe_items.recipe_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Household members can insert recipe_items"
  ON public.recipe_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipes r
      JOIN public.household_members m ON m.household_id = r.household_id
      WHERE r.id = recipe_items.recipe_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Household members can update recipe_items"
  ON public.recipe_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes r
      JOIN public.household_members m ON m.household_id = r.household_id
      WHERE r.id = recipe_items.recipe_id
        AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipes r
      JOIN public.household_members m ON m.household_id = r.household_id
      WHERE r.id = recipe_items.recipe_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Household members can delete recipe_items"
  ON public.recipe_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes r
      JOIN public.household_members m ON m.household_id = r.household_id
      WHERE r.id = recipe_items.recipe_id
        AND m.user_id = auth.uid()
    )
  );

-- 7. updated_at trigger for recipes
CREATE OR REPLACE FUNCTION public.handle_recipes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER recipes_set_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.handle_recipes_updated_at();

-- 20260328000002_recipes.sql
-- Recipes feature: allows users to create reusable product templates and inject them into shopping lists

-- 1. Create recipes table
CREATE TABLE public.recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON public.recipes (household_id);

-- 2. Create recipe_items table
CREATE TABLE public.recipe_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    catalog_item_id UUID NOT NULL REFERENCES public.items_catalog(id) ON DELETE CASCADE,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT recipe_items_unique_product UNIQUE (recipe_id, catalog_item_id)
);

CREATE INDEX ON public.recipe_items (recipe_id);
CREATE INDEX ON public.recipe_items (catalog_item_id);

-- 3. Enable Row Level Security
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_items ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for recipes
CREATE POLICY "Household members can manage recipes" ON public.recipes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.household_members
            WHERE household_id = recipes.household_id
              AND user_id = auth.uid()
        )
    );

-- 5. RLS Policies for recipe_items
-- Access is granted if the user is a member of the recipe's parent household
CREATE POLICY "Household members can manage recipe items" ON public.recipe_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.recipes r
            JOIN public.household_members m ON m.household_id = r.household_id
            WHERE r.id = recipe_items.recipe_id
              AND m.user_id = auth.uid()
        )
    );

-- 6. Trigger to auto-update updated_at on recipes
CREATE OR REPLACE FUNCTION update_recipes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recipes_updated_at
    BEFORE UPDATE ON public.recipes
    FOR EACH ROW
    EXECUTE FUNCTION update_recipes_updated_at();

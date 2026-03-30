-- Migration: Purchase Records & Statistics
-- Feature: Historique des achats & Statistiques
-- Date: 2026-03-29

-- =============================================================================
-- 1. Rename is_checked → is_purchased on shopping_list_items
-- =============================================================================
-- Rename the column for better semantic clarity.
-- All existing rows retain their values (false = not purchased).
ALTER TABLE public.shopping_list_items
  RENAME COLUMN is_checked TO is_purchased;


-- =============================================================================
-- 2. Create purchase_records table
-- =============================================================================
-- One row per individual item purchase.
-- Stores a snapshot of item name, category name, price and quantity at the time
-- of purchase so historical records remain accurate even if the catalog changes.
CREATE TABLE IF NOT EXISTS public.purchase_records (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id    UUID        NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  catalog_item_id UUID        REFERENCES public.items_catalog(id) ON DELETE SET NULL,
  item_name       TEXT        NOT NULL,       -- snapshot of item name at purchase time
  category_id     UUID        REFERENCES public.categories(id) ON DELETE SET NULL,
  category_name   TEXT,                       -- snapshot of category name at purchase time
  store_id        UUID        REFERENCES public.stores(id) ON DELETE SET NULL,
  list_id         UUID        REFERENCES public.shopping_lists(id) ON DELETE SET NULL,
  quantity        DECIMAL(10,3) NOT NULL,
  unit            TEXT,
  price_per_unit  DECIMAL(10,2),
  purchased_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS purchase_records_household_id_idx
  ON public.purchase_records (household_id);

CREATE INDEX IF NOT EXISTS purchase_records_purchased_at_idx
  ON public.purchase_records (household_id, purchased_at DESC);

CREATE INDEX IF NOT EXISTS purchase_records_catalog_item_id_idx
  ON public.purchase_records (household_id, catalog_item_id);

CREATE INDEX IF NOT EXISTS purchase_records_category_id_idx
  ON public.purchase_records (household_id, category_id);


-- =============================================================================
-- 3. Row Level Security for purchase_records
-- =============================================================================
ALTER TABLE public.purchase_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "purchase_records_household_isolation"
  ON public.purchase_records
  FOR ALL
  USING (
    household_id IN (
      SELECT household_id
      FROM public.household_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    household_id IN (
      SELECT household_id
      FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );


-- =============================================================================
-- 4. Statistics views
-- =============================================================================

-- View: spending by category per month
-- Aggregates total spending (price_per_unit * quantity) grouped by
-- household, category, store and calendar month.
CREATE OR REPLACE VIEW public.v_spending_by_category AS
  SELECT
    household_id,
    category_id,
    category_name,
    store_id,
    DATE_TRUNC('month', purchased_at) AS month,
    SUM(price_per_unit * quantity)    AS total_spent
  FROM public.purchase_records
  WHERE price_per_unit IS NOT NULL
  GROUP BY
    household_id,
    category_id,
    category_name,
    store_id,
    DATE_TRUNC('month', purchased_at);

-- View: top items by purchase frequency
-- Aggregates purchase count, total quantity and average price per item
-- within each household.
CREATE OR REPLACE VIEW public.v_top_items AS
  SELECT
    household_id,
    catalog_item_id,
    item_name,
    COUNT(*)            AS purchase_count,
    SUM(quantity)       AS total_quantity,
    AVG(price_per_unit) AS avg_price
  FROM public.purchase_records
  GROUP BY
    household_id,
    catalog_item_id,
    item_name;

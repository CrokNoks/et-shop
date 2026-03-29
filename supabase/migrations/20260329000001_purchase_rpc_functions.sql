-- Migration: Purchase RPC Atomic Functions
-- Feature: Historique des achats & Statistiques
-- Date: 2026-03-29

-- =============================================================================
-- 1. record_purchase_atomic
-- =============================================================================
-- Atomically marks a shopping list item as purchased AND inserts a purchase record.
-- Verifies that p_household_id belongs to the calling user via household_members.
CREATE OR REPLACE FUNCTION public.record_purchase_atomic(
  p_household_id    UUID,
  p_list_item_id    UUID,
  p_catalog_item_id UUID,
  p_item_name       TEXT,
  p_category_id     UUID,
  p_category_name   TEXT,
  p_store_id        UUID,
  p_list_id         UUID,
  p_quantity        DECIMAL,
  p_unit            TEXT,
  p_price_per_unit  DECIMAL
)
RETURNS TABLE (id UUID, purchased_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Security check: ensure caller is a member of the given household
  IF NOT EXISTS (
    SELECT 1
    FROM public.household_members
    WHERE household_id = p_household_id
      AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: user is not a member of household %', p_household_id;
  END IF;

  -- Step 1: Mark the shopping list item as purchased
  UPDATE public.shopping_list_items
  SET is_purchased = true
  WHERE id = p_list_item_id;

  -- Step 2: Insert the purchase record and return id + purchased_at
  RETURN QUERY
  INSERT INTO public.purchase_records (
    household_id,
    catalog_item_id,
    item_name,
    category_id,
    category_name,
    store_id,
    list_id,
    quantity,
    unit,
    price_per_unit
  )
  VALUES (
    p_household_id,
    p_catalog_item_id,
    p_item_name,
    p_category_id,
    p_category_name,
    p_store_id,
    p_list_id,
    p_quantity,
    p_unit,
    p_price_per_unit
  )
  RETURNING purchase_records.id, purchase_records.purchased_at;
END;
$$;


-- =============================================================================
-- 2. cancel_purchase_atomic
-- =============================================================================
-- Atomically deletes a purchase record AND resets the shopping list item to
-- is_purchased = false.
-- Verifies the household via the purchase_records row itself.
CREATE OR REPLACE FUNCTION public.cancel_purchase_atomic(
  p_purchase_record_id UUID,
  p_list_item_id       UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_household_id UUID;
BEGIN
  -- Resolve household from the purchase record
  SELECT household_id
  INTO v_household_id
  FROM public.purchase_records
  WHERE id = p_purchase_record_id;

  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'Purchase record % not found', p_purchase_record_id;
  END IF;

  -- Security check: ensure caller is a member of the household
  IF NOT EXISTS (
    SELECT 1
    FROM public.household_members
    WHERE household_id = v_household_id
      AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: user is not a member of household %', v_household_id;
  END IF;

  -- Step 1: Delete the purchase record
  DELETE FROM public.purchase_records
  WHERE id = p_purchase_record_id;

  -- Step 2: Reset the shopping list item to not purchased
  UPDATE public.shopping_list_items
  SET is_purchased = false
  WHERE id = p_list_item_id;
END;
$$;

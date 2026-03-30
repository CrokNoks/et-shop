-- Migration: Link purchase_records to shopping_list_items + fix RPC signatures
-- Date: 2026-03-30

-- =============================================================================
-- 1. Add shopping_list_item_id to purchase_records
-- =============================================================================
ALTER TABLE public.purchase_records
  ADD COLUMN IF NOT EXISTS shopping_list_item_id UUID
    REFERENCES public.shopping_list_items(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_purchase_records_list_item_id
  ON public.purchase_records(shopping_list_item_id);

-- =============================================================================
-- 2. Recreate record_purchase_atomic with correct signature
-- =============================================================================
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
  -- Security check
  IF NOT EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = p_household_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: user is not a member of household %', p_household_id;
  END IF;

  -- Mark item as purchased
  UPDATE public.shopping_list_items
    SET is_purchased = true
  WHERE id = p_list_item_id;

  -- Insert purchase record and return id + purchased_at
  RETURN QUERY
  INSERT INTO public.purchase_records (
    household_id, shopping_list_item_id, catalog_item_id,
    item_name, category_id, category_name,
    store_id, list_id, quantity, unit, price_per_unit
  ) VALUES (
    p_household_id, p_list_item_id, p_catalog_item_id,
    p_item_name, p_category_id, p_category_name,
    p_store_id, p_list_id, p_quantity, p_unit, p_price_per_unit
  )
  RETURNING purchase_records.id, purchase_records.purchased_at;
END;
$$;

-- =============================================================================
-- 3. Recreate cancel_purchase_atomic — takes only the list_item_id
--    Looks up the purchase_record via shopping_list_item_id
-- =============================================================================
CREATE OR REPLACE FUNCTION public.cancel_purchase_atomic(
  p_list_item_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_purchase_record_id UUID;
  v_household_id       UUID;
BEGIN
  -- Find the purchase record linked to this list item
  SELECT id, household_id
    INTO v_purchase_record_id, v_household_id
  FROM public.purchase_records
  WHERE shopping_list_item_id = p_list_item_id
  ORDER BY purchased_at DESC
  LIMIT 1;

  IF v_purchase_record_id IS NULL THEN
    RAISE EXCEPTION 'No purchase record found for shopping list item %', p_list_item_id;
  END IF;

  -- Security check
  IF NOT EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = v_household_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: user is not a member of household %', v_household_id;
  END IF;

  -- Delete the purchase record
  DELETE FROM public.purchase_records WHERE id = v_purchase_record_id;

  -- Reset the list item
  UPDATE public.shopping_list_items
    SET is_purchased = false
  WHERE id = p_list_item_id;
END;
$$;

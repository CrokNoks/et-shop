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
  IF NOT EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = p_household_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: user is not a member of household %', p_household_id;
  END IF;

  UPDATE public.shopping_list_items
    SET is_purchased = true
  WHERE id = p_list_item_id;

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

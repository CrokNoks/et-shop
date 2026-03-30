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
  SELECT id, household_id
    INTO v_purchase_record_id, v_household_id
  FROM public.purchase_records
  WHERE shopping_list_item_id = p_list_item_id
  ORDER BY purchased_at DESC
  LIMIT 1;

  IF v_purchase_record_id IS NULL THEN
    RAISE EXCEPTION 'No purchase record found for shopping list item %', p_list_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = v_household_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: user is not a member of household %', v_household_id;
  END IF;

  DELETE FROM public.purchase_records WHERE id = v_purchase_record_id;

  UPDATE public.shopping_list_items
    SET is_purchased = false
  WHERE id = p_list_item_id;
END;
$$;

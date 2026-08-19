-- Sécurité (revue backend_mobile_ui) : record_purchase_atomic vérifiait que
-- l'appelant est membre de p_household_id, mais ne vérifiait jamais que
-- p_list_item_id appartient bien à une liste de ce foyer. La fonction est
-- SECURITY DEFINER (contourne RLS) et appelable directement via PostgREST par
-- n'importe quel membre authentifié d'un foyer quelconque : sans ce garde, un
-- appelant légitime pour son propre foyer pouvait passer l'id d'un item d'un
-- AUTRE foyer et le marquer acheté / lui attribuer un purchase_records
-- incohérent. Le code applicatif (RecordPurchaseUseCase) valide déjà
-- correctement l'appartenance en amont, mais la RPC elle-même doit être sûre
-- indépendamment de son seul appelant actuel.
CREATE OR REPLACE FUNCTION public.record_purchase_atomic(
  p_household_id    UUID,
  p_list_item_id    UUID,
  p_catalog_item_id UUID,
  p_item_name       TEXT,
  p_category_id     UUID,
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
    SET is_purchased = true,
        purchased_by = auth.uid()
  WHERE shopping_list_items.id = p_list_item_id
    AND EXISTS (
      SELECT 1 FROM public.shopping_lists sl
      WHERE sl.id = shopping_list_items.list_id
        AND sl.household_id = p_household_id
    );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item % does not belong to household %', p_list_item_id, p_household_id;
  END IF;

  RETURN QUERY
  INSERT INTO public.purchase_records (
    household_id, shopping_list_item_id, catalog_item_id,
    item_name, category_id,
    store_id, list_id, quantity, unit, price_per_unit
  ) VALUES (
    p_household_id, p_list_item_id, p_catalog_item_id,
    p_item_name, p_category_id,
    p_store_id, p_list_id, p_quantity, p_unit, p_price_per_unit
  )
  RETURNING purchase_records.id, purchase_records.purchased_at;
END;
$$;

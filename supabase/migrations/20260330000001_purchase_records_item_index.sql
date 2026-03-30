CREATE INDEX IF NOT EXISTS idx_purchase_records_list_item_id
  ON public.purchase_records(shopping_list_item_id);

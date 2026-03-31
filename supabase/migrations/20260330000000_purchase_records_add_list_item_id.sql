ALTER TABLE public.purchase_records
  ADD COLUMN IF NOT EXISTS shopping_list_item_id UUID
    REFERENCES public.shopping_list_items(id) ON DELETE SET NULL;

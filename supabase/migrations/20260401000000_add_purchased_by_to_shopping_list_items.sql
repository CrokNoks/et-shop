-- Track who checked off an item (distinct from added_by, which tracks who added it).
ALTER TABLE public.shopping_list_items
  ADD COLUMN IF NOT EXISTS purchased_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

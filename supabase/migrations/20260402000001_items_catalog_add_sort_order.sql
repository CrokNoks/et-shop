-- Ordre des produits à l'intérieur d'un rayon (drag-and-drop), sur le même
-- modèle que categories.sort_order, déjà en place depuis le schéma initial.
ALTER TABLE public.items_catalog ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

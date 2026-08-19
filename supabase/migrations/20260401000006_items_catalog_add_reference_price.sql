-- Point 4 (backend_mobile_ui) : dernier prix connu d'un produit, mis à jour
-- opportunistement à chaque achat réussi (RecordPurchaseUseCase). Utilisé pour
-- calculer le coût estimé d'une recette (GET /recipes/:id).
ALTER TABLE public.items_catalog ADD COLUMN IF NOT EXISTS reference_price DECIMAL;

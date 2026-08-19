-- Point 4 (backend_mobile_ui) : couverts par défaut d'une recette.
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS servings INTEGER DEFAULT 4;

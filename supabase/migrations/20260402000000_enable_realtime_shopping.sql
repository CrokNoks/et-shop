-- Le front s'abonne déjà à `postgres_changes` sur `shopping_list_items` et
-- `shopping_lists` (useShoppingListItems.ts, useShoppingLists.ts) pour la
-- synchronisation temps réel entre appareils. Le code client était correct,
-- mais aucune migration n'ajoutait jamais ces deux tables à la publication
-- `supabase_realtime` : sans ça, Postgres ne diffuse aucun événement de
-- changement, quel que soit le client abonné — la synchro ne pouvait
-- fonctionner nulle part, il fallait recharger la page pour voir les
-- modifications faites sur un autre appareil.
--
-- REPLICA IDENTITY FULL : nécessaire pour que les événements UPDATE/DELETE
-- transportent la ligne complète (avant/après), ce dont Realtime a besoin
-- pour évaluer correctement la visibilité RLS de chaque changement et pour
-- que les abonnés reçoivent les colonnes utiles (ex. is_purchased,
-- purchased_by) sans avoir à refaire un fetch — même si useShoppingListItems
-- refetch systématiquement au lieu d'exploiter le payload, ça reste la
-- configuration recommandée par Supabase pour ces tables.
ALTER TABLE public.shopping_list_items REPLICA IDENTITY FULL;
ALTER TABLE public.shopping_lists REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'shopping_list_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shopping_list_items;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'shopping_lists'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shopping_lists;
  END IF;
END $$;

"use client";

import { useState, useMemo, useCallback } from "react";
import { ShoppingListItem } from "@/types";
import { StoreGroup } from "@/hooks/useShoppingListItems";

export interface AisleRef {
  key: string;
  storeId: string;
  storeName: string;
  categoryName: string;
  items: ShoppingListItem[];
}

function remainingCount(aisle: AisleRef): number {
  return aisle.items.filter((i) => !i.is_purchased).length;
}

/**
 * Sélection libre de rayon en mode magasin. `selectedKey` fait foi : une fois
 * choisi (manuellement ou par l'avancement automatique), un rayon reste
 * affiché même s'il est entièrement coché — on peut toujours le consulter
 * (cf. "On peut sauter à n'importe quel rayon, aucun ordre imposé").
 *
 * L'avancement automatique n'est PAS recalculé à chaque render : c'est un
 * événement ponctuel déclenché par l'appelant (le handler qui coche un
 * article) via `selectAisle`, au moment précis où le dernier article du
 * rayon actif vient d'être coché — pas un effet réactif sur "remaining".
 */
export function useAisleMode(storeGroups: StoreGroup[]) {
  const aisles = useMemo<AisleRef[]>(
    () =>
      storeGroups.flatMap((store) =>
        store.aisles.map((aisle) => ({
          key: `${store.id}::${aisle.categoryName}`,
          storeId: store.id,
          storeName: store.name,
          categoryName: aisle.categoryName,
          items: aisle.items,
        })),
      ),
    [storeGroups],
  );

  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // Le rayon sélectionné est toujours respecté, terminé ou non. On ne
  // retombe sur un choix par défaut (premier rayon non terminé) que si
  // aucune sélection n'a encore été faite, ou si le rayon sélectionné a
  // disparu (ex. tous ses articles supprimés).
  const activeAisle = useMemo(() => {
    if (aisles.length === 0) return null;
    const selected = selectedKey ? aisles.find((a) => a.key === selectedKey) : null;
    return selected ?? aisles.find((a) => remainingCount(a) > 0) ?? aisles[0];
  }, [aisles, selectedKey]);

  const nextAisle = useMemo(() => {
    if (!activeAisle) return null;
    const idx = aisles.findIndex((a) => a.key === activeAisle.key);
    return aisles.slice(idx + 1).find((a) => remainingCount(a) > 0) ?? null;
  }, [aisles, activeAisle]);

  const selectAisle = useCallback((key: string) => setSelectedKey(key), []);

  return {
    aisles,
    activeAisle,
    nextAisle,
    selectAisle,
  };
}

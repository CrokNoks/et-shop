"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { useSupabase } from "@/hooks/useSupabase";
import { ShoppingListItem } from "@/types";

export interface CatalogInfo {
  name: string;
  barcode?: string;
  category?: { name: string; sort_order: number };
  store?: { id: string; name: string };
  unit: string;
}

export function getCatalogInfo(item: ShoppingListItem): CatalogInfo {
  const catalog = Array.isArray(item.items_catalog)
    ? item.items_catalog[0]
    : item.items_catalog;
  return {
    name: catalog?.name || item.name || "Inconnu",
    barcode: item.barcode || catalog?.barcode,
    category: catalog?.categories,
    store: catalog?.stores,
    unit: item.unit || catalog?.unit || "pcs",
  };
}

export interface AisleGroup {
  categoryName: string;
  order: number;
  items: ShoppingListItem[];
}

export interface StoreGroup {
  id: string;
  name: string;
  aisles: AisleGroup[];
}

/**
 * Centralise le fetch, le temps réel Supabase et les mutations d'une liste de
 * courses. Extrait de `ShoppingList.tsx` pour que le bandeau (budget, progrès)
 * et le mode magasin partagent le même état sans re-fetch dupliqué.
 */
export function useShoppingListItems(
  listId: string | null,
  refreshKey?: number,
) {
  const supabase = useSupabase();
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!listId) {
      setItems([]);
      setIsLoading(false);
      return;
    }
    try {
      const data = await fetchApi(`/shopping-lists/${listId}`);
      setItems(data.shopping_list_items || []);
    } catch (error) {
      console.error("Failed to fetch items:", error);
    } finally {
      setIsLoading(false);
    }
  }, [listId]);

  useEffect(() => {
    fetchItems();
    if (!listId) return;
    const channel = supabase
      .channel(`shopping_list_${listId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shopping_list_items",
          filter: `list_id=eq.${listId}`,
        },
        () => fetchItems(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [listId, refreshKey, supabase, fetchItems]);

  const toggleCheck = useCallback(
    async (id: string, currentChecked: boolean) => {
      if (!currentChecked && "vibrate" in navigator) navigator.vibrate(50);
      const item = items.find((i) => i.id === id);
      setItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, is_purchased: !currentChecked } : i,
        ),
      );
      try {
        if (!currentChecked) {
          await fetchApi(`/shopping-lists/${listId}/items/${id}/purchase`, {
            method: "PATCH",
            body: JSON.stringify({ price: item?.price ?? 0 }),
          });
        } else {
          await fetchApi(`/shopping-lists/${listId}/items/${id}/unpurchase`, {
            method: "PATCH",
          });
        }
        fetchItems();
      } catch {
        fetchItems();
      }
    },
    [items, listId, fetchItems],
  );

  const handleQuantityUpdate = useCallback(
    async (id: string, currentQuantity: number, delta: number) => {
      const newQuantity = Math.max(1, currentQuantity + delta);
      if (newQuantity === currentQuantity) return;
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, quantity: newQuantity } : item,
        ),
      );
      try {
        await fetchApi(`/shopping-lists/items/${id}/quantity`, {
          method: "PATCH",
          body: JSON.stringify({ quantity: newQuantity }),
        });
      } catch {
        fetchItems();
      }
    },
    [fetchItems],
  );

  const handleDeleteItem = useCallback(
    async (id: string) => {
      setItems((prev) => prev.filter((item) => item.id !== id));
      try {
        await fetchApi(`/shopping-lists/items/${id}`, { method: "DELETE" });
      } catch {
        fetchItems();
      }
    },
    [fetchItems],
  );

  // Groupement magasin > rayon, rayons triés par sort_order, articles triés
  // non-cochés d'abord (cf. fix(classic_item_order)) — cohérent que ce soit
  // le mode classique ou le mode magasin (le mode magasin sépare juste les
  // cochés dans `doneItems` en plus).
  const { storeGroups, doneItems, relevantStoreIds } = useMemo(() => {
    const todo: Record<
      string,
      { name: string; aisles: Record<string, AisleGroup> }
    > = {};
    const done: ShoppingListItem[] = [];

    items.forEach((item) => {
      if (item.is_purchased) done.push(item);
      const { category, store } = getCatalogInfo(item);
      const storeName = store?.name || "Sans magasin";
      const storeId = store?.id || "none";
      const categoryName = category?.name || "Inconnu";
      const order = category?.sort_order ?? 999;

      if (!todo[storeId]) todo[storeId] = { name: storeName, aisles: {} };
      if (!todo[storeId].aisles[categoryName]) {
        todo[storeId].aisles[categoryName] = { categoryName, order, items: [] };
      }
      todo[storeId].aisles[categoryName].items.push(item);
    });

    const groups: StoreGroup[] = Object.entries(todo)
      .map(([id, storeData]) => ({
        id,
        name: storeData.name,
        aisles: Object.values(storeData.aisles)
          .sort((a, b) => a.order - b.order)
          .map((aisle) => ({
            ...aisle,
            items: [...aisle.items].sort(
              (a, b) => Number(a.is_purchased) - Number(b.is_purchased),
            ),
          })),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const uniqueStoreIds = new Set<string>();
    items.forEach((item) => {
      const { store } = getCatalogInfo(item);
      if (store?.id) uniqueStoreIds.add(store.id);
    });

    return {
      storeGroups: groups,
      doneItems: done,
      relevantStoreIds: Array.from(uniqueStoreIds),
    };
  }, [items]);

  const totalBudget = useMemo(
    () =>
      items.reduce(
        (acc, item) => acc + Number(item.price) * (item.quantity || 1),
        0,
      ),
    [items],
  );

  const checkedTotal = useMemo(
    () =>
      items
        .filter((i) => i.is_purchased)
        .reduce(
          (acc, item) => acc + Number(item.price) * (item.quantity || 1),
          0,
        ),
    [items],
  );

  const progress =
    items.length > 0 ? (doneItems.length / items.length) * 100 : 0;

  return {
    items,
    isLoading,
    fetchItems,
    toggleCheck,
    handleQuantityUpdate,
    handleDeleteItem,
    storeGroups,
    doneItems,
    relevantStoreIds,
    totalBudget,
    checkedTotal,
    progress,
  };
}

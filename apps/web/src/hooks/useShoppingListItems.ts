"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api";
import { useSupabase } from "@/hooks/useSupabase";
import { getActiveHouseholdId } from "@/hooks/useHousehold";
import {
  enqueueAction,
  getCachedList,
  removePendingAddItemAction,
  setCachedList,
  updatePendingAddItemPayload,
  type AddItemPayload,
} from "@/lib/offline/db";
import { flushPendingActions, isFlushInFlight } from "@/lib/offline/sync";
import { ShoppingListItem } from "@/types";

export interface CatalogInfo {
  name: string;
  barcode?: string;
  category?: { name: string; sort_order: number };
  store?: { id: string; name: string };
  unit: string;
  /** `sort_order` du produit catalogue — `undefined` sans correspondance catalogue (article libre ou optimiste hors ligne pas encore synchronisé). */
  sortOrder?: number;
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
    sortOrder: catalog?.sort_order,
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

function isOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

/**
 * Un article ajouté hors ligne porte un id local `offline-<uuid>` (cf.
 * `addItem` ci-dessous) jusqu'à ce que le flush le remplace par la version
 * serveur. Ce même id est aussi celui de la `pending_action` `add_item`
 * correspondante dans `pending_actions` : il sert de clé de corrélation
 * pour muter/retirer cette action en attente plutôt que d'enfiler une
 * action séparée référençant un id que le serveur ne connaît pas (cf. revue
 * Code Reviewer, correction #3 — sans ça, un `set_quantity`/`delete_item`
 * sur cet id ferait échouer indéfiniment le rejeu avec une erreur Postgres
 * 22P02, classée transitoire, jamais purgée de la file).
 */
function isOfflineOptimisticId(id: string): boolean {
  return id.startsWith("offline-");
}

/** Article fabriqué localement, en attendant que le flush le remplace par la version serveur. */
function createOptimisticItem(
  id: string,
  payload: AddItemPayload,
): ShoppingListItem {
  return {
    id,
    is_purchased: false,
    quantity: payload.quantity ?? 1,
    price: 0,
    unit: payload.unit,
    barcode: payload.barcode,
    name: payload.name,
    items_catalog: null,
  };
}

/**
 * Centralise le fetch, le temps réel Supabase et les mutations d'une liste de
 * courses. Extrait de `ShoppingList.tsx` pour que le bandeau (budget, progrès)
 * et le mode magasin partagent le même état sans re-fetch dupliqué.
 *
 * Mode hors ligne : les mutations restent optimistes sur `items`, mais
 * écrivent aussi dans le cache IndexedDB ; si le réseau est indisponible,
 * l'action est enfilée dans `pending_actions` au lieu d'appeler `fetchApi`
 * directement. `fetchItems` retombe sur le cache si le réseau échoue. Au
 * retour réseau, `flushPendingActions()` vide la file puis remplace l'état
 * par le refetch d'autorité (`onListGone` si la liste elle-même a disparu).
 */
export function useShoppingListItems(
  listId: string | null,
  refreshKey?: number,
  onListGone?: () => void,
) {
  const supabase = useSupabase();
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const onListGoneRef = useRef(onListGone);
  onListGoneRef.current = onListGone;

  const fetchItems = useCallback(async () => {
    if (!listId) {
      setItems([]);
      setIsLoading(false);
      return;
    }
    const householdId = getActiveHouseholdId();
    try {
      const data = await fetchApi(`/shopping-lists/${listId}`);
      const nextItems: ShoppingListItem[] = data.shopping_list_items || [];
      setItems(nextItems);
      if (householdId) setCachedList(householdId, listId, nextItems, data.name);
    } catch (error) {
      console.error("Failed to fetch items:", error);
      if (householdId) {
        const cached = await getCachedList(householdId, listId);
        if (cached) setItems(cached);
      }
    } finally {
      setIsLoading(false);
    }
  }, [listId]);

  useEffect(() => {
    // Un flush en cours pour cette liste applique déjà son propre refetch
    // d'autorité à la fin (`runFlush` → `setItems(result.items)` dans
    // l'effet ci-dessous) : un `fetchItems()` intercalé ici écrirait un
    // snapshot serveur partiel dans IndexedDB et ferait disparaître
    // visuellement une action encore "kept" en file, en violation du
    // protocole de synchronisation (cf. revue Code Reviewer, correction
    // bloquante #3). On l'ignore ; le refetch d'autorité du flush en cours
    // rattrape l'état (léger délai de propagation accepté).
    const householdId = getActiveHouseholdId();
    const skipInitialFetch =
      !!listId && !!householdId && isFlushInFlight(householdId, listId);
    if (!skipInitialFetch) fetchItems();
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
        () => {
          const hh = getActiveHouseholdId();
          if (hh && isFlushInFlight(hh, listId)) return;
          fetchItems();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [listId, refreshKey, supabase, fetchItems]);

  // Retour réseau (ou ouverture déjà en ligne avec une file laissée par une
  // session précédente) : vide la file puis pose le refetch d'autorité.
  useEffect(() => {
    if (!listId) return;
    const householdId = getActiveHouseholdId();
    if (!householdId) return;

    const runFlush = async () => {
      const result = await flushPendingActions(householdId, listId);
      if (result.listGone) {
        onListGoneRef.current?.();
        return;
      }
      if (result.items) setItems(result.items);
    };

    if (!isOffline()) runFlush();

    const handleOnline = () => runFlush();
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [listId]);

  const toggleCheck = useCallback(
    async (id: string, currentChecked: boolean) => {
      // Article pas encore synchronisé (son `add_item` est toujours en
      // file, hors ligne ou en attente de flush juste après un retour
      // réseau) : la seule `pending_action` qui le concerne est cet
      // `add_item`, et `AddItemPayload` n'a pas de champ "purchased" (le
      // backend ne l'accepte pas à la création). Vérifié indépendamment de
      // `isOffline()` — sinon un tap dans la fenêtre entre la reconnexion
      // et la fin du flush enverrait `PATCH .../offline-<uuid>/...` à
      // l'API (id non-UUID, 500) — cf. revue Code Reviewer, avertissement
      // NP-2. On refuse explicitement l'action et on informe l'utilisateur
      // plutôt que d'appliquer un état optimiste qui disparaîtrait
      // silencieusement au refetch d'autorité qui suit la synchro de
      // l'ajout (avertissement E).
      if (isOfflineOptimisticId(id)) {
        toast.info(
          "Cet article sera synchronisé avant de pouvoir être coché",
        );
        return;
      }

      if (!currentChecked && "vibrate" in navigator) navigator.vibrate(50);
      const item = items.find((i) => i.id === id);
      const nextItems = items.map((i) =>
        i.id === id ? { ...i, is_purchased: !currentChecked } : i,
      );
      setItems(nextItems);

      const householdId = getActiveHouseholdId();
      if (householdId && listId) setCachedList(householdId, listId, nextItems);

      if (isOffline()) {
        if (householdId && listId) {
          await enqueueAction({
            id: crypto.randomUUID(),
            type: "toggle_purchase",
            householdId,
            listId,
            itemId: id,
            checked: !currentChecked,
            price: item?.price ?? 0,
            createdAt: Date.now(),
            retryCount: 0,
          });
        }
        return;
      }

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
      const nextItems = items.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item,
      );
      setItems(nextItems);

      const householdId = getActiveHouseholdId();
      if (householdId && listId) setCachedList(householdId, listId, nextItems);

      // Article encore non-synchronisé (son `add_item` est toujours en
      // file) : on mute directement le payload de cette action en attente
      // au lieu d'enfiler un `set_quantity` référençant un id local que le
      // serveur ne connaît pas — vérifié indépendamment de `isOffline()`,
      // sinon la fenêtre entre reconnexion et fin du flush enverrait cet id
      // factice à l'API (cf. revue Code Reviewer, correction #3 / NP-2).
      if (isOfflineOptimisticId(id)) {
        await updatePendingAddItemPayload(id, newQuantity);
        return;
      }

      if (isOffline()) {
        if (householdId && listId) {
          await enqueueAction({
            id: crypto.randomUUID(),
            type: "set_quantity",
            householdId,
            listId,
            itemId: id,
            quantity: newQuantity,
            createdAt: Date.now(),
            retryCount: 0,
          });
        }
        return;
      }

      try {
        await fetchApi(`/shopping-lists/items/${id}/quantity`, {
          method: "PATCH",
          body: JSON.stringify({ quantity: newQuantity }),
        });
      } catch {
        fetchItems();
      }
    },
    [items, listId, fetchItems],
  );

  const handleDeleteItem = useCallback(
    async (id: string) => {
      const nextItems = items.filter((item) => item.id !== id);
      setItems(nextItems);

      const householdId = getActiveHouseholdId();
      if (householdId && listId) setCachedList(householdId, listId, nextItems);

      // L'article n'a jamais existé côté serveur (son `add_item` est
      // toujours en file) : on retire purement et simplement cette action
      // en attente plutôt que d'enfiler un `delete_item` référençant un id
      // local inconnu du serveur — vérifié indépendamment de `isOffline()`
      // (cf. revue Code Reviewer, correction #3 / NP-2).
      if (isOfflineOptimisticId(id)) {
        await removePendingAddItemAction(id);
        return;
      }

      if (isOffline()) {
        if (householdId && listId) {
          await enqueueAction({
            id: crypto.randomUUID(),
            type: "delete_item",
            householdId,
            listId,
            itemId: id,
            createdAt: Date.now(),
            retryCount: 0,
          });
        }
        return;
      }

      try {
        await fetchApi(`/shopping-lists/items/${id}`, { method: "DELETE" });
      } catch {
        fetchItems();
      }
    },
    [items, listId, fetchItems],
  );

  const addItem = useCallback(
    async (payload: AddItemPayload) => {
      if (!listId) return;
      const householdId = getActiveHouseholdId();

      if (isOffline()) {
        const optimisticId = `offline-${crypto.randomUUID()}`;
        const nextItems = [
          ...items,
          createOptimisticItem(optimisticId, payload),
        ];
        setItems(nextItems);
        if (householdId) {
          // Attendu avant l'enfilement : `HopInput` déclenche `onItemAdded()`
          // juste après le retour de cette fonction, qui relance `fetchItems()`
          // en repli cache — sans ce `await`, l'écriture du cache pouvait
          // courir contre cette lecture concurrente (cf. revue Code Reviewer,
          // avertissement J).
          await setCachedList(householdId, listId, nextItems);
          // L'id de la `pending_action` est le même que l'id optimiste de
          // l'article (`offline-<uuid>`) : c'est la clé de corrélation qui
          // permet à `toggleCheck`/`handleQuantityUpdate`/`handleDeleteItem`
          // de retrouver et muter/retirer cette action tant que l'article
          // n'a pas encore été synchronisé (cf. `isOfflineOptimisticId`).
          await enqueueAction({
            id: optimisticId,
            type: "add_item",
            householdId,
            listId,
            payload,
            createdAt: Date.now(),
            retryCount: 0,
          });
        }
        return;
      }

      await fetchApi(`/shopping-lists/${listId}/items`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      fetchItems();
    },
    [items, listId, fetchItems],
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
            // Tri primaire : non-cochés d'abord (cf. fix(classic_item_order)).
            // Tri secondaire : sort_order du produit catalogue au sein d'un
            // même rayon. Un article sans correspondance catalogue (ajout
            // libre, ou optimiste hors ligne pas encore synchronisé —
            // `items_catalog: null`) se trie après les articles catalogués
            // du rayon, par nom.
            items: [...aisle.items].sort((a, b) => {
              const purchasedDiff =
                Number(a.is_purchased) - Number(b.is_purchased);
              if (purchasedDiff !== 0) return purchasedDiff;

              const aInfo = getCatalogInfo(a);
              const bInfo = getCatalogInfo(b);
              const aHasSortOrder = aInfo.sortOrder !== undefined;
              const bHasSortOrder = bInfo.sortOrder !== undefined;

              if (aHasSortOrder && bHasSortOrder) {
                return aInfo.sortOrder! - bInfo.sortOrder!;
              }
              if (aHasSortOrder !== bHasSortOrder) {
                return aHasSortOrder ? -1 : 1;
              }
              return aInfo.name.localeCompare(bInfo.name);
            }),
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
    addItem,
    storeGroups,
    doneItems,
    relevantStoreIds,
    totalBudget,
    checkedTotal,
    progress,
  };
}

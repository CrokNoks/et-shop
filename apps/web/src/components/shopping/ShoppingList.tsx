"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  CheckCircleIcon,
  ShoppingCartIcon,
  TagIcon,
  ChevronRightIcon,
  MinusIcon,
  PlusIcon,
  TrashIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/outline";
import { useLoyaltyCards } from "../../hooks/useLoyaltyCards";
import { useStoreMap } from "../../hooks/useStores";
import { LoyaltyCardOverlay } from "../loyalty/LoyaltyCardOverlay";
import { LoyaltyCardFrontend } from "../../types/loyalty-card";
import { CreditCardIcon } from "@heroicons/react/24/outline";

import { CheckCircleIcon as CheckCircleSolidIcon } from "@heroicons/react/24/solid";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchApi } from "@/lib/api";
import { useSupabase } from "@/hooks/useSupabase";
import { toast } from "sonner";
import { ShoppingListItem } from "@/types";

interface ShoppingListProps {
  listId: string;
  storeId?: string;
  refreshKey?: number;
}

export const ShoppingList: React.FC<ShoppingListProps> = ({
  listId,
  refreshKey,
}) => {
  const supabase = useSupabase();
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [isShoppingMode, setIsShoppingMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [wakeLock, setWakeLock] = useState<{ release: () => void } | null>(
    null,
  );

  // Edit Item Sheet State
  const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editBarcode, setEditBarcode] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchItems = useCallback(async () => {
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

  useEffect(() => {
    const requestWakeLock = async () => {
      if ("wakeLock" in navigator && isShoppingMode) {
        try {
          const lock = await (
            navigator as Navigator & {
              wakeLock: {
                request: (type: string) => Promise<{ release: () => void }>;
              };
            }
          ).wakeLock.request("screen");
          setWakeLock(lock);
        } catch (err: unknown) {
          const e = err as { name?: string; message?: string };
          console.error(`${e?.name}, ${e?.message}`);
        }
      }
    };
    if (isShoppingMode) requestWakeLock();
    else if (wakeLock) {
      wakeLock.release();
      setWakeLock(null);
    }
    return () => {
      if (wakeLock) wakeLock.release();
    };
  }, [isShoppingMode, wakeLock]);

  const getCatalogInfo = (item: ShoppingListItem) => {
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
  };

  const toggleCheck = async (id: string, currentChecked: boolean) => {
    if (!currentChecked && "vibrate" in navigator) navigator.vibrate(50);
    try {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_purchased: !currentChecked } : item,
        ),
      );
      if (!currentChecked) {
        const item = items.find((i) => i.id === id);
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
  };

  const handleDeleteItem = async (id: string) => {
    try {
      setItems((prev) => prev.filter((item) => item.id !== id));
      await fetchApi(`/shopping-lists/items/${id}`, { method: "DELETE" });
    } catch {
      fetchItems();
    }
  };

  const openEditSheet = (item: ShoppingListItem) => {
    const { unit, barcode } = getCatalogInfo(item);
    setEditingItem(item);
    setEditPrice(item.price.toString());
    setEditUnit(unit);
    setEditBarcode(barcode || "");
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || isUpdating) return;

    setIsUpdating(true);
    try {
      const price = parseFloat(editPrice) || 0;
      await Promise.all([
        fetchApi(`/shopping-lists/items/${editingItem.id}/price`, {
          method: "PATCH",
          body: JSON.stringify({ price }),
        }),
        fetchApi(`/shopping-lists/items/${editingItem.id}/unit`, {
          method: "PATCH",
          body: JSON.stringify({ unit: editUnit }),
        }),
        fetchApi(`/shopping-lists/items/${editingItem.id}/barcode`, {
          method: "PATCH",
          body: JSON.stringify({ barcode: editBarcode }),
        }),
      ]);
      toast.success("Article mis à jour !");
      setEditingItem(null);
      fetchItems();
    } catch {
      toast.error("Erreur lors de la mise à jour.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuantityUpdate = async (
    id: string,
    currentQuantity: number,
    delta: number,
  ) => {
    const newQuantity = Math.max(1, currentQuantity + delta);
    if (newQuantity === currentQuantity) return;
    try {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, quantity: newQuantity } : item,
        ),
      );
      await fetchApi(`/shopping-lists/items/${id}/quantity`, {
        method: "PATCH",
        body: JSON.stringify({ quantity: newQuantity }),
      });
    } catch {
      fetchItems();
    }
  };

  const { todoGroups, doneItems, relevantStoreIds } = useMemo(() => {
    const todo: Record<
      string,
      {
        name: string;
        categories: Record<
          string,
          { items: ShoppingListItem[]; order: number }
        >;
      }
    > = {};
    const done: ShoppingListItem[] = [];

    items.forEach((item) => {
      if (isShoppingMode && item.is_purchased) done.push(item);
      else {
        const { category, store } = getCatalogInfo(item);
        const storeName = store?.name || "Sans magasin";
        const storeId = store?.id || "none";
        const categoryName = category?.name || "Inconnu";

        const order = category?.sort_order ?? 999;

        if (!todo[storeId]) {
          todo[storeId] = { name: storeName, categories: {} };
        }

        if (!todo[storeId].categories[categoryName]) {
          todo[storeId].categories[categoryName] = { items: [], order };
        }
        todo[storeId].categories[categoryName].items.push(item);
      }
    });

    // Trier les magasins (alphabétique) puis les rayons par ordre
    // En mode classique, trier les articles dans chaque rayon : non-cochés en premier, cochés en dernier
    const sortedGroups = Object.entries(todo)
      .map(([id, storeData]) => ({
        id,
        name: storeData.name,
        categories: Object.entries(storeData.categories)
          .sort((a, b) => a[1].order - b[1].order)
          .map(([categoryName, categoryData]) => [
            categoryName,
            {
              ...categoryData,
              items: [...categoryData.items].sort(
                (a, b) => Number(a.is_purchased) - Number(b.is_purchased),
              ),
            },
          ] as [string, { items: ShoppingListItem[]; order: number }]),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const uniqueStoreIds = new Set<string>();
    items.forEach((item) => {
      const { store } = getCatalogInfo(item);
      if (store?.id) {
        uniqueStoreIds.add(store.id);
      }
    });

    return {
      todoGroups: sortedGroups,
      doneItems: done,
      relevantStoreIds: Array.from(uniqueStoreIds),
    };
  }, [items, isShoppingMode]);

  const { data: relevantLoyaltyCards } = useLoyaltyCards(relevantStoreIds);
  const storeMap = useStoreMap();
  const [activeCard, setActiveCard] = useState<LoyaltyCardFrontend | null>(null);

  // Map storeId → carte de fidélité pour accès rapide
  const loyaltyCardByStore = useMemo(() => {
    const map: Record<string, LoyaltyCardFrontend> = {};
    relevantLoyaltyCards?.forEach((c) => { map[c.storeId] = c; });
    return map;
  }, [relevantLoyaltyCards]);

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
    items.length > 0
      ? (items.filter((i) => i.is_purchased).length / items.length) * 100
      : 0;

  if (isLoading && items.length === 0)
    return (
      <div className="p-8 text-center text-[var(--color-brand)] animate-pulse">
        Chargement...
      </div>
    );

  return (
    <div
      className={`w-full max-w-2xl transition-all duration-300 ${isShoppingMode ? "fixed inset-0 bg-white z-[100] p-6 pb-32 overflow-y-auto" : "mt-8"}`}
    >
      <div className="flex items-center justify-between mb-6 text-[var(--color-brand)]">
        <h2 className={`font-black ${isShoppingMode ? "text-3xl" : "text-xl"}`}>
          {isShoppingMode ? "🛒 En magasin" : "Ma liste active"}
        </h2>
        <button
          onClick={() => setIsShoppingMode(!isShoppingMode)}
          data-cy="shopping-mode-toggle"
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all shadow-md ${
            isShoppingMode
              ? "bg-[var(--color-brand)] text-white"
              : "bg-gray-100 text-[var(--color-brand)] hover:bg-gray-200"
          }`}
        >
          {isShoppingMode ? (
            <ChevronRightIcon className="w-5 h-5 rotate-180" />
          ) : (
            <ShoppingCartIcon className="w-5 h-5" />
          )}
          {isShoppingMode ? "Mode classique" : "Mode Shopping"}
        </button>
      </div>

      {isShoppingMode && (
        <div className="w-full h-3 bg-gray-100 rounded-full mb-8 overflow-hidden border border-gray-50">
          <div
            data-cy="shopping-progress-bar"
            className="h-full bg-[var(--color-accent)] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="bg-gray-50 rounded-2xl p-4 mb-8 flex items-center justify-between border border-gray-100 text-[var(--color-brand)]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--color-accent)]/10 rounded-xl">
            <TagIcon className="w-6 h-6 text-[var(--color-accent)]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
              Total estimé
            </p>
            <p className="text-xl font-black">{totalBudget.toFixed(2)} €</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
            Dans le panier
          </p>
          <p className="text-lg font-bold text-[var(--color-accent)]">
            {checkedTotal.toFixed(2)} €
          </p>
        </div>
      </div>

      {activeCard && (
        <LoyaltyCardOverlay
          card={activeCard}
          storeName={storeMap[activeCard.storeId] ?? activeCard.storeId}
          onClose={() => setActiveCard(null)}
        />
      )}

      <div className="space-y-12 text-[var(--color-brand)]">
        {items.length === 0 ? (
          <div className="text-center py-12 opacity-40 italic">
            Votre liste est vide. Ajoutez un article ! 🚀
          </div>
        ) : (
          todoGroups.map((storeGroup) => (
            <div key={storeGroup.id} className="space-y-8">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)]">
                  <TagIcon className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black flex-1">{storeGroup.name}</h3>
                {loyaltyCardByStore[storeGroup.id] && (
                  <button
                    onClick={() => setActiveCard(loyaltyCardByStore[storeGroup.id])}
                    className="p-2 rounded-2xl bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 text-[#FF6B35] transition-colors"
                    title="Afficher la carte de fidélité"
                  >
                    <CreditCardIcon className="w-6 h-6" />
                  </button>
                )}
              </div>

              <div className="space-y-8 pl-4 border-l-2 border-gray-100">
                {storeGroup.categories.map(
                  ([category, { items: categoryItems }]) => (
                    <div key={category} className="space-y-3 text-left">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-2">
                        <span className="w-4 h-[2px] bg-[var(--color-accent)]" />
                        {category}
                      </h4>
                      <div className="space-y-2">
                        {categoryItems.map((item) => {
                          const { name, unit } = getCatalogInfo(item);
                          return (
                            <div
                              key={item.id}
                              data-cy={`item-${item.id}`}
                              onClick={() =>
                                toggleCheck(item.id, item.is_purchased)
                              }
                              className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer group/item ${isShoppingMode ? "p-5 sm:p-6 bg-white border-gray-100 shadow-sm hover:border-[var(--color-accent)]" : "bg-white border-gray-100"}`}
                            >
                              <button className="flex-shrink-0">
                                {item.is_purchased ? (
                                  <CheckCircleSolidIcon className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--color-accent)]" />
                                ) : (
                                  <CheckCircleIcon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-200 group-hover/item:text-[var(--color-accent)]/30 transition-colors" />
                                )}
                              </button>
                              <div className="flex-1 min-w-0 flex flex-col gap-0.5 text-left">
                                <p
                                  className={`font-bold truncate ${isShoppingMode ? "text-xl sm:text-2xl" : "text-sm sm:text-base"} ${item.is_purchased ? "line-through text-gray-400" : ""}`}
                                >
                                  {name}
                                </p>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="flex items-center gap-1 bg-gray-100/50 px-1.5 py-0.5 rounded-lg border border-gray-100"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      onClick={() =>
                                        handleQuantityUpdate(
                                          item.id,
                                          item.quantity,
                                          -1,
                                        )
                                      }
                                      data-cy={`item-${item.id}-minus`}
                                      className="p-0.5 sm:p-1 hover:bg-white rounded-md text-gray-400 transition-colors"
                                    >
                                      <MinusIcon className="w-3 h-3" />
                                    </button>
                                    <span
                                      data-cy={`item-${item.id}-qty`}
                                      className={`text-xs sm:text-sm font-black min-w-[16px] sm:min-w-[20px] text-center ${isShoppingMode ? "text-base sm:text-lg" : ""}`}
                                    >
                                      {item.quantity}
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleQuantityUpdate(
                                          item.id,
                                          item.quantity,
                                          1,
                                        )
                                      }
                                      data-cy={`item-${item.id}-plus`}
                                      className="p-0.5 sm:p-1 hover:bg-white rounded-md text-gray-400 transition-colors"
                                    >
                                      <PlusIcon className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditSheet(item);
                                    }}
                                    data-cy={`item-${item.id}-edit`}
                                    className="text-[9px] sm:text-[10px] font-black uppercase text-gray-400 tracking-wider hover:text-[var(--color-accent)] transition-colors"
                                  >
                                    {unit}
                                  </button>
                                </div>
                              </div>
                              <div
                                className="flex items-center gap-2 sm:gap-4"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {!isShoppingMode && (
                                  <button
                                    onClick={() => handleDeleteItem(item.id)}
                                    data-cy={`item-${item.id}-delete`}
                                    className="p-1.5 sm:p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-100 sm:opacity-0 sm:group-hover/item:opacity-100"
                                  >
                                    <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                  </button>
                                )}
                                <div
                                  onClick={() => openEditSheet(item)}
                                  className={`text-base sm:text-xl font-bold whitespace-nowrap ${item.is_purchased ? "text-gray-300" : "text-[var(--color-accent)] bg-[var(--color-accent)]/5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg border border-[var(--color-accent)]/10"}`}
                                >
                                  {(
                                    Number(item.price) * (item.quantity || 1)
                                  ).toFixed(2)}{" "}
                                  €
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isShoppingMode && doneItems.length > 0 && (
        <div data-cy="shopping-done-section" className="mt-12 pt-12 border-t border-dashed border-gray-200">
          <h3 className="text-xs font-black text-gray-300 uppercase tracking-widest px-2 mb-4 flex items-center gap-2">
            <ArchiveBoxIcon className="w-4 h-4" />
            Déjà dans le panier ({doneItems.length})
          </h3>
          <div className="space-y-2 opacity-50">
            {doneItems.map((item) => {
              const { name } = getCatalogInfo(item);
              return (
                <div
                  key={item.id}
                  data-cy={`shopping-done-item-${item.id}`}
                  onClick={() => toggleCheck(item.id, item.is_purchased)}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-transparent cursor-pointer"
                >
                  <CheckCircleSolidIcon className="w-8 h-8 text-[var(--color-accent)]" />
                  <p className="flex-1 font-bold text-[var(--color-brand)] line-through decoration-2">
                    {name}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isShoppingMode && (
        <div className="fixed bottom-6 left-6 right-6 flex gap-4">
          <button
            onClick={() => setIsShoppingMode(false)}
            data-cy="shopping-finish"
            className="flex-1 bg-[var(--color-brand)] text-white py-5 rounded-2xl font-black text-xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
          >
            Terminer
          </button>
        </div>
      )}

      {/* Edit Item Sheet */}
      <Sheet
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
      >
        <SheetContent
          side="right"
          className="w-screen sm:max-w-[450px] p-10 text-[var(--color-brand)]"
        >
          <SheetHeader className="mb-10 text-left">
            <SheetTitle className="text-3xl font-black">
              Modifier l&apos;article
            </SheetTitle>
            <SheetDescription className="text-base text-gray-500 mt-2">
              {editingItem && getCatalogInfo(editingItem).name}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleUpdateItem} className="space-y-8">
            <div className="space-y-2">
              <Label
                htmlFor="item-price"
                className="text-xs font-black text-gray-400 uppercase tracking-widest"
              >
                Prix unitaire (€)
              </Label>
              <Input
                id="item-price"
                data-cy="edit-price"
                type="number"
                step="0.01"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                className="text-lg font-bold border-gray-200 focus-visible:ring-[var(--color-accent)]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="item-unit"
                className="text-xs font-black text-gray-400 uppercase tracking-widest"
              >
                Unité
              </Label>
              <Input
                id="item-unit"
                data-cy="edit-unit"
                value={editUnit}
                onChange={(e) => setEditUnit(e.target.value)}
                className="text-lg font-bold border-gray-200 focus-visible:ring-[var(--color-accent)]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="item-barcode"
                className="text-xs font-black text-gray-400 uppercase tracking-widest"
              >
                Code-barres
              </Label>
              <Input
                id="item-barcode"
                value={editBarcode}
                onChange={(e) => setEditBarcode(e.target.value)}
                placeholder="Scanner ou saisir..."
                className="text-lg font-bold border-gray-200 focus-visible:ring-[var(--color-accent)] font-mono"
              />
            </div>

            <SheetFooter className="mt-8 pt-4 sm:justify-start">
              <Button
                type="submit"
                data-cy="edit-submit"
                disabled={isUpdating}
                className="w-full bg-[var(--color-accent)] hover:bg-[#e55a2b] text-white font-bold text-lg py-6 rounded-xl"
              >
                {isUpdating ? "Mise à jour..." : "Enregistrer"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
};

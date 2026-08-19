"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircleIcon,
  ChevronRightIcon,
  MinusIcon,
  PlusIcon,
  TrashIcon,
  ArchiveBoxIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolidIcon } from "@heroicons/react/24/solid";
import { useLoyaltyCards } from "../../hooks/useLoyaltyCards";
import { useStoreMap } from "../../hooks/useStores";
import { LoyaltyCardOverlay } from "../loyalty/LoyaltyCardOverlay";
import { LoyaltyCardFrontend } from "../../types/loyalty-card";
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
import { toast } from "sonner";
import { ShoppingListItem } from "@/types";
import { getCatalogInfo, StoreGroup } from "@/hooks/useShoppingListItems";
import { useAisleMode } from "@/hooks/useAisleMode";
import { AisleModeHeader } from "./AisleModeHeader";
import { AisleSelector } from "./AisleSelector";

interface ShoppingListProps {
  isLoading: boolean;
  storeGroups: StoreGroup[];
  checkedTotal: number;
  toggleCheck: (id: string, currentChecked: boolean) => void;
  handleQuantityUpdate: (
    id: string,
    currentQuantity: number,
    delta: number,
  ) => void;
  handleDeleteItem: (id: string) => void;
  refetch: () => void;
}

export const ShoppingList: React.FC<ShoppingListProps> = ({
  isLoading,
  storeGroups,
  checkedTotal,
  toggleCheck,
  handleQuantityUpdate,
  handleDeleteItem,
  refetch,
}) => {
  const [isShoppingMode, setIsShoppingMode] = useState(false);
  const [wakeLock, setWakeLock] = useState<{ release: () => void } | null>(
    null,
  );

  // Edit Item Sheet State — sheet minimaliste conservé tel quel ce cycle ;
  // le passage à l'écran 4i complet (unité en texte libre + raccourcis) est
  // prévu au cycle "Ajout / édition d'article".
  const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editBarcode, setEditBarcode] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const { aisles, activeAisle, nextAisle, selectAisle } =
    useAisleMode(storeGroups);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isShoppingMode]);

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
      refetch();
    } catch {
      toast.error("Erreur lors de la mise à jour.");
    } finally {
      setIsUpdating(false);
    }
  };

  const relevantStoreIds = storeGroups
    .map((g) => g.id)
    .filter((id) => id !== "none");
  const { data: relevantLoyaltyCards } = useLoyaltyCards(relevantStoreIds);
  const storeMap = useStoreMap();
  const [activeCard, setActiveCard] = useState<LoyaltyCardFrontend | null>(
    null,
  );

  const loyaltyCardByStore: Record<string, LoyaltyCardFrontend> = {};
  relevantLoyaltyCards?.forEach((c) => {
    loyaltyCardByStore[c.storeId] = c;
  });

  const totalItems = storeGroups.reduce(
    (acc, g) => acc + g.aisles.reduce((a, aisle) => a + aisle.items.length, 0),
    0,
  );

  const editSheet = (
    <Sheet
      open={!!editingItem}
      onOpenChange={(open) => !open && setEditingItem(null)}
    >
      <SheetContent
        side="right"
        className="w-screen sm:max-w-[450px] p-10 text-[var(--es-ink)]"
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
              className="text-lg font-bold border-gray-200 focus-visible:ring-[#FF6B35]"
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
              className="text-lg font-bold border-gray-200 focus-visible:ring-[#FF6B35]"
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
              className="text-lg font-bold border-gray-200 focus-visible:ring-[#FF6B35] font-mono"
            />
          </div>
          <SheetFooter className="mt-8 pt-4 sm:justify-start">
            <Button
              type="submit"
              data-cy="edit-submit"
              disabled={isUpdating}
              className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-bold text-lg py-6 rounded-xl"
            >
              {isUpdating ? "Mise à jour..." : "Enregistrer"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );

  if (isLoading && totalItems === 0) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-[58px] rounded-2xl bg-[var(--es-surface)] border border-[var(--es-hairline)] flex items-center gap-3 px-3.5 animate-pulse"
          >
            <div className="w-[26px] h-[26px] rounded-full bg-[var(--es-skeleton)]" />
            <div className="flex-1 flex flex-col gap-1.5">
              <div className="h-[11px] w-2/3 rounded bg-[var(--es-skeleton)]" />
              <div className="h-[9px] w-1/3 rounded bg-[var(--es-skeleton)]" />
            </div>
            <div className="w-11 h-3 rounded bg-[var(--es-skeleton)]" />
          </div>
        ))}
      </div>
    );
  }

  if (isShoppingMode) {
    const activeCardForAisle = activeAisle
      ? loyaltyCardByStore[activeAisle.storeId]
      : undefined;
    return (
      <div className="fixed inset-0 z-[100] bg-[var(--es-shopping-bg)] flex flex-col">
        {activeAisle ? (
          <AisleModeHeader
            storeName={activeAisle.storeName}
            aisleName={activeAisle.categoryName}
            checkedCount={
              activeAisle.items.filter((i) => i.is_purchased).length
            }
            totalCount={activeAisle.items.length}
            checkedTotal={checkedTotal}
            hasLoyaltyCard={!!activeCardForAisle}
            onShowLoyaltyCard={() =>
              activeCardForAisle && setActiveCard(activeCardForAisle)
            }
          />
        ) : (
          <div className="p-6 text-center">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#c8471c] dark:text-[#ffb694]">
              En magasin
            </span>
            <p className="mt-2 text-[var(--es-secondary)]">
              Tous les rayons sont terminés 🎉
            </p>
          </div>
        )}

        <div className="px-3.5">
          <AisleSelector
            aisles={aisles}
            activeKey={activeAisle?.key ?? null}
            onSelect={selectAisle}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-3.5 pt-3 pb-32 space-y-2">
          {(() => {
            if (!activeAisle) return null;
            const unpurchased = activeAisle.items.filter((i) => !i.is_purchased);
            return unpurchased.map((item) => {
              const { name } = getCatalogInfo(item);
              const isLastOfAisle = unpurchased.length === 1;
              return (
                <div
                  key={item.id}
                  data-cy={`item-${item.id}`}
                  onClick={() => {
                    toggleCheck(item.id, item.is_purchased);
                    // Avancement automatique : uniquement au moment où le
                    // dernier article restant du rayon actif vient d'être
                    // coché — pas un effet recalculé sur "remaining", donc
                    // sélectionner un rayon déjà terminé reste possible.
                    if (isLastOfAisle && nextAisle) {
                      selectAisle(nextAisle.key);
                    }
                  }}
                  className="h-[76px] flex items-center gap-3 px-4 rounded-2xl bg-[var(--es-shopping-card)] border border-[var(--es-hairline)] shadow-sm cursor-pointer"
                >
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <p className="text-[21px] font-semibold truncate text-[var(--es-ink)]">
                      {name}
                    </p>
                    <div
                      className="flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() =>
                          handleQuantityUpdate(item.id, item.quantity, -1)
                        }
                        data-cy={`item-${item.id}-minus`}
                        className="p-1 rounded-md text-[var(--es-secondary)]"
                      >
                        <MinusIcon className="w-3.5 h-3.5" />
                      </button>
                      <span
                        data-cy={`item-${item.id}-qty`}
                        className="text-sm font-semibold tabular-nums min-w-[20px] text-center"
                      >
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          handleQuantityUpdate(item.id, item.quantity, 1)
                        }
                        data-cy={`item-${item.id}-plus`}
                        className="p-1 rounded-md text-[var(--es-secondary)]"
                      >
                        <PlusIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <button
                    className="shrink-0"
                    data-cy={`item-${item.id}-check`}
                  >
                    <CheckCircleIcon className="w-11 h-11 text-[var(--es-ring)]" />
                  </button>
                </div>
              );
            });
          })()}

          {activeAisle && activeAisle.items.some((i) => i.is_purchased) && (
            <div data-cy="shopping-done-section" className="pt-6 space-y-2">
              <h3 className="text-xs font-semibold text-[var(--es-tertiary)] uppercase tracking-widest px-2 flex items-center gap-2">
                <ArchiveBoxIcon className="w-4 h-4" /> Déjà dans le panier
              </h3>
              {activeAisle.items
                .filter((i) => i.is_purchased)
                .map((item) => {
                  const { name } = getCatalogInfo(item);
                  return (
                    <div
                      key={item.id}
                      data-cy={`shopping-done-item-${item.id}`}
                      onClick={() => toggleCheck(item.id, item.is_purchased)}
                      className="h-[60px] flex items-center gap-3 px-4 rounded-2xl bg-black/[.04] dark:bg-white/[.04] cursor-pointer"
                    >
                      <CheckCircleSolidIcon className="w-8 h-8 text-[#FF6B35] shrink-0" />
                      <p className="text-[17px] font-semibold line-through text-[var(--es-secondary)] truncate">
                        {name}
                      </p>
                    </div>
                  );
                })}
            </div>
          )}

          {nextAisle && (
            <div className="mt-4 p-3 rounded-xl border border-dashed border-[var(--es-hairline)] text-[12.5px] text-[var(--es-secondary)] flex items-center justify-between">
              <span>
                Rayon suivant → {nextAisle.categoryName} ·{" "}
                {nextAisle.items.length} articles
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--es-tertiary)]">
                auto
              </span>
            </div>
          )}
        </div>

        {activeCard && (
          <LoyaltyCardOverlay
            card={activeCard}
            storeName={storeMap[activeCard.storeId] ?? activeCard.storeId}
            onClose={() => setActiveCard(null)}
          />
        )}

        <div className="fixed bottom-6 left-4 right-4 flex gap-3">
          <button
            className="w-[52px] h-[52px] rounded-2xl border border-[var(--es-hairline)] bg-[var(--es-shopping-card)] flex items-center justify-center text-[var(--es-secondary)] shrink-0"
            title="Scanner un code-barres"
          >
            <QrCodeIcon className="w-6 h-6" />
          </button>
          <button
            onClick={() => setIsShoppingMode(false)}
            data-cy="shopping-finish"
            className="flex-1 h-[52px] rounded-2xl border border-[#FF6B35] bg-[#FF6B35]/16 dark:bg-[#FF6B35]/8 text-[#c8471c] dark:text-[#ffb694] font-semibold text-[15.5px]"
          >
            Terminer les courses
          </button>
        </div>
        {editSheet}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      <button
        onClick={() => setIsShoppingMode(true)}
        data-cy="shopping-mode-toggle"
        className="h-[46px] rounded-2xl border border-[#FF6B35] bg-[#FF6B35]/6 hover:bg-[#FF6B35]/14 active:bg-[#FF6B35]/22 text-[#c8471c] dark:text-[#ffb694] font-semibold text-sm transition-colors"
      >
        Démarrer le mode magasin
      </button>

      {totalItems === 0 ? (
        <div className="text-center py-12 opacity-50 italic text-[var(--es-secondary)]">
          Votre liste est vide. Ajoutez un article !
        </div>
      ) : (
        storeGroups.map((storeGroup) => (
          <div key={storeGroup.id} className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5 px-1">
              <span className="w-[3px] h-[22px] rounded-full bg-[#FF6B35]" />
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-[var(--es-ink)] truncate">
                  {storeGroup.name}
                </h3>
                <p className="text-[11.5px] text-[var(--es-tertiary)]">
                  {storeGroup.aisles.length} rayons ·{" "}
                  {storeGroup.aisles.reduce((a, ai) => a + ai.items.length, 0)}{" "}
                  articles
                </p>
              </div>
              {loyaltyCardByStore[storeGroup.id] && (
                <button
                  onClick={() =>
                    setActiveCard(loyaltyCardByStore[storeGroup.id])
                  }
                  className="p-2 rounded-xl bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 text-[#c8471c] dark:text-[#ffb694] transition-colors"
                  title="Afficher la carte de fidélité"
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3 pl-3 border-l border-[var(--es-hairline)]">
              {storeGroup.aisles.map((aisle) => (
                <div key={aisle.categoryName} className="flex flex-col gap-1.5">
                  <h4 className="flex items-center gap-2 px-1 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[var(--es-secondary)]">
                    <span className="w-3.5 h-[1.5px] bg-[#FF6B35]" />
                    {aisle.categoryName}
                  </h4>
                  <div className="rounded-2xl bg-[var(--es-surface)] border border-[var(--es-hairline)] overflow-hidden">
                    {aisle.items.map((item, idx) => {
                      const { name, unit } = getCatalogInfo(item);
                      return (
                        <div
                          key={item.id}
                          data-cy={`item-${item.id}`}
                          onClick={() =>
                            toggleCheck(item.id, item.is_purchased)
                          }
                          className={`h-[58px] flex items-center gap-3 px-3.5 cursor-pointer ${
                            idx > 0
                              ? "border-t border-[var(--es-hairline)]"
                              : ""
                          } ${item.is_purchased ? "bg-black/[.015] dark:bg-white/[.03]" : ""}`}
                        >
                          <button
                            className="shrink-0"
                            data-cy={`item-${item.id}-check`}
                          >
                            {item.is_purchased ? (
                              <CheckCircleSolidIcon className="w-[26px] h-[26px] text-[#FF6B35]" />
                            ) : (
                              <div className="w-[26px] h-[26px] rounded-full border-2 border-[var(--es-ring)]" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                            <p
                              className={`text-[15px] font-medium truncate ${
                                item.is_purchased
                                  ? "line-through text-[var(--es-tertiary)]"
                                  : "text-[var(--es-ink)]"
                              }`}
                            >
                              {name}
                            </p>
                            {item.is_purchased ? (
                              <p className="text-[11.5px] text-[var(--es-tertiary)]">
                                Coché · {formatRelativeTime(item.updated_at)}
                              </p>
                            ) : (
                              <div
                                className="flex items-center gap-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center gap-1 border border-[var(--es-hairline)] rounded-lg px-1">
                                  <button
                                    onClick={() =>
                                      handleQuantityUpdate(
                                        item.id,
                                        item.quantity,
                                        -1,
                                      )
                                    }
                                    data-cy={`item-${item.id}-minus`}
                                    className="p-1 rounded-md text-[var(--es-tertiary)]"
                                  >
                                    <MinusIcon className="w-3 h-3" />
                                  </button>
                                  <span
                                    data-cy={`item-${item.id}-qty`}
                                    className="text-[13.5px] font-semibold tabular-nums min-w-[16px] text-center"
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
                                    className="p-1 rounded-md text-[var(--es-tertiary)]"
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
                                  className="text-[10px] font-semibold uppercase text-[var(--es-tertiary)] tracking-wider"
                                >
                                  {unit}
                                </button>
                              </div>
                            )}
                          </div>
                          <div
                            className="flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {!item.is_purchased && (
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                data-cy={`item-${item.id}-delete`}
                                className="p-1.5 text-[var(--es-tertiary)] hover:text-red-500 rounded-lg transition-colors"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            )}
                            <span
                              onClick={() => openEditSheet(item)}
                              className={`text-sm font-semibold tabular-nums min-w-[52px] text-right ${
                                item.is_purchased
                                  ? "text-[var(--es-secondary)]"
                                  : "text-[#c8471c] dark:text-[#ffb694]"
                              }`}
                            >
                              {(
                                Number(item.price) * (item.quantity || 1)
                              ).toFixed(2)}{" "}
                              €
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
      {editSheet}
    </div>
  );
};

function formatRelativeTime(iso?: string): string {
  if (!iso) return "à l'instant";
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  return `il y a ${hours} h`;
}

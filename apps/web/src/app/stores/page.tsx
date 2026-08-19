"use client";

import React, { useState, useEffect, useMemo } from "react";
import { TabBar } from "@/components/layout/TabBar";
import { fetchApi } from "@/lib/api";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ChevronRightIcon,
  CreditCardIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Store } from "@/types";
import Link from "next/link";
import { AddLoyaltyCardSheet } from "@/components/loyalty/AddLoyaltyCardSheet";
import { useLoyaltyCards } from "@/hooks/useLoyaltyCards";

export const dynamic = "force-dynamic";

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Store Form state
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [isStoreSheetOpen, setIsStoreSheetOpen] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Loyalty card state
  const [selectedStoreForCard, setSelectedStoreForCard] =
    useState<Store | null>(null);

  const handleOpenLoyaltyCard = (e: React.MouseEvent, store: Store) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedStoreForCard(store);
  };

  // Un seul appel groupé (pas un par magasin) pour savoir lesquels ont une
  // carte de fidélité, pour l'étiquette de l'écran 4d.
  const { data: allCards } = useLoyaltyCards(stores.map((s) => s.id));
  const storesWithLoyalty = useMemo(
    () => new Set((allCards ?? []).map((c) => c.storeId)),
    [allCards],
  );

  const fetchData = async () => {
    try {
      const storesData = await fetchApi("/stores");
      setStores(storesData || []);
    } catch (error) {
      console.error("Failed to fetch stores:", error);
      toast.error("Erreur lors du chargement des magasins.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateStore = () => {
    setEditingStore(null);
    setStoreName("");
    setIsStoreSheetOpen(true);
  };

  const handleOpenEditStore = (e: React.MouseEvent, store: Store) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingStore(store);
    setStoreName(store.name);
    setIsStoreSheetOpen(true);
  };

  const handleStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingStore) {
        await fetchApi(`/stores/${editingStore.id}`, {
          method: "PATCH",
          body: JSON.stringify({ name: storeName }),
        });
        toast.success("Magasin mis à jour !");
      } else {
        await fetchApi("/stores", {
          method: "POST",
          body: JSON.stringify({ name: storeName }),
        });
        toast.success("Magasin créé !");
      }
      fetchData();
      setIsStoreSheetOpen(false);
    } catch {
      toast.error("Erreur lors de l'enregistrement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStoreDelete = async (
    e: React.MouseEvent,
    id: string,
    name: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Supprimer le magasin "${name}" ?`)) return;
    try {
      await fetchApi(`/stores/${id}`, { method: "DELETE" });
      setStores(stores.filter((s) => s.id !== id));
      toast.success("Magasin supprimé !");
    } catch {
      toast.error("Erreur lors de la suppression.");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--es-bg)] pb-24 text-[var(--es-ink)]">
      <div className="flex items-center justify-between px-3.5 pt-6 pb-4">
        <h1 className="text-[24px] font-semibold">Mes magasins</h1>
        <button
          onClick={handleOpenCreateStore}
          data-cy="stores-new"
          className="flex h-9 items-center gap-1 rounded-[10px] border border-[#FF6B35] px-3 text-[13px] font-semibold text-[#c8471c]"
        >
          <PlusIcon className="h-4 w-4" strokeWidth={2.5} />
          Nouveau
        </button>
      </div>

      <div className="px-3.5">
        {isLoading ? (
          <p className="py-20 text-center text-[13px] italic text-[var(--es-tertiary)]">
            Chargement des magasins...
          </p>
        ) : stores.length === 0 ? (
          <p className="py-20 text-center text-[13px] italic text-[var(--es-tertiary)]">
            Aucun magasin trouvé.
          </p>
        ) : (
          <div className="flex flex-col overflow-hidden rounded-[14px] border border-[var(--es-hairline)]">
            {stores.map((store) => (
              <Link
                key={store.id}
                href={`/stores/${store.id}`}
                data-cy={`store-${store.id}`}
                className="flex h-[66px] items-center gap-3 border-b border-[var(--es-hairline)] px-3.5 last:border-b-0 hover:bg-[var(--es-field)]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--es-field)] text-[#FF6B35]">
                  <BuildingStorefrontIcon className="h-5 w-5" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[15.5px] font-medium">
                    {store.name}
                  </span>
                  <span className="truncate text-[11.5px] text-[var(--es-tertiary)]">
                    Gérer les rayons et produits
                  </span>
                </div>
                {storesWithLoyalty.has(store.id) && (
                  <span className="shrink-0 rounded-[6px] bg-[rgba(255,107,53,0.1)] px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#c8471c]">
                    Fidélité
                  </span>
                )}
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    onClick={(e) => handleOpenLoyaltyCard(e, store)}
                    data-cy={`store-${store.id}-loyalty`}
                    className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[var(--es-secondary)] hover:bg-[var(--es-field)]"
                    title="Carte de fidélité"
                  >
                    <CreditCardIcon className="h-[18px] w-[18px]" />
                  </button>
                  <button
                    onClick={(e) => handleOpenEditStore(e, store)}
                    data-cy={`store-${store.id}-edit`}
                    className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[var(--es-secondary)] hover:bg-[var(--es-field)]"
                    title="Modifier le nom"
                  >
                    <PencilIcon className="h-[18px] w-[18px]" />
                  </button>
                  <button
                    onClick={(e) => handleStoreDelete(e, store.id, store.name)}
                    data-cy={`store-${store.id}-delete`}
                    className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[var(--es-secondary)] hover:bg-[var(--es-field)]"
                    title="Supprimer"
                  >
                    <TrashIcon className="h-[18px] w-[18px]" />
                  </button>
                </div>
                <ChevronRightIcon className="h-[18px] w-[18px] shrink-0 text-[var(--es-disabled)]" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Loyalty Card Sheet */}
      {selectedStoreForCard && (
        <AddLoyaltyCardSheet
          storeId={selectedStoreForCard.id}
          storeName={selectedStoreForCard.name}
          open={!!selectedStoreForCard}
          onClose={() => setSelectedStoreForCard(null)}
        />
      )}

      {/* Store Form Sheet */}
      <Sheet open={isStoreSheetOpen} onOpenChange={setIsStoreSheetOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto w-full max-w-lg rounded-t-[18px] p-6 pt-3 text-[var(--es-ink)] bg-[var(--es-surface)]"
        >
          <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-[var(--es-hairline)]" />
          <SheetHeader className="p-0 text-left">
            <SheetTitle className="text-[20px] font-semibold">
              {editingStore ? "Modifier le magasin" : "Nouveau magasin"}
            </SheetTitle>
            <SheetDescription className="text-[13px] text-[var(--es-secondary)]">
              Entrez le nom de votre magasin habituel.
            </SheetDescription>
          </SheetHeader>
          <form
            onSubmit={handleStoreSubmit}
            className="mt-6 flex flex-col gap-4"
          >
            <div className="space-y-2">
              <label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--es-secondary)]">
                Nom du magasin
              </label>
              <input
                type="text"
                data-cy="store-name-input"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Ex: Carrefour Market, Bio c' Bon..."
                className="h-[50px] w-full rounded-[14px] border border-[var(--es-hairline)] bg-[var(--es-surface)] px-3.5 text-[15px] font-medium outline-none focus:border-[#FF6B35]"
              />
            </div>
            <Button
              type="submit"
              data-cy="store-submit"
              disabled={isSubmitting}
              className="h-[50px] rounded-[14px] bg-[#1A365D] text-[15px] font-semibold hover:bg-[#1A365D]/90"
            >
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
      <TabBar />
    </div>
  );
}

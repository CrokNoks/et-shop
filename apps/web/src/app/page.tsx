"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { TabBar } from "@/components/layout/TabBar";
import { HopInput } from "@/components/shopping/HopInput";
import { ShoppingList } from "@/components/shopping/ShoppingList";
import { ListHeader } from "@/components/shopping/ListHeader";
import { fetchApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { ShoppingList as ShoppingListType } from "@/types";
import { useShoppingListItems } from "@/hooks/useShoppingListItems";
import {
  useActiveHousehold,
  useActiveHouseholdId,
  useHouseholdMembers,
} from "@/hooks/useHousehold";
import { ACTIVE_LIST_KEY } from "@/lib/constants";
import { useOnlineStatus } from "@/lib/offline/network";
import { setCachedLoyaltyCards, getCachedListName } from "@/lib/offline/db";
import { loyaltyCardsApi } from "@/lib/api/loyalty-cards";

export const dynamic = "force-dynamic";

export default function Home() {
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [activeListName, setActiveListName] = useState("");
  const [isLoadingLists, setIsLoadingLists] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const router = useRouter();

  const handleItemAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const loadInitialList = useCallback(async () => {
    const householdId =
      typeof window !== "undefined"
        ? localStorage.getItem("active_household_id")
        : null;
    if (!householdId) {
      router.push("/household/setup");
      return;
    }

    try {
      const lists = await fetchApi("/shopping-lists");
      if (lists && lists.length > 0) {
        const persistedId =
          typeof window !== "undefined"
            ? localStorage.getItem(ACTIVE_LIST_KEY)
            : null;
        const currentActive =
          lists.find(
            (l: ShoppingListType) =>
              l.id === activeListId || l.id === persistedId,
          ) || lists[0];
        setActiveListId(currentActive.id);
        setActiveListName(currentActive.name);
        localStorage.setItem(ACTIVE_LIST_KEY, currentActive.id);
      } else {
        setActiveListId(null);
        setActiveListName("Aucune liste trouvée");
      }
    } catch (error: unknown) {
      console.error("Failed to load lists:", error);
      const err = error as { status?: number };
      if (err.status === 401) {
        router.push("/login");
      } else if (err.status === 400 || err.status === 403) {
        // ID foyer manquant ou invalide, on renvoie vers le setup
        localStorage.removeItem("active_household_id");
        router.push("/household/setup");
      } else {
        // Panne réseau (pas de `status` HTTP : fetch a échoué avant même
        // d'obtenir une réponse). Démarrage à froid hors ligne (app tuée
        // par l'OS puis rouverte sans réseau) : on retombe sur la liste
        // active persistée + son nom en cache IndexedDB plutôt que de
        // rester bloqué sans `activeListId`, ce qui empêcherait
        // `useShoppingListItems` d'atteindre son propre repli cache pour
        // les articles. Si rien d'exploitable n'est en cache, on garde le
        // comportement actuel ("Erreur de connexion").
        const persistedId =
          typeof window !== "undefined"
            ? localStorage.getItem(ACTIVE_LIST_KEY)
            : null;
        const cachedName = persistedId
          ? await getCachedListName(householdId, persistedId)
          : null;
        if (persistedId && cachedName) {
          setActiveListId(persistedId);
          setActiveListName(cachedName);
        } else {
          setActiveListName("Erreur de connexion");
        }
      }
    } finally {
      setIsLoadingLists(false);
    }
  }, [activeListId, router]);

  useEffect(() => {
    const run = async () => {
      await loadInitialList();
    };
    run();
  }, [loadInitialList]);

  const household = useActiveHousehold();
  const householdId = useActiveHouseholdId();
  const { data: members = [] } = useHouseholdMembers(householdId);
  const onlineStatus = useOnlineStatus();
  const isSynced = onlineStatus !== "offline";

  const handleActiveListGone = useCallback(() => {
    setActiveListId(null);
    localStorage.removeItem(ACTIVE_LIST_KEY);
    loadInitialList();
  }, [loadInitialList]);

  const {
    isLoading: itemsLoading,
    storeGroups,
    totalBudget,
    checkedTotal,
    toggleCheck,
    handleQuantityUpdate,
    handleDeleteItem,
    addItem,
    fetchItems,
  } = useShoppingListItems(activeListId, refreshTrigger, handleActiveListGone);

  // Précache proactif des cartes de fidélité une fois le foyer actif résolu
  // (fire-and-forget, non bloquant) : la liste active est déjà mise en
  // cache par `useShoppingListItems` lui-même à chaque fetch réussi. Un
  // échec ici est silencieux — pas de capacité offline revendiquée.
  useEffect(() => {
    if (!householdId) return;
    loyaltyCardsApi
      .getLoyaltyCards()
      .then((cards) => setCachedLoyaltyCards(householdId, cards))
      .catch(() => {});
  }, [householdId]);

  return (
    <div className="min-h-screen bg-[var(--es-bg)] flex flex-col font-sans">
      <main className="flex-1 flex flex-col pb-24 sm:pt-12 sm:px-12 sm:items-center">
        <div className="w-full sm:max-w-2xl flex flex-col">
          {activeListId ? (
            <ListHeader
              id={activeListId}
              name={activeListName}
              isSynced={isSynced}
              householdName={household?.name || "Foyer"}
              members={members}
              totalBudget={totalBudget}
              checkedTotal={checkedTotal}
              onUpdate={(newName) => setActiveListName(newName)}
              onDelete={handleActiveListGone}
            />
          ) : isLoadingLists ? (
            <div className="flex flex-col gap-2 px-3.5 pt-6 animate-pulse">
              <div className="h-6 w-2/3 rounded bg-[var(--es-skeleton)]" />
              <div className="h-4 w-1/3 rounded bg-[var(--es-skeleton)]" />
            </div>
          ) : (
            <div className="flex flex-col gap-3 text-[var(--es-ink)] px-3.5 pt-6">
              <h1 className="text-[23px] font-semibold">{activeListName}</h1>
              <Link
                href="/lists"
                data-cy="empty-open-lists"
                className="text-[14px] font-semibold text-[var(--es-accent-text)]"
              >
                Voir mes listes →
              </Link>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-3.5 py-3">
            {activeListId ? (
              <ShoppingList
                isLoading={itemsLoading}
                storeGroups={storeGroups}
                checkedTotal={checkedTotal}
                toggleCheck={toggleCheck}
                handleQuantityUpdate={handleQuantityUpdate}
                handleDeleteItem={handleDeleteItem}
                refetch={fetchItems}
                members={members}
              />
            ) : (
              <div className="py-20 text-center text-[var(--es-ink)]">
                <p className="text-[var(--es-tertiary)] italic font-medium">
                  Veuillez sélectionner ou créer une liste pour commencer.
                </p>
              </div>
            )}
          </div>

          {activeListId && (
            <div className="sticky bottom-16 px-3.5 py-2 bg-[var(--es-bg)]">
              <HopInput
                listId={activeListId}
                onItemAdded={handleItemAdded}
                addItem={addItem}
              />
            </div>
          )}

          <footer className="hidden sm:flex mt-auto py-12 gap-6 flex-wrap items-center justify-center text-[var(--es-ink)] opacity-40 text-xs text-center">
            <p>© 2026 Et SHop! - Votre compagnon de courses propulsionné</p>
          </footer>
        </div>
      </main>
      <TabBar />
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
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
  useHouseholdMembers,
  getActiveHouseholdId,
} from "@/hooks/useHousehold";

export const dynamic = "force-dynamic";

export default function Home() {
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [activeListName, setActiveListName] = useState("Chargement...");
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null);
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
        const currentActive =
          lists.find((l: ShoppingListType) => l.id === activeListId) ||
          lists[0];
        setActiveListId(currentActive.id);
        setActiveListName(currentActive.name);
        setActiveStoreId(currentActive.store_id || null);
      } else {
        setActiveListId(null);
        setActiveListName("Aucune liste trouvée");
        setActiveStoreId(null);
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
        setActiveListName("Erreur de connexion");
      }
    }
  }, [activeListId, router]);

  useEffect(() => {
    const run = async () => {
      await loadInitialList();
    };
    run();
  }, [loadInitialList]);

  const handleListSelect = (id: string) => {
    setActiveListId(id);
  };

  const {
    isLoading: itemsLoading,
    storeGroups,
    totalBudget,
    checkedTotal,
    toggleCheck,
    handleQuantityUpdate,
    handleDeleteItem,
    fetchItems,
  } = useShoppingListItems(activeListId, refreshTrigger);

  const household = useActiveHousehold();
  const { data: members = [] } = useHouseholdMembers(getActiveHouseholdId());

  return (
    <div className="min-h-screen bg-[var(--es-bg)] flex flex-col sm:flex-row font-sans">
      <Sidebar
        activeListId={activeListId || ""}
        onListSelect={handleListSelect}
      />

      <main className="flex-1 flex flex-col pb-24 sm:p-12 sm:items-center">
        <div className="w-full sm:max-w-2xl flex flex-col">
          {activeListId ? (
            <ListHeader
              id={activeListId}
              name={activeListName}
              storeId={activeStoreId}
              isSynced={true}
              householdName={household?.name || "Foyer"}
              members={members}
              totalBudget={totalBudget}
              checkedTotal={checkedTotal}
              onUpdate={(newName, newStoreId) => {
                setActiveListName(newName);
                setActiveStoreId(newStoreId || null);
              }}
              onDelete={() => {
                setActiveListId(null);
                loadInitialList();
              }}
            />
          ) : (
            <div className="flex flex-col gap-1 text-[var(--es-ink)] px-3.5 pt-6">
              <h1 className="text-3xl font-black">{activeListName}</h1>
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
            <div className="sticky bottom-16 sm:bottom-0 px-3.5 py-2 bg-[var(--es-bg)]">
              <HopInput listId={activeListId} onItemAdded={handleItemAdded} />
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

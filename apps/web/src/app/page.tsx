"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { HopInput } from "@/components/shopping/HopInput";
import { ShoppingList } from "@/components/shopping/ShoppingList";
import { ListHeader } from "@/components/shopping/ListHeader";
import { fetchApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { ShoppingList as ShoppingListType } from "@/types";

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col sm:flex-row font-[family-name:var(--font-geist-sans)]">
      <Sidebar
        activeListId={activeListId || ""}
        onListSelect={handleListSelect}
      />

      <main className="flex-1 p-6 pt-24 sm:p-12 flex justify-center">
        <div className="w-full max-w-2xl flex flex-col gap-10">
          {activeListId ? (
            <ListHeader
              id={activeListId}
              name={activeListName}
              storeId={activeStoreId}
              isSynced={true}
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
            <div className="flex flex-col gap-1 text-[#1A365D]">
              <h1 className="text-3xl font-black">{activeListName}</h1>
            </div>
          )}

          {activeListId ? (
            <>
              <div className="flex flex-col gap-4">
                <HopInput listId={activeListId} onItemAdded={handleItemAdded} />
              </div>
              <ShoppingList
                listId={activeListId}
                storeId={activeStoreId || undefined}
                refreshKey={refreshTrigger}
              />
            </>
          ) : (
            <div className="py-20 text-center text-[#1A365D]">
              <p className="text-gray-400 italic font-medium">
                Veuillez sélectionner ou créer une liste pour commencer.
              </p>
            </div>
          )}

          <footer className="mt-auto py-12 flex gap-6 flex-wrap items-center justify-center text-[#1A365D] opacity-40 text-xs text-center">
            <p>© 2026 Et SHop! - Votre compagnon de courses propulsionné</p>
          </footer>
        </div>
      </main>
    </div>
  );
}

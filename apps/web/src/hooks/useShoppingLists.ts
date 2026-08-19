"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { useSupabase } from "@/hooks/useSupabase";
import { ShoppingList } from "@/types";
import { getActiveHouseholdId } from "@/hooks/useHousehold";

/**
 * Toutes les listes du foyer actif, avec mise à jour temps réel. Extrait de
 * l'ancien SidebarContent pour l'écran "Mes listes & foyer" (2g/3d).
 *
 * Écran 4j : la création ne prend qu'un nom — aucun magasin n'est demandé,
 * les sections magasin/rayon d'une liste se déduisent des produits ajoutés.
 */
export function useShoppingLists() {
  const supabase = useSupabase();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLists = useCallback(async () => {
    try {
      const data = await fetchApi("/shopping-lists");
      setLists(data || []);
    } catch (error) {
      console.error("Failed to load shopping lists:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLists();

    const householdId = getActiveHouseholdId();
    if (!householdId) return;

    const channel = supabase
      .channel("shopping_lists_overview")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shopping_lists",
          filter: `household_id=eq.${householdId}`,
        },
        () => fetchLists(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchLists]);

  const createList = useCallback(async (name: string) => {
    const newList = await fetchApi("/shopping-lists", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    await fetchLists();
    return newList as ShoppingList;
  }, [fetchLists]);

  return { lists, isLoading, createList, refetch: fetchLists };
}

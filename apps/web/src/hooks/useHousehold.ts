"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { useLocalStorageValue } from "@/hooks/useLocalStorageValue";

export interface Household {
  id: string;
  name: string;
}

export interface HouseholdMember {
  user_id: string;
  role?: string;
  profile?: {
    full_name?: string;
    email?: string;
  } | null;
}

const ACTIVE_HOUSEHOLD_KEY = "active_household_id";

/** Lecture synchrone hors composant (event handlers, query functions). */
function getActiveHouseholdId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_HOUSEHOLD_KEY);
}

/** Lecture sûre pour l'hydratation, à utiliser dans le corps d'un composant. */
export function useActiveHouseholdId(): string | null {
  return useLocalStorageValue(ACTIVE_HOUSEHOLD_KEY);
}

/**
 * Le nom du foyer actif, dérivé de /households/me (pas d'endpoint dédié
 * "household by id" côté API).
 */
export function useActiveHousehold() {
  const householdId = useActiveHouseholdId();

  const { data: households = [] } = useQuery<Household[], Error>({
    queryKey: ["households", "me"],
    queryFn: () => fetchApi("/households/me"),
    enabled: !!householdId,
  });
  return households.find((h) => h.id === householdId) ?? null;
}

export function useHouseholdMembers(householdId: string | null) {
  return useQuery<HouseholdMember[], Error>({
    queryKey: ["households", householdId, "members"],
    queryFn: () => fetchApi(`/households/${householdId}/members`),
    enabled: !!householdId,
  });
}

export { getActiveHouseholdId };

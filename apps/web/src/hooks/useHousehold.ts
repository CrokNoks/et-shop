"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";

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

function getActiveHouseholdId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("active_household_id");
}

/**
 * Le nom du foyer actif, dérivé de /households/me (pas d'endpoint dédié
 * "household by id" côté API).
 */
export function useActiveHousehold() {
  const householdId = getActiveHouseholdId();
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

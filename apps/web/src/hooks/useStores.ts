"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { Store } from "@/types";

export function useStores() {
  return useQuery<Store[], Error>({
    queryKey: ["stores"],
    queryFn: () => fetchApi("/stores"),
  });
}

export function useStoreMap() {
  const { data: stores = [] } = useStores();
  return Object.fromEntries(stores.map((s) => [s.id, s.name]));
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { getRecipes } from "@/lib/api";
import { Recipe } from "@/types";

export function useRecipes() {
  return useQuery<Recipe[], Error>({
    queryKey: ["recipes"],
    queryFn: () => getRecipes(),
  });
}

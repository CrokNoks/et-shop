"use client";

import { useQuery } from "@tanstack/react-query";
import { getRecipe } from "@/lib/api";
import { Recipe } from "@/types";

export function useRecipeDetail(id: string) {
  return useQuery<Recipe, Error>({
    queryKey: ["recipes", id],
    queryFn: () => getRecipe(id),
    enabled: !!id,
  });
}

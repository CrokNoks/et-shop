"use client";

import React, { useState } from "react";
import { TabBar } from "@/components/layout/TabBar";
import { useRecipes } from "@/hooks/useRecipes";
import { RecipeList } from "@/components/recipes/RecipeList";
import { deleteRecipe } from "@/lib/api";
import { PlusIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function RecipesPage() {
  const { data: recipes = [], isLoading } = useRecipes();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (
    e: React.MouseEvent,
    id: string,
    name: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Supprimer la recette "${name}" ?`)) return;
    setIsDeleting(true);
    try {
      await deleteRecipe(id);
      await queryClient.invalidateQueries({ queryKey: ["recipes"] });
      toast.success("Recette supprimée !");
    } catch {
      toast.error("Erreur lors de la suppression.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--es-bg)] pb-24 text-[var(--es-ink)]">
      <main className="mx-auto flex w-full max-w-lg flex-col gap-4 px-3.5 pt-6 sm:max-w-2xl">
        <header className="flex items-center justify-between gap-3">
          <h1 className="text-[24px] font-semibold">Mes Recettes</h1>
          <Link
            href="/recipes/new"
            data-cy="recipes-new"
            className="flex h-9 items-center gap-1 rounded-[10px] border border-[#FF6B35] px-3 text-[13px] font-semibold text-[var(--es-accent-text)]"
          >
            <PlusIcon className="h-4 w-4" strokeWidth={2.5} />
            Nouvelle
          </Link>
        </header>

        {isLoading ? (
          <p className="animate-pulse py-20 text-center italic text-[var(--es-tertiary)]">
            Chargement des recettes...
          </p>
        ) : (
          <RecipeList
            recipes={recipes}
            onDelete={isDeleting ? () => {} : handleDelete}
          />
        )}
      </main>
      <TabBar />
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useRecipes } from "@/hooks/useRecipes";
import { RecipeList } from "@/components/recipes/RecipeList";
import { deleteRecipe } from "@/lib/api";
import { Button } from "@/components/ui/button";
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
    <div className="min-h-screen bg-gray-50 flex flex-col sm:flex-row font-[family-name:var(--font-geist-sans)] text-[#1A365D]">
      <Sidebar activeListId="" onListSelect={() => {}} />

      <main className="flex-1 p-6 pt-24 sm:p-12 flex justify-center">
        <div className="w-full max-w-4xl flex flex-col gap-10">
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex flex-col gap-2 text-left">
              <h1 className="text-4xl font-black">Mes Recettes</h1>
              <p className="text-gray-500">
                Créez des modèles réutilisables de produits pour vos listes de
                courses.
              </p>
            </div>
            <Link href="/recipes/new" data-cy="recipes-new">
              <Button className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-bold rounded-2xl px-6 py-6 shadow-lg transition-all border-none">
                <PlusIcon className="w-5 h-5 mr-2" strokeWidth={3} />
                Nouvelle Recette
              </Button>
            </Link>
          </header>

          {isLoading ? (
            <p className="text-center py-20 text-gray-400 italic animate-pulse">
              Chargement des recettes...
            </p>
          ) : (
            <RecipeList
              recipes={recipes}
              onDelete={isDeleting ? () => {} : handleDelete}
            />
          )}
        </div>
      </main>
    </div>
  );
}

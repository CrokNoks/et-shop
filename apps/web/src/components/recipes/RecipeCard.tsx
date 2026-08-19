"use client";

import React from "react";
import Link from "next/link";
import { ChefHat, Trash2 } from "lucide-react";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { Recipe } from "@/types";

interface RecipeCardProps {
  recipe: Recipe;
  onDelete: (e: React.MouseEvent, id: string, name: string) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onDelete }) => {
  // GET /recipes renvoie recipe_items en agrégat (`recipe_items(count)`),
  // pas le détail des items : `recipe.recipe_items` vaut ici [{ count: N }],
  // pas un vrai tableau d'ingrédients. Le détail (noms, items_catalog)
  // n'existe que sur GET /recipes/:id (RecipeDetail). On ne peut donc
  // afficher qu'un compte ici, pas de puces de noms sans un fetch par
  // recette (N+1, écarté pour la même raison que les compteurs
  // rayons/produits de /stores).
  const rawItems = recipe.recipe_items ?? [];
  const aggregateCount = (rawItems[0] as unknown as { count?: number })?.count;
  const itemCount = aggregateCount ?? rawItems.length;

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="group flex items-center justify-between gap-3 rounded-[14px] border border-[var(--es-hairline)] bg-[var(--es-surface)] p-3 text-left"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-[rgba(255,107,53,0.1)] text-[var(--es-accent-text)]">
          <ChefHat className="h-5 w-5" />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="truncate text-[16.5px] font-semibold text-[var(--es-ink)]">
            {recipe.name}
          </h3>
          <p className="text-[11.5px] text-[var(--es-tertiary)]">
            {itemCount} ingrédient{itemCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={(e) => onDelete(e, recipe.id, recipe.name)}
          data-cy="recipe-delete"
          className="flex h-11 w-11 items-center justify-center rounded-[10px] text-[var(--es-tertiary)] transition-colors hover:bg-[rgba(179,38,30,0.08)] hover:text-[var(--es-danger)]"
          title="Supprimer"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <ChevronRightIcon className="h-[18px] w-[18px] text-[var(--es-disabled)]" />
      </div>
    </Link>
  );
};

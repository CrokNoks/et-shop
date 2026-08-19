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
  const items = recipe.recipe_items ?? [];
  const itemCount = items.length;
  const visibleNames = items
    .slice(0, 3)
    .map((i) => i.items_catalog?.name)
    .filter(Boolean) as string[];
  const extraCount = itemCount - visibleNames.length;

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
          {visibleNames.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 pt-0.5">
              {visibleNames.map((name) => (
                <span
                  key={name}
                  className="h-[26px] rounded-[6px] bg-[var(--es-field)] px-2 text-[11.5px] leading-[26px] text-[var(--es-secondary)]"
                >
                  {name}
                </span>
              ))}
              {extraCount > 0 && (
                <span className="h-[26px] rounded-[6px] bg-[var(--es-field)] px-2 text-[11.5px] leading-[26px] text-[var(--es-tertiary)]">
                  +{extraCount}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={(e) => onDelete(e, recipe.id, recipe.name)}
          data-cy="recipe-delete"
          className="flex h-9 w-9 items-center justify-center rounded-[10px] text-[var(--es-tertiary)] opacity-0 transition-opacity hover:bg-[rgba(179,38,30,0.08)] hover:text-[var(--es-danger)] group-hover:opacity-100"
          title="Supprimer"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <ChevronRightIcon className="h-[18px] w-[18px] text-[var(--es-disabled)]" />
      </div>
    </Link>
  );
};

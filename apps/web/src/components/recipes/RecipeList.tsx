"use client";

import React, { useMemo, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Recipe } from "@/types";
import { RecipeCard } from "./RecipeCard";

interface RecipeListProps {
  recipes: Recipe[];
  onDelete: (e: React.MouseEvent, id: string, name: string) => void;
}

export const RecipeList: React.FC<RecipeListProps> = ({
  recipes,
  onDelete,
}) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter((r) => r.name.toLowerCase().includes(q));
  }, [recipes, search]);

  if (recipes.length === 0) {
    return (
      <p className="py-20 text-center italic text-[var(--es-tertiary)]">
        Aucune recette. Cliquez sur &laquo; Nouvelle Recette &raquo; pour en
        créer une !
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-11 items-center gap-2 rounded-[12px] border border-[var(--es-hairline)] bg-[var(--es-surface)] px-3">
        <MagnifyingGlassIcon className="h-4 w-4 shrink-0 text-[var(--es-tertiary)]" />
        <input
          data-cy="recipes-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une recette..."
          className="h-full w-full bg-transparent text-[14px] text-[var(--es-ink)] outline-none placeholder:text-[var(--es-tertiary)]"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center italic text-[var(--es-tertiary)]">
          Aucune recette ne correspond à &laquo; {search} &raquo;.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
};

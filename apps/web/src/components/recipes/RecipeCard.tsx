"use client";

import React from "react";
import Link from "next/link";
import { ChefHat, Trash2, ChevronRight } from "lucide-react";
import { Recipe } from "@/types";

interface RecipeCardProps {
  recipe: Recipe;
  onDelete: (e: React.MouseEvent, id: string, name: string) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onDelete }) => {
  const itemCount = recipe.recipe_items?.length ?? 0;

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
    >
      <div className="flex items-center gap-6">
        <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-[#FF6B35]">
          <ChefHat className="w-6 h-6" />
        </div>
        <div className="flex flex-col text-left">
          <h3 className="text-xl font-bold">{recipe.name}</h3>
          {recipe.description && (
            <p className="text-sm text-gray-400 truncate max-w-xs">
              {recipe.description}
            </p>
          )}
          <p className="text-sm text-gray-400">
            {itemCount} produit{itemCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={(e) => onDelete(e, recipe.id, recipe.name)}
          data-cy="recipe-delete"
          className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
          title="Supprimer"
        >
          <Trash2 className="w-5 h-5" />
        </button>
        <div className="p-3 text-gray-300 group-hover:text-[#FF6B35] transition-all">
          <ChevronRight className="w-6 h-6" strokeWidth={3} />
        </div>
      </div>
    </Link>
  );
};

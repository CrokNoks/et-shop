"use client";

import React from "react";
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
  if (recipes.length === 0) {
    return (
      <p className="text-center py-20 text-gray-400 italic">
        Aucune recette. Cliquez sur &laquo; Nouvelle Recette &raquo; pour en créer une !
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} onDelete={onDelete} />
      ))}
    </div>
  );
};

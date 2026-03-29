"use client";

import React, { useState } from "react";
import { Recipe, RecipeItem } from "@/types";
import { RecipeItemRow } from "./RecipeItemRow";
import { AddRecipeItemForm } from "./AddRecipeItemForm";
import { SendToListDialog } from "./SendToListDialog";
import { Button } from "@/components/ui/button";
import { ChefHat, Send } from "lucide-react";

interface RecipeDetailProps {
  recipe: Recipe;
  onUpdateItem: (
    itemId: string,
    data: { quantity?: number; unit?: string },
  ) => void;
  onDeleteItem: (itemId: string) => void;
  onAddItem: (data: {
    catalog_item_id: string;
    quantity: number;
    unit?: string;
  }) => void;
  onSendToList: (shoppingListId: string) => void;
  isAddingItem?: boolean;
  isSending?: boolean;
}

export const RecipeDetail: React.FC<RecipeDetailProps> = ({
  recipe,
  onUpdateItem,
  onDeleteItem,
  onAddItem,
  onSendToList,
  isAddingItem = false,
  isSending = false,
}) => {
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const items: RecipeItem[] = recipe.recipe_items || [];

  const handleSend = (shoppingListId: string) => {
    onSendToList(shoppingListId);
    setIsSendDialogOpen(false);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-[#FF6B35]">
            <ChefHat className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-4xl font-black">{recipe.name}</h1>
            {recipe.description && (
              <p className="text-gray-500 mt-1">{recipe.description}</p>
            )}
          </div>
        </div>

        <Button
          onClick={() => setIsSendDialogOpen(true)}
          data-cy="recipe-send"
          disabled={items.length === 0}
          className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-bold rounded-2xl px-6 py-6 shadow-lg transition-all border-none flex-shrink-0"
        >
          <Send className="w-5 h-5 mr-2" />
          Envoyer vers une liste
        </Button>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">
          Produits ({items.length})
        </h2>

        {items.length === 0 ? (
          <p className="text-gray-400 italic text-sm py-4">
            Aucun produit. Ajoutez-en un ci-dessous.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <RecipeItemRow
                key={item.id}
                item={item}
                onUpdate={onUpdateItem}
                onDelete={onDeleteItem}
              />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">
          Ajouter un produit
        </h2>
        <AddRecipeItemForm onAdd={onAddItem} isSubmitting={isAddingItem} />
      </section>

      <SendToListDialog
        open={isSendDialogOpen}
        onClose={() => setIsSendDialogOpen(false)}
        onSend={handleSend}
        isSending={isSending}
      />
    </div>
  );
};

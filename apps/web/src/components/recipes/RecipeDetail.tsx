"use client";

import React, { useState } from "react";
import { Recipe, RecipeItem } from "@/types";
import { RecipeItemRow } from "./RecipeItemRow";
import { AddRecipeItemForm } from "./AddRecipeItemForm";
import { SendToListDialog } from "./SendToListDialog";
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
  onSendToList: (shoppingListId: string, itemIds?: string[]) => void;
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
  // Ce composant n'est monté que depuis la page de détail (GET /recipes/:id),
  // qui renvoie le détail réel des lignes — jamais l'agrégat de comptage de
  // GET /recipes (cf. RecipeCard). Le filtre rend ça honnête pour le
  // typeur sans cast, sans changer le comportement réel.
  const items: RecipeItem[] = (recipe.recipe_items ?? []).filter(
    (item): item is RecipeItem => !("count" in item),
  );

  // Tout est sélectionné par défaut (cohérent avec "pas d'item_ids = tout"
  // côté backend). On ne suit que les décochés plutôt que les cochés : un
  // ingrédient ajouté après coup reste sélectionné sans effet supplémentaire.
  const [deselectedIds, setDeselectedIds] = useState<Set<string>>(new Set());
  const toggleSelected = (itemId: string) => {
    setDeselectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };
  const selectedCount = items.length - deselectedIds.size;

  const handleSend = (shoppingListId: string) => {
    const itemIds =
      deselectedIds.size === 0
        ? undefined
        : items.filter((i) => !deselectedIds.has(i.id)).map((i) => i.id);
    onSendToList(shoppingListId, itemIds);
    setIsSendDialogOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="-mx-3.5 flex flex-col gap-4 bg-[var(--es-banner)] px-3.5 py-4 text-white sm:mx-0 sm:rounded-[14px]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-white/10 text-[#FF6B35]">
            <ChefHat className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#FF6B35]">
              Recette
            </span>
            <h1 className="truncate text-[22px] font-semibold">
              {recipe.name}
            </h1>
          </div>
        </div>
        {recipe.description && (
          <p className="text-[13px] text-white/70">{recipe.description}</p>
        )}
        {recipe.estimated_cost !== undefined && (
          <p className="text-[13px] text-white/70">
            ≈ {recipe.estimated_cost.toFixed(2)} €
          </p>
        )}
      </div>

      <button
        onClick={() => setIsSendDialogOpen(true)}
        data-cy="recipe-send"
        disabled={selectedCount === 0}
        className="flex h-[50px] items-center justify-center gap-2 rounded-[14px] border border-[#FF6B35] bg-[rgba(255,107,53,0.08)] text-[15px] font-semibold text-[var(--es-accent-text)] disabled:opacity-40"
      >
        <Send className="h-4 w-4" />
        Ajouter {selectedCount} article{selectedCount !== 1 ? "s" : ""}
      </button>

      <section className="flex flex-col gap-2">
        <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--es-secondary)]">
          Ingrédients ({items.length})
        </h2>

        {items.length === 0 ? (
          <p className="py-4 text-[13px] italic text-[var(--es-tertiary)]">
            Aucun ingrédient. Ajoutez-en un ci-dessous.
          </p>
        ) : (
          <div className="overflow-hidden rounded-[14px] border border-[var(--es-hairline)]">
            {items.map((item) => (
              <RecipeItemRow
                key={item.id}
                item={item}
                onUpdate={onUpdateItem}
                onDelete={onDeleteItem}
                isSelected={!deselectedIds.has(item.id)}
                onToggleSelected={toggleSelected}
              />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--es-secondary)]">
          Ajouter un ingrédient
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

"use client";

import React, { useState } from "react";
import { use } from "react";
import { TabBar } from "@/components/layout/TabBar";
import { useRecipeDetail } from "@/hooks/useRecipeDetail";
import { RecipeDetail } from "@/components/recipes/RecipeDetail";
import {
  addRecipeItem,
  updateRecipeItem,
  deleteRecipeItem,
  sendRecipeToList,
  updateRecipe,
} from "@/lib/api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export const dynamic = "force-dynamic";

interface RecipePageProps {
  params: Promise<{ id: string }>;
}

export default function RecipePage({ params }: RecipePageProps) {
  const { id } = use(params);
  const { data: recipe, isLoading, error } = useRecipeDetail(id);
  const queryClient = useQueryClient();
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Edit sheet state
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["recipes", id] });

  const handleAddItem = async (data: {
    catalog_item_id: string;
    quantity: number;
    unit?: string;
  }) => {
    setIsAddingItem(true);
    try {
      await addRecipeItem(id, data);
      await invalidate();
      toast.success("Produit ajouté !");
    } catch (error: unknown) {
      console.error("Failed to add recipe item:", error);
      // Debug pour Cypress
      if (
        typeof window !== "undefined" &&
        (window as unknown as Record<string, unknown>)["Cypress"]
      ) {
        window.alert("RECIPE_ITEM_ERROR: " + JSON.stringify(error));
      }
      toast.error("Erreur lors de l'ajout du produit.");
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleUpdateItem = async (
    itemId: string,
    data: { quantity?: number; unit?: string },
  ) => {
    try {
      await updateRecipeItem(id, itemId, data);
      await invalidate();
      toast.success("Produit mis à jour.");
    } catch {
      toast.error("Erreur lors de la mise à jour.");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteRecipeItem(id, itemId);
      await invalidate();
      toast.success("Produit retiré.");
    } catch {
      toast.error("Erreur lors de la suppression.");
    }
  };

  const handleSendToList = async (
    shoppingListId: string,
    itemIds?: string[],
  ) => {
    setIsSending(true);
    try {
      const result = await sendRecipeToList(id, shoppingListId, itemIds);
      toast.success(
        `Recette envoyée ! ${result.applied} produit(s) ajouté(s).`,
      );
    } catch {
      toast.error("Erreur lors de l'envoi vers la liste.");
    } finally {
      setIsSending(false);
    }
  };

  const openEditSheet = () => {
    if (!recipe) return;
    setEditName(recipe.name);
    setEditDescription(recipe.description || "");
    setIsEditSheetOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditSubmitting(true);
    try {
      await updateRecipe(id, {
        name: editName,
        description: editDescription || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ["recipes"] });
      await invalidate();
      toast.success("Recette mise à jour !");
      setIsEditSheetOpen(false);
    } catch {
      toast.error("Erreur lors de la mise à jour.");
    } finally {
      setIsEditSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--es-bg)] pb-24 text-[var(--es-ink)]">
      <main className="mx-auto flex w-full max-w-lg flex-col gap-4 pt-6 sm:max-w-2xl">
        {isLoading ? (
          <p className="animate-pulse px-3.5 py-20 text-center italic text-[var(--es-tertiary)]">
            Chargement...
          </p>
        ) : error || !recipe ? (
          <p className="px-3.5 py-20 text-center text-[var(--es-danger)]">
            Recette introuvable.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex justify-end px-3.5">
              <button
                onClick={openEditSheet}
                className="text-[13px] font-semibold text-[var(--es-secondary)] hover:text-[var(--es-ink)]"
              >
                Modifier la recette
              </button>
            </div>
            <div className="px-3.5">
              <RecipeDetail
                recipe={recipe}
                onAddItem={handleAddItem}
                onUpdateItem={handleUpdateItem}
                onDeleteItem={handleDeleteItem}
                onSendToList={handleSendToList}
                isAddingItem={isAddingItem}
                isSending={isSending}
              />
            </div>
          </div>
        )}
      </main>
      <TabBar />

      {/* Edit recipe sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto w-full max-w-lg rounded-t-[18px] p-6 pt-3 text-[var(--es-ink)] bg-[var(--es-surface)]"
        >
          <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-[var(--es-hairline)]" />
          <SheetHeader className="p-0 text-left">
            <SheetTitle className="text-[20px] font-semibold">
              Modifier la recette
            </SheetTitle>
            <SheetDescription className="text-[13px] text-[var(--es-secondary)]">
              Modifiez le nom ou la description de votre recette.
            </SheetDescription>
          </SheetHeader>
          <form
            onSubmit={handleEditSubmit}
            className="mt-6 flex flex-col gap-4"
          >
            <div className="space-y-2">
              <label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--es-secondary)]">
                Nom
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-[50px] w-full rounded-[14px] border border-[var(--es-hairline)] bg-[var(--es-surface)] px-3.5 text-[15px] font-medium outline-none focus:border-[#FF6B35] focus:bg-[rgba(255,107,53,0.04)]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--es-secondary)]">
                Description (optionnel)
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-[14px] border border-[var(--es-hairline)] bg-[var(--es-surface)] p-3.5 text-[15px] font-medium outline-none focus:border-[#FF6B35] focus:bg-[rgba(255,107,53,0.04)]"
              />
            </div>
            <button
              type="submit"
              disabled={isEditSubmitting}
              className="h-[50px] rounded-[14px] bg-[#1A365D] text-[15px] font-semibold text-white disabled:opacity-40"
            >
              {isEditSubmitting ? "Enregistrement..." : "Enregistrer"}
            </button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}

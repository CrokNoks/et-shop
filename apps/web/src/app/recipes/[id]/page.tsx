"use client";

import React, { useState } from "react";
import { use } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
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
import { Button } from "@/components/ui/button";
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
    } catch (error: any) {
      console.error("Failed to add recipe item:", error);
      // Debug pour Cypress
      if (typeof window !== "undefined" && (window as any).Cypress) {
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

  const handleSendToList = async (shoppingListId: string) => {
    setIsSending(true);
    try {
      const result = await sendRecipeToList(id, shoppingListId);
      toast.success(`Recette envoyée ! ${result.applied} produit(s) ajouté(s).`);
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
      await updateRecipe(id, { name: editName, description: editDescription || undefined });
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
    <div className="min-h-screen bg-gray-50 flex flex-col sm:flex-row font-[family-name:var(--font-geist-sans)] text-[#1A365D]">
      <Sidebar activeListId="" onListSelect={() => {}} />

      <main className="flex-1 p-6 pt-24 sm:p-12 flex justify-center">
        <div className="w-full max-w-4xl flex flex-col gap-10">
          {isLoading ? (
            <p className="text-center py-20 text-gray-400 italic animate-pulse">
              Chargement...
            </p>
          ) : error || !recipe ? (
            <p className="text-center py-20 text-red-400">
              Recette introuvable.
            </p>
          ) : (
            <>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={openEditSheet}
                  className="font-bold rounded-xl"
                >
                  Modifier la recette
                </Button>
              </div>
              <RecipeDetail
                recipe={recipe}
                onAddItem={handleAddItem}
                onUpdateItem={handleUpdateItem}
                onDeleteItem={handleDeleteItem}
                onSendToList={handleSendToList}
                isAddingItem={isAddingItem}
                isSending={isSending}
              />
            </>
          )}
        </div>
      </main>

      {/* Edit recipe sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent
          side="right"
          className="w-screen sm:max-w-[450px] p-10 text-[#1A365D]"
        >
          <SheetHeader className="mb-10 text-left">
            <SheetTitle className="text-3xl font-black">
              Modifier la recette
            </SheetTitle>
            <SheetDescription className="text-base text-gray-500 mt-2">
              Modifiez le nom ou la description de votre recette.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleEditSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Nom
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#FF6B35] font-medium transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Description (optionnel)
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#FF6B35] font-medium transition-all resize-none"
              />
            </div>
            <Button
              type="submit"
              disabled={isEditSubmitting}
              className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-bold text-lg py-6 rounded-xl shadow-lg"
            >
              {isEditSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}

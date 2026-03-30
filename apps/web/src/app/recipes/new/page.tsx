"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { createRecipe } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ChefHat } from "lucide-react";

export const dynamic = "force-dynamic";

export default function NewRecipePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      const recipe = await createRecipe({ name, description: description || undefined });
      await queryClient.invalidateQueries({ queryKey: ["recipes"] });
      toast.success("Recette créée !");
      router.push(`/recipes/${recipe.id}`);
    } catch {
      toast.error("Erreur lors de la création de la recette.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col sm:flex-row font-[family-name:var(--font-geist-sans)] text-[#1A365D]">
      <Sidebar activeListId="" onListSelect={() => {}} />

      <main className="flex-1 p-6 pt-24 sm:p-12 flex justify-center">
        <div className="w-full max-w-2xl flex flex-col gap-10">
          <header className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-[#FF6B35]">
              <ChefHat className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-4xl font-black">Nouvelle Recette</h1>
              <p className="text-gray-500">
                Créez un modèle réutilisable de produits.
              </p>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Nom de la recette *
              </label>
              <input
                type="text"
                data-cy="recipe-name-input"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Pâtes bolognaise, Salade César..."
                className="w-full p-4 bg-white border border-gray-100 rounded-2xl outline-none focus:border-[#FF6B35] font-medium transition-all shadow-sm"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Description (optionnel)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez votre recette..."
                rows={3}
                className="w-full p-4 bg-white border border-gray-100 rounded-2xl outline-none focus:border-[#FF6B35] font-medium transition-all shadow-sm resize-none"
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                onClick={() => router.back()}
                variant="outline"
                className="flex-1 py-6 rounded-xl font-bold text-lg"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                data-cy="recipe-submit"
                disabled={isSubmitting || !name.trim()}
                className="flex-1 bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-bold text-lg py-6 rounded-xl shadow-lg"
              >
                {isSubmitting ? "Création..." : "Créer la recette"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

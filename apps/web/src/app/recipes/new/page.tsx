"use client";

import React, { useState } from "react";
import { TabBar } from "@/components/layout/TabBar";
import { createRecipe } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { XMarkIcon } from "@heroicons/react/24/outline";

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
      const recipe = await createRecipe({
        name,
        description: description || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ["recipes"] });
      toast.success("Recette créée !");
      router.push(`/recipes/${recipe.id}`);
    } catch {
      toast.error("Erreur lors de la création de la recette.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--es-bg)] pb-24 text-[var(--es-ink)]">
      <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-3.5 pt-6 sm:max-w-2xl">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Fermer"
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--es-secondary)] hover:bg-[var(--es-field)]"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <div className="flex flex-col">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--es-tertiary)]">
                Nouvelle recette
              </span>
              <h1 className="text-[19px] font-semibold">
                {name || "Sans titre"}
              </h1>
            </div>
          </div>
          <button
            type="submit"
            form="new-recipe-form"
            data-cy="recipe-submit"
            disabled={isSubmitting || !name.trim()}
            className="text-[14px] font-semibold text-[#c8471c] disabled:opacity-40"
          >
            {isSubmitting ? "Création..." : "Enregistrer"}
          </button>
        </header>

        <form
          id="new-recipe-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--es-secondary)]">
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
              className="h-[50px] rounded-[14px] border border-[var(--es-hairline)] bg-[var(--es-surface)] px-3.5 text-[15px] font-medium outline-none focus:border-[#FF6B35] focus:bg-[rgba(255,107,53,0.04)]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--es-secondary)]">
              Description (optionnel)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre recette..."
              rows={3}
              className="rounded-[14px] border border-[var(--es-hairline)] bg-[var(--es-surface)] p-3.5 text-[15px] font-medium outline-none focus:border-[#FF6B35] focus:bg-[rgba(255,107,53,0.04)] resize-none"
            />
          </div>
        </form>
      </main>
      <TabBar />
    </div>
  );
}

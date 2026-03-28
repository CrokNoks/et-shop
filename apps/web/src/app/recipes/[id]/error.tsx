"use client";

export default function RecipeDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <h2 className="text-xl font-semibold">
        Erreur lors du chargement de la recette
      </h2>
      <p className="text-muted-foreground text-sm">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-[var(--color-brand)] text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
      >
        Réessayer
      </button>
    </div>
  );
}

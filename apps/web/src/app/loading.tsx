import { ListSkeleton } from "@/components/shopping/ListSkeleton";

/** Écran 4k — squelette de chargement inter-pages, jamais un texte "Chargement...". */
export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-[var(--es-bg)] px-3.5 pt-8">
      <div className="w-full max-w-lg space-y-2 animate-pulse">
        <div className="h-6 w-2/3 rounded bg-[var(--es-skeleton)]" />
        <div className="h-4 w-1/3 rounded bg-[var(--es-skeleton)]" />
      </div>
      <div className="mt-8 w-full max-w-lg">
        <ListSkeleton />
      </div>
    </div>
  );
}

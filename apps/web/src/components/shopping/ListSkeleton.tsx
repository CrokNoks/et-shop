/** Écran 4k — squelette de chargement, jamais un texte "Chargement...". */
export function ListSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-[58px] rounded-2xl bg-[var(--es-surface)] border border-[var(--es-hairline)] flex items-center gap-3 px-3.5 animate-pulse"
        >
          <div className="w-[26px] h-[26px] rounded-full bg-[var(--es-skeleton)]" />
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="h-[11px] w-2/3 rounded bg-[var(--es-skeleton)]" />
            <div className="h-[9px] w-1/3 rounded bg-[var(--es-skeleton)]" />
          </div>
          <div className="w-11 h-3 rounded bg-[var(--es-skeleton)]" />
        </div>
      ))}
    </div>
  );
}

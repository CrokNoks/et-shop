export default function RecipesLoading() {
  return (
    <div className="p-8 animate-pulse">
      <div className="w-48 h-8 bg-[var(--es-skeleton)] rounded-xl mb-8" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-[var(--es-skeleton)] rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

export default function RecipeDetailLoading() {
  return (
    <div className="p-8 animate-pulse">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-gray-200 rounded-2xl" />
        <div className="flex flex-col gap-2">
          <div className="w-48 h-8 bg-gray-200 rounded-xl" />
          <div className="w-32 h-4 bg-gray-100 rounded-xl" />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default function LoyaltyCardsLoading() {
  return (
    <div className="p-8 animate-pulse">
      <div className="w-56 h-8 bg-gray-200 rounded-xl mb-8" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

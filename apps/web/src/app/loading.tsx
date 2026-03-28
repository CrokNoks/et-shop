export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 animate-pulse">
      <div className="w-64 h-8 bg-gray-200 rounded-xl" />
      <div className="w-48 h-4 bg-gray-100 rounded-lg" />
      <div className="w-full max-w-2xl mt-8 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

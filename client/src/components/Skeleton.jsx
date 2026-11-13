export function ReadingCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-3 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-16 h-10 bg-gray-200 rounded-lg"></div>
        <div className="space-y-2">
          <div className="w-32 h-4 bg-gray-200 rounded"></div>
          <div className="w-24 h-3 bg-gray-200 rounded"></div>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="w-12 h-7 bg-gray-200 rounded-lg"></div>
        <div className="w-14 h-7 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 text-center animate-pulse">
      <div className="w-16 h-3 bg-gray-200 rounded mx-auto mb-2"></div>
      <div className="w-12 h-7 bg-gray-200 rounded mx-auto mb-1"></div>
      <div className="w-8 h-2 bg-gray-200 rounded mx-auto"></div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
      <div className="w-32 h-4 bg-gray-200 rounded mb-6"></div>
      <div className="w-full h-52 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300">
        Loading chart...
      </div>
    </div>
  );
}

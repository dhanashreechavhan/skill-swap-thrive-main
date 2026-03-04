import { StarRating } from "./StarRating";

interface Stats {
  averageRating: number;
  totalReviews: number;
  distribution: Record<number, number>;
}

export const RatingSummary = ({ stats }: { stats: Stats }) => {
  const { averageRating, totalReviews, distribution } = stats;

  return (
    <div className="flex flex-col sm:flex-row gap-6 p-6 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl border border-violet-100">
      
      {/* Big number on the left */}
      <div className="flex flex-col items-center justify-center min-w-[120px] gap-2">
        <span className="text-6xl font-black text-slate-800 leading-none">
          {averageRating.toFixed(1)}
        </span>
        <StarRating value={averageRating} readonly size="sm" />
        <span className="text-xs text-slate-500">
          {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
        </span>
      </div>

      {/* Bar chart on the right */}
      <div className="flex-1 space-y-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = distribution[star] || 0;
          const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2.5">
              <span className="text-xs text-slate-500 w-3">{star}</span>
              <div className="flex-1 h-2.5 bg-white rounded-full overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 w-4">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

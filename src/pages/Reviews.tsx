import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { ReviewCard } from "@/components/ReviewCard";
import { ReviewForm } from "@/components/ReviewForm";
import { RatingSummary } from "@/components/RatingSummary";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquarePlus, Star } from "lucide-react";

// TypeScript types (just describing what data looks like)
interface Review {
  _id: string;
  reviewer: { _id: string; name: string; avatar?: string; profilePhoto?: string };
  rating: number;
  title?: string;
  comment: string;
  skillTaught?: string;
  tags: string[];
  helpfulVotes: number;
  createdAt: string;
}
interface Stats       { averageRating: number; totalReviews: number; distribution: Record<number, number>; }
interface Pagination  { total: number; page: number; pages: number; }

// Get the logged-in user's ID from the token stored in browser
function getCurrentUserId(): string | null {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload?.id || payload?.userId || null;
  } catch { return null; }
}

export default function ReviewsPage() {
  const { userId } = useParams<{ userId: string }>();

  const [reviews,    setReviews]    = useState<Review[]>([]);
  const [stats,      setStats]      = useState<Stats>({ averageRating: 0, totalReviews: 0, distribution: {1:0,2:0,3:0,4:0,5:0} });
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, pages: 1 });
  const [sort,       setSort]       = useState("newest");
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);

  const currentUserId = getCurrentUserId();
  const canReview = currentUserId && currentUserId !== userId;

  // Fetch reviews from backend
  const fetchReviews = useCallback(async (page = 1) => {
  if (!userId) return;
  setLoading(true);
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `http://localhost:5000/api/reviews/user/${userId}?page=${page}&limit=8&sort=${sort}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    setReviews(data.reviews || []);
    setStats(data.stats);
    setPagination(data.pagination);
  } catch { /* silent */ }
  finally { setLoading(false); }
}, [userId, sort]); 

  // Run when page loads or sort changes
  useEffect(() => { fetchReviews(1); }, [fetchReviews]);

  // Delete a review
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    const token = localStorage.getItem("token");
   await fetch(`http://localhost:5000/api/reviews/${id}`, {
  method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchReviews(pagination.page);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">

        {/* Page title row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 rounded-xl">
              <Star className="w-6 h-6 text-amber-500 fill-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Reviews & Feedback</h1>
              <p className="text-sm text-slate-500">
                {stats.totalReviews} {stats.totalReviews === 1 ? "review" : "reviews"}
              </p>
            </div>
          </div>
          {canReview && (
            <Button onClick={() => setShowForm(true)} className="bg-violet-600 hover:bg-violet-700 gap-2">
              <MessageSquarePlus className="w-4 h-4" /> Write a Review
            </Button>
          )}
        </div>

        {/* Rating summary (only shows if there are reviews) */}
        {!loading && stats.totalReviews > 0 && <RatingSummary stats={stats} />}

        {/* Sort dropdown */}
        {reviews.length > 0 && (
          <div className="flex justify-end">
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-44 bg-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="highest">Highest rated</SelectItem>
                <SelectItem value="lowest">Lowest rated</SelectItem>
                <SelectItem value="helpful">Most helpful</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Loading skeletons / empty state / review cards */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
              <Star className="w-7 h-7 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">No reviews yet</h3>
            <p className="text-slate-400 text-sm">Be the first to leave a review!</p>
            {canReview && (
              <Button onClick={() => setShowForm(true)} variant="outline" className="mt-2 border-violet-200 text-violet-600">
                Write first review
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <ReviewCard
                key={r._id}
                review={r}
                currentUserId={currentUserId || undefined}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Page buttons (1, 2, 3 ...) */}
        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2 pt-4">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === pagination.page ? "default" : "outline"}
                size="sm"
                className={p === pagination.page ? "bg-violet-600 hover:bg-violet-700" : ""}
                onClick={() => fetchReviews(p)}
              >
                {p}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Write Review popup */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquarePlus className="w-5 h-5 text-violet-600" />
              Write a Review
            </DialogTitle>
          </DialogHeader>
          <ReviewForm
            revieweeId={userId!}
            revieweeName="this user"
            onSuccess={() => { setShowForm(false); fetchReviews(1); }}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

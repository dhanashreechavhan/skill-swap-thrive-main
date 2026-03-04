import { useState } from "react";
import { StarRating, ratingLabel } from "./StarRating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThumbsUp, Flag, MoreHorizontal, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface ReviewCardProps {
  review: Review;
  currentUserId?: string;
  onDelete?: (id: string) => void;
  onEdit?: (review: Review) => void;
}

// Shows "2 days ago", "3 months ago" etc.
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export const ReviewCard = ({ review, currentUserId, onDelete, onEdit }: ReviewCardProps) => {
  const [helpful, setHelpful] = useState(review.helpfulVotes);
  const [voted, setVoted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isOwner = currentUserId === review.reviewer._id;
  const avatar = review.reviewer.profilePhoto || review.reviewer.avatar;

  const handleHelpful = async () => {
    if (voted) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:5000/api/reviews/${review._id}/helpful`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setHelpful((h) => h + 1);
      setVoted(true);
    } catch { /* silent fail */ }
  };

  const handleReport = async () => {
    if (!confirm("Report this review as inappropriate?")) return;
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:5000/api/reviews/${review._id}/report`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    alert("Review reported! Our team will look into it.");
    setMenuOpen(false);
  };

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all duration-200">
      
      {/* Top row: avatar + name + stars + menu */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar circle */}
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
            {avatar ? (
              <img src={avatar} alt={review.reviewer.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-sm">
                {review.reviewer.name?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">{review.reviewer.name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-400">{timeAgo(review.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <div className="flex flex-col items-end gap-0.5">
            <StarRating value={review.rating} readonly size="sm" />
            <span className="text-xs text-amber-500 font-medium">{ratingLabel(review.rating)}</span>
          </div>
          {/* 3-dot menu */}
          <div className="relative">
            <Button
              variant="ghost" size="icon"
              className="w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
            {menuOpen && (
              <div className="absolute right-0 top-8 bg-white border border-slate-100 rounded-xl shadow-lg z-20 min-w-[130px] py-1">
                {isOwner ? (
                  <>
                    <button onClick={() => { onEdit?.(review); setMenuOpen(false); }}
                      className="w-full px-4 py-2 text-sm text-left text-slate-700 hover:bg-slate-50">
                      Edit review
                    </button>
                    <button onClick={() => { onDelete?.(review._id); setMenuOpen(false); }}
                      className="w-full px-4 py-2 text-sm text-left text-red-500 hover:bg-red-50">
                      Delete
                    </button>
                  </>
                ) : (
                  <button onClick={handleReport}
                    className="w-full px-4 py-2 text-sm text-left text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                    <Flag className="w-3.5 h-3.5" /> Report
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Skill badge */}
      {review.skillTaught && (
        <Badge variant="secondary" className="mb-2 text-xs bg-violet-50 text-violet-700 border-violet-100">
          {review.skillTaught}
        </Badge>
      )}

      {/* Review title */}
      {review.title && (
        <h4 className="font-semibold text-slate-800 text-sm mb-1">{review.title}</h4>
      )}

      {/* Review text */}
      <p className="text-slate-600 text-sm leading-relaxed">{review.comment}</p>

      {/* Tags */}
      {review.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {review.tags.map((tag) => (
            <span key={tag} className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 capitalize">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Bottom: helpful button */}
      <div className="flex items-center mt-4 pt-3 border-t border-slate-50">
        <button
          onClick={handleHelpful}
          disabled={voted}
          className={cn(
            "flex items-center gap-1.5 text-xs transition-colors",
            voted ? "text-violet-600 cursor-default" : "text-slate-400 hover:text-violet-600 cursor-pointer"
          )}
        >
          <ThumbsUp className={cn("w-3.5 h-3.5", voted && "fill-violet-600")} />
          Helpful {helpful > 0 && `(${helpful})`}
        </button>
      </div>
    </div>
  );
};

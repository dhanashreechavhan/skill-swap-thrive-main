import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (val: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeMap = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" };

export const StarRating = ({ value, onChange, readonly = false, size = "md" }: StarRatingProps) => {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div className="flex gap-1" onMouseLeave={() => !readonly && setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          className={cn(
            "transition-all duration-150",
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
          )}
          aria-label={`Rate ${star} stars`}
        >
          <Star
            className={cn(
              sizeMap[size],
              "transition-colors duration-150",
              active >= star
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-slate-300"
            )}
          />
        </button>
      ))}
    </div>
  );
};

export const ratingLabel = (r: number) =>
  ["", "Poor", "Fair", "Good", "Very Good", "Excellent"][Math.round(r)] || "";

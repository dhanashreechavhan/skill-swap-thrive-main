import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { StarRating, ratingLabel } from "./StarRating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// These are the clickable tag options
const TAGS = ["patient", "knowledgeable", "clear", "punctual", "friendly", "engaging", "prepared"] as const;

// Rules for the form fields
const schema = z.object({
  rating:      z.number().min(1, "Please select a rating").max(5),
  title:       z.string().max(100).optional(),
  comment:     z.string().min(10, "Please write at least 10 characters").max(1000),
  skillTaught: z.string().max(60).optional(),
  isPublic:    z.boolean(),
});
type FormData = z.infer<typeof schema>;

interface ReviewFormProps {
  revieweeId:   string;
  revieweeName: string;
  sessionId?:   string;
  onSuccess?:   () => void;
  onCancel?:    () => void;
}

export const ReviewForm = ({ revieweeId, revieweeName, sessionId, onSuccess, onCancel }: ReviewFormProps) => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const {
    register, handleSubmit, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { rating: 0, isPublic: true, comment: "", title: "", skillTaught: "" },
  });

  const rating   = watch("rating");
  const isPublic = watch("isPublic");
  const comment  = watch("comment");

  // Add/remove tag when clicked
  const toggleTag = (tag: string) =>
    setSelectedTags((p) => p.includes(tag) ? p.filter((t) => t !== tag) : [...p, tag]);

  // Send review to backend
  const onSubmit = async (data: FormData) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...data, revieweeId, tags: selectedTags, sessionId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      setSubmitted(true);
      setTimeout(() => onSuccess?.(), 1500);
    } catch (err: any) {
      alert(err.message || "Something went wrong. Please try again.");
    }
  };

  // Show success screen after submitting
  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <CheckCircle2 className="w-14 h-14 text-emerald-500 animate-bounce" />
        <h3 className="text-xl font-semibold text-slate-800">Review Submitted!</h3>
        <p className="text-slate-500 text-sm">Thanks for reviewing {revieweeName}.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

      {/* Star picker */}
      <div className="flex flex-col items-center gap-2 py-5 bg-slate-50 rounded-xl border border-slate-100">
        <p className="text-sm text-slate-500">
          How was your session with <span className="font-semibold text-slate-700">{revieweeName}</span>?
        </p>
        <StarRating value={rating} onChange={(v) => setValue("rating", v, { shouldValidate: true })} size="lg" />
        {rating > 0 && <p className="text-amber-500 font-medium text-sm">{ratingLabel(rating)}</p>}
        {errors.rating && <p className="text-red-500 text-xs">{errors.rating.message}</p>}
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-slate-700">
          Review title <span className="text-slate-400">(optional)</span>
        </Label>
        <Input placeholder="Summarise your experience in one line..." {...register("title")} className="focus-visible:ring-violet-400" />
      </div>

      {/* Comment box */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-slate-700">
          Your review <span className="text-red-400">*</span>
        </Label>
        <Textarea
          placeholder="What did you learn? How was the session? What made it great?"
          rows={4} {...register("comment")}
          className="resize-none focus-visible:ring-violet-400"
        />
        <div className="flex justify-between items-center">
          {errors.comment
            ? <p className="text-red-500 text-xs">{errors.comment.message}</p>
            : <span />}
          <span className={cn("text-xs", comment.length > 900 ? "text-red-400" : "text-slate-400")}>
            {comment.length}/1000
          </span>
        </div>
      </div>

      {/* Skill name */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-slate-700">
          Skill exchanged <span className="text-slate-400">(optional)</span>
        </Label>
        <Input placeholder="e.g. Python, Guitar, Graphic Design..." {...register("skillTaught")} className="focus-visible:ring-violet-400" />
      </div>

      {/* Clickable tags */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">
          Tags <span className="text-slate-400">(click all that apply)</span>
        </Label>
        <div className="flex flex-wrap gap-2">
          {TAGS.map((tag) => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "outline"}
              onClick={() => toggleTag(tag)}
              className={cn(
                "cursor-pointer capitalize transition-all select-none",
                selectedTags.includes(tag)
                  ? "bg-violet-600 hover:bg-violet-700 text-white"
                  : "hover:border-violet-400 hover:text-violet-600"
              )}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Public / private toggle */}
      <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
        <div>
          <p className="text-sm font-medium text-slate-700">Make review public</p>
          <p className="text-xs text-slate-400">Others can see this on {revieweeName}'s profile</p>
        </div>
        <Switch checked={isPublic} onCheckedChange={(v) => setValue("isPublic", v)} />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-1">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="flex-1 bg-violet-600 hover:bg-violet-700 gap-2"
        >
          {isSubmitting
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
            : <><Send className="w-4 h-4" /> Submit Review</>}
        </Button>
      </div>
    </form>
  );
};

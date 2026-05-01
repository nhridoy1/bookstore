import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Star, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface Review {
  id: string;
  book_id: string;
  user_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  profiles?: { display_name: string | null; avatar_url: string | null } | null;
}

export default function BookReviews({ bookId }: { bookId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const { data: reviews = [] } = useQuery({
    queryKey: ["book-reviews", bookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("book_reviews")
        .select("*")
        .eq("book_id", bookId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data || []) as Omit<Review, "profiles">[];
      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
      let profileMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", userIds);
        (profs || []).forEach((p: any) => profileMap.set(p.user_id, { display_name: p.display_name, avatar_url: p.avatar_url }));
      }
      return rows.map((r) => ({ ...r, profiles: profileMap.get(r.user_id) || null })) as Review[];
    },
  });

  const myReview = user ? reviews.find((r) => r.user_id === user.id) : undefined;

  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setReviewText(myReview.review_text || "");
    }
  }, [myReview?.id]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in");
      if (rating < 1 || rating > 5) throw new Error("Please select a rating from 1 to 5");
      const trimmed = reviewText.trim().slice(0, 1000);
      if (myReview) {
        const { error } = await supabase
          .from("book_reviews")
          .update({ rating, review_text: trimmed || null })
          .eq("id", myReview.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("book_reviews").insert({
          book_id: bookId,
          user_id: user.id,
          rating,
          review_text: trimmed || null,
        } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["book-reviews", bookId] });
      toast({ title: myReview ? "Review updated" : "Review submitted" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("book_reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["book-reviews", bookId] });
      setRating(0);
      setReviewText("");
      toast({ title: "Review deleted" });
    },
  });

  const avg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  return (
    <div className="mt-10">
      <div className="flex items-center gap-2 mb-6">
        <Star className="h-5 w-5 text-primary fill-primary" />
        <h2 className="font-heading text-xl font-bold">
          Reviews ({reviews.length})
        </h2>
        {reviews.length > 0 && (
          <span className="text-sm text-muted-foreground ml-2">
            Avg {avg.toFixed(1)} / 5
          </span>
        )}
      </div>

      {user ? (
        <div className="mb-8 rounded-lg border p-4 bg-card">
          <p className="text-sm font-medium mb-2">
            {myReview ? "Update your review" : "Write a review"}
          </p>
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1"
                aria-label={`Rate ${n} stars`}
              >
                <Star
                  className={`h-6 w-6 transition-colors ${
                    n <= (hoverRating || rating)
                      ? "fill-primary text-primary"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm text-muted-foreground">{rating} / 5</span>
            )}
          </div>
          <Textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value.slice(0, 1000))}
            placeholder="Share your thoughts about this book (optional)"
            rows={3}
            maxLength={1000}
          />
          <div className="flex items-center gap-2 mt-2">
            <Button
              size="sm"
              disabled={rating < 1 || submitMutation.isPending}
              onClick={() => submitMutation.mutate()}
            >
              {submitMutation.isPending
                ? "Saving..."
                : myReview
                ? "Update Review"
                : "Submit Review"}
            </Button>
            {myReview && (
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => deleteMutation.mutate(myReview.id)}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mb-6">
          Sign in to leave a review.
        </p>
      )}

      <div className="space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="flex gap-3 border-b pb-4 last:border-0">
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarImage src={r.profiles?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {(r.profiles?.display_name || "A")[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">
                  {r.profiles?.display_name || "Anonymous"}
                </span>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`h-3.5 w-3.5 ${
                        n <= r.rating
                          ? "fill-primary text-primary"
                          : "text-muted-foreground/40"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(r.created_at), "MMM d, yyyy")}
                </span>
              </div>
              {r.review_text && (
                <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">
                  {r.review_text}
                </p>
              )}
            </div>
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="text-center text-muted-foreground py-6">
            No reviews yet. Be the first to review!
          </p>
        )}
      </div>
    </div>
  );
}

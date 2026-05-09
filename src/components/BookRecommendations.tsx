import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import BookCard from "@/components/BookCard";
import { Sparkles } from "lucide-react";

/**
 * Hybrid book recommender.
 *
 * Signals combined into a single score per candidate book:
 *  1. Content-based: +3 per overlap with categories the user has bought/borrowed
 *  2. Collaborative ("users who bought X also bought Y"):
 *     +2 per co-purchase by another user who shares ≥1 book with the current user
 *  3. Quality: + (avg_rating) — books with higher avg rating float up
 *  4. Popularity: +0.1 per total order_item row (light tie-breaker)
 *  5. Seasonal boost: +1.5 if the book's category name matches the current season
 *     (e.g. "Horror" in October, "Romance" in February, "Children" in December)
 *  6. Featured boost: +1 if is_featured
 *
 * Books the user already purchased / borrowed / wishlisted are excluded.
 * Falls back to featured + top-rated when the user has no history.
 */

const SEASONAL_KEYWORDS: Record<number, string[]> = {
  0: ["self", "productivity", "business"],          // Jan — new year
  1: ["romance", "love", "poetry"],                  // Feb
  2: ["history", "biography"],                       // Mar
  3: ["nature", "science"],                          // Apr
  4: ["travel", "adventure"],                        // May
  5: ["fiction", "thriller", "mystery"],             // Jun — summer reads
  6: ["fiction", "thriller", "mystery", "fantasy"],  // Jul
  7: ["fiction", "thriller", "fantasy"],             // Aug
  8: ["education", "academic", "school"],            // Sep — back to school
  9: ["horror", "mystery", "thriller"],              // Oct — Halloween
  10: ["cooking", "food", "family"],                 // Nov
  11: ["children", "fantasy", "holiday", "family"],  // Dec
};

function getSeasonalBoost(categoryName: string | undefined): number {
  if (!categoryName) return 0;
  const month = new Date().getMonth();
  const keywords = SEASONAL_KEYWORDS[month] || [];
  const lower = categoryName.toLowerCase();
  return keywords.some((k) => lower.includes(k)) ? 1.5 : 0;
}

export default function BookRecommendations() {
  const { user } = useAuth();

  const { data: recommendations = [] } = useQuery({
    queryKey: ["recommendations-v2", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // ----- 1. Gather user history -----
      const [myOrderItems, myBorrows, myWishlist] = await Promise.all([
        supabase
          .from("order_items")
          .select("book_id, books!inner(category_id, user_id:publisher_id), orders!inner(user_id)")
          .eq("orders.user_id", user.id),
        supabase
          .from("book_borrows")
          .select("book_id, books(category_id)")
          .eq("user_id", user.id),
        supabase.from("wishlists").select("book_id").eq("user_id", user.id),
      ]);

      const ownedBookIds = new Set<string>();
      const userCategoryIds = new Set<string>();

      (myOrderItems.data || []).forEach((r: any) => {
        ownedBookIds.add(r.book_id);
        if (r.books?.category_id) userCategoryIds.add(r.books.category_id);
      });
      (myBorrows.data || []).forEach((r: any) => {
        ownedBookIds.add(r.book_id);
        if (r.books?.category_id) userCategoryIds.add(r.books.category_id);
      });
      (myWishlist.data || []).forEach((r: any) => ownedBookIds.add(r.book_id));

      // ----- 2. Collaborative signal: find peers + co-purchased books -----
      // Only meaningful when user has bought something
      const coBoughtCounts = new Map<string, number>();
      if (ownedBookIds.size > 0) {
        // Peers = other users who bought any of my books
        const { data: peerOrders } = await supabase
          .from("order_items")
          .select("orders!inner(user_id)")
          .in("book_id", Array.from(ownedBookIds))
          .limit(500);
        const peerIds = new Set<string>();
        (peerOrders || []).forEach((r: any) => {
          const uid = r.orders?.user_id;
          if (uid && uid !== user.id) peerIds.add(uid);
        });

        if (peerIds.size > 0) {
          const { data: peerBuys } = await supabase
            .from("order_items")
            .select("book_id, orders!inner(user_id)")
            .in("orders.user_id", Array.from(peerIds))
            .limit(1000);
          (peerBuys || []).forEach((r: any) => {
            if (!ownedBookIds.has(r.book_id)) {
              coBoughtCounts.set(r.book_id, (coBoughtCounts.get(r.book_id) || 0) + 1);
            }
          });
        }
      }

      // ----- 3. Pull candidate books -----
      // Candidates = co-bought books ∪ books in user's categories ∪ featured (fallback)
      const candidateIds = new Set<string>(coBoughtCounts.keys());
      let categoryCandidates: any[] = [];
      if (userCategoryIds.size > 0) {
        const { data } = await supabase
          .from("books")
          .select("*, categories(name)")
          .in("category_id", Array.from(userCategoryIds))
          .limit(40);
        (data || []).forEach((b) => candidateIds.add(b.id));
        categoryCandidates = data || [];
      }

      // Always add featured as filler
      const { data: featured } = await supabase
        .from("books")
        .select("*, categories(name)")
        .eq("is_featured", true)
        .limit(20);
      (featured || []).forEach((b) => candidateIds.add(b.id));

      candidateIds.forEach((id) => ownedBookIds.has(id) && candidateIds.delete(id));
      if (candidateIds.size === 0) return featured || [];

      // Fetch full data for any candidates we don't yet have
      const haveIds = new Set([...categoryCandidates, ...(featured || [])].map((b: any) => b.id));
      const missingIds = Array.from(candidateIds).filter((id) => !haveIds.has(id));
      let extra: any[] = [];
      if (missingIds.length > 0) {
        const { data } = await supabase
          .from("books")
          .select("*, categories(name)")
          .in("id", missingIds);
        extra = data || [];
      }
      const allBooks = [
        ...categoryCandidates,
        ...(featured || []),
        ...extra,
      ].filter((b, i, arr) => arr.findIndex((x) => x.id === b.id) === i)
       .filter((b) => !ownedBookIds.has(b.id));

      // ----- 4. Rating + popularity signals -----
      const bookIds = allBooks.map((b) => b.id);
      const [reviewsRes, popularityRes] = await Promise.all([
        supabase.from("book_reviews").select("book_id, rating").in("book_id", bookIds),
        supabase.from("order_items").select("book_id").in("book_id", bookIds).limit(1000),
      ]);
      const ratingMap = new Map<string, { sum: number; n: number }>();
      (reviewsRes.data || []).forEach((r: any) => {
        const cur = ratingMap.get(r.book_id) || { sum: 0, n: 0 };
        cur.sum += r.rating;
        cur.n += 1;
        ratingMap.set(r.book_id, cur);
      });
      const popMap = new Map<string, number>();
      (popularityRes.data || []).forEach((r: any) => {
        popMap.set(r.book_id, (popMap.get(r.book_id) || 0) + 1);
      });

      // ----- 5. Score -----
      const scored = allBooks.map((b: any) => {
        let score = 0;
        if (b.category_id && userCategoryIds.has(b.category_id)) score += 3;
        score += (coBoughtCounts.get(b.id) || 0) * 2;
        const r = ratingMap.get(b.id);
        if (r && r.n > 0) score += r.sum / r.n;
        score += (popMap.get(b.id) || 0) * 0.1;
        score += getSeasonalBoost(b.categories?.name);
        if (b.is_featured) score += 1;
        return { ...b, _score: score };
      });

      scored.sort((a, b) => b._score - a._score);
      return scored.slice(0, 4);
    },
    enabled: !!user,
  });

  if (!user || recommendations.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="flex items-center gap-2 mb-8">
        <Sparkles className="h-6 w-6 text-primary" />
        <h2 className="font-heading text-3xl font-bold">Recommended for You</h2>
      </div>
      <div className="grid gap-6 grid-cols-2 md:grid-cols-4">
        {recommendations.map((book: any) => (
          <BookCard key={book.id} {...book} category_name={book.categories?.name} />
        ))}
      </div>
    </section>
  );
}

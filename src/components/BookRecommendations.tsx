import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import BookCard from "@/components/BookCard";
import { Sparkles } from "lucide-react";

export default function BookRecommendations() {
  const { user } = useAuth();

  const { data: recommendations = [] } = useQuery({
    queryKey: ["recommendations", user?.id],
    queryFn: async () => {
      // 1. Get user's purchased/borrowed book category IDs
      const [ordersRes, borrowsRes] = await Promise.all([
        supabase
          .from("order_items")
          .select("books(category_id)")
          .limit(50),
        supabase
          .from("book_borrows")
          .select("books(category_id)")
          .eq("user_id", user!.id)
          .limit(50),
      ]);

      const userCategoryIds = new Set<string>();
      const userBookIds = new Set<string>();

      // Collect categories from orders
      ordersRes.data?.forEach((item: any) => {
        if (item.books?.category_id) userCategoryIds.add(item.books.category_id);
      });
      borrowsRes.data?.forEach((item: any) => {
        if (item.books?.category_id) userCategoryIds.add(item.books.category_id);
      });

      if (userCategoryIds.size === 0) {
        // No purchase history — return popular/featured books
        const { data } = await supabase
          .from("books")
          .select("*, categories(name)")
          .eq("is_featured", true)
          .limit(4);
        return data || [];
      }

      // 2. Find other users who bought books in the same categories
      const { data: similarOrders } = await supabase
        .from("order_items")
        .select("books(id, category_id)")
        .limit(200);

      const recommendedBookIds = new Set<string>();
      similarOrders?.forEach((item: any) => {
        if (item.books?.id && !userBookIds.has(item.books.id)) {
          recommendedBookIds.add(item.books.id);
        }
      });

      // 3. Get books from same categories that user hasn't interacted with
      const categoryArray = Array.from(userCategoryIds);
      const { data: recBooks } = await supabase
        .from("books")
        .select("*, categories(name)")
        .in("category_id", categoryArray)
        .order("is_featured", { ascending: false })
        .limit(8);

      return recBooks || [];
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
        {recommendations.slice(0, 4).map((book: any) => (
          <BookCard key={book.id} {...book} category_name={(book.categories as any)?.name} />
        ))}
      </div>
    </section>
  );
}

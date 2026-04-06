import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Heart, ShoppingCart, Trash2, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

export default function Wishlist() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: wishlist = [], isLoading } = useQuery({
    queryKey: ["wishlist", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wishlists")
        .select("*, books(id, title, author, price, cover_image_url, stock_quantity)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("wishlists").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast({ title: "Removed from wishlist" });
    },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-7 w-7 text-primary" />
          <h1 className="font-heading text-3xl font-bold">My Wishlist</h1>
        </div>
        {isLoading ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />)}</div>
        ) : wishlist.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground mb-4">Your wishlist is empty</p>
            <Button asChild><Link to="/books">Browse Books</Link></Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wishlist.map((item: any) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Link to={`/books/${item.books?.id}`} className="h-24 w-16 rounded bg-muted overflow-hidden flex-shrink-0">
                      {item.books?.cover_image_url ? (
                        <img src={item.books.cover_image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full flex items-center justify-center"><BookOpen className="h-6 w-6 text-muted-foreground/30" /></div>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/books/${item.books?.id}`} className="font-heading font-semibold hover:text-primary truncate block">{item.books?.title}</Link>
                      <p className="text-sm text-muted-foreground">{item.books?.author}</p>
                      <p className="font-bold text-primary mt-1">${Number(item.books?.price || 0).toFixed(2)}</p>
                      <div className="flex gap-2 mt-2">
                        {item.books?.stock_quantity > 0 && (
                          <Button size="sm" variant="outline" onClick={() => addToCart(item.books.id)}>
                            <ShoppingCart className="mr-1 h-3 w-3" /> Add to Cart
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeMutation.mutate(item.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

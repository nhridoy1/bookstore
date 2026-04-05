import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ShoppingCart, BookOpen, ArrowLeft } from "lucide-react";

export default function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: book, isLoading } = useQuery({
    queryKey: ["book", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("*, categories(name)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const borrowMutation = useMutation({
    mutationFn: async () => {
      if (!user || !book) throw new Error("Must be logged in");
      const { error } = await supabase.from("book_borrows").insert({
        user_id: user.id,
        book_id: book.id,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Borrow request sent!", description: "Waiting for admin/publisher approval." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) return <div className="flex min-h-screen flex-col"><Navbar /><div className="flex-1 flex items-center justify-center"><div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div></div>;
  if (!book) return <div className="flex min-h-screen flex-col"><Navbar /><div className="flex-1 flex items-center justify-center text-muted-foreground">Book not found</div></div>;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex-1">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
        <div className="grid gap-8 md:grid-cols-2">
          <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted">
            {book.cover_image_url ? (
              <img src={book.cover_image_url} alt={book.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center"><BookOpen className="h-24 w-24 text-muted-foreground/20" /></div>
            )}
          </div>
          <div className="space-y-4">
            {(book.categories as any)?.name && <Badge variant="secondary">{(book.categories as any).name}</Badge>}
            <h1 className="font-heading text-3xl font-bold md:text-4xl">{book.title}</h1>
            <p className="text-lg text-muted-foreground">by {book.author}</p>
            {book.isbn && <p className="text-sm text-muted-foreground">ISBN: {book.isbn}</p>}
            <div className="flex items-center gap-4">
              <span className="font-heading text-3xl font-bold text-primary">${book.price.toFixed(2)}</span>
              {book.is_borrowable && <Badge variant="outline" className="text-accent border-accent">Borrowable</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">{book.stock_quantity > 0 ? `${book.stock_quantity} in stock` : "Out of stock"}</p>
            {book.description && <p className="text-foreground leading-relaxed">{book.description}</p>}
            {user ? (
              <div className="flex gap-3 pt-4">
                {book.stock_quantity > 0 && (
                  <Button size="lg" onClick={() => addToCart(book.id)}>
                    <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
                  </Button>
                )}
                {book.is_borrowable && (
                  <Button size="lg" variant="outline" onClick={() => borrowMutation.mutate()} disabled={borrowMutation.isPending}>
                    <BookOpen className="mr-2 h-5 w-5" /> Request Borrow
                  </Button>
                )}
              </div>
            ) : (
              <Button size="lg" onClick={() => navigate("/auth")}>Sign in to Purchase</Button>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

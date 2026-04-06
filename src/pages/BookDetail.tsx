import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ShoppingCart, BookOpen, ArrowLeft, Heart } from "lucide-react";

export default function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [borrowDialogOpen, setBorrowDialogOpen] = useState(false);
  const [borrowMessage, setBorrowMessage] = useState("");
  const [policyAccepted, setPolicyAccepted] = useState(false);

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

  const { data: isWishlisted, refetch: refetchWishlist } = useQuery({
    queryKey: ["wishlist-check", id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("wishlists")
        .select("id")
        .eq("user_id", user!.id)
        .eq("book_id", id!)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!id,
  });

  const wishlistMutation = useMutation({
    mutationFn: async () => {
      if (!user || !id) throw new Error("Must be logged in");
      if (isWishlisted) {
        const { error } = await supabase.from("wishlists").delete().eq("id", isWishlisted.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("wishlists").insert({ user_id: user.id, book_id: id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      refetchWishlist();
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast({ title: isWishlisted ? "Removed from wishlist" : "Added to wishlist" });
    },
  });

  const borrowMutation = useMutation({
    mutationFn: async () => {
      if (!user || !book) throw new Error("Must be logged in");
      const { error } = await supabase.from("book_borrows").insert({
        user_id: user.id,
        book_id: book.id,
        status: "pending",
        user_message: borrowMessage || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Borrow request sent!", description: "Waiting for admin/publisher approval." });
      setBorrowDialogOpen(false);
      setBorrowMessage("");
      setPolicyAccepted(false);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) return <div className="flex min-h-screen flex-col"><Navbar /><div className="flex-1 flex items-center justify-center"><div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div></div>;
  if (!book) return <div className="flex min-h-screen flex-col"><Navbar /><div className="flex-1 flex items-center justify-center text-muted-foreground">Book not found</div></div>;

  const defaultPolicy = "• Book must be returned in intact condition\n• No stains, marks, or writing on pages\n• No page tear-off or damage\n• Cover must remain undamaged\n• Late returns may incur additional fees";
  const policy = book.borrow_policy || defaultPolicy;

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
            {book.is_borrowable && Number(book.borrow_price) > 0 && (
              <p className="text-sm text-muted-foreground">Borrow fee: <span className="font-semibold text-foreground">${Number(book.borrow_price).toFixed(2)}</span></p>
            )}
            {book.is_borrowable && Number(book.borrow_price) === 0 && (
              <p className="text-sm text-green-600 font-medium">Free to borrow</p>
            )}
            <p className="text-sm text-muted-foreground">{book.stock_quantity > 0 ? `${book.stock_quantity} in stock` : "Out of stock"}</p>
            {book.description && <p className="text-foreground leading-relaxed">{book.description}</p>}
            {user ? (
              <div className="flex gap-3 pt-4 flex-wrap">
                {book.stock_quantity > 0 && (
                  <Button size="lg" onClick={() => addToCart(book.id)}>
                    <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
                  </Button>
                )}
                {book.is_borrowable && (
                  <Button size="lg" variant="outline" onClick={() => setBorrowDialogOpen(true)}>
                    <BookOpen className="mr-2 h-5 w-5" /> Request Borrow
                  </Button>
                )}
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={() => wishlistMutation.mutate()}
                  className={isWishlisted ? "text-red-500" : ""}
                >
                  <Heart className={`mr-2 h-5 w-5 ${isWishlisted ? "fill-current" : ""}`} />
                  {isWishlisted ? "Wishlisted" : "Wishlist"}
                </Button>
              </div>
            ) : (
              <Button size="lg" onClick={() => navigate("/auth")}>Sign in to Purchase</Button>
            )}
          </div>
        </div>
      </div>

      {/* Borrow Dialog with Policy */}
      <Dialog open={borrowDialogOpen} onOpenChange={setBorrowDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-heading">Request to Borrow</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Borrowing Policy</p>
              <div className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground whitespace-pre-line max-h-40 overflow-y-auto">
                {policy}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="policy"
                checked={policyAccepted}
                onCheckedChange={(v) => setPolicyAccepted(!!v)}
              />
              <label htmlFor="policy" className="text-sm cursor-pointer">
                I have read and agree to the borrowing policy
              </label>
            </div>
            {Number(book.borrow_price) > 0 && (
              <p className="text-sm font-medium">Borrow fee: <span className="text-primary">${Number(book.borrow_price).toFixed(2)}</span></p>
            )}
            <div>
              <label className="text-sm font-medium">Message (optional)</label>
              <Textarea
                value={borrowMessage}
                onChange={(e) => setBorrowMessage(e.target.value)}
                placeholder="How long do you need? Any notes for the admin..."
                rows={3}
                className="mt-1"
              />
            </div>
            <Button
              className="w-full"
              onClick={() => borrowMutation.mutate()}
              disabled={!policyAccepted || borrowMutation.isPending}
            >
              {borrowMutation.isPending ? "Submitting..." : "Submit Borrow Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}

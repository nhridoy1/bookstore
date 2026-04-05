import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Minus, Plus, Trash2, ShoppingCart, CreditCard, Banknote } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Cart() {
  const { items, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [paymentMethod, setPaymentMethod] = useState<"cod" | "stripe">("cod");
  const [checkingOut, setCheckingOut] = useState(false);

  const handleCheckout = async () => {
    if (!user) { navigate("/auth"); return; }
    setCheckingOut(true);
    try {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total_amount: totalPrice,
          status: "pending",
          payment_method: paymentMethod,
          payment_status: paymentMethod === "cod" ? "unpaid" : "unpaid",
        })
        .select()
        .single();
      if (orderError) throw orderError;

      const orderItems = items.map((item) => ({
        order_id: order.id,
        book_id: item.book_id,
        quantity: item.quantity,
        price_at_purchase: item.books.price,
      }));
      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      // Clear cart from DB
      await supabase.from("cart_items").delete().eq("user_id", user.id);
      clearCart();

      if (paymentMethod === "stripe") {
        // Invoke Stripe checkout
        const { data, error } = await supabase.functions.invoke("create-checkout", {
          body: { order_id: order.id, amount: totalPrice },
        });
        if (error) throw error;
        if (data?.url) {
          window.open(data.url, "_blank");
        }
      }

      toast({ title: "Order placed!", description: paymentMethod === "cod" ? "Pay on delivery." : "Complete payment in the new tab." });
      navigate("/orders");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCheckingOut(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <ShoppingCart className="h-16 w-16 text-muted-foreground/30" />
          <p className="text-muted-foreground">Sign in to view your cart</p>
          <Button onClick={() => navigate("/auth")}>Sign In</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex-1">
        <h1 className="font-heading text-3xl font-bold mb-8">Shopping Cart</h1>
        {items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground mb-4">Your cart is empty</p>
            <Button onClick={() => navigate("/books")}>Browse Books</Button>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="h-20 w-14 rounded bg-muted overflow-hidden flex-shrink-0">
                      {item.books.cover_image_url && <img src={item.books.cover_image_url} alt={item.books.title} className="h-full w-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-semibold truncate">{item.books.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.books.author}</p>
                      <p className="font-semibold text-primary">${item.books.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="h-fit">
              <CardHeader><CardTitle className="font-heading">Order Summary</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>${totalPrice.toFixed(2)}</span></div>
                <div className="border-t pt-4 flex justify-between font-heading font-bold text-lg"><span>Total</span><span className="text-primary">${totalPrice.toFixed(2)}</span></div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-3">Payment Method</p>
                  <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "cod" | "stripe")} className="space-y-2">
                    <div className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Banknote className="h-4 w-4 text-green-600" /> Cash on Delivery
                      </Label>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="stripe" id="stripe" />
                      <Label htmlFor="stripe" className="flex items-center gap-2 cursor-pointer flex-1">
                        <CreditCard className="h-4 w-4 text-blue-600" /> Pay Online (Stripe)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button className="w-full" size="lg" onClick={handleCheckout} disabled={checkingOut}>
                  {checkingOut ? "Processing..." : paymentMethod === "stripe" ? "Pay & Place Order" : "Place Order (COD)"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

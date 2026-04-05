import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CreditCard, Banknote, CheckCircle2, Circle, Package, Truck } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const ORDER_STEPS = ["pending", "processing", "shipped", "delivered"];

function OrderStepper({ currentStatus }: { currentStatus: string }) {
  const currentIndex = ORDER_STEPS.indexOf(currentStatus);
  if (currentStatus === "cancelled") {
    return <Badge variant="destructive">Cancelled</Badge>;
  }
  return (
    <div className="flex items-center gap-1 mt-3">
      {ORDER_STEPS.map((step, i) => {
        const done = i <= currentIndex;
        return (
          <div key={step} className="flex items-center gap-1">
            <div className="flex flex-col items-center">
              {done ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/30" />
              )}
              <span className={`text-[10px] mt-0.5 capitalize ${done ? "text-foreground font-medium" : "text-muted-foreground"}`}>{step}</span>
            </div>
            {i < ORDER_STEPS.length - 1 && (
              <div className={`h-0.5 w-6 mb-4 ${i < currentIndex ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Orders() {
  const { user } = useAuth();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, books(title, author, cover_image_url))")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex-1">
        <h1 className="font-heading text-3xl font-bold mb-8">Order History</h1>
        {isLoading ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />)}</div>
        ) : orders.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">No orders yet.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(order.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <Badge className={statusColors[order.status] || ""}>{order.status}</Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {order.payment_method === "stripe" ? <CreditCard className="h-3 w-3" /> : <Banknote className="h-3 w-3" />}
                        {order.payment_method === "stripe" ? "Online" : "COD"}
                        {order.payment_status === "paid" && <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0">Paid</Badge>}
                      </div>
                      <p className="font-heading font-bold text-primary">${Number(order.total_amount).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {order.order_items?.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3 text-sm">
                        <div className="h-10 w-7 rounded bg-muted overflow-hidden flex-shrink-0">
                          {item.books?.cover_image_url && <img src={item.books.cover_image_url} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <span className="flex-1 truncate">{item.books?.title}</span>
                        <span className="text-muted-foreground">×{item.quantity}</span>
                        <span>${Number(item.price_at_purchase).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <OrderStepper currentStatus={order.status} />
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

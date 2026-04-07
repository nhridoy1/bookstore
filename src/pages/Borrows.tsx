import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function Borrows() {
  const { user } = useAuth();

  const { data: borrows = [], isLoading } = useQuery({
    queryKey: ["borrows", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("book_borrows")
        .select("*, books(title, author, cover_image_url)")
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
        <h1 className="font-heading text-3xl font-bold mb-8">My Borrows</h1>
        {isLoading ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />)}</div>
        ) : borrows.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">No borrows yet.</p>
        ) : (
          <div className="space-y-4">
            {borrows.map((borrow: any) => (
              <Card key={borrow.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="h-16 w-11 rounded bg-muted overflow-hidden flex-shrink-0">
                    {borrow.books?.cover_image_url && <img src={borrow.books.cover_image_url} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading font-semibold">{borrow.books?.title}</h3>
                    <p className="text-sm text-muted-foreground">{borrow.books?.author}</p>
                    <p className="text-xs text-muted-foreground">
                      {borrow.status === "pending" ? "Awaiting approval" : 
                       borrow.status === "rejected" ? "Request rejected" :
                       `Due: ${format(new Date(borrow.due_date), "MMM d, yyyy")}${borrow.borrow_days ? ` (${borrow.borrow_days} days)` : ""}`}
                    </p>
                    {borrow.status === "borrowed" && borrow.approved_at && (
                      <p className="text-xs text-green-600 font-medium">
                        Approved — You have {borrow.borrow_days || 14} days to return
                      </p>
                    )}
                  </div>
                  <Badge variant={
                    borrow.status === "returned" ? "secondary" : 
                    borrow.status === "overdue" || borrow.status === "rejected" ? "destructive" : 
                    borrow.status === "pending" ? "outline" : "default"
                  }>
                    {borrow.status}
                  </Badge>
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

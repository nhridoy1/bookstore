import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BookOpen } from "lucide-react";

export default function Categories() {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex-1">
        <h1 className="font-heading text-3xl font-bold mb-8">Categories</h1>
        {isLoading ? (
          <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />)}
          </div>
        ) : categories.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">No categories yet.</p>
        ) : (
          <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {categories.map((cat) => (
              <Link key={cat.id} to={`/books?category=${cat.id}`} className="group rounded-lg border bg-card p-6 text-center hover:shadow-book transition-all hover:-translate-y-1">
                <BookOpen className="mx-auto h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-heading font-semibold text-lg">{cat.name}</h3>
                {cat.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{cat.description}</p>}
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

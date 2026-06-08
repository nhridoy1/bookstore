import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BookOpen, ArrowUpRight } from "lucide-react";

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
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-12 flex-1">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm uppercase tracking-[0.2em] text-primary font-medium mb-3">Explore</p>
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground">Browse by Category</h1>
          <p className="text-muted-foreground mt-3">Find your next read across our curated shelves.</p>
        </div>
        {isLoading ? (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : categories.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">No categories yet.</p>
        ) : (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {categories.map((cat, idx) => {
              // Alternate accent treatments for visual rhythm
              const isAccent = idx % 5 === 0;
              return (
                <Link
                  key={cat.id}
                  to={`/books?category=${cat.id}`}
                  className={`group relative overflow-hidden rounded-xl border p-6 transition-all hover:-translate-y-1 hover:shadow-book ${
                    isAccent
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-card-foreground border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className={`rounded-lg p-2 ${isAccent ? "bg-primary-foreground/15" : "bg-primary/10"}`}>
                      <BookOpen className={`h-5 w-5 ${isAccent ? "text-primary-foreground" : "text-primary"}`} />
                    </div>
                    <ArrowUpRight className={`h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 ${isAccent ? "text-primary-foreground/70" : "text-muted-foreground"}`} />
                  </div>
                  <h3 className="font-heading font-semibold text-xl leading-tight">{cat.name}</h3>
                  {cat.description && (
                    <p className={`text-sm mt-2 line-clamp-2 ${isAccent ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      {cat.description}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

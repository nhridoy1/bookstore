import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import BookCard from "@/components/BookCard";
import BookRecommendations from "@/components/BookRecommendations";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroImage from "@/assets/hero-bookstore.jpg";
import { ArrowRight, BookOpen, Truck, CreditCard, Sparkles } from "lucide-react";

export default function Index() {
  const { data: featuredBooks = [] } = useQuery({
    queryKey: ["featured-books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("*, categories(name)")
        .eq("is_featured", true)
        .limit(8);
      if (error) throw error;
      return data;
    },
  });

  const { data: latestBooks = [] } = useQuery({
    queryKey: ["latest-books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("*, categories(name)")
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-home"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").limit(6);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative h-[75vh] min-h-[520px] overflow-hidden">
        <img src={heroImage} alt="BookStore hero" className="absolute inset-0 h-full w-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <div className="relative container mx-auto flex h-full flex-col items-start justify-center px-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 mb-5 backdrop-blur-sm animate-fade-in">
            <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
            <span className="text-xs uppercase tracking-widest text-primary-foreground">Curated for readers</span>
          </div>
          <h1 className="font-heading text-5xl font-bold text-primary-foreground md:text-7xl lg:text-8xl mb-5 leading-[1.05] animate-fade-in">
            Stories worth<br />
            <span className="italic text-primary">getting lost</span> in.
          </h1>
          <p className="max-w-xl text-lg text-primary-foreground/85 mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Browse thousands of titles, borrow or buy — your literary journey starts here.
          </p>
          <div className="flex gap-3 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <Button size="lg" asChild>
              <Link to="/books">Browse Books <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link to="/categories">Explore Categories</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b bg-card py-14">
        <div className="container mx-auto grid gap-8 px-4 md:grid-cols-3">
          {[
            { icon: BookOpen, title: "Borrow Books", desc: "Borrow titles for 14 days at no cost" },
            { icon: Truck, title: "Fast Delivery", desc: "Get your books delivered quickly" },
            { icon: CreditCard, title: "Secure Payments", desc: "Pay safely with Stripe" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="group flex items-start gap-4 rounded-xl border border-transparent p-4 transition-all hover:border-border hover:bg-background">
              <div className="rounded-lg bg-primary/10 p-3 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-lg">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Books */}
      {featuredBooks.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-3xl font-bold">Featured Books</h2>
            <Button variant="ghost" asChild><Link to="/books">View All <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
          </div>
          <div className="grid gap-6 grid-cols-2 md:grid-cols-4">
            {featuredBooks.map((book) => (
              <BookCard key={book.id} {...book} category_name={(book.categories as any)?.name} />
            ))}
          </div>
        </section>
      )}

      {/* Categories — editorial warm treatment */}
      {categories.length > 0 && (
        <section className="relative py-20" style={{ background: "linear-gradient(180deg, hsl(var(--secondary)) 0%, hsl(var(--background)) 100%)" }}>
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-primary font-medium mb-2">Explore</p>
                <h2 className="font-heading text-4xl md:text-5xl font-bold">Browse by Category</h2>
              </div>
              <Button variant="ghost" asChild>
                <Link to="/categories">All Categories <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              {categories.map((cat, idx) => {
                const isAccent = idx === 0 || idx === 4;
                return (
                  <Link
                    key={cat.id}
                    to={`/books?category=${cat.id}`}
                    className={`group relative overflow-hidden rounded-xl border p-5 transition-all hover:-translate-y-1 hover:shadow-book ${
                      isAccent
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-card-foreground border-border hover:border-primary/40"
                    }`}
                  >
                    <BookOpen className={`h-5 w-5 mb-3 ${isAccent ? "text-primary-foreground/80" : "text-primary"}`} />
                    <h3 className="font-heading font-semibold">{cat.name}</h3>
                    {cat.description && (
                      <p className={`text-xs mt-1 line-clamp-2 ${isAccent ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
                        {cat.description}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* AI Recommendations */}
      <BookRecommendations />

      {/* Latest Books */}
      {latestBooks.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-3xl font-bold">New Arrivals</h2>
            <Button variant="ghost" asChild><Link to="/books">View All <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
          </div>
          <div className="grid gap-6 grid-cols-2 md:grid-cols-4">
            {latestBooks.map((book) => (
              <BookCard key={book.id} {...book} category_name={(book.categories as any)?.name} />
            ))}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}

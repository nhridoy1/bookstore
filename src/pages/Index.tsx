import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import BookCard from "@/components/BookCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroImage from "@/assets/hero-bookstore.jpg";
import { ArrowRight, BookOpen, Truck, CreditCard } from "lucide-react";

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
      <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
        <img src={heroImage} alt="BookStore hero" className="absolute inset-0 h-full w-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <div className="relative container mx-auto flex h-full flex-col items-center justify-center px-4 text-center">
          <h1 className="font-heading text-4xl font-bold text-primary-foreground md:text-6xl lg:text-7xl mb-4 animate-fade-in">
            Discover Your Next<br />Favorite Book
          </h1>
          <p className="max-w-xl text-lg text-primary-foreground/80 mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Browse thousands of titles, borrow or buy — your literary journey starts here.
          </p>
          <div className="flex gap-4 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <Button size="lg" asChild>
              <Link to="/books">Browse Books <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link to="/categories">Explore Categories</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b bg-card py-12">
        <div className="container mx-auto grid gap-8 px-4 md:grid-cols-3">
          {[
            { icon: BookOpen, title: "Borrow Books", desc: "Borrow titles for 14 days at no cost" },
            { icon: Truck, title: "Fast Delivery", desc: "Get your books delivered quickly" },
            { icon: CreditCard, title: "Secure Payments", desc: "Pay safely with Stripe" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-3"><Icon className="h-6 w-6 text-primary" /></div>
              <div><h3 className="font-heading font-semibold">{title}</h3><p className="text-sm text-muted-foreground">{desc}</p></div>
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

      {/* Categories */}
      {categories.length > 0 && (
        <section className="bg-card py-16">
          <div className="container mx-auto px-4">
            <h2 className="font-heading text-3xl font-bold mb-8 text-center">Browse by Category</h2>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              {categories.map((cat) => (
                <Link key={cat.id} to={`/books?category=${cat.id}`} className="rounded-lg border bg-background p-6 text-center hover:shadow-book transition-all hover:-translate-y-1">
                  <h3 className="font-heading font-semibold">{cat.name}</h3>
                  {cat.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{cat.description}</p>}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

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

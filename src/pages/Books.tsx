import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import BookCard from "@/components/BookCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function Books() {
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get("category");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter || "all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [sortBy, setSortBy] = useState("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: books = [], isLoading } = useQuery({
    queryKey: ["books", selectedCategory, search, priceRange],
    queryFn: async () => {
      let query = supabase.from("books").select("*, categories(name)").order("created_at", { ascending: false });
      if (selectedCategory && selectedCategory !== "all") query = query.eq("category_id", selectedCategory);
      if (search) query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%`);
      query = query.gte("price", priceRange[0]).lte("price", priceRange[1]);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const sortedBooks = useMemo(() => {
    const sorted = [...books];
    switch (sortBy) {
      case "price-low": return sorted.sort((a, b) => a.price - b.price);
      case "price-high": return sorted.sort((a, b) => b.price - a.price);
      case "title": return sorted.sort((a, b) => a.title.localeCompare(b.title));
      default: return sorted;
    }
  }, [books, sortBy]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex-1">
        <h1 className="font-heading text-3xl font-bold mb-8">All Books</h1>

        <div className="flex flex-col gap-4 md:flex-row md:items-center mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search books..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Sort by" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="title">Title A–Z</SelectItem>
            </SelectContent>
          </Select>
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" /> Filters
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>

        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <CollapsibleContent>
            <div className="rounded-lg border bg-card p-4 mb-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Price Range: ${priceRange[0]} – ${priceRange[1]}</label>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground">$0</span>
                  <Slider
                    min={0} max={500} step={5}
                    value={priceRange}
                    onValueChange={(v) => setPriceRange(v as [number, number])}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground">$500</span>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
        {isLoading ? (
          <div className="grid gap-6 grid-cols-2 md:grid-cols-4">
            {[...Array(8)].map((_, i) => <div key={i} className="h-80 rounded-lg bg-muted animate-pulse" />)}
          </div>
        ) : books.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">No books found.</p>
        ) : (
          <div className="grid gap-6 grid-cols-2 md:grid-cols-4">
            {sortedBooks.map((book) => <BookCard key={book.id} {...book} category_name={(book.categories as any)?.name} />)}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import BookCard from "@/components/BookCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useState, useMemo, useEffect } from "react";
import { Search, SlidersHorizontal, Star, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function Books() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFilter = searchParams.get("category");
  const authorFilter = searchParams.get("author");
  const publisherFilter = searchParams.get("publisher");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter || "all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [sortBy, setSortBy] = useState("newest");
  const [minRating, setMinRating] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  // Lookup publisher name for badge
  const { data: publisherProfile } = useQuery({
    queryKey: ["publisher-profile", publisherFilter],
    enabled: !!publisherFilter,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("display_name").eq("user_id", publisherFilter!).maybeSingle();
      return data;
    },
  });

  const { data: books = [], isLoading } = useQuery({
    queryKey: ["books", selectedCategory, search, priceRange, authorFilter, publisherFilter],
    queryFn: async () => {
      let query = supabase.from("books").select("*, categories(name)").order("created_at", { ascending: false });
      if (selectedCategory && selectedCategory !== "all") query = query.eq("category_id", selectedCategory);
      if (authorFilter) query = query.eq("author", authorFilter);
      if (publisherFilter) query = query.eq("publisher_id", publisherFilter);
      if (search) query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%`);
      query = query.gte("price", priceRange[0]).lte("price", priceRange[1]);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch average ratings for all books
  const { data: ratingsMap = {} } = useQuery({
    queryKey: ["book-ratings-avg"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("book_reviews")
        .select("book_id, rating");
      if (error) throw error;
      const map: Record<string, { avg: number; count: number }> = {};
      for (const r of data || []) {
        if (!map[r.book_id]) map[r.book_id] = { avg: 0, count: 0 };
        map[r.book_id].count++;
        map[r.book_id].avg += r.rating;
      }
      for (const id in map) {
        map[id].avg = map[id].avg / map[id].count;
      }
      return map;
    },
  });

  const sortedBooks = useMemo(() => {
    let filtered = [...books];
    // Filter by minimum rating
    if (minRating > 0) {
      filtered = filtered.filter((b) => {
        const r = ratingsMap[b.id];
        return r && r.avg >= minRating;
      });
    }
    switch (sortBy) {
      case "price-low": return filtered.sort((a, b) => a.price - b.price);
      case "price-high": return filtered.sort((a, b) => b.price - a.price);
      case "title": return filtered.sort((a, b) => a.title.localeCompare(b.title));
      case "rating-high": return filtered.sort((a, b) => (ratingsMap[b.id]?.avg || 0) - (ratingsMap[a.id]?.avg || 0));
      default: return filtered;
    }
  }, [books, sortBy, minRating, ratingsMap]);

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
        <h1 className="font-heading text-3xl font-bold mb-3">All Books</h1>

        {(authorFilter || publisherFilter) && (
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Filtered by:</span>
            {authorFilter && (
              <Badge variant="secondary" className="gap-1">
                Author: {authorFilter}
                <button onClick={() => { searchParams.delete("author"); setSearchParams(searchParams); }}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {publisherFilter && (
              <Badge variant="secondary" className="gap-1">
                Publisher: {publisherProfile?.display_name || "…"}
                <button onClick={() => { searchParams.delete("publisher"); setSearchParams(searchParams); }}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

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
              <SelectItem value="rating-high">Highest Rated</SelectItem>
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
              <div>
                <label className="text-sm font-medium mb-2 block">Minimum Rating: {minRating > 0 ? `${minRating}+ stars` : "Any"}</label>
                <div className="flex items-center gap-2">
                  {[0, 1, 2, 3, 4, 5].map((r) => (
                    <Button
                      key={r}
                      variant={minRating === r ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMinRating(r)}
                      className="gap-1"
                    >
                      {r === 0 ? "Any" : (
                        <>
                          {r} <Star className="h-3 w-3 fill-current" />
                        </>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
        {isLoading ? (
          <div className="grid gap-6 grid-cols-2 md:grid-cols-4">
            {[...Array(8)].map((_, i) => <div key={i} className="h-80 rounded-lg bg-muted animate-pulse" />)}
          </div>
        ) : sortedBooks.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">No books found.</p>
        ) : (
          <div className="grid gap-6 grid-cols-2 md:grid-cols-4">
            {sortedBooks.map((book) => (
              <BookCard
                key={book.id}
                {...book}
                category_name={(book.categories as any)?.name}
                avgRating={ratingsMap[book.id]?.avg}
                reviewCount={ratingsMap[book.id]?.count}
              />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

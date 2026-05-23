import { useQuery } from "@tanstack/react-query";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, PenLine, Building2, BookOpen } from "lucide-react";
import { useMemo, useState } from "react";

export default function Creators() {
  const { user, loading } = useAuth();
  const [search, setSearch] = useState("");

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const { data: books = [] } = useQuery({
    queryKey: ["creators-books"],
    queryFn: async () => {
      const { data, error } = await supabase.from("books").select("id, author, publisher_id");
      if (error) throw error;
      return data;
    },
  });

  const { data: publishers = [] } = useQuery({
    queryKey: ["creators-publishers"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "publisher");
      const ids = (roles || []).map((r: any) => r.user_id);
      if (ids.length === 0) return [];
      const { data: profs } = await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", ids);
      return profs || [];
    },
  });

  const authors = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of books as any[]) {
      if (!b.author) continue;
      map.set(b.author, (map.get(b.author) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [books]);

  const publisherCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of books as any[]) {
      if (!b.publisher_id) continue;
      map.set(b.publisher_id, (map.get(b.publisher_id) || 0) + 1);
    }
    return (publishers as any[]).map((p) => ({ ...p, count: map.get(p.user_id) || 0 }))
      .sort((a, b) => b.count - a.count);
  }, [publishers, books]);

  const q = search.trim().toLowerCase();
  const filteredAuthors = q ? authors.filter((a) => a.name.toLowerCase().includes(q)) : authors;
  const filteredPublishers = q
    ? publisherCounts.filter((p) => (p.display_name || "").toLowerCase().includes(q))
    : publisherCounts;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="flex items-center gap-3 mb-2">
          <PenLine className="h-7 w-7 text-primary" />
          <h1 className="font-heading text-3xl font-bold">Authors & Publishers</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Find a creator and browse their full catalog.</p>

        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs defaultValue="authors">
          <TabsList className="mb-6">
            <TabsTrigger value="authors"><PenLine className="mr-2 h-4 w-4" />Authors ({filteredAuthors.length})</TabsTrigger>
            <TabsTrigger value="publishers"><Building2 className="mr-2 h-4 w-4" />Publishers ({filteredPublishers.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="authors">
            {filteredAuthors.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No authors found.</p>
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {filteredAuthors.map((a) => (
                  <Link key={a.name} to={`/books?author=${encodeURIComponent(a.name)}`}>
                    <Card className="hover:border-primary transition-colors h-full">
                      <CardContent className="p-4 flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {a.name[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{a.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <BookOpen className="h-3 w-3" /> {a.count} book{a.count !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="publishers">
            {filteredPublishers.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No publishers found.</p>
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPublishers.map((p) => (
                  <Link key={p.user_id} to={`/books?publisher=${p.user_id}`}>
                    <Card className="hover:border-primary transition-colors h-full">
                      <CardContent className="p-4 flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={p.avatar_url || undefined} />
                          <AvatarFallback className="bg-accent/10 text-accent-foreground font-semibold">
                            {(p.display_name || "P")[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{p.display_name || "Unnamed publisher"}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">Publisher</Badge>
                            <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{p.count}</span>
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}

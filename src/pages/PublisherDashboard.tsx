import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Package, BookOpen, FolderTree } from "lucide-react";
import { format } from "date-fns";

export default function PublisherDashboard() {
  const { user, isPublisher, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!user || (!isPublisher && !isAdmin)) return <Navigate to="/" />;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="flex items-center gap-3 mb-8">
          <BookOpen className="h-8 w-8 text-primary" />
          <div>
            <h1 className="font-heading text-3xl font-bold">Publisher Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage your books, categories, and view orders</p>
          </div>
        </div>
        <Tabs defaultValue="my-books">
          <TabsList className="mb-6">
            <TabsTrigger value="my-books"><BookOpen className="mr-2 h-4 w-4" />My Books</TabsTrigger>
            <TabsTrigger value="categories"><FolderTree className="mr-2 h-4 w-4" />Categories</TabsTrigger>
            <TabsTrigger value="orders"><Package className="mr-2 h-4 w-4" />Orders</TabsTrigger>
          </TabsList>
          <TabsContent value="my-books"><PublisherBooksTab /></TabsContent>
          <TabsContent value="categories"><PublisherCategoriesTab /></TabsContent>
          <TabsContent value="orders"><PublisherOrdersTab /></TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}

function PublisherBooksTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editBook, setEditBook] = useState<any>(null);

  const { data: books = [] } = useQuery({
    queryKey: ["publisher-books", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("*, categories(name)")
        .eq("publisher_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("books").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publisher-books"] });
      toast({ title: "Book deleted" });
    },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">{books.length} book(s) published</p>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditBook(null); }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add Book</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-heading">{editBook ? "Edit Book" : "Add Book"}</DialogTitle></DialogHeader>
            <PubBookForm book={editBook} categories={categories} onClose={() => { setOpen(false); setEditBook(null); }} />
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Book</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {books.map((book: any) => (
              <TableRow key={book.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-8 rounded bg-muted overflow-hidden flex-shrink-0">
                      {book.cover_image_url && <img src={book.cover_image_url} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div>
                      <p className="font-medium">{book.title}</p>
                      <p className="text-xs text-muted-foreground">{book.author}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell><Badge variant="secondary">{(book.categories as any)?.name || "—"}</Badge></TableCell>
                <TableCell className="text-right">${book.price}</TableCell>
                <TableCell className="text-right">{book.stock_quantity}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => { setEditBook(book); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(book.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {books.length === 0 && <p className="text-center text-muted-foreground py-8">No books yet. Add your first book!</p>}
    </div>
  );
}

function PubBookForm({ book, categories, onClose }: { book: any; categories: any[]; onClose: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: book?.title || "",
    author: book?.author || "",
    description: book?.description || "",
    price: book?.price?.toString() || "0",
    stock_quantity: book?.stock_quantity?.toString() || "0",
    isbn: book?.isbn || "",
    category_id: book?.category_id || "",
    is_borrowable: book?.is_borrowable || false,
    is_featured: book?.is_featured || false,
    cover_image_url: book?.cover_image_url || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      price: parseFloat(form.price),
      stock_quantity: parseInt(form.stock_quantity),
      category_id: form.category_id || null,
      publisher_id: user!.id,
    };
    try {
      if (book) {
        const { error } = await supabase.from("books").update(payload).eq("id", book.id);
        if (error) throw error;
        toast({ title: "Book updated" });
      } else {
        const { error } = await supabase.from("books").insert(payload);
        if (error) throw error;
        toast({ title: "Book added" });
      }
      queryClient.invalidateQueries({ queryKey: ["publisher-books"] });
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
      <div><Label>Author</Label><Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} required /></div>
      <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Price ($)</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
        <div><Label>Stock</Label><Input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} /></div>
      </div>
      <div><Label>ISBN</Label><Input value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} /></div>
      <div><Label>Cover Image URL</Label><Input value={form.cover_image_url} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} placeholder="https://..." /></div>
      <div>
        <Label>Category</Label>
        <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
          <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
          <SelectContent>{categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2"><Switch checked={form.is_borrowable} onCheckedChange={(v) => setForm({ ...form, is_borrowable: v })} /><Label>Borrowable</Label></div>
        <div className="flex items-center gap-2"><Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} /><Label>Featured</Label></div>
      </div>
      <Button type="submit" className="w-full">{book ? "Update Book" : "Add Book"}</Button>
    </form>
  );
}

function PublisherCategoriesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("categories").insert({ name, description: desc || null });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    toast({ title: "Category added" });
    setName(""); setDesc(""); setOpen(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-heading text-xl font-semibold">Categories</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add Category</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading">Add Category</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
              <div><Label>Description</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
              <Button type="submit" className="w-full">Add Category</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-3">
        {categories.map((cat) => (
          <Card key={cat.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div><h3 className="font-semibold">{cat.name}</h3>{cat.description && <p className="text-sm text-muted-foreground">{cat.description}</p>}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PublisherOrdersTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [] } = useQuery({
    queryKey: ["publisher-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, books(title)), profiles(display_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    queryClient.invalidateQueries({ queryKey: ["publisher-orders"] });
    toast({ title: `Order ${status}` });
  };

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold mb-4">Process Orders ({orders.length})</h2>
      <div className="space-y-3">
        {orders.map((order: any) => (
          <Card key={order.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-muted-foreground">{(order.profiles as any)?.display_name} · {format(new Date(order.created_at), "MMM d, yyyy")}</p>
                </div>
                <div className="text-right">
                  <Badge>{order.status}</Badge>
                  <p className="font-bold text-primary mt-1">${Number(order.total_amount).toFixed(2)}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                {["pending", "processing", "shipped", "delivered"].map((s) => (
                  <Button key={s} variant={order.status === s ? "default" : "outline"} size="sm" onClick={() => updateStatus(order.id, s)} className="text-xs capitalize">
                    {s}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        {orders.length === 0 && <p className="text-center text-muted-foreground py-8">No orders yet.</p>}
      </div>
    </div>
  );
}

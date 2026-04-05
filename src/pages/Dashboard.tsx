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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Package, BookOpen, FolderTree, Users } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { user, isAdmin, isPublisher, loading } = useAuth();

  if (loading) return null;
  if (!user || (!isAdmin && !isPublisher)) return <Navigate to="/" />;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex-1">
        <h1 className="font-heading text-3xl font-bold mb-8">Dashboard</h1>
        <Tabs defaultValue="books">
          <TabsList className="mb-6">
            <TabsTrigger value="books"><BookOpen className="mr-2 h-4 w-4" />Books</TabsTrigger>
            <TabsTrigger value="categories"><FolderTree className="mr-2 h-4 w-4" />Categories</TabsTrigger>
            <TabsTrigger value="orders"><Package className="mr-2 h-4 w-4" />Orders</TabsTrigger>
            <TabsTrigger value="borrows"><Users className="mr-2 h-4 w-4" />Borrows</TabsTrigger>
          </TabsList>
          <TabsContent value="books"><BooksTab /></TabsContent>
          <TabsContent value="categories"><CategoriesTab /></TabsContent>
          <TabsContent value="orders"><OrdersTab /></TabsContent>
          <TabsContent value="borrows"><BorrowsTab /></TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}

function BooksTab() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editBook, setEditBook] = useState<any>(null);

  const { data: books = [] } = useQuery({
    queryKey: ["dashboard-books"],
    queryFn: async () => {
      let query = supabase.from("books").select("*, categories(name)").order("created_at", { ascending: false });
      if (!isAdmin) query = query.eq("publisher_id", user!.id);
      const { data, error } = await query;
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
      queryClient.invalidateQueries({ queryKey: ["dashboard-books"] });
      toast({ title: "Book deleted" });
    },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-heading text-xl font-semibold">Manage Books</h2>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditBook(null); }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add Book</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-heading">{editBook ? "Edit Book" : "Add Book"}</DialogTitle></DialogHeader>
            <BookForm book={editBook} categories={categories} onClose={() => { setOpen(false); setEditBook(null); }} />
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-3">
        {books.map((book: any) => (
          <Card key={book.id}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-16 w-11 rounded bg-muted overflow-hidden flex-shrink-0">
                {book.cover_image_url && <img src={book.cover_image_url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{book.title}</h3>
                <p className="text-sm text-muted-foreground">{book.author} · ${book.price} · Stock: {book.stock_quantity}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => { setEditBook(book); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(book.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {books.length === 0 && <p className="text-center text-muted-foreground py-8">No books yet.</p>}
      </div>
    </div>
  );
}

function BookForm({ book, categories, onClose }: { book: any; categories: any[]; onClose: () => void }) {
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
      publisher_id: book?.publisher_id || user!.id,
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
      queryClient.invalidateQueries({ queryKey: ["dashboard-books"] });
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
      <div><Label>Author</Label><Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} required /></div>
      <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
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
          <SelectContent>
            {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
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

function CategoriesTab() {
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

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    toast({ title: "Category deleted" });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-heading text-xl font-semibold">Manage Categories</h2>
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
              <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </CardContent>
          </Card>
        ))}
        {categories.length === 0 && <p className="text-center text-muted-foreground py-8">No categories yet.</p>}
      </div>
    </div>
  );
}

function OrdersTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [] } = useQuery({
    queryKey: ["dashboard-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, books(title)), profiles!orders_user_id_fkey(display_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    queryClient.invalidateQueries({ queryKey: ["dashboard-orders"] });
    toast({ title: `Order ${status}` });
  };

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold mb-4">Manage Orders</h2>
      <div className="space-y-3">
        {orders.map((order: any) => (
          <Card key={order.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-muted-foreground">{(order.profiles as any)?.display_name} · {format(new Date(order.created_at), "MMM d, yyyy")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge>{order.status}</Badge>
                  <span className="font-bold text-primary">${Number(order.total_amount).toFixed(2)}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                {["pending", "processing", "shipped", "delivered", "cancelled"].map((s) => (
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

function BorrowsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: borrows = [] } = useQuery({
    queryKey: ["dashboard-borrows"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("book_borrows")
        .select("*, books(title, author), profiles!book_borrows_user_id_fkey(display_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const markReturned = async (id: string) => {
    const { error } = await supabase.from("book_borrows").update({ status: "returned", return_date: new Date().toISOString() }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    queryClient.invalidateQueries({ queryKey: ["dashboard-borrows"] });
    toast({ title: "Book marked as returned" });
  };

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold mb-4">Manage Borrows</h2>
      <div className="space-y-3">
        {borrows.map((borrow: any) => (
          <Card key={borrow.id}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex-1">
                <h3 className="font-semibold">{borrow.books?.title}</h3>
                <p className="text-sm text-muted-foreground">Borrowed by: {(borrow.profiles as any)?.display_name}</p>
                <p className="text-xs text-muted-foreground">Due: {format(new Date(borrow.due_date), "MMM d, yyyy")}</p>
              </div>
              <Badge variant={borrow.status === "returned" ? "secondary" : borrow.status === "overdue" ? "destructive" : "default"}>
                {borrow.status}
              </Badge>
              {borrow.status === "borrowed" && (
                <Button size="sm" variant="outline" onClick={() => markReturned(borrow.id)}>Mark Returned</Button>
              )}
            </CardContent>
          </Card>
        ))}
        {borrows.length === 0 && <p className="text-center text-muted-foreground py-8">No borrows yet.</p>}
      </div>
    </div>
  );
}

import { useState, useRef, useCallback } from "react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Package, BookOpen, FolderTree, Users, BarChart3, ShieldCheck, UserCog, UserPlus, CreditCard, Banknote, Upload, X, Image, DollarSign, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export default function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!user || !isAdmin) return <Navigate to="/" />;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="flex items-center gap-3 mb-8">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <div>
            <h1 className="font-heading text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Full control over books, categories, orders, users, and borrows</p>
          </div>
        </div>
        <StatsCards />
        <Tabs defaultValue="books" className="mt-8">
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="books"><BookOpen className="mr-2 h-4 w-4" />Books</TabsTrigger>
            <TabsTrigger value="categories"><FolderTree className="mr-2 h-4 w-4" />Categories</TabsTrigger>
            <TabsTrigger value="orders"><Package className="mr-2 h-4 w-4" />Orders</TabsTrigger>
            <TabsTrigger value="borrows"><Users className="mr-2 h-4 w-4" />Borrows</TabsTrigger>
            <TabsTrigger value="users"><UserCog className="mr-2 h-4 w-4" />Users</TabsTrigger>
            <TabsTrigger value="revenue"><TrendingUp className="mr-2 h-4 w-4" />Revenue</TabsTrigger>
          </TabsList>
          <TabsContent value="books"><AdminBooksTab /></TabsContent>
          <TabsContent value="categories"><AdminCategoriesTab /></TabsContent>
          <TabsContent value="orders"><AdminOrdersTab /></TabsContent>
          <TabsContent value="borrows"><AdminBorrowsTab /></TabsContent>
          <TabsContent value="users"><AdminUsersTab /></TabsContent>
          <TabsContent value="revenue"><RevenueTab /></TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}

function StatsCards() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [books, orders, borrows, categories, users] = await Promise.all([
        supabase.from("books").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("book_borrows").select("id", { count: "exact", head: true }),
        supabase.from("categories").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      return {
        books: books.count || 0,
        orders: orders.count || 0,
        borrows: borrows.count || 0,
        categories: categories.count || 0,
        users: users.count || 0,
      };
    },
  });

  const items = [
    { label: "Total Books", value: stats?.books || 0, icon: BookOpen, color: "text-primary" },
    { label: "Categories", value: stats?.categories || 0, icon: FolderTree, color: "text-accent" },
    { label: "Orders", value: stats?.orders || 0, icon: Package, color: "text-orange-500" },
    { label: "Borrows", value: stats?.borrows || 0, icon: Users, color: "text-blue-500" },
    { label: "Total Users", value: stats?.users || 0, icon: UserCog, color: "text-green-500" },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
      {items.map(({ label, value, icon: Icon, color }) => (
        <Card key={label}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-muted p-3"><Icon className={`h-6 w-6 ${color}`} /></div>
            <div>
              <p className="text-2xl font-heading font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AdminBooksTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editBook, setEditBook] = useState<any>(null);
  const [search, setSearch] = useState("");

  const { data: books = [] } = useQuery({
    queryKey: ["admin-books"],
    queryFn: async () => {
      const { data, error } = await supabase.from("books").select("*, categories(name)").order("created_at", { ascending: false });
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
      queryClient.invalidateQueries({ queryKey: ["admin-books"] });
      toast({ title: "Book deleted" });
    },
  });

  const filteredBooks = books.filter((b: any) =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4 gap-4">
        <Input placeholder="Search books..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditBook(null); }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add Book</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-heading">{editBook ? "Edit Book" : "Add Book"}</DialogTitle></DialogHeader>
            <BookForm book={editBook} categories={categories} onClose={() => { setOpen(false); setEditBook(null); }} queryKey="admin-books" />
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
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBooks.map((book: any) => (
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
                <TableCell>
                  <div className="flex gap-1">
                    {book.is_featured && <Badge className="text-xs">Featured</Badge>}
                    {book.is_borrowable && <Badge variant="outline" className="text-xs">Borrow</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => { setEditBook(book); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(book.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {filteredBooks.length === 0 && <p className="text-center text-muted-foreground py-8">No books found.</p>}
    </div>
  );
}

function BookForm({ book, categories, onClose, queryKey }: { book: any; categories: any[]; onClose: () => void; queryKey: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(book?.cover_image_url || "");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
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
    borrow_price: book?.borrow_price?.toString() || "0",
    borrow_policy: book?.borrow_policy || "",
  });

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB allowed.", variant: "destructive" });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return imagePreview || null;
    const ext = imageFile.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("book-covers").upload(fileName, imageFile);
    if (error) throw new Error("Image upload failed: " + error.message);
    const { data } = supabase.storage.from("book-covers").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      const coverUrl = await uploadImage();
      const payload = {
        ...form,
        price: parseFloat(form.price),
        stock_quantity: parseInt(form.stock_quantity),
        borrow_price: parseFloat(form.borrow_price),
        borrow_policy: form.borrow_policy || null,
        category_id: form.category_id || null,
        publisher_id: book?.publisher_id || user!.id,
        cover_image_url: coverUrl,
      };
      if (book) {
        const { error } = await supabase.from("books").update(payload).eq("id", book.id);
        if (error) throw error;
        toast({ title: "Book updated" });
      } else {
        const { error } = await supabase.from("books").insert(payload);
        if (error) throw error;
        toast({ title: "Book added" });
      }
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
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
      
      {/* Image Upload */}
      <div>
        <Label>Cover Image</Label>
        <div
          className={`mt-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
          {imagePreview ? (
            <div className="relative inline-block">
              <img src={imagePreview} alt="Preview" className="h-32 w-auto rounded-md object-cover mx-auto" />
              <button
                type="button"
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(""); }}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="py-4">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Drag & drop an image or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">Max 5MB • JPG, PNG, WebP</p>
            </div>
          )}
        </div>
      </div>

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
      {form.is_borrowable && (
        <>
          <div><Label>Borrow Price ($) — 0 for free</Label><Input type="number" step="0.01" value={form.borrow_price} onChange={(e) => setForm({ ...form, borrow_price: e.target.value })} /></div>
          <div><Label>Borrow Policy</Label><Textarea value={form.borrow_policy} onChange={(e) => setForm({ ...form, borrow_policy: e.target.value })} rows={4} placeholder="e.g., Book must be returned intact, no stains..." /></div>
        </>
      )}
      <Button type="submit" className="w-full" disabled={uploading}>{uploading ? "Uploading..." : book ? "Update Book" : "Add Book"}</Button>
    </form>
  );
}

function AdminCategoriesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editCat, setEditCat] = useState<any>(null);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editCat) {
        const { error } = await supabase.from("categories").update({ name, description: desc || null }).eq("id", editCat.id);
        if (error) throw error;
        toast({ title: "Category updated" });
      } else {
        const { error } = await supabase.from("categories").insert({ name, description: desc || null });
        if (error) throw error;
        toast({ title: "Category added" });
      }
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setOpen(false); setEditCat(null); setName(""); setDesc("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
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
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditCat(null); setName(""); setDesc(""); } }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add Category</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading">{editCat ? "Edit Category" : "Add Category"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
              <div><Label>Description</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
              <Button type="submit" className="w-full">{editCat ? "Update" : "Add"} Category</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell className="font-medium">{cat.name}</TableCell>
                <TableCell className="text-muted-foreground">{cat.description || "—"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => { setEditCat(cat); setName(cat.name); setDesc(cat.description || ""); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function AdminOrdersTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
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
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    toast({ title: `Order marked as ${status}` });
  };

  const deleteOrder = async (orderId: string) => {
    const { error } = await supabase.from("orders").delete().eq("id", orderId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    toast({ title: "Order deleted" });
  };

  const filtered = statusFilter === "all" ? orders : orders.filter((o: any) => o.status === statusFilter);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-heading text-xl font-semibold">Manage Orders ({orders.length})</h2>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-3">
        {filtered.map((order: any) => (
          <Card key={order.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-muted-foreground">
                    {(order.profiles as any)?.display_name || "Unknown"} · {format(new Date(order.created_at), "MMM d, yyyy HH:mm")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Items: {order.order_items?.map((i: any) => `${i.books?.title} ×${i.quantity}`).join(", ")}
                  </p>
                </div>
                <div className="text-right">
                  <Badge>{order.status}</Badge>
                  <p className="font-heading font-bold text-primary mt-1">${Number(order.total_amount).toFixed(2)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                {order.payment_method === "stripe" ? <CreditCard className="h-3 w-3" /> : <Banknote className="h-3 w-3" />}
                {order.payment_method === "stripe" ? "Online Payment" : "Cash on Delivery"}
                {order.payment_status === "paid" && <Badge variant="outline" className="text-[10px] px-1 py-0 ml-1">Paid</Badge>}
              </div>
              <div className="flex gap-2 flex-wrap">
                {["pending", "processing", "shipped", "delivered", "cancelled"].map((s) => (
                  <Button key={s} variant={order.status === s ? "default" : "outline"} size="sm" onClick={() => updateStatus(order.id, s)} className="text-xs capitalize">
                    {s}
                  </Button>
                ))}
                <Button variant="ghost" size="sm" onClick={() => deleteOrder(order.id)} className="text-xs text-destructive ml-auto">
                  <Trash2 className="h-3 w-3 mr-1" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No orders found.</p>}
      </div>
    </div>
  );
}

function AdminBorrowsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [approveId, setApproveId] = useState<string | null>(null);
  const [borrowDays, setBorrowDays] = useState("14");

  const { data: borrows = [] } = useQuery({
    queryKey: ["admin-borrows"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("book_borrows")
        .select("*, books(title, author), profiles(display_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const approveBorrow = async (id: string) => {
    const now = new Date();
    const days = parseInt(borrowDays) || 14;
    const dueDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const { error } = await supabase.from("book_borrows").update({
      status: "borrowed",
      borrow_date: now.toISOString(),
      due_date: dueDate.toISOString(),
      approved_at: now.toISOString(),
      borrow_days: days,
    }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    queryClient.invalidateQueries({ queryKey: ["admin-borrows"] });
    toast({ title: `Borrow approved for ${days} days` });
    setApproveId(null);
    setBorrowDays("14");
  };

  const rejectBorrow = async (id: string) => {
    const { error } = await supabase.from("book_borrows").update({ status: "rejected" }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    queryClient.invalidateQueries({ queryKey: ["admin-borrows"] });
    toast({ title: "Borrow request rejected" });
  };

  const updateBorrow = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === "returned") updates.return_date = new Date().toISOString();
    const { error } = await supabase.from("book_borrows").update(updates).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    queryClient.invalidateQueries({ queryKey: ["admin-borrows"] });
    toast({ title: `Borrow marked as ${status}` });
  };

  const statusColor = (s: string) => {
    if (s === "returned") return "secondary" as const;
    if (s === "overdue") return "destructive" as const;
    if (s === "rejected") return "destructive" as const;
    if (s === "pending") return "outline" as const;
    return "default" as const;
  };

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold mb-4">Manage Borrows ({borrows.length})</h2>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Book</TableHead>
              <TableHead>Borrower</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {borrows.map((b: any) => (
              <TableRow key={b.id}>
                <TableCell><p className="font-medium">{b.books?.title}</p><p className="text-xs text-muted-foreground">{b.books?.author}</p></TableCell>
                <TableCell>{(b.profiles as any)?.display_name || "Unknown"}</TableCell>
                <TableCell className="text-sm">{format(new Date(b.created_at), "MMM d, yyyy")}</TableCell>
                <TableCell className="text-sm">{b.status === "pending" ? "—" : format(new Date(b.due_date), "MMM d, yyyy")}</TableCell>
                <TableCell>
                  <Badge variant={statusColor(b.status)}>{b.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {b.status === "pending" && (
                    <div className="flex items-center gap-2 justify-end">
                      {approveId === b.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            value={borrowDays}
                            onChange={(e) => setBorrowDays(e.target.value)}
                            className="w-20 h-8 text-xs"
                            placeholder="Days"
                          />
                          <span className="text-xs text-muted-foreground">days</span>
                          <Button size="sm" onClick={() => approveBorrow(b.id)}>Confirm</Button>
                          <Button size="sm" variant="ghost" onClick={() => setApproveId(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <>
                          <Button size="sm" onClick={() => setApproveId(b.id)}>Approve</Button>
                          <Button size="sm" variant="destructive" onClick={() => rejectBorrow(b.id)}>Reject</Button>
                        </>
                      )}
                    </div>
                  )}
                  {b.status === "borrowed" && (
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="outline" onClick={() => updateBorrow(b.id, "returned")}>Return</Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateBorrow(b.id, "overdue")}>Overdue</Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {borrows.length === 0 && <p className="text-center text-muted-foreground py-8">No borrows yet.</p>}
    </div>
  );
}

function AdminUsersTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignRole, setAssignRole] = useState<string>("publisher");

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, user_roles(role)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const removeRole = async (userId: string, role: "admin" | "publisher" | "user") => {
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    toast({ title: `Removed ${role} role` });
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignUserId) {
      toast({ title: "Select a user", variant: "destructive" });
      return;
    }
    try {
      const { error } = await supabase.from("user_roles").insert({ user_id: assignUserId, role: assignRole as any });
      if (error) {
        if (error.code === "23505") {
          toast({ title: "Already assigned", description: "User already has this role.", variant: "destructive" });
        } else throw error;
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      const selectedUser = users.find((u: any) => u.user_id === assignUserId);
      toast({ title: "Role assigned!", description: `${assignRole} role given to ${selectedUser?.display_name || "user"}` });
      setAssignOpen(false);
      setAssignUserId("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-heading text-xl font-semibold">Users & Roles ({users.length})</h2>
        <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="mr-2 h-4 w-4" />Assign Role</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading">Assign Role to User</DialogTitle></DialogHeader>
            <form onSubmit={handleAssignRole} className="space-y-4">
              <div>
                <Label>Select User</Label>
                <Select value={assignUserId} onValueChange={setAssignUserId}>
                  <SelectTrigger><SelectValue placeholder="Choose a user..." /></SelectTrigger>
                  <SelectContent>
                    {users.map((u: any) => (
                      <SelectItem key={u.user_id} value={u.user_id}>{u.display_name || "Unknown"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Role</Label>
                <Select value={assignRole} onValueChange={setAssignRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="publisher">Publisher</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Assign Role</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u: any) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                        {(u.display_name || "?")[0].toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium">{u.display_name || "Unknown"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {u.user_roles?.map((r: any) => (
                      <Badge key={r.role} variant={r.role === "admin" ? "default" : r.role === "publisher" ? "secondary" : "outline"}>
                        {r.role}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{format(new Date(u.created_at), "MMM d, yyyy")}</TableCell>
                <TableCell className="text-right">
                  {u.user_roles?.filter((r: any) => r.role !== "user").map((r: any) => (
                    <Button key={r.role} variant="ghost" size="sm" className="text-xs text-destructive" onClick={() => removeRole(u.user_id, r.role)}>
                      Remove {r.role}
                    </Button>
                  ))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export { BookForm };

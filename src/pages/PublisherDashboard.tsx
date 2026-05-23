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
import { Plus, Pencil, Trash2, Package, BookOpen, TrendingUp, Upload, X, DollarSign, Star, Users } from "lucide-react";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import CommentAnalysis from "@/components/CommentAnalysis";

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
            <p className="text-sm text-muted-foreground">Manage your published books, view orders & ratings</p>
          </div>
        </div>
        <PublisherStats userId={user.id} />
        <Tabs defaultValue="my-books" className="mt-8">
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="my-books"><BookOpen className="mr-2 h-4 w-4" />My Books</TabsTrigger>
            <TabsTrigger value="orders"><Package className="mr-2 h-4 w-4" />Orders</TabsTrigger>
            <TabsTrigger value="borrows"><Users className="mr-2 h-4 w-4" />Borrows</TabsTrigger>
            <TabsTrigger value="ratings"><Star className="mr-2 h-4 w-4" />Ratings</TabsTrigger>
            <TabsTrigger value="revenue"><TrendingUp className="mr-2 h-4 w-4" />Revenue</TabsTrigger>
          </TabsList>
          <TabsContent value="my-books"><PublisherBooksTab /></TabsContent>
          <TabsContent value="orders"><PublisherOrdersTab /></TabsContent>
          <TabsContent value="borrows"><PublisherBorrowsTab /></TabsContent>
          <TabsContent value="ratings"><PublisherRatingsTab /></TabsContent>
          <TabsContent value="revenue"><PublisherRevenueTab /></TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}

function PublisherStats({ userId }: { userId: string }) {
  const { data: stats } = useQuery({
    queryKey: ["publisher-stats", userId],
    queryFn: async () => {
      const { data: books } = await supabase.from("books").select("id").eq("publisher_id", userId);
      const bookIds = books?.map(b => b.id) || [];
      
      let orderCount = 0;
      let borrowCount = 0;
      let reviewCount = 0;
      
      if (bookIds.length > 0) {
        const [ordersRes, borrowsRes, reviewsRes] = await Promise.all([
          supabase.from("order_items").select("id", { count: "exact", head: true }).in("book_id", bookIds),
          supabase.from("book_borrows").select("id", { count: "exact", head: true }).in("book_id", bookIds),
          supabase.from("book_reviews").select("id", { count: "exact", head: true }).in("book_id", bookIds),
        ]);
        orderCount = ordersRes.count || 0;
        borrowCount = borrowsRes.count || 0;
        reviewCount = reviewsRes.count || 0;
      }
      
      return { books: bookIds.length, orders: orderCount, borrows: borrowCount, reviews: reviewCount };
    },
  });

  const items = [
    { label: "My Books", value: stats?.books || 0, icon: BookOpen, color: "text-primary" },
    { label: "Orders", value: stats?.orders || 0, icon: Package, color: "text-orange-500" },
    { label: "Borrows", value: stats?.borrows || 0, icon: Users, color: "text-blue-500" },
    { label: "Reviews", value: stats?.reviews || 0, icon: Star, color: "text-yellow-500" },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
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
    if (!file.type.startsWith("image/")) { toast({ title: "Invalid file", variant: "destructive" }); return; }
    if (file.size > 5 * 1024 * 1024) { toast({ title: "File too large", variant: "destructive" }); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f); }, []);
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(true); }, []);
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
        publisher_id: user!.id,
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
      queryClient.invalidateQueries({ queryKey: ["publisher-books"] });
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
      <div>
        <Label>Cover Image</Label>
        <div
          className={`mt-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}`}
          onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />
          {imagePreview ? (
            <div className="relative inline-block">
              <img src={imagePreview} alt="Preview" className="h-32 w-auto rounded-md object-cover mx-auto" />
              <button type="button" className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1" onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(""); }}>
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="py-4">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Drag & drop or click to browse</p>
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

function PublisherOrdersTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [] } = useQuery({
    queryKey: ["publisher-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, books(title, publisher_id)), profiles(display_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Only show orders that contain at least one book by this publisher
      return data.filter((o: any) =>
        o.order_items?.some((i: any) => (i.books as any)?.publisher_id === user?.id)
      );
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
      <h2 className="font-heading text-xl font-semibold mb-4">Orders for My Books ({orders.length})</h2>
      <div className="space-y-3">
        {orders.map((order: any) => {
          const myItems = order.order_items?.filter((i: any) => (i.books as any)?.publisher_id === user?.id) || [];
          return (
            <Card key={order.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">{(order.profiles as any)?.display_name} · {format(new Date(order.created_at), "MMM d, yyyy")}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      My items: {myItems.map((i: any) => `${i.books?.title} ×${i.quantity}`).join(", ")}
                    </p>
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
          );
        })}
        {orders.length === 0 && <p className="text-center text-muted-foreground py-8">No orders for your books yet.</p>}
      </div>
    </div>
  );
}

function PublisherBorrowsTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [approveId, setApproveId] = useState<string | null>(null);
  const [borrowDays, setBorrowDays] = useState("14");

  const { data: borrows = [] } = useQuery({
    queryKey: ["publisher-borrows", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("book_borrows")
        .select("*, books(title, author, publisher_id), profiles(display_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Only borrows for this publisher's books
      return data.filter((b: any) => (b.books as any)?.publisher_id === user?.id);
    },
  });

  const approveBorrow = async (id: string) => {
    const now = new Date();
    const days = parseInt(borrowDays) || 14;
    const dueDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const borrow = borrows.find((b: any) => b.id === id);
    const { error } = await supabase.from("book_borrows").update({
      status: "borrowed",
      borrow_date: now.toISOString(),
      due_date: dueDate.toISOString(),
      approved_at: now.toISOString(),
      borrow_days: days,
    }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    if (borrow) {
      await supabase.from("notifications").insert({
        user_id: borrow.user_id,
        title: "Borrow Request Approved",
        message: `Your request to borrow "${borrow.books?.title}" has been approved for ${days} days. Due date: ${format(dueDate, "MMM d, yyyy")}`,
        type: "borrow",
      } as any);
    }
    queryClient.invalidateQueries({ queryKey: ["publisher-borrows"] });
    toast({ title: `Borrow approved for ${days} days` });
    setApproveId(null);
    setBorrowDays("14");
  };

  const rejectBorrow = async (id: string) => {
    const borrow = borrows.find((b: any) => b.id === id);
    const { error } = await supabase.from("book_borrows").update({ status: "rejected" }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    if (borrow) {
      await supabase.from("notifications").insert({
        user_id: borrow.user_id,
        title: "Borrow Request Rejected",
        message: `Your request to borrow "${borrow.books?.title}" has been rejected.`,
        type: "borrow",
      } as any);
    }
    queryClient.invalidateQueries({ queryKey: ["publisher-borrows"] });
    toast({ title: "Borrow request rejected" });
  };

  const updateBorrow = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === "returned") updates.return_date = new Date().toISOString();
    const { error } = await supabase.from("book_borrows").update(updates).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    queryClient.invalidateQueries({ queryKey: ["publisher-borrows"] });
    toast({ title: `Borrow marked as ${status}` });
  };

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold mb-4">Borrows for My Books ({borrows.length})</h2>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Book</TableHead>
              <TableHead>Borrower</TableHead>
              <TableHead>Desired Days</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {borrows.map((b: any) => (
              <TableRow key={b.id}>
                <TableCell>
                  <p className="font-medium">{b.books?.title}</p>
                  <p className="text-xs text-muted-foreground">{b.books?.author}</p>
                </TableCell>
                <TableCell>
                  <p>{(b.profiles as any)?.display_name || "Unknown"}</p>
                  {b.user_message && <p className="text-xs text-muted-foreground italic">"{b.user_message}"</p>}
                </TableCell>
                <TableCell className="font-medium">{b.desired_days ? `${b.desired_days} days` : "—"}</TableCell>
                <TableCell>
                  <Badge variant={
                    b.status === "returned" ? "secondary" :
                    b.status === "overdue" || b.status === "rejected" ? "destructive" :
                    b.status === "pending" ? "outline" : "default"
                  }>{b.status}</Badge>
                  {b.status === "borrowed" && b.due_date && (
                    <p className="text-xs text-muted-foreground mt-1">Due: {format(new Date(b.due_date), "MMM d, yyyy")}</p>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {b.status === "pending" && (
                    <div className="flex items-center gap-2 justify-end">
                      {approveId === b.id ? (
                        <>
                          <Input type="number" min="1" value={borrowDays} onChange={(e) => setBorrowDays(e.target.value)} className="w-20 h-8 text-xs" />
                          <span className="text-xs text-muted-foreground">days</span>
                          <Button size="sm" onClick={() => approveBorrow(b.id)}>Confirm</Button>
                          <Button size="sm" variant="ghost" onClick={() => setApproveId(null)}>Cancel</Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" onClick={() => { setApproveId(b.id); setBorrowDays(b.desired_days?.toString() || "14"); }}>Approve</Button>
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
      {borrows.length === 0 && <p className="text-center text-muted-foreground py-8">No borrows for your books yet.</p>}
    </div>
  );
}

function PublisherRatingsTab() {
  const { user } = useAuth();
  const [analyzeBookId, setAnalyzeBookId] = useState<string>("");

  const { data: myBooks = [] } = useQuery({
    queryKey: ["publisher-my-books-list", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("books").select("id, title").eq("publisher_id", user!.id).order("title");
      return data || [];
    },
  });

  const { data: reviewsData = [] } = useQuery({
    queryKey: ["publisher-ratings", user?.id],
    queryFn: async () => {
      const { data: books } = await supabase.from("books").select("id, title").eq("publisher_id", user!.id);
      if (!books || books.length === 0) return [];
      const bookIds = books.map(b => b.id);
      const { data: reviews } = await supabase
        .from("book_reviews")
        .select("*, profiles(display_name)")
        .in("book_id", bookIds)
        .order("created_at", { ascending: false });
      
      return (reviews || []).map((r: any) => ({
        ...r,
        bookTitle: books.find(b => b.id === r.book_id)?.title || "Unknown",
      }));
    },
  });

  const avgRating = reviewsData.length > 0
    ? (reviewsData.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewsData.length).toFixed(1)
    : "—";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-semibold">Reviews & Ratings ({reviewsData.length})</h2>
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
          <span className="font-heading text-xl font-bold">{avgRating}</span>
          <span className="text-sm text-muted-foreground">avg rating</span>
        </div>
      </div>

      <div className="mb-6 rounded-lg border p-4 bg-card">
        <Label className="mb-2 block">AI Analyze Feedback for a Book</Label>
        <div className="flex gap-2 mb-3">
          <Select value={analyzeBookId} onValueChange={setAnalyzeBookId}>
            <SelectTrigger className="max-w-md"><SelectValue placeholder="Select one of your books" /></SelectTrigger>
            <SelectContent>
              {myBooks.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {analyzeBookId && (
          <CommentAnalysis bookId={analyzeBookId} bookTitle={myBooks.find((b: any) => b.id === analyzeBookId)?.title} />
        )}
      </div>

      <div className="space-y-3">
        {reviewsData.map((r: any) => (
          <Card key={r.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold">{r.bookTitle}</p>
                  <p className="text-sm text-muted-foreground">{(r.profiles as any)?.display_name || "Anonymous"} · {format(new Date(r.created_at), "MMM d, yyyy")}</p>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < r.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}`} />
                  ))}
                </div>
              </div>
              {r.review_text && <p className="text-sm text-foreground">{r.review_text}</p>}
            </CardContent>
          </Card>
        ))}
        {reviewsData.length === 0 && <p className="text-center text-muted-foreground py-8">No reviews for your books yet.</p>}
      </div>
    </div>
  );
}

function PublisherRevenueTab() {
  const { user } = useAuth();

  const { data: orders = [] } = useQuery({
    queryKey: ["pub-revenue-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("total_amount, created_at, status, order_items(books(publisher_id))")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data.filter((o: any) => o.order_items?.some((i: any) => (i.books as any)?.publisher_id === user?.id));
    },
  });

  const { data: borrows = [] } = useQuery({
    queryKey: ["pub-revenue-borrows", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("book_borrows")
        .select("created_at, status, books(borrow_price, publisher_id)")
        .in("status", ["borrowed", "returned"]);
      if (error) throw error;
      return data.filter((b: any) => (b.books as any)?.publisher_id === user?.id);
    },
  });

  const totalOrderRevenue = orders
    .filter((o: any) => o.status !== "cancelled")
    .reduce((sum: number, o: any) => sum + Number(o.total_amount), 0);

  const totalBorrowRevenue = borrows.reduce((sum: number, b: any) => sum + Number((b.books as any)?.borrow_price || 0), 0);
  const totalRevenue = totalOrderRevenue + totalBorrowRevenue;

  const monthlyData: Record<string, { month: string; sales: number; borrows: number }> = {};
  orders.filter((o: any) => o.status !== "cancelled").forEach((o: any) => {
    const month = format(new Date(o.created_at), "MMM yyyy");
    if (!monthlyData[month]) monthlyData[month] = { month, sales: 0, borrows: 0 };
    monthlyData[month].sales += Number(o.total_amount);
  });
  borrows.forEach((b: any) => {
    const month = format(new Date(b.created_at), "MMM yyyy");
    if (!monthlyData[month]) monthlyData[month] = { month, sales: 0, borrows: 0 };
    monthlyData[month].borrows += Number((b.books as any)?.borrow_price || 0);
  });
  const chartData = Object.values(monthlyData);

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-semibold">My Revenue</h2>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-lg bg-green-100 p-3"><DollarSign className="h-6 w-6 text-green-600" /></div>
            <div>
              <p className="text-2xl font-heading font-bold">${totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-lg bg-blue-100 p-3"><Package className="h-6 w-6 text-blue-600" /></div>
            <div>
              <p className="text-2xl font-heading font-bold">${totalOrderRevenue.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Sales Revenue</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-lg bg-purple-100 p-3"><BookOpen className="h-6 w-6 text-purple-600" /></div>
            <div>
              <p className="text-2xl font-heading font-bold">${totalBorrowRevenue.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Borrow Revenue</p>
            </div>
          </CardContent>
        </Card>
      </div>
      {chartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="font-heading text-lg">Monthly Revenue</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  <Bar dataKey="sales" fill="hsl(var(--primary))" name="Sales" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="borrows" fill="hsl(var(--accent))" name="Borrows" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

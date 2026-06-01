import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, User, LogOut, BookOpen, LayoutDashboard, Menu, X, Shield, Settings, Package, Library, Heart } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function Navbar() {
  const { user, isAdmin, isPublisher, signOut } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url, display_name")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const avatarSrc = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const displayName = profile?.display_name || user?.user_metadata?.full_name || "User";

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="font-heading text-xl font-bold text-foreground">BookStore</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Home</Link>
          <Link to="/books" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Books</Link>
          <Link to="/categories" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Categories</Link>
          <Link to="/creators" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Authors & Publishers</Link>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user && <NotificationBell />}
          {user && (
            <Button variant="ghost" size="icon" className="relative" onClick={() => navigate("/cart")}>
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                  {totalItems}
                </Badge>
              )}
            </Button>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatarSrc} />
                    <AvatarFallback className="text-xs">{displayName[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="font-medium">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <Settings className="mr-2 h-4 w-4" /> Profile & Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/orders")}>
                  <Package className="mr-2 h-4 w-4" /> My Orders
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/borrows")}>
                  <Library className="mr-2 h-4 w-4" /> My Borrows
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/wishlist")}>
                  <Heart className="mr-2 h-4 w-4" /> Wishlist
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Dashboard
                  </DropdownMenuItem>
                )}
                {isPublisher && (
                  <DropdownMenuItem onClick={() => navigate("/publisher")}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Publisher Dashboard
                  </DropdownMenuItem>
                )}
                {(isAdmin || isPublisher) && <DropdownMenuSeparator />}
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => navigate("/login")} size="sm">Login</Button>
          )}
        </div>

        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileOpen && (
        <div className="border-t bg-background px-4 py-4 md:hidden space-y-3">
          <Link to="/" className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>Home</Link>
          <Link to="/books" className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>Books</Link>
          <Link to="/categories" className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>Categories</Link>
          <Link to="/creators" className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>Authors & Publishers</Link>
          {user && (
            <>
              <Link to="/cart" className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>Cart ({totalItems})</Link>
              <Link to="/orders" className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>My Orders</Link>
              <Link to="/wishlist" className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>Wishlist</Link>
              {isAdmin && <Link to="/admin" className="block text-sm font-medium text-primary" onClick={() => setMobileOpen(false)}>Admin Dashboard</Link>}
              {isPublisher && <Link to="/publisher" className="block text-sm font-medium text-primary" onClick={() => setMobileOpen(false)}>Publisher Dashboard</Link>}
              <button className="text-sm font-medium text-destructive" onClick={() => { signOut(); setMobileOpen(false); }}>Sign Out</button>
            </>
          )}
          {user && (
            <Link to="/profile" className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>Profile & Settings</Link>
          )}
          {!user && (
            <Link to="/login" className="block text-sm font-medium text-primary" onClick={() => setMobileOpen(false)}>Login</Link>
          )}
        </div>
      )}
    </nav>
  );
}

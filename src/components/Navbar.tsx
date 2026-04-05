import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, User, LogOut, BookOpen, LayoutDashboard, Menu, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState } from "react";

export default function Navbar() {
  const { user, isAdmin, isPublisher, signOut } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

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
        </div>

        <div className="hidden items-center gap-3 md:flex">
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
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate("/orders")}>My Orders</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/borrows")}>My Borrows</DropdownMenuItem>
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
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Button onClick={() => navigate("/auth")} size="sm">Sign In</Button>
              <Button onClick={() => navigate("/admin-signup")} size="sm" variant="outline">
                <Shield className="mr-1 h-3 w-3" /> Admin
              </Button>
            </div>
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
          {user && (
            <>
              <Link to="/cart" className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>Cart ({totalItems})</Link>
              <Link to="/orders" className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>My Orders</Link>
              {isAdmin && <Link to="/admin" className="block text-sm font-medium text-primary" onClick={() => setMobileOpen(false)}>Admin Dashboard</Link>}
              {isPublisher && <Link to="/publisher" className="block text-sm font-medium text-primary" onClick={() => setMobileOpen(false)}>Publisher Dashboard</Link>}
              <button className="text-sm font-medium text-destructive" onClick={() => { signOut(); setMobileOpen(false); }}>Sign Out</button>
            </>
          )}
          {!user && (
            <>
              <Link to="/auth" className="block text-sm font-medium text-primary" onClick={() => setMobileOpen(false)}>Sign In</Link>
              <Link to="/admin-signup" className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>Admin/Publisher Signup</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

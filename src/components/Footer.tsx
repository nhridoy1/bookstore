import { Link } from "react-router-dom";
import BrandLogo from "@/components/BrandLogo";

export default function Footer() {
  return (
    <footer className="border-t bg-card mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="mb-3"><BrandLogo /></div>
            <p className="text-sm text-muted-foreground">Your one-stop destination for books. Buy, borrow, and explore thousands of titles.</p>
          </div>
          <div>
            <h4 className="font-heading font-semibold mb-3">Quick Links</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <Link to="/books" className="block hover:text-foreground transition-colors">Browse Books</Link>
              <Link to="/categories" className="block hover:text-foreground transition-colors">Categories</Link>
            </div>
          </div>
          <div>
            <h4 className="font-heading font-semibold mb-3">Account</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <Link to="/auth" className="block hover:text-foreground transition-colors">Sign In</Link>
              <Link to="/orders" className="block hover:text-foreground transition-colors">My Orders</Link>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} BookJunky. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

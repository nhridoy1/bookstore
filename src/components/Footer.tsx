import { Link } from "react-router-dom";
import BrandLogo from "@/components/BrandLogo";
import { Mail, MapPin, Phone, BookOpen, ShieldCheck, Truck, Instagram, Twitter, Facebook } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-auto relative overflow-hidden bg-[hsl(var(--secondary))] text-foreground border-t border-border/60">
      {/* Warm decorative gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(1200px 400px at 10% -20%, hsl(var(--primary) / 0.18), transparent 60%), radial-gradient(900px 500px at 100% 120%, hsl(var(--accent) / 0.20), transparent 55%)",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="relative container mx-auto px-4 pt-12 pb-6">
        {/* Trust strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-8 mb-8 border-b border-border/60">
          {[
            { icon: Truck, title: "Fast Delivery", desc: "Standard shipping in 3–7 days" },
            { icon: ShieldCheck, title: "Secure Checkout", desc: "Encrypted payments end-to-end" },
            { icon: BookOpen, title: "Borrow & Buy", desc: "Read now, own it later" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 rounded-lg bg-background/60 backdrop-blur-sm border border-border/50 px-4 py-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-heading text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="mb-3"><BrandLogo /></div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A cozy corner of the internet for readers. Buy, borrow, and discover thousands of hand-picked titles.
            </p>
            <div className="flex items-center gap-2 mt-4">
              {[Instagram, Twitter, Facebook].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label="Social link"
                  className="h-9 w-9 rounded-full border border-border/70 bg-background/60 flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-3 text-sm uppercase tracking-wider">Explore</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <Link to="/books" className="block hover:text-primary transition-colors">Browse Books</Link>
              <Link to="/categories" className="block hover:text-primary transition-colors">Categories</Link>
              <Link to="/creators" className="block hover:text-primary transition-colors">Authors & Publishers</Link>
              <Link to="/wishlist" className="block hover:text-primary transition-colors">Wishlist</Link>
            </div>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-3 text-sm uppercase tracking-wider">Policies</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <Link to="/policies/borrow" className="block hover:text-primary transition-colors">Book Borrow Policy</Link>
              <Link to="/policies/refund" className="block hover:text-primary transition-colors">Buy & Refund Policy</Link>
              <Link to="/orders" className="block hover:text-primary transition-colors">My Orders</Link>
              <Link to="/borrows" className="block hover:text-primary transition-colors">My Borrows</Link>
            </div>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-3 text-sm uppercase tracking-wider">Contact</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> hello@bookjunky.co</p>
              <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> +1 (555) 010-2288</p>
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> 221B Reader Ln, Bookville</p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-5 border-t border-border/60 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} BookJunky. Crafted for readers, everywhere.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link to="/policies/borrow" className="hover:text-primary transition-colors">Borrow Policy</Link>
            <span aria-hidden>·</span>
            <Link to="/policies/refund" className="hover:text-primary transition-colors">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

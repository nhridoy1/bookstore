import { Link } from "react-router-dom";
import { ShoppingCart, BookOpen, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";

export interface BookCardProps {
  id: string;
  title: string;
  author: string;
  price: number;
  cover_image_url: string | null;
  is_borrowable: boolean;
  stock_quantity: number;
  category_name?: string;
  avgRating?: number;
  reviewCount?: number;
}

export default function BookCard({ id, title, author, price, cover_image_url, is_borrowable, stock_quantity, category_name, avgRating, reviewCount }: BookCardProps) {
  const { user } = useAuth();
  const { addToCart } = useCart();

  return (
    <div className="group rounded-lg border bg-card shadow-card overflow-hidden transition-all hover:shadow-book hover:-translate-y-1 animate-fade-in">
      <Link to={`/books/${id}`} className="block">
        <div className="aspect-[3/4] overflow-hidden bg-muted">
          {cover_image_url ? (
            <img src={cover_image_url} alt={title} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <BookOpen className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
        </div>
      </Link>
      <div className="p-4 space-y-2">
        {category_name && <Badge variant="secondary" className="text-xs">{category_name}</Badge>}
        <Link to={`/books/${id}`}>
          <h3 className="font-heading font-semibold text-card-foreground line-clamp-1 hover:text-primary transition-colors">{title}</h3>
        </Link>
        <p className="text-sm text-muted-foreground">{author}</p>
        {avgRating !== undefined && (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={`h-3 w-3 ${s <= Math.round(avgRating) ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
            ))}
            <span className="text-xs text-muted-foreground ml-1">({reviewCount})</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-1">
          <span className="font-heading text-lg font-bold text-primary">${price.toFixed(2)}</span>
          <div className="flex gap-1">
            {is_borrowable && <Badge variant="outline" className="text-xs text-accent border-accent">Borrowable</Badge>}
          </div>
        </div>
        {user && stock_quantity > 0 && (
          <Button size="sm" className="w-full mt-2" onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(id); }}>
            <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
          </Button>
        )}
        {stock_quantity === 0 && <p className="text-xs text-destructive text-center mt-2">Out of Stock</p>}
      </div>
    </div>
  );
}

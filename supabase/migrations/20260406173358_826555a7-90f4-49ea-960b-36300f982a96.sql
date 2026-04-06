
-- Wishlist table
CREATE TABLE public.wishlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, book_id)
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wishlist" ON public.wishlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to own wishlist" ON public.wishlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove from own wishlist" ON public.wishlists FOR DELETE USING (auth.uid() = user_id);

-- Borrow enhancements on books
ALTER TABLE public.books ADD COLUMN borrow_price NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.books ADD COLUMN borrow_policy TEXT;

-- Borrow enhancements on book_borrows
ALTER TABLE public.book_borrows ADD COLUMN user_message TEXT;

-- Stock update trigger for borrows
CREATE OR REPLACE FUNCTION public.update_stock_on_borrow_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When status changes to 'borrowed' (approved), decrease stock
  IF NEW.status = 'borrowed' AND (OLD.status IS NULL OR OLD.status != 'borrowed') THEN
    UPDATE public.books SET stock_quantity = GREATEST(stock_quantity - 1, 0) WHERE id = NEW.book_id;
  END IF;
  -- When status changes to 'returned', increase stock
  IF NEW.status = 'returned' AND OLD.status != 'returned' THEN
    UPDATE public.books SET stock_quantity = stock_quantity + 1 WHERE id = NEW.book_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_stock_on_borrow
BEFORE UPDATE ON public.book_borrows
FOR EACH ROW
EXECUTE FUNCTION public.update_stock_on_borrow_change();

-- Stock update trigger for orders (when delivered, decrease stock)
CREATE OR REPLACE FUNCTION public.update_stock_on_order_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When order status changes to 'processing' (confirmed), decrease stock by order quantities
  IF NEW.status = 'processing' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
    UPDATE public.books b SET stock_quantity = GREATEST(b.stock_quantity - oi.quantity, 0)
    FROM public.order_items oi WHERE oi.order_id = NEW.id AND oi.book_id = b.id;
  END IF;
  -- When order is cancelled (was processing/shipped), restore stock
  IF NEW.status = 'cancelled' AND OLD.status IN ('processing', 'shipped') THEN
    UPDATE public.books b SET stock_quantity = b.stock_quantity + oi.quantity
    FROM public.order_items oi WHERE oi.order_id = NEW.id AND oi.book_id = b.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_stock_on_order
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_stock_on_order_status();

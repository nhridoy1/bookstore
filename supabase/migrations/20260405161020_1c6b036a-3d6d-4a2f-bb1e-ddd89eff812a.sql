
-- Add payment method and payment status to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'cod';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid';

-- Add foreign key from orders.user_id to profiles.user_id
ALTER TABLE public.orders ADD CONSTRAINT orders_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add foreign key from book_borrows.user_id to profiles.user_id  
ALTER TABLE public.book_borrows ADD CONSTRAINT book_borrows_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Allow admins to delete orders
CREATE POLICY "Admins can delete orders"
  ON public.orders FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

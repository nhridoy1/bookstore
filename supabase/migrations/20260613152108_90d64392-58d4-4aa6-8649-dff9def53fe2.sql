
CREATE POLICY "Admins can update profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.book_borrows
  ADD COLUMN IF NOT EXISTS fine_amount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fine_note TEXT,
  ADD COLUMN IF NOT EXISTS fine_sent_at TIMESTAMP WITH TIME ZONE;

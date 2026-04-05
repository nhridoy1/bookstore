
ALTER TABLE public.book_borrows 
  ALTER COLUMN status SET DEFAULT 'pending',
  ADD COLUMN borrow_days integer DEFAULT 14,
  ADD COLUMN approved_at timestamp with time zone;

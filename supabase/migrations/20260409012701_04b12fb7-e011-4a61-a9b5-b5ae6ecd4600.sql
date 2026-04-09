
CREATE TABLE public.book_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parent_id UUID REFERENCES public.book_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.book_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments viewable by everyone"
ON public.book_comments FOR SELECT
USING (true);

CREATE POLICY "Users can create own comments"
ON public.book_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
ON public.book_comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
ON public.book_comments FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any comment"
ON public.book_comments FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Publishers can delete any comment"
ON public.book_comments FOR DELETE
USING (public.has_role(auth.uid(), 'publisher'));

CREATE INDEX idx_book_comments_book_id ON public.book_comments(book_id);
CREATE INDEX idx_book_comments_parent_id ON public.book_comments(parent_id);

CREATE TRIGGER update_book_comments_updated_at
BEFORE UPDATE ON public.book_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.publisher_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
  book_title TEXT NOT NULL,
  author TEXT,
  preferred_publisher TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.publisher_requests TO authenticated;
GRANT ALL ON public.publisher_requests TO service_role;

ALTER TABLE public.publisher_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own requests"
  ON public.publisher_requests FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all requests"
  ON public.publisher_requests FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Publishers view all requests"
  ON public.publisher_requests FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'publisher'));

CREATE POLICY "Admins update requests"
  ON public.publisher_requests FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_publisher_requests_updated_at
  BEFORE UPDATE ON public.publisher_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
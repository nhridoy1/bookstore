
-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins/publishers can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'publisher'::app_role));

CREATE POLICY "Admins can delete notifications"
ON public.notifications FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete profiles (for user removal)
CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete user_roles for any user
CREATE POLICY "Admins can delete any user roles"
ON public.user_roles FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

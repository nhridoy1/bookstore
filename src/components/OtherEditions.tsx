import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BookOpen, Building2, Send } from "lucide-react";

interface Props {
  bookId: string;
  title: string;
  author: string;
  currentPublisherId: string | null;
}

export default function OtherEditions({ bookId, title, author, currentPublisherId }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [preferredPublisher, setPreferredPublisher] = useState("");
  const [message, setMessage] = useState("");

  const { data: editions = [] } = useQuery({
    queryKey: ["other-editions", bookId, title],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("id, title, author, cover_image_url, price, publisher_id, profiles:publisher_id(display_name)")
        .ilike("title", title)
        .neq("id", bookId);
      if (error) throw error;
      return data || [];
    },
  });

  const requestMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in required");
      const { error } = await supabase.from("publisher_requests").insert({
        user_id: user.id,
        book_id: bookId,
        book_title: title,
        author,
        preferred_publisher: preferredPublisher || null,
        message: message || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Request submitted", description: "Publishers will see your request." });
      setOpen(false);
      setPreferredPublisher("");
      setMessage("");
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <section className="mt-12 rounded-xl border border-border bg-secondary/40 p-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-xl font-bold">Other Editions & Publishers</h2>
        </div>
        {user && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Send className="h-4 w-4" /> Request from another publisher
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-heading">Request a different publisher edition</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Tell us which publisher's edition of <span className="font-medium text-foreground">"{title}"</span> you'd like to see.
                </p>
                <div>
                  <label className="text-sm font-medium">Preferred publisher</label>
                  <Input
                    value={preferredPublisher}
                    onChange={(e) => setPreferredPublisher(e.target.value)}
                    placeholder="e.g. Penguin Classics"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Notes (optional)</label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Edition year, language, hardcover, etc."
                    rows={3}
                    className="mt-1"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => requestMutation.mutate()}
                  disabled={requestMutation.isPending}
                >
                  {requestMutation.isPending ? "Submitting..." : "Submit request"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {editions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No other editions found yet. Use the request button to ask for a specific publisher's edition.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {editions.map((e: any) => (
            <Link
              key={e.id}
              to={`/books/${e.id}`}
              className="group flex gap-3 rounded-lg border bg-card p-3 hover:shadow-book transition-all"
            >
              <div className="h-20 w-14 flex-shrink-0 overflow-hidden rounded bg-muted">
                {e.cover_image_url ? (
                  <img src={e.cover_image_url} alt={e.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <BookOpen className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">{e.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{e.author}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <Building2 className="inline h-3 w-3 mr-1" />
                  {e.profiles?.display_name || "Unknown publisher"}
                </p>
                <p className="text-sm font-semibold text-primary mt-1">${Number(e.price).toFixed(2)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

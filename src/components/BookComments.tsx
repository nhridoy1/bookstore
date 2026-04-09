import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Reply, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";

interface Comment {
  id: string;
  book_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  profiles?: { display_name: string | null; avatar_url: string | null } | null;
  replies?: Comment[];
}

export default function BookComments({ bookId }: { bookId: string }) {
  const { user, isAdmin, isPublisher } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  const { data: comments = [] } = useQuery({
    queryKey: ["book-comments", bookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("book_comments")
        .select("*, profiles(display_name, avatar_url)")
        .eq("book_id", bookId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      
      // Build tree
      const map = new Map<string, Comment>();
      const roots: Comment[] = [];
      (data || []).forEach((c: any) => {
        map.set(c.id, { ...c, replies: [] });
      });
      map.forEach((c) => {
        if (c.parent_id && map.has(c.parent_id)) {
          map.get(c.parent_id)!.replies!.push(c);
        } else {
          roots.push(c);
        }
      });
      return roots;
    },
  });

  const postMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: string }) => {
      const { error } = await supabase.from("book_comments").insert({
        book_id: bookId,
        user_id: user!.id,
        content,
        parent_id: parentId || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["book-comments", bookId] });
      setNewComment("");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from("book_comments").delete().eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["book-comments", bookId] });
      toast({ title: "Comment deleted" });
    },
  });

  const totalComments = comments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0);

  return (
    <div className="mt-10">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h2 className="font-heading text-xl font-bold">Comments ({totalComments})</h2>
      </div>

      {user && (
        <div className="mb-6">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            rows={3}
          />
          <Button
            className="mt-2"
            size="sm"
            disabled={!newComment.trim() || postMutation.isPending}
            onClick={() => postMutation.mutate({ content: newComment.trim() })}
          >
            {postMutation.isPending ? "Posting..." : "Post Comment"}
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            bookId={bookId}
            user={user}
            isAdmin={isAdmin}
            isPublisher={isPublisher}
            onDelete={(id) => deleteMutation.mutate(id)}
            onReply={(content, parentId) => postMutation.mutate({ content, parentId })}
            isPending={postMutation.isPending}
          />
        ))}
        {comments.length === 0 && (
          <p className="text-center text-muted-foreground py-6">No comments yet. Be the first to comment!</p>
        )}
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  bookId,
  user,
  isAdmin,
  isPublisher,
  onDelete,
  onReply,
  isPending,
  depth = 0,
}: {
  comment: Comment;
  bookId: string;
  user: any;
  isAdmin: boolean;
  isPublisher: boolean;
  onDelete: (id: string) => void;
  onReply: (content: string, parentId: string) => void;
  isPending: boolean;
  depth?: number;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReplies, setShowReplies] = useState(true);

  const canDelete = user && (user.id === comment.user_id || isAdmin || isPublisher);
  const profile = comment.profiles;
  const displayName = profile?.display_name || "Anonymous";

  return (
    <div className={`${depth > 0 ? "ml-8 border-l-2 border-muted pl-4" : ""}`}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="text-xs">{displayName[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{displayName}</span>
            <span className="text-xs text-muted-foreground">{format(new Date(comment.created_at), "MMM d, yyyy · h:mm a")}</span>
          </div>
          <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{comment.content}</p>
          <div className="flex items-center gap-2 mt-2">
            {user && depth < 3 && (
              <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => setReplyOpen(!replyOpen)}>
                <Reply className="h-3 w-3 mr-1" /> Reply
              </Button>
            )}
            {canDelete && (
              <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-destructive" onClick={() => onDelete(comment.id)}>
                <Trash2 className="h-3 w-3 mr-1" /> Delete
              </Button>
            )}
          </div>

          {replyOpen && (
            <div className="mt-2 space-y-2">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                rows={2}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="text-xs h-7"
                  disabled={!replyText.trim() || isPending}
                  onClick={() => {
                    onReply(replyText.trim(), comment.id);
                    setReplyText("");
                    setReplyOpen(false);
                  }}
                >
                  Post Reply
                </Button>
                <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setReplyOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          <Button variant="ghost" size="sm" className="text-xs h-6 px-1 mb-2" onClick={() => setShowReplies(!showReplies)}>
            {showReplies ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
            {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
          </Button>
          {showReplies && (
            <div className="space-y-3">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  bookId={bookId}
                  user={user}
                  isAdmin={isAdmin}
                  isPublisher={isPublisher}
                  onDelete={onDelete}
                  onReply={onReply}
                  isPending={isPending}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

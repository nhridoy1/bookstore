import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, ThumbsUp, ThumbsDown, Minus, Loader2 } from "lucide-react";

interface Result {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  summary: string;
  highlights: string[];
  analyzed?: number;
}

export default function CommentAnalysis({ bookId, bookTitle }: { bookId: string; bookTitle?: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const run = async () => {
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-comments", { body: { book_id: bookId } });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setResult(data as Result);
    } catch (e: any) {
      toast({ title: "Analysis failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const pct = (n: number) => (result && result.total ? Math.round((n / result.total) * 100) : 0);

  return (
    <Card className="border-primary/30">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> AI Sentiment Analysis
            </p>
            {bookTitle && <p className="text-xs text-muted-foreground">{bookTitle}</p>}
          </div>
          <Button size="sm" onClick={run} disabled={loading}>
            {loading ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Analyzing...</> : result ? "Re-analyze" : "Analyze"}
          </Button>
        </div>

        {result && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded border p-2 text-center bg-green-500/10">
                <ThumbsUp className="h-4 w-4 mx-auto text-green-600 mb-1" />
                <p className="text-lg font-heading font-bold">{result.positive}</p>
                <p className="text-[10px] text-muted-foreground">Positive · {pct(result.positive)}%</p>
              </div>
              <div className="rounded border p-2 text-center bg-muted">
                <Minus className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-lg font-heading font-bold">{result.neutral}</p>
                <p className="text-[10px] text-muted-foreground">Neutral · {pct(result.neutral)}%</p>
              </div>
              <div className="rounded border p-2 text-center bg-destructive/10">
                <ThumbsDown className="h-4 w-4 mx-auto text-destructive mb-1" />
                <p className="text-lg font-heading font-bold">{result.negative}</p>
                <p className="text-[10px] text-muted-foreground">Negative · {pct(result.negative)}%</p>
              </div>
            </div>
            {result.summary && (
              <p className="text-sm text-foreground bg-muted/40 rounded p-2">{result.summary}</p>
            )}
            {result.highlights?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {result.highlights.map((h, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{h}</Badge>
                ))}
              </div>
            )}
            {result.total === 0 && (
              <p className="text-xs text-muted-foreground text-center">No feedback yet to analyze.</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

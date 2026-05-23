import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } }
    );

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error("Not authenticated");

    // Verify role
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userData.user.id);
    const isAdmin = roles?.some((r: any) => r.role === "admin");
    const isPublisher = roles?.some((r: any) => r.role === "publisher");
    if (!isAdmin && !isPublisher) throw new Error("Forbidden");

    const { book_id } = await req.json();
    if (!book_id) throw new Error("book_id required");

    // Publisher can only analyze own books
    if (!isAdmin) {
      const { data: book } = await supabase.from("books").select("publisher_id").eq("id", book_id).maybeSingle();
      if (book?.publisher_id !== userData.user.id) throw new Error("Forbidden");
    }

    const [reviewsRes, commentsRes] = await Promise.all([
      supabase.from("book_reviews").select("rating, review_text").eq("book_id", book_id),
      supabase.from("book_comments").select("content").eq("book_id", book_id),
    ]);

    const reviews = reviewsRes.data || [];
    const comments = commentsRes.data || [];
    const items: string[] = [
      ...reviews.filter((r: any) => r.review_text).map((r: any) => `[Review ${r.rating}/5] ${r.review_text}`),
      ...comments.map((c: any) => `[Comment] ${c.content}`),
    ];

    if (items.length === 0) {
      return new Response(
        JSON.stringify({ total: 0, positive: 0, neutral: 0, negative: 0, summary: "No feedback yet for this book.", highlights: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sample = items.slice(0, 80).join("\n---\n");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You analyze book feedback sentiment. Always return data via the provided tool." },
          { role: "user", content: `Analyze the following ${items.length} feedback entries (reviews & comments) for one book. Classify each as positive, neutral, or negative, then summarize.\n\n${sample}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "report_sentiment",
            description: "Return aggregated sentiment analysis",
            parameters: {
              type: "object",
              properties: {
                positive: { type: "integer", description: "Count of positive entries" },
                neutral: { type: "integer", description: "Count of neutral entries" },
                negative: { type: "integer", description: "Count of negative entries" },
                summary: { type: "string", description: "2-3 sentence overall summary in plain English" },
                highlights: {
                  type: "array",
                  description: "Up to 5 key themes (e.g., 'praises pacing', 'criticizes ending')",
                  items: { type: "string" },
                },
              },
              required: ["positive", "neutral", "negative", "summary", "highlights"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "report_sentiment" } },
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      if (aiRes.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded, try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiRes.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI gateway error: " + t);
    }

    const data = await aiRes.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = args ? JSON.parse(args) : {};
    const total = (parsed.positive || 0) + (parsed.neutral || 0) + (parsed.negative || 0);

    return new Response(
      JSON.stringify({
        total: total || items.length,
        positive: parsed.positive || 0,
        neutral: parsed.neutral || 0,
        negative: parsed.negative || 0,
        summary: parsed.summary || "",
        highlights: parsed.highlights || [],
        analyzed: items.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("analyze-comments error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

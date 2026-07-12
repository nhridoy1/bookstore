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

    const { data: reviews = [], error: reviewsError } = await supabase
      .from("book_reviews")
      .select("rating, review_text")
      .eq("book_id", book_id);
    if (reviewsError) throw reviewsError;

    const items: string[] = reviews.map((r: any, index: number) => {
      const text = typeof r.review_text === "string" && r.review_text.trim().length > 0
        ? r.review_text.trim()
        : "No written review.";
      return `[Review ${index + 1} · Rating ${r.rating}/5] ${text}`;
    });
    const ratingSentiment = reviews.reduce(
      (acc: { positive: number; neutral: number; negative: number }, review: any) => {
        const rating = Number(review.rating) || 0;
        if (rating >= 4) acc.positive += 1;
        else if (rating <= 2) acc.negative += 1;
        else acc.neutral += 1;
        return acc;
      },
      { positive: 0, neutral: 0, negative: 0 }
    );

    if (items.length === 0) {
      return new Response(
        JSON.stringify({ total: 0, positive: 0, neutral: 0, negative: 0, summary: "No reviews yet for this book.", highlights: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const actualTotal = reviews.length;
    const sample = items.slice(0, 80).join("\n---\n");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You summarize book review sentiment themes. Always return data via the provided tool. Counts are calculated separately from review ratings, so focus on an accurate summary and highlights." },
          { role: "user", content: `Summarize exactly ${actualTotal} book reviews for one book. Do not include comments or invent additional reviews.\n\n${sample}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "report_sentiment",
            description: "Return aggregated sentiment analysis",
            parameters: {
              type: "object",
              properties: {
                positive: { type: "integer", description: "Count of positive reviews" },
                neutral: { type: "integer", description: "Count of neutral reviews" },
                negative: { type: "integer", description: "Count of negative reviews" },
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
    let p = ratingSentiment.positive;
    let n = ratingSentiment.neutral;
    let g = ratingSentiment.negative;
    p = Math.min(p, actualTotal);
    n = Math.min(n, actualTotal);
    g = Math.min(g, actualTotal);
    const aiSum = p + n + g;

    // Normalize AI counts to match the actual number of items analyzed
    if (aiSum === 0) {
      n = actualTotal;
    } else if (aiSum !== actualTotal) {
      // Proportionally rescale
      const scaled = [p, n, g].map((v) => (v * actualTotal) / aiSum);
      const rounded = scaled.map((v) => Math.floor(v));
      let diff = actualTotal - rounded.reduce((a, b) => a + b, 0);
      // Distribute leftover to largest fractional parts
      const fracs = scaled.map((v, i) => ({ i, f: v - Math.floor(v) })).sort((a, b) => b.f - a.f);
      for (let k = 0; k < diff; k++) rounded[fracs[k % 3].i]++;
      [p, n, g] = rounded;
    }

    return new Response(
      JSON.stringify({
        total: actualTotal,
        positive: p,
        neutral: n,
        negative: g,
        summary: parsed.summary || "",
        highlights: parsed.highlights || [],
        analyzed: actualTotal,
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

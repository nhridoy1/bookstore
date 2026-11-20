import { describe, expect, it } from "vitest";
import { aggregateFeedbackSentiment, type FeedbackItem } from "../../supabase/functions/_shared/feedback-analysis";

describe("aggregateFeedbackSentiment", () => {
  it("counts each review and comment exactly once, ignoring duplicate and unknown model IDs", () => {
    const items: FeedbackItem[] = [
      { id: "review:1", kind: "review", text: "Great story", rating: 5, fallbackSentiment: "positive" },
      { id: "review:2", kind: "review", text: "", rating: 2, fallbackSentiment: "negative" },
      { id: "comment:1", kind: "comment", text: "Beautifully written", fallbackSentiment: "neutral" },
    ];

    const result = aggregateFeedbackSentiment(items, [
      { id: "review:1", sentiment: "positive" },
      { id: "review:1", sentiment: "negative" },
      { id: "comment:1", sentiment: "neutral" },
      { id: "unrelated", sentiment: "negative" },
    ]);

    expect(result).toEqual({ total: 3, reviews: 2, comments: 1, positive: 1, neutral: 1, negative: 1 });
    expect(result.positive + result.neutral + result.negative).toBe(result.total);
  });
});
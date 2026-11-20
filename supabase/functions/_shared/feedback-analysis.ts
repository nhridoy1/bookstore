export type Sentiment = "positive" | "neutral" | "negative";

export interface FeedbackClassification {
  id: string;
  sentiment: Sentiment;
}

export interface FeedbackItem {
  id: string;
  kind: "review" | "comment";
  text: string;
  fallbackSentiment: Sentiment;
  rating?: number;
}

export function aggregateFeedbackSentiment(
  items: FeedbackItem[],
  classifications: FeedbackClassification[],
) {
  const expectedIds = new Set(items.filter((item) => item.text.length > 0).map((item) => item.id));
  const sentimentById = new Map<string, Sentiment>();
  for (const classification of classifications) {
    if (expectedIds.has(classification.id) && !sentimentById.has(classification.id)) {
      sentimentById.set(classification.id, classification.sentiment);
    }
  }

  const result = { total: items.length, reviews: 0, comments: 0, positive: 0, neutral: 0, negative: 0 };
  for (const item of items) {
    if (item.kind === "review") result.reviews += 1;
    else result.comments += 1;

    const sentiment = sentimentById.get(item.id) ?? item.fallbackSentiment;
    result[sentiment] += 1;
  }
  return result;
}
export type ConversationTurn = {
  role: "user" | "assistant";
  content: string;
};

export interface PlaceRecommendation {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  district: string | null;
  description: string | null;
  image: string | null;
  rating: number | null;
  reviews: number | null;
  difficulty: string | null;
  season: string | null;
  safetyTips: string | null;
  activities: string[];
  insiderTip: string | null;
  matchReason?: string;
}

export interface RecommendationResponse {
  reply: string;
  recommendedDestinationIds: string[];
  places: PlaceRecommendation[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "places" | "heritage" | "nature" | "coast" | "reviews";
  tier: "Bronze" | "Silver" | "Gold" | "Master";
  criteria: {
    type: "places_count" | "districts_count" | "reviews_count" | "category_count";
    targetCategory?: string;
    threshold: number;
  };
}

export const BADGES: Badge[] = [
  {
    id: "island-pioneer",
    name: "Island Pioneer",
    description: "Contributed 10+ hidden places across 3+ districts in Sri Lanka",
    icon: "🌟",
    category: "places",
    tier: "Gold",
    criteria: {
      type: "districts_count",
      threshold: 3,
    },
  },
  {
    id: "heritage-hunter",
    name: "Heritage Hunter",
    description: "Cataloged 5+ ancient temples, ruins, and sacred cultural grounds",
    icon: "🛕",
    category: "heritage",
    tier: "Silver",
    criteria: {
      type: "category_count",
      targetCategory: "Temples",
      threshold: 5,
    },
  },
  {
    id: "waterfall-scout",
    name: "Waterfall Scout",
    description: "Mapped 5+ wild waterfalls, cascades, and secluded natural plunge pools",
    icon: "💧",
    category: "nature",
    tier: "Bronze",
    criteria: {
      type: "category_count",
      targetCategory: "Waterfalls",
      threshold: 5,
    },
  },
  {
    id: "coast-explorer",
    name: "Coast Explorer",
    description: "Discovered 4+ secret horseshoe bays, reefs, and wild sand beaches",
    icon: "🌊",
    category: "coast",
    tier: "Silver",
    criteria: {
      type: "category_count",
      targetCategory: "Beaches",
      threshold: 4,
    },
  },
  {
    id: "ancient-trails",
    name: "Ancient Trails",
    description: "Mapped 15+ jungle trails, cave dwellings, and mountain summits",
    icon: "⛰️",
    category: "nature",
    tier: "Master",
    criteria: {
      type: "places_count",
      threshold: 15,
    },
  },
  {
    id: "community-guardian",
    name: "Community Guardian",
    description: "Wrote 25+ helpful field reviews with verified travel tips",
    icon: "🛡️",
    category: "reviews",
    tier: "Gold",
    criteria: {
      type: "reviews_count",
      threshold: 25,
    },
  },
];

export interface ContributorStats {
  placesCount: number;
  districtsCount: number;
  reviewsCount: number;
  categoryBreakdown: Record<string, number>;
}

export function evaluateBadges(stats: ContributorStats): Badge[] {
  return BADGES.filter((badge) => {
    switch (badge.criteria.type) {
      case "places_count":
        return stats.placesCount >= badge.criteria.threshold;
      case "districts_count":
        return stats.districtsCount >= badge.criteria.threshold;
      case "reviews_count":
        return stats.reviewsCount >= badge.criteria.threshold;
      case "category_count":
        if (!badge.criteria.targetCategory) return false;
        return (
          (stats.categoryBreakdown[badge.criteria.targetCategory] || 0) >=
          badge.criteria.threshold
        );
      default:
        return false;
    }
  });
}

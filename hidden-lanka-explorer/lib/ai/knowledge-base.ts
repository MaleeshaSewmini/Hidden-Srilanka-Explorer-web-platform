export interface PlaceRecommendation {
  id: string;
  name: string;
  slug: string;
  category: string;
  district: string;
  description: string;
  image: string;
  rating: number;
  reviews: number;
  difficulty: "Easy" | "Moderate" | "Challenging";
  season: string;
  tags: string[];
  insiderTip: string;
  matchReason?: string;
}

export const SRI_LANKA_PLACES: PlaceRecommendation[] = [
  {
    id: "sigiriya",
    name: "Sigiriya Ancient Rock Fortress",
    slug: "sigiriya-rock-fortress",
    category: "Ruins",
    district: "Matale",
    description:
      "A 5th-century ancient citadel perched atop a 200m towering granite pillar, featuring the famous Mirror Wall, lion paws gateway, and frescoes.",
    image: "/images/hero/sigiriya.jpg",
    rating: 4.9,
    reviews: 420,
    difficulty: "Moderate",
    season: "Year-Round (Best: Jan – Apr)",
    tags: ["culture", "history", "ruins", "unesco", "viewpoint", "architecture", "sunrise"],
    insiderTip:
      "Climb early in the morning before 7:30 AM to beat the mid-day heat and large group queues.",
  },
  {
    id: "knuckles",
    name: "Knuckles Mountain Range",
    slug: "knuckles-mountain-range",
    category: "Highlands",
    district: "Kandy / Matale",
    description:
      "A dramatic, mist-clad UNESCO wilderness with 34 isolated mountain peaks, hidden cloud forests, cascading streams, and secluded village trails.",
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
    rating: 4.9,
    reviews: 280,
    difficulty: "Challenging",
    season: "Jan – Mar, Jun – Sep",
    tags: ["hiking", "trekking", "nature", "mountains", "clouds", "adventure", "camp", "forest"],
    insiderTip:
      "Hire a local guide from Riverston or Meemure to navigate offbeat trail paths and leeches safely.",
  },
  {
    id: "bambarakanda",
    name: "Bambarakanda Falls",
    slug: "bambarakanda-falls",
    category: "Waterfalls",
    district: "Badulla",
    description:
      "Sri Lanka's tallest waterfall cascading 263 meters (863 ft) through sheer pine slopes, evergreen ridges, and a hidden natural plunge pool.",
    image:
      "https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=1200&q=80",
    rating: 4.8,
    reviews: 145,
    difficulty: "Moderate",
    season: "Mar – Sep",
    tags: ["waterfall", "nature", "swimming", "scenic", "pine forest", "haputale", "badulla"],
    insiderTip:
      "Take the upper pathway above the falls to discover Lanka Ella, a secret secluded pool shaped like the map of Sri Lanka.",
  },
  {
    id: "hiriketiya",
    name: "Hiriketiya Horseshoe Bay",
    slug: "hiriketiya-bay",
    category: "Beaches",
    district: "Matara",
    description:
      "A peaceful turquoise horseshoe-shaped cove bordered by lush coconut groves, celebrated for gentle surf breaks and relaxed bohemian beach cafés.",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    rating: 4.8,
    reviews: 312,
    difficulty: "Easy",
    season: "Nov – Apr",
    tags: ["beach", "surf", "coast", "swimming", "sunset", "south coast", "relaxation", "cafes"],
    insiderTip:
      "Best waves for beginner and intermediate surfers break at dawn between 6:30 AM and 9:00 AM.",
  },
  {
    id: "pottuvil",
    name: "Pottuvil Lagoon & Mangrove Sanctuary",
    slug: "pottuvil-lagoon",
    category: "Wildlife",
    district: "Ampara",
    description:
      "A tranquil wetland sanctuary where mangrove tunnels, saltwater crocodiles, swimming wild elephants, and migratory waterbirds convene on the eastern coast.",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    rating: 4.6,
    reviews: 63,
    difficulty: "Easy",
    season: "Apr – Sep",
    tags: ["wildlife", "safari", "birds", "elephants", "boat", "east coast", "arugam bay", "nature"],
    insiderTip:
      "Book a traditional rowboat with local fishermen at 4:30 PM to watch wild elephants drinking along the mangrove edges at dusk.",
  },
  {
    id: "pidurangala",
    name: "Pidurangala Rock",
    slug: "pidurangala-rock",
    category: "Ruins",
    district: "Matale",
    description:
      "An adjacent historic monastery rock offering the most spectacular panoramic 360-degree viewpoint directly facing the Sigiriya fortress.",
    image:
      "https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=1200&q=80",
    rating: 4.9,
    reviews: 520,
    difficulty: "Moderate",
    season: "Year-Round",
    tags: ["viewpoint", "sunrise", "hike", "sigiriya", "ruins", "monastery", "budget", "bouldering"],
    insiderTip:
      "Start the climb by 5:00 AM with a torch to catch the sunrise bathing Sigiriya in golden light.",
  },
  {
    id: "diyaluma",
    name: "Upper Diyaluma Natural Infinity Pools",
    slug: "upper-diyaluma-pools",
    category: "Waterfalls",
    district: "Badulla",
    description:
      "A series of crystal-clear tier pools and natural rock waterslides perched right atop Sri Lanka's second tallest waterfall overlooking the valley.",
    image:
      "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80",
    rating: 4.8,
    reviews: 210,
    difficulty: "Moderate",
    season: "Jan – Sep",
    tags: ["waterfall", "infinity pool", "swimming", "adventure", "ella", "scenic", "hike"],
    insiderTip:
      "Access from the Poonagala tea estate road above the falls for a much gentler 30-minute downhill hike instead of climbing from below.",
  },
  {
    id: "ritigala",
    name: "Ritigala Strict Nature Reserve & Monastery",
    slug: "ritigala-ancient-monastery",
    category: "Ruins",
    district: "Anuradhapura",
    description:
      "An enigmatic 1st-century BCE forest hermitage enveloped in dense jungle mist, paved granite pathways, sunken healing ponds, and herbal microclimates.",
    image:
      "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80",
    rating: 4.7,
    reviews: 95,
    difficulty: "Easy",
    season: "Year-Round",
    tags: ["forest", "monastery", "meditation", "ancient", "ayurveda", "nature", "quiet"],
    insiderTip:
      "Ritigala has a unique micro-ecosystem that feels much cooler than the surrounding dry plains; maintain silence to enjoy the bird songs.",
  },
  {
    id: "delft",
    name: "Delft Island (Neduntheevu)",
    slug: "delft-island",
    category: "Nature",
    district: "Jaffna",
    description:
      "A windswept, isolated limestone island in the Palk Strait featuring coral stone fences, wild feral horses descended from Dutch traders, and an ancient hollow Baobab tree.",
    image:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    rating: 4.7,
    reviews: 82,
    difficulty: "Easy",
    season: "Jan – Sep",
    tags: ["island", "jaffna", "horses", "history", "ferry", "dutch", "north coast", "remote"],
    insiderTip:
      "Catch the morning passenger ferry from Kurikadduwan (KKD) Jetty at 8:30 AM and rent a tuk-tuk on the island to see all points in 3 hours.",
  },
  {
    id: "riverston",
    name: "Riverston & Mini World's End",
    slug: "riverston-peak",
    category: "Highlands",
    district: "Matale",
    description:
      "A breezy ridge in the northern Knuckles range dropping vertically 300 meters, famous for rolling grasslands, wind gusts, and mist-wrapped vistas.",
    image:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
    rating: 4.8,
    reviews: 160,
    difficulty: "Moderate",
    season: "Feb – Sep",
    tags: ["highlands", "ridge", "viewpoint", "mist", "wind", "matale", "trekking", "scenic"],
    insiderTip:
      "Stop by the remote Sera Ella waterfall nearby, where you can walk behind the curtain of falling water inside a cave.",
  },
];

/**
 * Intelligent semantic match function when Gemini API is not yet configured or as fallback
 */
export function getLocalRecommendations(query: string): {
  reply: string;
  places: PlaceRecommendation[];
} {
  const normalized = query.toLowerCase();

  // Score each place
  const scored = SRI_LANKA_PLACES.map((place) => {
    let score = 0;
    const reasons: string[] = [];

    // Category matches
    if (
      normalized.includes(place.category.toLowerCase()) ||
      (normalized.includes("water") && place.category === "Waterfalls") ||
      (normalized.includes("beach") && place.category === "Beaches") ||
      (normalized.includes("temple") && place.category === "Temples") ||
      (normalized.includes("hike") && (place.category === "Highlands" || place.tags.includes("hike")))
    ) {
      score += 4;
      reasons.push(`Matches your interest in ${place.category.toLowerCase()}`);
    }

    // District matches
    if (normalized.includes(place.district.toLowerCase())) {
      score += 5;
      reasons.push(`Located directly in ${place.district}`);
    }

    // Tags matching
    for (const tag of place.tags) {
      if (normalized.includes(tag)) {
        score += 2;
        reasons.push(`Tagged with #${tag}`);
      }
    }

    // Difficulty matching
    if (normalized.includes("easy") && place.difficulty === "Easy") {
      score += 3;
      reasons.push("Gentle and beginner-friendly access");
    }
    if (
      (normalized.includes("adventure") || normalized.includes("hard") || normalized.includes("challenge")) &&
      place.difficulty === "Challenging"
    ) {
      score += 3;
      reasons.push("Exciting and challenging terrain for adventure seekers");
    }

    // Weather/Season keywords
    if (
      (normalized.includes("december") || normalized.includes("january") || normalized.includes("february") || normalized.includes("winter")) &&
      (place.season.includes("Dec") || place.season.includes("Jan") || place.season.includes("Feb") || place.season.includes("Year-Round"))
    ) {
      score += 2;
      reasons.push("Ideal weather during this season");
    }

    return {
      place,
      score,
      reason: reasons.length > 0 ? reasons[0] : "Remarkable offbeat destination in Sri Lanka",
    };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Take top 2-3 places (or default diverse selection if query was generic)
  const topMatches = scored[0].score > 0 ? scored.slice(0, 3) : scored.slice(0, 3);

  const matchedPlaces = topMatches.map((m) => ({
    ...m.place,
    matchReason: m.reason,
  }));

  // Generate natural language advice
  let reply = "";
  if (normalized.includes("beach") || normalized.includes("coast") || normalized.includes("surf")) {
    reply =
      "For a serene coastal getaway without the tourist crowds, I highly recommend exploring the southern and eastern shores. Here are the top hidden coastal spots perfectly suited to your search:";
  } else if (normalized.includes("waterfall") || normalized.includes("waterfalls") || normalized.includes("swim") || normalized.includes("pool")) {
    reply =
      "Sri Lanka has one of the highest densities of waterfalls in the world! Beyond the busy highway stops, these secret cascades feature secluded natural swimming pools and pristine scenery:";
  } else if (normalized.includes("hike") || normalized.includes("mountain") || normalized.includes("highland") || normalized.includes("trek")) {
    reply =
      "If you love misty ridges, tea country trails, and cool mountain air, the Central Highlands hold some of the island's most rewarding treks away from commercial routes:";
  } else if (normalized.includes("culture") || normalized.includes("ruin") || normalized.includes("temple") || normalized.includes("history")) {
    reply =
      "Sri Lanka's 2,500+ years of civilization are dotted with hidden jungle hermitages and rock fortresses where you can immerse yourself in peace:";
  } else {
    reply =
      "Based on your travel request, here are top handpicked hidden destinations across Sri Lanka with stunning views, authentic experiences, and insider tips:";
  }

  return {
    reply,
    places: matchedPlaces,
  };
}

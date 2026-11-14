import { calculateHaversineDistance } from "./distance";
import { PlaceRecord, TripPreference } from "./types";

/**
 * Calculates a match score (0 - 100) and specific match reasons for each published place
 * based strictly on the user's explicit preferences, starting location, and travel season.
 * PURE ALGORITHM - NO AI OR EXTERNAL AI APIS.
 */
export function scorePlaceRecommendation(
  place: PlaceRecord,
  startLat: number,
  startLng: number,
  preferences: TripPreference,
  tripMonth?: number // 1 - 12 (January to December)
): { score: number; reasons: string[] } {
  let score = 30; // base score for being an approved, published destination
  const reasons: string[] = [];

  // 1. Interest & Category Match (up to +35 points)
  const placeCat = (place.category_name || "").toLowerCase();
  const placeActivities = (place.activities || []).map((a) => a.toLowerCase());
  const placeText = `${place.name} ${place.description || ""} ${place.short_description || ""}`.toLowerCase();

  let matchedInterestCount = 0;
  for (const interest of preferences.interests) {
    const term = interest.toLowerCase();
    const isCategoryMatch = placeCat.includes(term);
    const isActivityMatch = placeActivities.some((act) => act.includes(term));
    const isTextMatch = placeText.includes(term);

    if (isCategoryMatch || isActivityMatch || isTextMatch) {
      matchedInterestCount++;
      if (reasons.length < 2) {
        reasons.push(`Matches ${interest}`);
      }
    }
  }

  if (preferences.interests.length > 0) {
    const interestRatio = Math.min(1, matchedInterestCount / Math.max(1, preferences.interests.length));
    score += Math.round(interestRatio * 35);
  } else {
    score += 15; // default moderate score if no specific interests picked
  }

  // 2. Preferred District Match (up to +20 points)
  if (preferences.preferred_districts.length > 0) {
    if (preferences.preferred_districts.includes(place.district)) {
      score += 20;
      reasons.push(`In preferred district (${place.district})`);
    }
  } else {
    score += 10;
  }

  // 3. Preferred Categories Match (+15 points)
  if (preferences.preferred_categories.length > 0) {
    const isCategorySelected = preferences.preferred_categories.some(
      (c) => c.toLowerCase() === placeCat || (place.category_id && c === place.category_id)
    );
    if (isCategorySelected) {
      score += 15;
    }
  }

  // 4. Proximity / Accessible distance from starting location (+10 points)
  const dist = calculateHaversineDistance(
    startLat,
    startLng,
    place.latitude,
    place.longitude
  );

  if (dist < 40) {
    score += 10;
    reasons.push("Very close to starting point");
  } else if (dist < 90) {
    score += 7;
  } else if (dist < 180) {
    score += 4;
  }

  // 5. Pace & Difficulty Matching (+5 points)
  const diff = (place.difficulty || "Moderate").toLowerCase();
  if (preferences.pace === "relaxed" && (diff.includes("easy") || diff.includes("moderate"))) {
    score += 5;
    reasons.push("Easy-going trail suitable for relaxed pace");
  } else if (preferences.pace === "packed" && (diff.includes("hard") || diff.includes("challenging") || diff.includes("high"))) {
    score += 5;
    reasons.push("Challenging adventure spot");
  }

  // 6. Seasonality check (+5 points if in season)
  if (tripMonth && place.best_season) {
    const season = place.best_season.toLowerCase();
    const isYearRound = season.includes("year-round") || season.includes("all year");
    const isDryNorthEast = (tripMonth >= 5 && tripMonth <= 9) && (season.includes("may") || season.includes("east"));
    const isDrySouthWest = (tripMonth <= 4 || tripMonth >= 11) && (season.includes("dec") || season.includes("south") || season.includes("west"));

    if (isYearRound || isDryNorthEast || isDrySouthWest) {
      score += 5;
      reasons.push("Ideal season for visit");
    }
  }

  // Quality boost from rating
  if (place.rating_avg && place.rating_avg >= 4.5) {
    score += 5;
  }

  const finalScore = Math.min(99, Math.max(30, score));
  return {
    score: finalScore,
    reasons: reasons.slice(0, 3),
  };
}

/**
 * Returns list of places ranked by recommendation score for a given trip
 */
export function getRecommendedPlaces(
  places: PlaceRecord[],
  startLat: number,
  startLng: number,
  preferences: TripPreference,
  excludePlaceIds: string[] = [],
  tripMonth?: number
): PlaceRecord[] {
  const available = places.filter((p) => !excludePlaceIds.includes(p.id));

  const scored = available.map((place) => {
    const { score, reasons } = scorePlaceRecommendation(
      place,
      startLat,
      startLng,
      preferences,
      tripMonth
    );
    const dist = calculateHaversineDistance(
      startLat,
      startLng,
      place.latitude,
      place.longitude
    );

    return {
      ...place,
      distance_km: dist,
      match_score: score,
      match_reasons: reasons,
    };
  });

  return scored.sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0));
}

/**
 * Finds alternative nearby places within a given radius (e.g. 15 km)
 * Useful for alternative suggestions in case of bad weather or overcrowding.
 */
export function findNearbyAlternatives(
  targetPlace: PlaceRecord,
  allPlaces: PlaceRecord[],
  maxRadiusKm = 25,
  limit = 3
): PlaceRecord[] {
  return allPlaces
    .filter((p) => p.id !== targetPlace.id)
    .map((p) => ({
      ...p,
      distance_km: calculateHaversineDistance(
        targetPlace.latitude,
        targetPlace.longitude,
        p.latitude,
        p.longitude
      ),
    }))
    .filter((p) => (p.distance_km ?? Infinity) <= maxRadiusKm)
    .sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0))
    .slice(0, limit);
}


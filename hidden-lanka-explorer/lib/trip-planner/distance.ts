import { LocationPoint, PlaceRecord, TransportMode } from "./types";

/**
 * Standard Sri Lankan Towns and Hubs for manual location selection
 */
export const SRI_LANKA_HUBS: LocationPoint[] = [
  { name: "Colombo (Fort / Central)", latitude: 6.9271, longitude: 79.8612, district: "Colombo" },
  { name: "Bandaranaike Airport (Katunayake / Negombo)", latitude: 7.1808, longitude: 79.8841, district: "Gampaha" },
  { name: "Kandy (Hill Country Hub)", latitude: 7.2906, longitude: 80.6337, district: "Kandy" },
  { name: "Galle (Southern Coast / Fort)", latitude: 6.0535, longitude: 80.221, district: "Galle" },
  { name: "Ella (Highlands)", latitude: 6.8667, longitude: 81.0466, district: "Badulla" },
  { name: "Nuwara Eliya (Tea Country)", latitude: 6.9497, longitude: 80.7891, district: "Nuwara Eliya" },
  { name: "Sigiriya / Dambulla (Cultural Triangle)", latitude: 7.8731, longitude: 80.6517, district: "Matale" },
  { name: "Anuradhapura (Ancient City)", latitude: 8.3114, longitude: 80.4037, district: "Anuradhapura" },
  { name: "Jaffna (Northern Capital)", latitude: 9.6615, longitude: 80.0255, district: "Jaffna" },
  { name: "Trincomalee (East Coast Harbor)", latitude: 8.5874, longitude: 81.2152, district: "Trincomalee" },
  { name: "Mirissa / Weligama", latitude: 5.9482, longitude: 80.4716, district: "Matara" },
  { name: "Arugam Bay", latitude: 6.8413, longitude: 81.8347, district: "Ampara" },
  { name: "Badulla (Knuckles & Uva Foothills)", latitude: 6.9934, longitude: 81.055, district: "Badulla" },
  { name: "Ratnapura (Peak Wilderness)", latitude: 6.6828, longitude: 80.4035, district: "Ratnapura" },
  { name: "Kurunegala (Wayamba Crossroads)", latitude: 7.4863, longitude: 80.3623, district: "Kurunegala" },
  { name: "Matale (Knuckles Gateway)", latitude: 7.4675, longitude: 80.6234, district: "Matale" },
];

/**
 * Calculates great-circle distance between two points using the Haversine formula
 * @returns distance in kilometers rounded to 1 decimal place
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const R = 6371; // Earth's mean radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  return Math.round(d * 10) / 10;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Estimates travel time in minutes based on real-world Sri Lankan road speeds
 */
export function estimateTravelMinutes(
  distanceKm: number,
  mode: TransportMode = "driving"
): number {
  if (distanceKm <= 0) return 0;

  // Real-world Sri Lanka average speeds considering traffic, hill roads & terrain
  let speedKmH = 38; // average driving speed in Sri Lanka
  switch (mode) {
    case "walking":
      speedKmH = 4.5;
      break;
    case "cycling":
      speedKmH = 14;
      break;
    case "transit":
      speedKmH = 28; // bus / train stops
      break;
    case "driving":
    default:
      speedKmH = 38;
      break;
  }

  // Account for road curvature: road distance is typically ~1.25x straight-line distance
  const estimatedRoadKm = distanceKm * 1.25;
  const hours = estimatedRoadKm / speedKmH;
  return Math.round(hours * 60);
}

/**
 * Formats duration in minutes to human readable string (e.g. "1h 45m" or "25 mins")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.max(1, Math.round(minutes))} mins`;
  }
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Formats distance in km
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Filters places within a given radius in kilometers from a location
 * Supports radius 5, 10, 25, 50, 100, or all (null / 0)
 */
export function filterPlacesByRadius(
  places: PlaceRecord[],
  startLat: number,
  startLng: number,
  radiusKm: number | null
): PlaceRecord[] {
  const withDistance = places.map((place) => {
    const dist = calculateHaversineDistance(
      startLat,
      startLng,
      place.latitude,
      place.longitude
    );
    return {
      ...place,
      distance_km: dist,
      estimated_drive_minutes: estimateTravelMinutes(dist, "driving"),
    };
  });

  if (!radiusKm || radiusKm <= 0) {
    return withDistance.sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0));
  }

  return withDistance
    .filter((p) => (p.distance_km ?? Infinity) <= radiusKm)
    .sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0));
}


import { calculateHaversineDistance, estimateTravelMinutes } from "./distance";
import { RouteLeg, RoutePlan, TransportMode } from "./types";

interface OSRMRouteResponse {
  code: string;
  routes?: Array<{
    distance: number; // in meters
    duration: number; // in seconds
    geometry: {
      type: "LineString";
      coordinates: [number, number][]; // [lon, lat]
    };
    legs?: Array<{
      distance: number;
      duration: number;
    }>;
  }>;
}

/**
 * Calculates a complete multi-stop route between an ordered list of points:
 * [Start Location, Stop 1, Stop 2, ..., Stop N]
 * Uses OSRM public routing API with automatic fallback to Haversine straight lines.
 */
export async function calculateRouteWithOSRM(
  waypoints: Array<{ name: string; latitude: number; longitude: number }>,
  mode: TransportMode = "driving"
): Promise<RoutePlan> {
  if (waypoints.length < 2) {
    return {
      totalDistanceKm: 0,
      totalDurationMinutes: 0,
      legs: [],
      fullPolyline: waypoints.map((w) => [w.latitude, w.longitude]),
      isOsrm: false,
    };
  }

  // Profile selection
  let profile = "driving";
  if (mode === "walking") profile = "foot";
  else if (mode === "cycling") profile = "bike";

  // Build OSRM query: {lon},{lat};{lon},{lat};...
  const coordString = waypoints
    .map((w) => `${w.longitude.toFixed(6)},${w.latitude.toFixed(6)}`)
    .join(";");

  const url = `https://router.project-osrm.org/route/v1/${profile}/${coordString}?overview=full&geometries=geojson`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data: OSRMRouteResponse = await response.json();

      if (data.code === "Ok" && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const fullPolyline: [number, number][] = route.geometry.coordinates.map(
          ([lon, lat]) => [lat, lon]
        );

        const totalDistanceKm = Math.round((route.distance / 1000) * 10) / 10;
        const totalDurationMinutes = Math.round(route.duration / 60);

        // Build individual leg information
        const legs: RouteLeg[] = [];
        const osrmLegs = route.legs || [];

        for (let i = 0; i < waypoints.length - 1; i++) {
          const from = waypoints[i];
          const to = waypoints[i + 1];
          const legDistKm =
            osrmLegs[i] != null
              ? Math.round((osrmLegs[i].distance / 1000) * 10) / 10
              : calculateHaversineDistance(
                  from.latitude,
                  from.longitude,
                  to.latitude,
                  to.longitude
                );

          const legDurationMin =
            osrmLegs[i] != null
              ? Math.round(osrmLegs[i].duration / 60)
              : estimateTravelMinutes(legDistKm, mode);

          legs.push({
            fromName: from.name,
            toName: to.name,
            distanceKm: legDistKm,
            durationMinutes: legDurationMin,
            coordinates: [
              [from.latitude, from.longitude],
              [to.latitude, to.longitude],
            ],
          });
        }

        return {
          totalDistanceKm,
          totalDurationMinutes,
          legs,
          fullPolyline,
          isOsrm: true,
        };
      }
    }
  } catch (error) {
    // Log softly and fallback seamlessly
    console.warn("OSRM routing unavailable, using Haversine calculation:", error);
  }

  // FALLBACK: Pure Haversine Calculation
  return fallbackHaversineRoute(waypoints, mode);
}

function fallbackHaversineRoute(
  waypoints: Array<{ name: string; latitude: number; longitude: number }>,
  mode: TransportMode
): RoutePlan {
  const legs: RouteLeg[] = [];
  let totalDistanceKm = 0;
  let totalDurationMinutes = 0;
  const fullPolyline: [number, number][] = waypoints.map((w) => [
    w.latitude,
    w.longitude,
  ]);

  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];
    const dist = calculateHaversineDistance(
      from.latitude,
      from.longitude,
      to.latitude,
      to.longitude
    );
    const duration = estimateTravelMinutes(dist, mode);

    totalDistanceKm += dist;
    totalDurationMinutes += duration;

    legs.push({
      fromName: from.name,
      toName: to.name,
      distanceKm: dist,
      durationMinutes: duration,
      coordinates: [
        [from.latitude, from.longitude],
        [to.latitude, to.longitude],
      ],
    });
  }

  return {
    totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
    totalDurationMinutes,
    legs,
    fullPolyline,
    isOsrm: false,
  };
}


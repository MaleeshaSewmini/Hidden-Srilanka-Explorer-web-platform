import { createClient } from "@/lib/supabase/client";
import { Trip } from "./types";

const LOCAL_STORAGE_TRIPS_KEY = "lanka_personalized_trips";
const LOCAL_STORAGE_VISITED_KEY = "lanka_visited_places";

/**
 * Loads all trips for the authenticated user, or falls back to local storage
 */
export async function loadUserTrips(): Promise<Trip[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    try {
      const { data: dbTrips, error: tripsErr } = await supabase
        .from("trips")
        .select(`
          *,
          destinations:trip_destinations(
            *,
            place:places(id, name, slug, district, nearest_town, category_id, short_description, description, hero_image_url, image_url, latitude, longitude, difficulty, best_season, entrance_fee, hidden_tips, safety_tips, warnings, road_condition, activities, rating_avg, rating_count, like_count)
          ),
          preferences:trip_preferences(*),
          expenses:trip_expenses(*),
          members:trip_members(*)
        `)
        .order("created_at", { ascending: false });

      if (!tripsErr && dbTrips && dbTrips.length > 0) {
        // Cache in localStorage
        try {
          localStorage.setItem(LOCAL_STORAGE_TRIPS_KEY, JSON.stringify(dbTrips));
        } catch {}
        return dbTrips as Trip[];
      }
    } catch (err) {
      console.warn("Could not query Supabase trips table, falling back to local storage:", err);
    }
  }

  // Fallback to local storage
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_TRIPS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Local storage load error:", e);
    }
  }

  return [];
}

/**
 * Saves or updates a trip in Supabase and local storage
 */
export async function saveTrip(trip: Trip): Promise<Trip> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const tripToSave: Trip = {
    ...trip,
    user_id: user ? user.id : trip.user_id || "guest-explorer",
    updated_at: new Date().toISOString(),
  };

  if (user) {
    try {
      // 1. Upsert main trip record
      const { error: tripErr } = await supabase.from("trips").upsert(
        {
          id: tripToSave.id,
          user_id: user.id,
          title: tripToSave.title,
          description: tripToSave.description,
          start_location_name: tripToSave.start_location_name,
          start_latitude: tripToSave.start_latitude,
          start_longitude: tripToSave.start_longitude,
          start_date: tripToSave.start_date,
          end_date: tripToSave.end_date,
          duration_days: tripToSave.duration_days,
          traveler_count: tripToSave.traveler_count,
          budget_currency: tripToSave.budget_currency,
          total_budget: tripToSave.total_budget,
          estimated_cost: tripToSave.estimated_cost,
          transport_mode: tripToSave.transport_mode,
          status: tripToSave.status,
          is_public: tripToSave.is_public,
          share_token: tripToSave.share_token,
          updated_at: tripToSave.updated_at,
        },
        { onConflict: "id" }
      );

      if (!tripErr) {
        // 2. Upsert preferences
        if (tripToSave.preferences) {
          await supabase.from("trip_preferences").upsert(
            {
              trip_id: tripToSave.id,
              interests: tripToSave.preferences.interests,
              preferred_districts: tripToSave.preferences.preferred_districts,
              preferred_categories: tripToSave.preferences.preferred_categories,
              pace: tripToSave.preferences.pace,
              accommodation_tier: tripToSave.preferences.accommodation_tier,
            },
            { onConflict: "trip_id" }
          );
        }

        // 3. Upsert destinations
        if (tripToSave.destinations && tripToSave.destinations.length > 0) {
          // Delete existing for this trip and re-insert for clean sequence
          await supabase.from("trip_destinations").delete().eq("trip_id", tripToSave.id);

          const destinationRows = tripToSave.destinations.map((d, idx) => ({
            trip_id: tripToSave.id,
            place_id: d.place_id,
            day_number: d.day_number || 1,
            order_index: idx,
            visit_time_slot: d.visit_time_slot || "morning",
            planned_date: d.planned_date || null,
            notes: d.notes || null,
            is_visited: d.is_visited || false,
            visited_at: d.visited_at || null,
          }));

          await supabase.from("trip_destinations").insert(destinationRows);
        }

        // 4. Upsert expenses
        if (tripToSave.expenses && tripToSave.expenses.length > 0) {
          await supabase.from("trip_expenses").delete().eq("trip_id", tripToSave.id);

          const expenseRows = tripToSave.expenses.map((e) => ({
            trip_id: tripToSave.id,
            category: e.category,
            title: e.title,
            amount: e.amount,
            is_estimated: e.is_estimated,
            notes: e.notes || null,
          }));

          await supabase.from("trip_expenses").insert(expenseRows);
        }
      }
    } catch (err) {
      console.warn("Supabase trip upsert encountered an error, saving to local cache:", err);
    }
  }

  // Update localStorage cache
  if (typeof window !== "undefined") {
    try {
      const existing = await loadUserTrips();
      const filtered = existing.filter((t) => t.id !== tripToSave.id);
      const updated = [tripToSave, ...filtered];
      localStorage.setItem(LOCAL_STORAGE_TRIPS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  }

  return tripToSave;
}

/**
 * Duplicates an existing trip with a new title and ID
 */
export async function duplicateTrip(trip: Trip): Promise<Trip> {
  const newTripId = `trip-${Date.now()}`;
  const duplicated: Trip = {
    ...trip,
    id: newTripId,
    title: `${trip.title} (Copy)`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    destinations: (trip.destinations || []).map((d) => ({
      ...d,
      id: `dest-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      trip_id: newTripId,
      is_visited: false,
      visited_at: null,
    })),
    expenses: (trip.expenses || []).map((e) => ({
      ...e,
      id: `exp-${newTripId}-${Math.random().toString(36).substring(2, 7)}`,
      trip_id: newTripId,
    })),
    preferences: trip.preferences
      ? {
          ...trip.preferences,
          id: undefined,
          trip_id: newTripId,
        }
      : undefined,
  };

  return await saveTrip(duplicated);
}

/**
 * Deletes a trip from Supabase and local storage
 */
export async function deleteTrip(tripId: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    try {
      await supabase.from("trips").delete().eq("id", tripId);
    } catch (err) {
      console.warn("Supabase trip delete notice:", err);
    }
  }

  if (typeof window !== "undefined") {
    try {
      const existing = await loadUserTrips();
      const updated = existing.filter((t) => t.id !== tripId);
      localStorage.setItem(LOCAL_STORAGE_TRIPS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  }
}

/**
 * Loads a shared trip by share token
 */
export async function loadSharedTripByToken(token: string): Promise<Trip | null> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("trips")
      .select(`
        *,
        destinations:trip_destinations(
          *,
          place:places(id, name, slug, district, nearest_town, category_id, short_description, description, hero_image_url, image_url, latitude, longitude, difficulty, best_season, entrance_fee, hidden_tips, safety_tips, warnings, road_condition, activities, rating_avg, rating_count, like_count)
        ),
        preferences:trip_preferences(*),
        expenses:trip_expenses(*)
      `)
      .eq("share_token", token)
      .maybeSingle();

    if (!error && data) {
      return data as Trip;
    }
  } catch (err) {
    console.warn("Error fetching shared trip by token:", err);
  }

  // Fallback check in local storage
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_TRIPS_KEY);
      if (saved) {
        const trips: Trip[] = JSON.parse(saved);
        const match = trips.find((t) => t.share_token === token || t.id === token);
        if (match) return match;
      }
    } catch {}
  }

  return null;
}

/**
 * Visited Places & Travel History Tracking
 */
export type VisitedPlaceRecord = {
  place_id: string;
  place_name: string;
  district: string;
  latitude: number;
  longitude: number;
  visited_at: string;
  trip_id?: string;
  trip_title?: string;
  notes?: string;
};

export function getVisitedPlaces(): VisitedPlaceRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_VISITED_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function markPlaceAsVisited(record: VisitedPlaceRecord): void {
  if (typeof window === "undefined") return;
  try {
    const current = getVisitedPlaces();
    const filtered = current.filter((v) => v.place_id !== record.place_id);
    const updated = [record, ...filtered];
    localStorage.setItem(LOCAL_STORAGE_VISITED_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Mark visited error:", e);
  }
}

export function unmarkPlaceAsVisited(placeId: string): void {
  if (typeof window === "undefined") return;
  try {
    const current = getVisitedPlaces();
    const updated = current.filter((v) => v.place_id !== placeId);
    localStorage.setItem(LOCAL_STORAGE_VISITED_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Unmark visited error:", e);
  }
}

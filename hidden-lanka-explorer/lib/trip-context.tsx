"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export type TripContextType = {
  placeIds: string[];
  addPlace: (id: string) => void;
  removePlace: (id: string) => void;
  toggleTrip: (id: string) => void;
  isPlaceInTrip: (id: string) => boolean;
  likedPlaceIds: string[];
  toggleLike: (id: string) => void;
  isPlaceLiked: (id: string) => boolean;
  clear: () => void;
};

const TripContext = createContext<TripContextType | undefined>(undefined);

const TRIPS_STORAGE_KEY = "hidden-lanka-trip";
const LIKES_STORAGE_KEY = "hidden-lanka-likes";

export function TripProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [placeIds, setPlaceIds] = useState<string[]>([]);
  const [likedPlaceIds, setLikedPlaceIds] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // 1. Initial Load: Load local storage & sync with Supabase for authenticated user
  useEffect(() => {
    // Read local cache first for instant feedback
    try {
      const savedTrips = localStorage.getItem(TRIPS_STORAGE_KEY);
      if (savedTrips) {
        const parsed = JSON.parse(savedTrips);
        if (Array.isArray(parsed)) setPlaceIds(parsed);
      }
      const savedLikes = localStorage.getItem(LIKES_STORAGE_KEY);
      if (savedLikes) {
        const parsed = JSON.parse(savedLikes);
        if (Array.isArray(parsed)) setLikedPlaceIds(parsed);
      }
    } catch {
      // ignore storage errors
    }

    // Check Supabase session
    async function syncWithSupabase() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      // Fetch saved places from Supabase
      const { data: savedData } = await supabase
        .from("user_saved_places")
        .select("place_id")
        .eq("user_id", user.id);

      if (savedData && savedData.length > 0) {
        const ids = savedData.map((row: { place_id: string }) => row.place_id);
        setPlaceIds(ids);
        try {
          localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(ids));
        } catch {}
      }

      // Fetch liked places from Supabase
      const { data: likesData } = await supabase
        .from("user_likes")
        .select("place_id")
        .eq("user_id", user.id);

      if (likesData && likesData.length > 0) {
        const ids = likesData.map((row: { place_id: string }) => row.place_id);
        setLikedPlaceIds(ids);
        try {
          localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(ids));
        } catch {}
      }
    }

    void syncWithSupabase();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUserId(session.user.id);
          void syncWithSupabase();
        } else {
          setUserId(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 2. Add place to trip
  const addPlace = useCallback(
    async (id: string) => {
      setPlaceIds((current) => {
        if (current.includes(id)) return current;
        const updated = [...current, id];
        try {
          localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });

      if (userId) {
        await supabase
          .from("user_saved_places")
          .upsert({ user_id: userId, place_id: id }, { onConflict: "user_id,place_id" });
      }
    },
    [userId]
  );

  // 3. Remove place from trip
  const removePlace = useCallback(
    async (id: string) => {
      setPlaceIds((current) => {
        const updated = current.filter((item) => item !== id);
        try {
          localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });

      if (userId) {
        await supabase
          .from("user_saved_places")
          .delete()
          .match({ user_id: userId, place_id: id });
      }
    },
    [userId]
  );

  // 4. Toggle trip
  const toggleTrip = useCallback(
    (id: string) => {
      if (placeIds.includes(id)) {
        void removePlace(id);
      } else {
        void addPlace(id);
      }
    },
    [placeIds, addPlace, removePlace]
  );

  // 5. Toggle like
  const toggleLike = useCallback(
    async (id: string) => {
      const isAlreadyLiked = likedPlaceIds.includes(id);

      setLikedPlaceIds((current) => {
        const updated = isAlreadyLiked
          ? current.filter((item) => item !== id)
          : [...current, id];
        try {
          localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });

      if (userId) {
        if (isAlreadyLiked) {
          await supabase
            .from("user_likes")
            .delete()
            .match({ user_id: userId, place_id: id });
        } else {
          await supabase
            .from("user_likes")
            .upsert({ user_id: userId, place_id: id }, { onConflict: "user_id,place_id" });
        }
      }
    },
    [likedPlaceIds, userId]
  );

  // 6. Helpers
  const isPlaceInTrip = useCallback(
    (id: string) => placeIds.includes(id),
    [placeIds]
  );

  const isPlaceLiked = useCallback(
    (id: string) => likedPlaceIds.includes(id),
    [likedPlaceIds]
  );

  const clear = useCallback(() => {
    setPlaceIds([]);
    try {
      localStorage.removeItem(TRIPS_STORAGE_KEY);
    } catch {}
  }, []);

  const value = useMemo(
    () => ({
      placeIds,
      addPlace,
      removePlace,
      toggleTrip,
      isPlaceInTrip,
      likedPlaceIds,
      toggleLike,
      isPlaceLiked,
      clear,
    }),
    [
      placeIds,
      addPlace,
      removePlace,
      toggleTrip,
      isPlaceInTrip,
      likedPlaceIds,
      toggleLike,
      isPlaceLiked,
      clear,
    ]
  );

  return (
    <TripContext.Provider value={value}>
      {children}
    </TripContext.Provider>
  );
}

export function useTrip() {
  const context = useContext(TripContext);

  if (!context) {
    throw new Error("useTrip must be used inside TripProvider");
  }

  return context;
}
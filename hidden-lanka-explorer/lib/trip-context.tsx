"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type TripContextType = {
  placeIds: string[];
  addPlace: (id: string) => void;
  removePlace: (id: string) => void;
  clear: () => void;
};

const TripContext = createContext<TripContextType | undefined>(undefined);

const STORAGE_KEY = "hidden-lanka-trip";

export function TripProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [placeIds, setPlaceIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setPlaceIds(parsed);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(placeIds));
  }, [placeIds]);

  const value = useMemo(
    () => ({
      placeIds,

      addPlace: (id: string) => {
        setPlaceIds((current) =>
          current.includes(id) ? current : [...current, id]
        );
      },

      removePlace: (id: string) => {
        setPlaceIds((current) => current.filter((item) => item !== id));
      },

      clear: () => {
        setPlaceIds([]);
      },
    }),
    [placeIds]
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
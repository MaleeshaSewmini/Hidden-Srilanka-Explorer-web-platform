"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const MapExplorer = dynamic(() => import("./map-explorer"), {
  ssr: false,
  loading: () => (
    <main className="flex min-h-[70vh] items-center justify-center bg-gray-50 text-gray-600">
      Loading the destination map...
    </main>
  ),
});

export default function MapPage() {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  return (
    <MapExplorer
      latitude={latitude}
      longitude={longitude}
      onLocationChange={(nextLatitude, nextLongitude) => {
        setLatitude(nextLatitude);
        setLongitude(nextLongitude);
      }}
    />
  );
}

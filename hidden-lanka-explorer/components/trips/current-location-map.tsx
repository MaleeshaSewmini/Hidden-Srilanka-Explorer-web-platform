"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, Marker, Circle } from "leaflet";
import { LocateFixed, MapPin, RefreshCw } from "lucide-react";

/* ==========================================================================
   CurrentLocationMap
   OpenStreetMap tiles + Leaflet. Shows where the visitor is right now
   (blue dot with accuracy circle) and the trip's starting point (gold dot).

   Place at: components/trips/current-location-map.tsx
   Load it with next/dynamic and { ssr: false } because Leaflet needs `window`.
   ========================================================================== */

type Status = "idle" | "locating" | "found" | "error";

type Position = { lat: number; lng: number; accuracy: number };

type Props = {
  /** The trip's current starting point, shown as a gold dot. */
  startLocation?: { latitude: number; longitude: number; name?: string } | null;
  /** Called when the visitor chooses "Use as starting point". */
  onUseAsStart?: (lat: number, lng: number) => void;
  /** Map height in pixels. */
  height?: number;
  /** Ask for the location as soon as the map is ready. */
  autoLocate?: boolean;
};

const SRI_LANKA_CENTER: [number, number] = [7.8731, 80.7718];

const STYLES = `
.clm-icon{ background:none; border:0; }
.clm-you{ display:block; width:18px; height:18px; border-radius:50%; background:#2563eb;
  border:3px solid #fff; box-shadow:0 0 0 0 rgba(37,99,235,.5); animation:clm-pulse 2s infinite; }
.clm-start{ display:block; width:18px; height:18px; border-radius:50%; background:#a77a2f;
  border:3px solid #fff; box-shadow:0 1px 4px rgba(0,0,0,.35); }
@keyframes clm-pulse{ 70%{ box-shadow:0 0 0 14px rgba(37,99,235,0); } 100%{ box-shadow:0 0 0 0 rgba(37,99,235,0); } }
@media (prefers-reduced-motion:reduce){ .clm-you{ animation:none; } }
`;

export default function CurrentLocationMap({
  startLocation = null,
  onUseAsStart,
  height = 340,
  autoLocate = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const youMarkerRef = useRef<Marker | null>(null);
  const circleRef = useRef<Circle | null>(null);
  const startMarkerRef = useRef<Marker | null>(null);

  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");
  const [position, setPosition] = useState<Position | null>(null);

  // ───────────── 1. Create the map once ─────────────
  useEffect(() => {
    let cancelled = false;
    let map: LeafletMap | null = null;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      map = L.map(containerRef.current, {
        scrollWheelZoom: false, // keeps page scrolling smooth; users can still pinch or use +/-
      }).setView(SRI_LANKA_CENTER, 7);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      leafletRef.current = L;
      mapRef.current = map;
      setReady(true);

      // The container may still be settling into its grid cell.
      setTimeout(() => map?.invalidateSize(), 250);
    })();

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
      leafletRef.current = null;
      youMarkerRef.current = null;
      circleRef.current = null;
      startMarkerRef.current = null;
      setReady(false);
    };
  }, []);

  // ───────────── 2. Starting point marker (gold) ─────────────
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map) return;

    startMarkerRef.current?.remove();
    startMarkerRef.current = null;

    if (startLocation) {
      const marker = L.marker([startLocation.latitude, startLocation.longitude], {
        icon: L.divIcon({
          className: "clm-icon",
          html: '<span class="clm-start"></span>',
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        }),
        title: startLocation.name ?? "Starting point",
      }).addTo(map);

      // Use a DOM node so the name is shown as text, never as HTML.
      const label = document.createElement("span");
      label.textContent = `Start: ${startLocation.name ?? "Starting point"}`;
      marker.bindTooltip(label);

      startMarkerRef.current = marker;
    }
  }, [ready, startLocation?.latitude, startLocation?.longitude, startLocation?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  // ───────────── 3. Current location marker (blue) ─────────────
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map || !position) return;

    youMarkerRef.current?.remove();
    circleRef.current?.remove();

    const latlng: [number, number] = [position.lat, position.lng];

    circleRef.current = L.circle(latlng, {
      radius: position.accuracy,
      color: "#2563eb",
      weight: 1,
      fillColor: "#2563eb",
      fillOpacity: 0.12,
    }).addTo(map);

    youMarkerRef.current = L.marker(latlng, {
      icon: L.divIcon({
        className: "clm-icon",
        html: '<span class="clm-you"></span>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      }),
      zIndexOffset: 1000,
      title: "You are here",
    })
      .addTo(map)
      .bindTooltip("You are here");

    map.flyTo(latlng, position.accuracy > 1000 ? 12 : 14, { duration: 1.2 });
  }, [ready, position]);

  // ───────────── Ask the browser for the location ─────────────
  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setStatus("error");
      setMessage("This browser can't share your location.");
      return;
    }

    setStatus("locating");
    setMessage("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setStatus("found");
      },
      (err) => {
        setStatus("error");
        if (err.code === err.PERMISSION_DENIED) {
          setMessage(
            "Location access is blocked. Allow it in your browser's site settings, then try again."
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setMessage("Your position couldn't be determined. Check your connection and try again.");
        } else {
          setMessage("Finding your location took too long. Try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  }, []);

  useEffect(() => {
    if (ready && autoLocate) locate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const locating = status === "locating";

  return (
    <div>
      <style>{STYLES}</style>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-sm text-[#5b616b]" role="status" aria-live="polite">
          {locating && "Finding your location…"}
          {status === "found" && position && (
            <>
              <span className="font-bold text-[#16181d]">
                {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
              </span>
              {", accurate to about "}
              {Math.round(position.accuracy)} m
            </>
          )}
          {status === "error" && <span className="text-red-700">{message}</span>}
          {status === "idle" && "Show where you are on the map."}
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={locate}
            disabled={!ready || locating}
            className="inline-flex items-center justify-center gap-2 bg-white border border-[#d3d7dd] hover:border-[#16181d] text-[#16181d] font-bold px-5 py-3 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {locating ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <LocateFixed className="w-5 h-5" />
            )}
            {status === "found" ? "Update my location" : "Find my location"}
          </button>

          {onUseAsStart && (
            <button
              type="button"
              onClick={() => position && onUseAsStart(position.lat, position.lng)}
              disabled={!position}
              className="inline-flex items-center justify-center gap-2 bg-[#a77a2f] hover:bg-[#8f6824] text-white font-bold px-5 py-3 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MapPin className="w-5 h-5" />
              Use as starting point
            </button>
          )}
        </div>
      </div>

      {/* Map. `isolate` keeps Leaflet's z-indexes below page modals. */}
      <div
        className="isolate rounded-lg overflow-hidden border border-[#e3e6ea] bg-[#f1f2f4]"
        style={{ height }}
      >
        <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm text-[#5b616b]">
        <span className="inline-flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#2563eb]" /> You are here
        </span>
        {startLocation && (
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#a77a2f]" /> Starting point
          </span>
        )}
      </div>
    </div>
  );
}
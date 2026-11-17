"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, Marker, Circle } from "leaflet";
import { LocateFixed, MapPin, RefreshCw, Search } from "lucide-react";

/* ==========================================================================
   CurrentLocationMap
   OpenStreetMap tiles + Leaflet. Shows where the visitor is right now
   (blue dot with accuracy circle) and the trip's starting point (gold dot).

   Place at: components/trips/current-location-map.tsx
   Load it with next/dynamic and { ssr: false } because Leaflet needs `window`.
   ========================================================================== */

type Status = "idle" | "locating" | "found" | "error";

type Position = { lat: number; lng: number; accuracy: number };
type SearchResult = { id: string; name: string; displayName: string; lat: number; lng: number };

type Props = {
  /** The trip's current starting point, shown as a gold dot. */
  startLocation?: { latitude: number; longitude: number; name?: string } | null;
  /** Called when the visitor chooses "Use as starting point". */
  onUseAsStart?: (lat: number, lng: number, name?: string) => void;
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
.clm-searched{ display:block; width:18px; height:18px; border-radius:50%; background:#16a34a;
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
  const searchMarkerRef = useRef<Marker | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const lastSearchAtRef = useRef(0);
  const selectedLocationRef = useRef<SearchResult | null>(null);

  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");
  const [position, setPosition] = useState<Position | null>(null);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<SearchResult | null>(null);

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
      searchMarkerRef.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => () => searchAbortRef.current?.abort(), []);

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

    if (!selectedLocationRef.current) {
      map.flyTo(latlng, position.accuracy > 1000 ? 12 : 14, { duration: 1.2 });
    }
  }, [ready, position]);

  // ───────────── Searched location marker ─────────────
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map) return;

    searchMarkerRef.current?.remove();
    searchMarkerRef.current = null;
    if (!selectedLocation) return;

    searchMarkerRef.current = L.marker([selectedLocation.lat, selectedLocation.lng], {
      icon: L.divIcon({
        className: "clm-icon",
        html: '<span class="clm-searched"></span>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      }),
      title: selectedLocation.name,
    })
      .addTo(map)
      .bindTooltip(selectedLocation.displayName);

    map.flyTo([selectedLocation.lat, selectedLocation.lng], 14, { duration: 1.2 });
  }, [ready, selectedLocation]);

  // ───────────── Ask the browser for the location ─────────────
  const locate = useCallback((clearSearch = true) => {
    if (clearSearch) {
      selectedLocationRef.current = null;
      setSelectedLocation(null);
    }

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

  const searchPlaces = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const searchTerm = query.trim();
    if (!searchTerm) {
      setSearchError("Enter a place, address, or landmark to search.");
      setSearchResults([]);
      return;
    }

    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;
    setSearching(true);
    setSearchError("");
    setSearchResults([]);

    try {
      const delay = Math.max(0, 1000 - (Date.now() - lastSearchAtRef.current));
      if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
      if (controller.signal.aborted) return;

      lastSearchAtRef.current = Date.now();
      const params = new URLSearchParams({
        q: searchTerm,
        format: "jsonv2",
        limit: "5",
      });
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        { headers: { Accept: "application/json" }, signal: controller.signal }
      );
      if (!response.ok) {
        throw new Error(`Place search failed with status ${response.status}.`);
      }

      const data: unknown = await response.json();
      if (!Array.isArray(data)) throw new Error("Place search returned an invalid response.");
      const results = data.flatMap((entry: unknown) => {
        if (!entry || typeof entry !== "object") return [];
        const item = entry as Record<string, unknown>;
        const lat = Number(item.lat);
        const lng = Number(item.lon);
        if (
          !Number.isFinite(lat) ||
          !Number.isFinite(lng) ||
          typeof item.display_name !== "string" ||
          !item.display_name
        ) return [];

        return [{
          id: String(item.place_id ?? item.display_name),
          name: typeof item.name === "string" && item.name ? item.name : item.display_name.split(",")[0],
          displayName: item.display_name,
          lat,
          lng,
        }];
      });

      if (results.length === 0) {
        setSearchError("No matching places found. Try a different search.");
      } else {
        setSearchResults(results);
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error("Place search failed:", error);
      setSearchError("Place search is unavailable right now. Please try again.");
    } finally {
      if (!controller.signal.aborted) setSearching(false);
    }
  }, [query]);

  const selectSearchResult = (result: SearchResult) => {
    selectedLocationRef.current = result;
    setSelectedLocation(result);
    setSearchResults([]);
    setSearchError("");
    setQuery(result.name);
  };

  useEffect(() => {
    if (ready && autoLocate) locate(false);
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
            onClick={() => locate()}
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
              onClick={() => {
                if (selectedLocation) {
                  onUseAsStart(selectedLocation.lat, selectedLocation.lng, selectedLocation.name);
                } else if (position) {
                  onUseAsStart(position.lat, position.lng);
                }
              }}
              disabled={!position && !selectedLocation}
              className="inline-flex items-center justify-center gap-2 bg-[#a77a2f] hover:bg-[#8f6824] text-white font-bold px-5 py-3 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MapPin className="w-5 h-5" />
              {selectedLocation ? "Use searched place as starting point" : "Use as starting point"}
            </button>
          )}
        </div>
      </div>

      <form onSubmit={searchPlaces} className="mb-4">
        <label htmlFor="clm-place-search" className="block text-sm font-bold text-[#16181d] mb-2">
          Search for a place anywhere
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id="clm-place-search"
            type="search"
            value={query}
            onChange={(event) => {
              searchAbortRef.current?.abort();
              setSearching(false);
              selectedLocationRef.current = null;
              setQuery(event.target.value);
              setSearchResults([]);
              setSearchError("");
              setSelectedLocation(null);
            }}
            placeholder="Search a city, address, or landmark"
            className="min-w-[220px] flex-1 border border-[#d3d7dd] rounded-lg px-4 py-3 text-sm text-[#16181d] focus:border-[#a77a2f] focus:outline-none"
          />
          <button
            type="submit"
            disabled={searching}
            className="inline-flex items-center justify-center gap-2 bg-[#16181d] hover:bg-black text-white font-bold px-5 py-3 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {searching ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
            Search
          </button>
        </div>
        {searchError && (
          <p className="mt-2 text-sm text-red-700" role="alert">{searchError}</p>
        )}
        {searchResults.length > 0 && (
          <ul className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-[#d3d7dd] bg-white shadow-sm">
            {searchResults.map((result) => (
              <li key={result.id}>
                <button
                  type="button"
                  onClick={() => selectSearchResult(result)}
                  className="w-full border-b border-[#e3e6ea] px-4 py-3 text-left last:border-b-0 hover:bg-[#f5f6f7]"
                >
                  <span className="block text-sm font-bold text-[#16181d]">{result.name}</span>
                  <span className="block text-xs text-[#5b616b]">{result.displayName}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-[#5b616b]">Place search by OpenStreetMap Nominatim.</p>
      </form>

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
        {selectedLocation && (
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#16a34a]" /> Searched location
          </span>
        )}
        {startLocation && (
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#a77a2f]" /> Starting point
          </span>
        )}
      </div>
    </div>
  );
}
"use client";

import {
  ComponentProps,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "leaflet/dist/leaflet.css";
import type {
  Circle,
  LayerGroup,
  Map as LeafletMap,
  Marker,
  Polyline,
} from "leaflet";
import { LocationPoint, PlaceRecord } from "@/lib/trip-planner/types";
import {
  calculateHaversineDistance,
  estimateTravelMinutes,
  formatDistance,
  formatDuration,
} from "@/lib/trip-planner/distance";
import PlaceCard from "@/components/places/place-card";
import {
  MapPin,
  Clock,
  Plus,
  Check,
  Search,
  LocateFixed,
  Crosshair,
  RefreshCw,
} from "lucide-react";

/* ==========================================================================
   NearbyPlacesDiscovery
   - Places are shown with your website's own PlaceCard.
   - A Leaflet / OpenStreetMap map draws a line from the measuring point to
     every place, labelled with its distance.
   - The measuring point can be the visitor's current location, a point
     picked on the map, or whatever the parent's location selector sets.
   - Sort from nearest to farthest, or farthest to nearest.
   ========================================================================== */

interface NearbyPlacesDiscoveryProps {
  places: PlaceRecord[];
  startLocation: LocationPoint;
  tripPlaceIds: string[];
  onAddPlace: (place: PlaceRecord) => void;
  onRemovePlace: (placeId: string) => void;
  /** Lets this component change the measuring point (current location, map pick). */
  onStartLocationChange?: (location: LocationPoint) => void;
  className?: string;
}

type SortKey = "distance_asc" | "distance_desc" | "rating" | "name";

type PlaceWithDistance = PlaceRecord & {
  distance_km: number;
  estimated_drive_minutes: number;
};

const RADIUS_OPTIONS = [
  { label: "All island", value: 0 },
  { label: "5 km", value: 5 },
  { label: "10 km", value: 10 },
  { label: "25 km", value: 25 },
  { label: "50 km", value: 50 },
  { label: "100 km", value: 100 },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "distance_asc", label: "Nearest to farthest" },
  { value: "distance_desc", label: "Farthest to nearest" },
  { value: "rating", label: "Highest rated" },
  { value: "name", label: "A to Z" },
];

const CURRENT_NAME = "My current location";
const CUSTOM_NAME = "Custom location";

const CARD = "bg-white rounded-xl border border-[#e3e6ea]";
const BTN_SECONDARY =
  "inline-flex items-center justify-center gap-2 bg-white border border-[#d3d7dd] hover:border-[#16181d] text-[#16181d] font-bold px-5 py-3 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const FIELD =
  "w-full border border-[#d3d7dd] rounded-lg px-4 py-3 text-sm bg-white text-[#16181d] focus:border-[#a77a2f] focus:outline-none";

/**
 * PlaceCard was built for your website's own place objects. This maps the
 * trip planner's PlaceRecord onto them. If your PlaceCard reads other field
 * names, add them here.
 */
type CardPlace = ComponentProps<typeof PlaceCard>["place"];
function toCardPlace(p: PlaceRecord): CardPlace {
  return {
    ...p,
    likes: p.like_count ?? 0,
    image: p.hero_image_url ?? p.image_url,
  } as unknown as CardPlace;
}

/* ─────────────────────────── Map ─────────────────────────── */

const MAP_STYLES = `
.cdm-icon{ background:none; border:0; }
.cdm-dot{ display:block; width:16px; height:16px; border-radius:50%; background:#16181d;
  border:3px solid #fff; box-shadow:0 1px 4px rgba(0,0,0,.4); transition:transform .15s, background .15s; }
.cdm-dot.cdm-trip{ background:#a77a2f; }
.cdm-active .cdm-dot{ transform:scale(1.6); background:#a77a2f; }
.cdm-start{ display:block; width:22px; height:22px; border-radius:50%; background:#fff;
  border:5px solid #a77a2f; box-shadow:0 1px 5px rgba(0,0,0,.4); }
.cdm-you{ display:block; width:20px; height:20px; border-radius:50%; background:#2563eb;
  border:3px solid #fff; box-shadow:0 0 0 0 rgba(37,99,235,.5); animation:cdm-pulse 2s infinite; }
@keyframes cdm-pulse{ 70%{ box-shadow:0 0 0 14px rgba(37,99,235,0); } 100%{ box-shadow:0 0 0 0 rgba(37,99,235,0); } }
.cdm-tip{ font-size:13px; font-weight:700; color:#16181d; border:1px solid #e3e6ea; box-shadow:0 1px 4px rgba(0,0,0,.15); }
.cdm-pick .leaflet-container, .cdm-pick .leaflet-grab, .cdm-pick .leaflet-interactive{ cursor:crosshair !important; }
@media (prefers-reduced-motion:reduce){ .cdm-you{ animation:none; } .cdm-dot{ transition:none; } }
`;

type MapItem = { marker: Marker; line: Polyline; inTrip: boolean };

function DiscoveryMap({
  start,
  places,
  radiusKm,
  tripPlaceIds,
  highlightedId,
  pickMode,
  onHover,
  onSelect,
  onPick,
  height = 440,
}: {
  start: LocationPoint;
  places: PlaceWithDistance[];
  radiusKm: number;
  tripPlaceIds: string[];
  highlightedId: string | null;
  pickMode: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onPick: (lat: number, lng: number) => void;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const itemsRef = useRef<Map<string, MapItem>>(new Map());
  const [ready, setReady] = useState(false);

  // Always call the latest callbacks from Leaflet event handlers
  const cb = useRef({ onHover, onSelect, onPick, pickMode });
  cb.current = { onHover, onSelect, onPick, pickMode };

  // 1. Create the map once
  useEffect(() => {
    let cancelled = false;
    let map: LeafletMap | null = null;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(
        [7.8731, 80.7718],
        7
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      map.on("click", (e) => {
        if (cb.current.pickMode) cb.current.onPick(e.latlng.lat, e.latlng.lng);
      });

      leafletRef.current = L;
      mapRef.current = map;
      setReady(true);
      setTimeout(() => map?.invalidateSize(), 250);
    })();

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
      leafletRef.current = null;
      layerRef.current = null;
      itemsRef.current.clear();
      setReady(false);
    };
  }, []);

  // 2. Draw the start point, the radius, and a line + marker for each place
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map) return;

    layerRef.current?.remove();
    const group = L.layerGroup().addTo(map);
    layerRef.current = group;
    itemsRef.current.clear();

    const startLatLng: [number, number] = [start.latitude, start.longitude];
    let circle: Circle | null = null;

    if (radiusKm > 0) {
      circle = L.circle(startLatLng, {
        radius: radiusKm * 1000,
        color: "#a77a2f",
        weight: 1.5,
        dashArray: "6 6",
        fillColor: "#a77a2f",
        fillOpacity: 0.05,
        interactive: false,
      }).addTo(group);
    }

    // Always label when there are few places; otherwise label on hover
    const labelsAlways = places.length <= 12;

    places.forEach((place) => {
      const latlng: [number, number] = [place.latitude, place.longitude];
      const inTrip = tripPlaceIds.includes(place.id);

      const line = L.polyline([startLatLng, latlng], {
        color: inTrip ? "#a77a2f" : "#9aa1ab",
        weight: inTrip ? 2.5 : 1.5,
        opacity: inTrip ? 0.9 : 0.6,
        dashArray: "5 7",
        interactive: false,
      }).addTo(group);

      const marker = L.marker(latlng, {
        icon: L.divIcon({
          className: "cdm-icon",
          html: `<span class="cdm-dot ${inTrip ? "cdm-trip" : ""}"></span>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        }),
      }).addTo(group);

      // DOM node so names are shown as text, never as HTML
      const label = document.createElement("span");
      label.textContent = `${place.name}, ${formatDistance(place.distance_km)}`;
      marker.bindTooltip(label, {
        permanent: labelsAlways,
        direction: "top",
        offset: [0, -8],
        className: "cdm-tip",
      });

      marker.on("mouseover", () => cb.current.onHover(place.id));
      marker.on("mouseout", () => cb.current.onHover(null));
      marker.on("click", () => cb.current.onSelect(place.id));

      itemsRef.current.set(place.id, { marker, line, inTrip });
    });

    // Measuring point on top
    const isCurrent = start.name === CURRENT_NAME;
    const startMarker = L.marker(startLatLng, {
      icon: L.divIcon({
        className: "cdm-icon",
        html: `<span class="${isCurrent ? "cdm-you" : "cdm-start"}"></span>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      }),
      zIndexOffset: 2000,
    }).addTo(group);
    const startLabel = document.createElement("span");
    startLabel.textContent = `Measuring from: ${start.name}`;
    startMarker.bindTooltip(startLabel, {
      direction: "top",
      offset: [0, -10],
      className: "cdm-tip",
    });

    // Fit the view
    if (circle) {
      map.fitBounds(circle.getBounds(), { padding: [30, 30], maxZoom: 13 });
    } else {
      const bounds = L.latLngBounds([
        startLatLng,
        ...places.map((p) => [p.latitude, p.longitude] as [number, number]),
      ]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [ready, start.latitude, start.longitude, start.name, places, radiusKm, tripPlaceIds]);

  // 3. Highlight the hovered or selected place
  useEffect(() => {
    const labelsAlways = places.length <= 12;
    itemsRef.current.forEach((item, id) => {
      const active = id === highlightedId;
      item.line.setStyle(
        active
          ? { color: "#a77a2f", weight: 4, opacity: 1, dashArray: "" }
          : {
              color: item.inTrip ? "#a77a2f" : "#9aa1ab",
              weight: item.inTrip ? 2.5 : 1.5,
              opacity: item.inTrip ? 0.9 : 0.6,
              dashArray: "5 7",
            }
      );
      item.marker.getElement()?.classList.toggle("cdm-active", active);
      item.marker.setZIndexOffset(active ? 1000 : 0);
      if (active) {
        item.line.bringToFront();
        item.marker.openTooltip();
      } else if (!labelsAlways) {
        item.marker.closeTooltip();
      }
    });
  }, [ready, highlightedId, places]);

  return (
    <div>
      <style>{MAP_STYLES}</style>
      <div
        className={`isolate rounded-xl overflow-hidden border border-[#e3e6ea] bg-[#f1f2f4] ${
          pickMode ? "cdm-pick" : ""
        }`}
        style={{ height }}
      >
        <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
      </div>
    </div>
  );
}

/* ─────────────────────────── Main component ─────────────────────────── */

export default function NearbyPlacesDiscovery({
  places,
  startLocation,
  tripPlaceIds,
  onAddPlace,
  onRemovePlace,
  onStartLocationChange,
  className = "",
}: NearbyPlacesDiscoveryProps) {
  const [selectedRadius, setSelectedRadius] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("distance_asc");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [pickMode, setPickMode] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");

  // Categories for the filter
  const categories = useMemo(() => {
    const set = new Set<string>();
    places.forEach((p) => {
      if (p.category_name) set.add(p.category_name);
    });
    return Array.from(set).sort();
  }, [places]);

  // Distances from the measuring point, then filters
  const processedPlaces = useMemo<PlaceWithDistance[]>(() => {
    return places
      .filter(
        (p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude)
      )
      .map((place) => {
        const dist = calculateHaversineDistance(
          startLocation.latitude,
          startLocation.longitude,
          place.latitude,
          place.longitude
        );
        return {
          ...place,
          distance_km: dist,
          estimated_drive_minutes: estimateTravelMinutes(dist, "driving"),
        };
      })
      .filter((place) => {
        if (selectedRadius > 0 && place.distance_km > selectedRadius) return false;

        if (
          selectedCategory !== "all" &&
          place.category_name?.toLowerCase() !== selectedCategory.toLowerCase()
        ) {
          return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match =
            place.name.toLowerCase().includes(q) ||
            place.district?.toLowerCase().includes(q) ||
            place.nearest_town?.toLowerCase().includes(q) ||
            place.short_description?.toLowerCase().includes(q);
          if (!match) return false;
        }
        return true;
      });
  }, [places, startLocation, selectedRadius, selectedCategory, searchQuery]);

  const sortedPlaces = useMemo(() => {
    return [...processedPlaces].sort((a, b) => {
      if (sortBy === "distance_asc") return a.distance_km - b.distance_km;
      if (sortBy === "distance_desc") return b.distance_km - a.distance_km;
      if (sortBy === "rating") return (b.rating_avg ?? 0) - (a.rating_avg ?? 0);
      return a.name.localeCompare(b.name);
    });
  }, [processedPlaces, sortBy]);

  const nearest = useMemo(
    () => (processedPlaces.length ? Math.min(...processedPlaces.map((p) => p.distance_km)) : 0),
    [processedPlaces]
  );
  const farthest = useMemo(
    () => (processedPlaces.length ? Math.max(...processedPlaces.map((p) => p.distance_km)) : 0),
    [processedPlaces]
  );

  // ───────── Choose where to measure from ─────────
  const setMeasuringPoint = (name: string, latitude: number, longitude: number) => {
    onStartLocationChange?.({
      ...startLocation,
      name,
      latitude,
      longitude,
    } as LocationPoint);
  };

  const locateMe = () => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setLocError("This browser can't share your location.");
      return;
    }
    setLocating(true);
    setLocError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMeasuringPoint(CURRENT_NAME, pos.coords.latitude, pos.coords.longitude);
        setPickMode(false);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setLocError(
          err.code === err.PERMISSION_DENIED
            ? "Location access is blocked. Allow it in your browser's site settings, then try again."
            : err.code === err.POSITION_UNAVAILABLE
            ? "Your position couldn't be determined. Check your connection and try again."
            : "Finding your location took too long. Try again."
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  };

  const handlePick = (lat: number, lng: number) => {
    setMeasuringPoint(CUSTOM_NAME, lat, lng);
    setPickMode(false);
  };

  // Clicking a marker scrolls to its card
  const handleSelect = (id: string) => {
    setHighlightedId(id);
    document
      .getElementById(`discover-place-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const resetFilters = () => {
    setSelectedRadius(0);
    setSearchQuery("");
    setSelectedCategory("all");
  };

  const canChangeStart = !!onStartLocationChange;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ───────── Controls ───────── */}
      <div className={`${CARD} p-6 space-y-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-[#16181d]">Distances from your location</h3>
            <p className="text-sm text-[#5b616b] mt-1">
              Measuring from{" "}
              <span className="font-bold text-[#16181d]">{startLocation.name}</span>
            </p>
          </div>

          {canChangeStart && (
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={locateMe} disabled={locating} className={BTN_SECONDARY}>
                {locating ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <LocateFixed className="w-5 h-5" />
                )}
                {locating ? "Locating…" : "Use my current location"}
              </button>
              <button
                type="button"
                onClick={() => setPickMode((v) => !v)}
                aria-pressed={pickMode}
                className={`inline-flex items-center justify-center gap-2 font-bold px-5 py-3 rounded-lg text-sm transition-colors border ${
                  pickMode
                    ? "bg-[#a77a2f] border-[#a77a2f] text-white"
                    : "bg-white border-[#d3d7dd] hover:border-[#16181d] text-[#16181d]"
                }`}
              >
                <Crosshair className="w-5 h-5" />
                {pickMode ? "Click the map…" : "Choose on map"}
              </button>
            </div>
          )}
        </div>

        {locError && (
          <p className="text-sm text-red-700" role="alert">
            {locError}
          </p>
        )}
        {pickMode && (
          <p className="text-sm text-[#16181d] bg-[#f1f2f4] rounded-lg px-4 py-3">
            Click anywhere on the map and distances will be measured from that point.
          </p>
        )}

        {/* Radius */}
        <div>
          <p className="text-sm font-bold text-[#16181d] mb-3">Show places within</p>
          <div className="flex flex-wrap gap-2">
            {RADIUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedRadius(opt.value)}
                aria-pressed={selectedRadius === opt.value}
                className={`rounded-full px-4 py-2 text-sm font-bold border transition-colors ${
                  selectedRadius === opt.value
                    ? "bg-[#a77a2f] border-[#a77a2f] text-white"
                    : "bg-white border-[#d3d7dd] text-[#16181d] hover:border-[#16181d]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search, category, sort */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="discover-search" className="block text-sm font-bold text-[#16181d] mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="w-5 h-5 text-[#5b616b] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                id="discover-search"
                type="text"
                placeholder="Name, district or town"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${FIELD} pl-12`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="discover-category" className="block text-sm font-bold text-[#16181d] mb-2">
              Category
            </label>
            <select
              id="discover-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={FIELD}
            >
              <option value="all">All categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="discover-sort" className="block text-sm font-bold text-[#16181d] mb-2">
              Sort by
            </label>
            <select
              id="discover-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className={FIELD}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ───────── Distance map ───────── */}
      <div>
        <DiscoveryMap
          start={startLocation}
          places={sortedPlaces}
          radiusKm={selectedRadius}
          tripPlaceIds={tripPlaceIds}
          highlightedId={highlightedId}
          pickMode={pickMode}
          onHover={setHighlightedId}
          onSelect={handleSelect}
          onPick={handlePick}
        />
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm text-[#5b616b]">
          <span className="inline-flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                startLocation.name === CURRENT_NAME
                  ? "bg-[#2563eb]"
                  : "bg-white border-[3px] border-[#a77a2f]"
              }`}
            />
            Measuring point
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#16181d]" /> Place
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#a77a2f]" /> In your trip
          </span>
          <span>Lines show straight-line distance. Drive times are estimates.</span>
        </div>
      </div>

      {/* ───────── Results ───────── */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h3 className="text-lg font-bold text-[#16181d]">
          {sortedPlaces.length} place{sortedPlaces.length !== 1 ? "s" : ""}
        </h3>
        {sortedPlaces.length > 0 && (
          <p className="text-sm text-[#5b616b]">
            Nearest {formatDistance(nearest)}, farthest {formatDistance(farthest)}
          </p>
        )}
      </div>

      {sortedPlaces.length === 0 ? (
        <div className={`${CARD} border-dashed p-10 text-center`}>
          <MapPin className="w-10 h-10 mx-auto text-[#c4c9d0] mb-3" />
          <h4 className="text-lg font-bold text-[#16181d]">No places in this range</h4>
          <p className="text-base text-[#5b616b] mt-2 max-w-md mx-auto">
            Try a larger distance, or clear the search and category filters.
          </p>
          <button type="button" onClick={resetFilters} className={`${BTN_SECONDARY} mt-5`}>
            Reset filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {sortedPlaces.map((place) => {
            const isInTrip = tripPlaceIds.includes(place.id);
            const highlighted = highlightedId === place.id;

            return (
              <div
                key={place.id}
                id={`discover-place-${place.id}`}
                onMouseEnter={() => setHighlightedId(place.id)}
                onMouseLeave={() => setHighlightedId(null)}
                onFocusCapture={() => setHighlightedId(place.id)}
                onBlurCapture={() => setHighlightedId(null)}
                className={`rounded-xl transition-shadow ${
                  highlighted ? "ring-2 ring-[#a77a2f] ring-offset-4 ring-offset-[#f5f6f7]" : ""
                }`}
              >
                {/* Your website's own place card */}
                <PlaceCard place={toCardPlace(place)} />

                {/* Distance and trip action */}
                <div className={`${CARD} mt-3 p-4 flex items-center justify-between gap-4`}>
                  <div className="min-w-0">
                    <p className="text-base font-bold text-[#16181d]">
                      {formatDistance(place.distance_km)} away
                    </p>
                    <p className="text-sm text-[#5b616b] flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-4 h-4 text-[#a77a2f]" />
                      About {formatDuration(place.estimated_drive_minutes)} by road
                    </p>
                  </div>

                  {isInTrip ? (
                    <button
                      type="button"
                      onClick={() => onRemovePlace(place.id)}
                      title="Remove from trip"
                      className="inline-flex items-center gap-2 shrink-0 bg-white border border-[#a77a2f] text-[#16181d] font-bold px-4 py-2.5 rounded-lg text-sm hover:bg-[#f1f2f4] transition-colors"
                    >
                      <Check className="w-5 h-5 text-[#a77a2f]" />
                      Added
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onAddPlace(place)}
                      className="inline-flex items-center gap-2 shrink-0 bg-[#a77a2f] hover:bg-[#8f6824] text-white font-bold px-4 py-2.5 rounded-lg text-sm transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      Add to trip
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
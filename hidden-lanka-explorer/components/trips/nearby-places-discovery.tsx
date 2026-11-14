"use client";

import { useMemo, useState } from "react";
import { LocationPoint, PlaceRecord } from "@/lib/trip-planner/types";
import {
  calculateHaversineDistance,
  estimateTravelMinutes,
  formatDistance,
  formatDuration,
} from "@/lib/trip-planner/distance";
import {
  MapPin,
  Clock,
  Plus,
  Check,
  Search,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";

interface NearbyPlacesDiscoveryProps {
  places: PlaceRecord[];
  startLocation: LocationPoint;
  tripPlaceIds: string[];
  onAddPlace: (place: PlaceRecord) => void;
  onRemovePlace: (placeId: string) => void;
  className?: string;
}

const RADIUS_OPTIONS = [
  { label: "All Island", value: 0 },
  { label: "5 km", value: 5 },
  { label: "10 km", value: 10 },
  { label: "25 km", value: 25 },
  { label: "50 km", value: 50 },
  { label: "100 km", value: 100 },
];

export default function NearbyPlacesDiscovery({
  places,
  startLocation,
  tripPlaceIds,
  onAddPlace,
  onRemovePlace,
  className = "",
}: NearbyPlacesDiscoveryProps) {
  const [selectedRadius, setSelectedRadius] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"distance" | "rating" | "name">("distance");

  // Extract unique categories from places
  const categories = useMemo(() => {
    const set = new Set<string>();
    places.forEach((p) => {
      if (p.category_name) set.add(p.category_name);
    });
    return Array.from(set).sort();
  }, [places]);

  // Compute distances & filter
  const processedPlaces = useMemo(() => {
    const withDistance = places.map((place) => {
      const dist = calculateHaversineDistance(
        startLocation.latitude,
        startLocation.longitude,
        place.latitude,
        place.longitude
      );
      const estMinutes = estimateTravelMinutes(dist, "driving");

      return {
        ...place,
        distance_km: dist,
        estimated_drive_minutes: estMinutes,
      };
    });

    return withDistance.filter((place) => {
      // Radius filter
      if (selectedRadius > 0 && (place.distance_km ?? Infinity) > selectedRadius) {
        return false;
      }

      // Category filter
      if (
        selectedCategory !== "all" &&
        place.category_name?.toLowerCase() !== selectedCategory.toLowerCase()
      ) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = place.name.toLowerCase().includes(query);
        const matchDistrict = place.district.toLowerCase().includes(query);
        const matchTown = place.nearest_town?.toLowerCase().includes(query);
        const matchDesc = place.short_description?.toLowerCase().includes(query);
        if (!matchName && !matchDistrict && !matchTown && !matchDesc) {
          return false;
        }
      }

      return true;
    });
  }, [places, startLocation, selectedRadius, selectedCategory, searchQuery]);

  // Sort places
  const sortedPlaces = useMemo(() => {
    return [...processedPlaces].sort((a, b) => {
      if (sortBy === "distance") {
        return (a.distance_km ?? 0) - (b.distance_km ?? 0);
      }
      if (sortBy === "rating") {
        return (b.rating_avg ?? 0) - (a.rating_avg ?? 0);
      }
      return a.name.localeCompare(b.name);
    });
  }, [processedPlaces, sortBy]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header & Controls */}
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 border border-[#0b2417]/10 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-[#0b2417] text-base sm:text-lg">
              Explore Destinations by Proximity
            </h3>
            <p className="text-xs text-[#718078]">
              Showing places measured from {startLocation.name}
            </p>
          </div>

          {/* Radius Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-[#718078] mr-1">
              Radius:
            </span>
            {RADIUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedRadius(opt.value)}
                className={`rounded-full px-2.5 py-1 text-xs font-bold transition ${
                  selectedRadius === opt.value
                    ? "bg-[#123b26] text-[#f1cf88]"
                    : "bg-[#f6f1e8] text-[#0b2417] hover:bg-[#e9e0d0]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search, Category & Sorting Filters */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="flex items-center gap-2 rounded-xl border border-[#0b2417]/15 bg-[#f6f1e8]/50 px-3 py-1.5">
            <Search size={14} className="text-[#718078]" />
            <input
              type="text"
              placeholder="Filter by name, district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-[#0b2417] placeholder:text-[#718078] outline-none"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-[#0b2417]/15 bg-[#f6f1e8]/50 px-3 py-1.5 text-xs text-[#0b2417] outline-none"
          >
            <option value="all">All Categories ({categories.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "distance" | "rating" | "name")}
            className="rounded-xl border border-[#0b2417]/15 bg-[#f6f1e8]/50 px-3 py-1.5 text-xs text-[#0b2417] outline-none"
          >
            <option value="distance">Sort: Nearest Distance</option>
            <option value="rating">Sort: Highest Rating</option>
            <option value="name">Sort: Alphabetical</option>
          </select>
        </div>
      </div>

      {/* Places List */}
      {sortedPlaces.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#0b2417]/20 p-8 text-center bg-white/50">
          <MapPin size={28} className="mx-auto text-[#718078]/60 mb-2" />
          <h4 className="font-bold text-[#0b2417]">No places found within this range</h4>
          <p className="mt-1 text-xs text-[#718078]">
            Try expanding the radius to 50 km or 100 km, or clearing search filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedRadius(0);
              setSearchQuery("");
              setSelectedCategory("all");
            }}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#123b26] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#c99a43] hover:text-[#0b2417]"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sortedPlaces.map((place) => {
            const isInTrip = tripPlaceIds.includes(place.id);

            return (
              <div
                key={place.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-[#0b2417]/10 bg-white shadow-sm transition hover:shadow-md hover:border-[#123b26]/30"
              >
                <div>
                  {/* Image & Distance Badge */}
                  <div className="relative h-36 w-full overflow-hidden bg-[#e9e0d0]">
                    {place.hero_image_url ? (
                      <img
                        src={place.hero_image_url}
                        alt={place.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-[#718078]">
                        <MapPin size={24} className="text-[#c99a43]" />
                      </div>
                    )}

                    {/* Distance Badge */}
                    <div className="absolute top-2.5 left-2.5 rounded-full bg-[#0b2417]/85 px-2.5 py-1 text-[11px] font-bold text-[#f1cf88] backdrop-blur-sm shadow-md">
                      {formatDistance(place.distance_km ?? 0)}
                    </div>

                    {/* Estimated drive time */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-[#0b2417] backdrop-blur-sm shadow-md">
                      <Clock size={11} className="text-[#c99a43]" />
                      <span>
                        ~{formatDuration(place.estimated_drive_minutes ?? 0)} drive
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-3.5">
                    <div className="flex items-center justify-between text-xs text-[#718078]">
                      <span>{place.district}</span>
                      {place.category_name && (
                        <span className="font-medium text-[#123b26]">
                          {place.category_name}
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/places/${place.slug}`}
                      target="_blank"
                      className="mt-1 block font-bold text-sm text-[#0b2417] hover:text-[#c99a43] transition line-clamp-1"
                    >
                      {place.name}
                    </Link>

                    {place.short_description && (
                      <p className="mt-1 line-clamp-2 text-xs text-gray-600">
                        {place.short_description}
                      </p>
                    )}

                    {/* Safety notice preview */}
                    {(place.safety_tips || place.warnings) && (
                      <div className="mt-2 flex items-start gap-1 rounded-lg bg-amber-50 p-1.5 text-[10px] text-amber-900 border border-amber-200/60">
                        <ShieldAlert size={12} className="shrink-0 mt-0.5 text-amber-600" />
                        <span className="line-clamp-1">
                          {place.warnings || place.safety_tips}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="border-t border-gray-100 p-3 pt-2">
                  {isInTrip ? (
                    <button
                      type="button"
                      onClick={() => onRemovePlace(place.id)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-50 py-1.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
                    >
                      <Check size={14} /> Added to Itinerary
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onAddPlace(place)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#123b26] py-1.5 text-xs font-bold text-white transition hover:bg-[#c99a43] hover:text-[#0b2417]"
                    >
                      <Plus size={14} /> Add to Trip
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

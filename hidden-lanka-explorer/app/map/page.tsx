
"use client";

import { useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

type Place = {
  id: number;
  name: string;
  category: string;
  district: string;
  latitude: number;
  longitude: number;
  description: string;
};

type MapSectionProps = {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (lat: number, lng: number) => void;
};

// Sample destinations. Replace these with your Supabase data.
const places: Place[] = [
  {
    id: 1,
    name: "Ravana Falls",
    category: "Waterfalls",
    district: "Badulla",
    latitude: 6.8395,
    longitude: 81.0588,
    description: "A scenic waterfall near Ella.",
  },
  {
    id: 2,
    name: "Nine Arch Bridge",
    category: "Historical Sites",
    district: "Badulla",
    latitude: 6.8768,
    longitude: 81.0608,
    description: "A famous railway bridge surrounded by greenery.",
  },
  {
    id: 3,
    name: "Unawatuna Beach",
    category: "Beaches",
    district: "Galle",
    latitude: 6.0108,
    longitude: 80.249,
    description: "A beautiful beach on Sri Lanka's southern coast.",
  },
  {
    id: 4,
    name: "Sigiriya Rock",
    category: "Historical Sites",
    district: "Matale",
    latitude: 7.957,
    longitude: 80.7603,
    description: "An iconic ancient rock fortress.",
  },
  {
    id: 5,
    name: "Horton Plains",
    category: "Nature",
    district: "Nuwara Eliya",
    latitude: 6.802,
    longitude: 80.808,
    description: "A protected highland landscape with scenic trails.",
  },
  {
    id: 6,
    name: "Arugam Bay",
    category: "Beaches",
    district: "Ampara",
    latitude: 6.8405,
    longitude: 81.8368,
    description: "A popular surfing destination on the east coast.",
  },
  {
    id: 7,
    name: "Pidurangala Rock",
    category: "Mountains",
    district: "Matale",
    latitude: 7.9698,
    longitude: 80.7602,
    description: "A rocky summit with views towards Sigiriya.",
  },
  {
    id: 8,
    name: "Diyaluma Falls",
    category: "Waterfalls",
    district: "Badulla",
    latitude: 6.802,
    longitude: 81.032,
    description: "A spectacular waterfall in the hill country.",
  },
];

const categories = [
  "All Categories",
  "Beaches",
  "Waterfalls",
  "Mountains",
  "Historical Sites",
  "Nature",
];

const districts = [
  "All Districts",
  ...Array.from(new Set(places.map((place) => place.district))).sort(),
];

function MapViewUpdater({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const map = useMap();

  // Move the map when a destination is selected.
  useMemo(() => {
    map.setView([latitude, longitude], map.getZoom());
    return null;
  }, [latitude, longitude, map]);

  return null;
}

export default function MapSection({
  latitude,
  longitude,
  onLocationChange,
}: MapSectionProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [district, setDistrict] = useState("All Districts");
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  if (typeof window === "undefined") {
    return null;
  }

  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      const matchesSearch =
        place.name.toLowerCase().includes(search.toLowerCase()) ||
        place.district.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        category === "All Categories" ||
        place.category === category;

      const matchesDistrict =
        district === "All Districts" ||
        place.district === district;

      return matchesSearch && matchesCategory && matchesDistrict;
    });
  }, [search, category, district]);

  const focusPlace = (place: Place) => {
    setSelectedPlace(place);
    onLocationChange(place.latitude, place.longitude);
  };

  return (
    <div className="w-full">
      {/* Search and filters */}
      <div className="space-y-4 border-b border-gray-200 bg-white p-4 sm:p-5">
        <div>
          <label
            htmlFor="destination-search"
            className="mb-2 block text-sm font-semibold text-gray-800"
          >
            Search destinations
          </label>

          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m16 16 4 4" />
              </svg>
            </span>

            <input
              id="destination-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by place name or district..."
              className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="destination-category"
              className="mb-2 block text-sm font-semibold text-gray-800"
            >
              Category
            </label>

            <select
              id="destination-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-600"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="destination-district"
              className="mb-2 block text-sm font-semibold text-gray-800"
            >
              District
            </label>

            <select
              id="destination-district"
              value={district}
              onChange={(event) => setDistrict(event.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-600"
            >
              {districts.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-600" aria-live="polite">
            <span className="font-semibold text-emerald-700">
              {filteredPlaces.length}
            </span>{" "}
            destinations found
          </p>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setCategory("All Categories");
              setDistrict("All Districts");
              setSelectedPlace(null);
            }}
            className="rounded-lg px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
          >
            Clear filters
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="relative z-0 h-[420px] w-full sm:h-[520px]">
        <MapContainer
          center={[latitude ?? 7.8731, longitude ?? 80.7718]}
          zoom={8}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {selectedPlace && (
            <MapViewUpdater
              latitude={selectedPlace.latitude}
              longitude={selectedPlace.longitude}
            />
          )}

          {filteredPlaces.map((place) => (
            <CircleMarker
              key={place.id}
              center={[place.latitude, place.longitude]}
              radius={selectedPlace?.id === place.id ? 10 : 7}
              pathOptions={{
                color:
                  selectedPlace?.id === place.id
                    ? "#064e3b"
                    : "#ffffff",
                fillColor:
                  selectedPlace?.id === place.id
                    ? "#059669"
                    : "#10b981",
                fillOpacity: 1,
                weight: 2,
              }}
              eventHandlers={{
                click: () => focusPlace(place),
              }}
            >
              <Popup>
                <div className="min-w-40">
                  <h3 className="font-semibold">{place.name}</h3>
                  <p className="mt-1 text-sm">{place.category}</p>
                  <p className="text-sm">{place.district} District</p>
                  <p className="mt-2 text-sm">{place.description}</p>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block font-medium text-emerald-700"
                  >
                    Get directions →
                  </a>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* Destination results */}
      <div className="bg-gray-50 p-4 sm:p-5">
        <h2 className="mb-4 text-lg font-bold text-gray-900">
          Explore destinations
        </h2>

        {filteredPlaces.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center">
            <p className="font-medium text-gray-800">
              No destinations found
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Try another search term or change your filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPlaces.map((place) => (
              <button
                key={place.id}
                type="button"
                onClick={() => focusPlace(place)}
                className={`rounded-xl border bg-white p-4 text-left transition hover:border-emerald-500 hover:shadow-sm ${
                  selectedPlace?.id === place.id
                    ? "border-emerald-600 ring-1 ring-emerald-600"
                    : "border-gray-200"
                }`}
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  {place.category}
                </span>

                <h3 className="mt-1 font-bold text-gray-900">
                  {place.name}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  {place.district} District
                </p>

                <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                  {place.description}
                </p>

                <span className="mt-3 inline-block text-sm font-semibold text-emerald-700">
                  Show on map →
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

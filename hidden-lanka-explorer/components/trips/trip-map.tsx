"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LocationPoint, PlaceRecord, RoutePlan } from "@/lib/trip-planner/types";
import { Navigation, Compass } from "lucide-react";

interface TripMapProps {
  startLocation: LocationPoint;
  destinations: PlaceRecord[];
  allPlaces?: PlaceRecord[];
  routePlan?: RoutePlan | null;
  selectedPlaceId?: string | null;
  onSelectPlace?: (place: PlaceRecord) => void;
  onAddPlace?: (place: PlaceRecord) => void;
  height?: string;
  interactive?: boolean;
}

// Controller component to smoothly fit map bounds
function AutoFitBounds({
  points,
}: {
  points: [number, number][];
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || points.length === 0) return;

    if (points.length === 1) {
      map.setView(points[0], 12);
      return;
    }

    try {
      // Calculate bounds
      const lats = points.map((p) => p[0]);
      const lngs = points.map((p) => p[1]);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      map.fitBounds(
        [
          [minLat, minLng],
          [maxLat, maxLng],
        ],
        { padding: [50, 50], maxZoom: 15 }
      );
    } catch (e) {
      console.warn("fitBounds error:", e);
    }
  }, [map, points]);

  return null;
}

export default function TripMap({
  startLocation,
  destinations,
  allPlaces = [],
  routePlan,
  selectedPlaceId,
  onSelectPlace,
  onAddPlace,
  height = "520px",
  interactive = true,
}: TripMapProps) {
  const [leafletLib, setLeafletLib] = useState<typeof import("leaflet") | null>(null);

  useEffect(() => {
    import("leaflet").then((L) => {
      setLeafletLib(L);
    });
  }, []);

  // Compute all key points for fitting bounds
  const allPoints: [number, number][] = useMemo(() => {
    const list: [number, number][] = [
      [startLocation.latitude, startLocation.longitude],
    ];
    destinations.forEach((d) => {
      if (typeof d.latitude === "number" && typeof d.longitude === "number") {
        list.push([d.latitude, d.longitude]);
      }
    });
    return list;
  }, [startLocation, destinations]);

  // Center coordinate
  const centerLat = startLocation.latitude || 7.8731;
  const centerLng = startLocation.longitude || 80.7718;

  // Custom marker icons using Leaflet divIcon
  const createStartIcon = () => {
    if (!leafletLib) return undefined;
    return leafletLib.divIcon({
      className: "custom-start-marker",
      html: `
        <div style="
          background: #c99a43;
          color: #0b2417;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(11,36,23,0.35);
          border: 3px solid #ffffff;
          font-weight: 800;
          font-size: 14px;
        ">
          ★
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });
  };

  const createStopIcon = (index: number, isSelected: boolean) => {
    if (!leafletLib) return undefined;
    const bg = isSelected ? "#c99a43" : "#0b2417";
    const text = isSelected ? "#0b2417" : "#f1cf88";

    return leafletLib.divIcon({
      className: "custom-stop-marker",
      html: `
        <div style="
          background: ${bg};
          color: ${text};
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 10px rgba(0,0,0,0.3);
          border: 2.5px solid #ffffff;
          font-weight: 700;
          font-size: 13px;
          transition: transform 0.2s;
        ">
          ${index + 1}
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  const createAvailableIcon = () => {
    if (!leafletLib) return undefined;
    return leafletLib.divIcon({
      className: "custom-avail-marker",
      html: `
        <div style="
          background: #718078;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 2px solid #ffffff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
          opacity: 0.8;
          cursor: pointer;
        "></div>
      `,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
  };

  if (!leafletLib) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-[#0b2417]/10 bg-[#e9e0d0]/50"
        style={{ height }}
      >
        <div className="flex items-center gap-3 text-sm text-[#718078]">
          <Compass className="animate-spin text-[#c99a43]" size={20} />
          <span>Loading interactive route map...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#0b2417]/15 shadow-sm" style={{ height }}>
      {/* Map Header Status Banner */}
      <div className="pointer-events-none absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-2">
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-[#0b2417]/90 px-3 py-1.5 text-xs font-semibold text-white shadow-md backdrop-blur-md">
          <Navigation size={13} className="text-[#c99a43]" />
          <span>
            {destinations.length} Destination{destinations.length !== 1 ? "s" : ""}
          </span>
          {routePlan && (
            <span className="text-[#f1cf88]/90">
              · {routePlan.totalDistanceKm} km
            </span>
          )}
        </div>
        {routePlan?.isOsrm && (
          <div className="pointer-events-auto rounded-full bg-emerald-800/90 px-2.5 py-1 text-[11px] font-medium text-emerald-100 shadow-md backdrop-blur-md">
            ✓ OSRM Road Route
          </div>
        )}
      </div>

      <MapContainer
        center={[centerLat, centerLng]}
        zoom={8}
        scrollWheelZoom={interactive}
        dragging={interactive}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <AutoFitBounds points={allPoints} />

        {/* Start Location Marker */}
        <Marker
          position={[startLocation.latitude, startLocation.longitude]}
          icon={createStartIcon()}
        >
          <Popup>
            <div className="p-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#c99a43]">
                Starting Point
              </span>
              <h4 className="font-semibold text-[#0b2417]">
                {startLocation.name}
              </h4>
              <p className="mt-1 text-xs text-gray-500">
                Lat: {startLocation.latitude.toFixed(4)}, Lng: {startLocation.longitude.toFixed(4)}
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Destination Markers */}
        {destinations.map((place, idx) => {
          if (!place.latitude || !place.longitude) return null;
          const isSelected = place.id === selectedPlaceId;

          return (
            <Marker
              key={place.id}
              position={[place.latitude, place.longitude]}
              icon={createStopIcon(idx, isSelected)}
              eventHandlers={{
                click: () => onSelectPlace?.(place),
              }}
            >
              <Popup>
                <div className="w-52 p-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#c99a43]">
                    <span>Stop #{idx + 1}</span>
                    <span>·</span>
                    <span>{place.district}</span>
                  </div>

                  <h4 className="mt-0.5 font-bold text-[#0b2417]">
                    {place.name}
                  </h4>

                  {place.hero_image_url && (
                    <img
                      src={place.hero_image_url}
                      alt={place.name}
                      className="mt-2 h-24 w-full rounded-md object-cover"
                    />
                  )}

                  {place.short_description && (
                    <p className="mt-1.5 line-clamp-2 text-xs text-gray-600">
                      {place.short_description}
                    </p>
                  )}

                  {place.distance_km != null && (
                    <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-1.5 text-[11px] text-gray-500">
                      <span>Distance: {place.distance_km} km</span>
                      {place.difficulty && (
                        <span className="font-medium text-[#0b2417]">
                          {place.difficulty}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Other available catalog places on map */}
        {allPlaces
          .filter(
            (p) =>
              typeof p.latitude === "number" &&
              typeof p.longitude === "number" &&
              !destinations.some((d) => d.id === p.id)
          )
          .map((place) => (
            <Marker
              key={`avail-${place.id}`}
              position={[place.latitude, place.longitude]}
              icon={createAvailableIcon()}
            >
              <Popup>
                <div className="w-52 p-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#718078]">
                    {place.district} · {place.category_name}
                  </span>
                  <h4 className="font-semibold text-[#0b2417] mt-0.5">{place.name}</h4>
                  {place.hero_image_url && (
                    <img
                      src={place.hero_image_url}
                      alt={place.name}
                      className="mt-2 h-20 w-full rounded-md object-cover"
                    />
                  )}
                  {onAddPlace && (
                    <button
                      type="button"
                      onClick={() => onAddPlace(place)}
                      className="mt-3 w-full bg-[#c99a43] hover:bg-[#b58735] text-[#0b2417] text-xs font-bold py-1.5 px-3 rounded-md transition-colors"
                    >
                      + Add to Trip
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Fallback direct distance lines if no OSRM polyline */}
        {(!routePlan || routePlan.fullPolyline.length <= 1) &&
          destinations.map((place) => {
            if (typeof place.latitude !== "number" || typeof place.longitude !== "number") return null;
            return (
              <Polyline
                key={`line-${place.id}`}
                positions={[
                  [startLocation.latitude, startLocation.longitude],
                  [place.latitude, place.longitude],
                ]}
                pathOptions={{
                  color: "#c99a43",
                  weight: 2.5,
                  opacity: 0.85,
                  dashArray: "6 6",
                }}
              />
            );
          })}

        {/* Route Polylines */}
        {routePlan && routePlan.fullPolyline.length > 1 && (
          <>
            {/* Outline casing for visual pop */}
            <Polyline
              positions={routePlan.fullPolyline}
              pathOptions={{
                color: "#ffffff",
                weight: 7,
                opacity: 0.8,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
            {/* Primary route line */}
            <Polyline
              positions={routePlan.fullPolyline}
              pathOptions={{
                color: "#123b26",
                weight: 4.5,
                opacity: 0.95,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
}

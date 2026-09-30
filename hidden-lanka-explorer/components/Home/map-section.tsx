"use client";

import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type PlaceLocationPickerProps = {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (latitude: number, longitude: number) => void;
};

const markerIcon = L.icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapClickHandler({
  onLocationChange,
}: {
  onLocationChange: (latitude: number, longitude: number) => void;
}) {
  useMapEvents({
    click(event) {
      onLocationChange(
        Number(event.latlng.lat.toFixed(6)),
        Number(event.latlng.lng.toFixed(6))
      );
    },
  });

  return null;
}

function MapPositionUpdater({
  latitude,
  longitude,
}: {
  latitude: number | null;
  longitude: number | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      map.flyTo([latitude, longitude], 15, {
        duration: 1,
      });
    }
  }, [latitude, longitude, map]);

  return null;
}

export default function PlaceLocationPicker({
  latitude,
  longitude,
  onLocationChange,
}: PlaceLocationPickerProps) {
  const defaultCenter: [number, number] = [7.8731, 80.7718];

  const selectedPosition: [number, number] =
    latitude !== null && longitude !== null
      ? [latitude, longitude]
      : defaultCenter;

  return (
    <div className="place-map-wrapper">
      <MapContainer
        center={defaultCenter}
        zoom={7}
        scrollWheelZoom
        className="place-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onLocationChange={onLocationChange} />

        <MapPositionUpdater
          latitude={latitude}
          longitude={longitude}
        />

        {latitude !== null && longitude !== null && (
          <Marker
            position={selectedPosition}
            icon={markerIcon}
          />
        )}
      </MapContainer>

      <div className="map-instruction">
        <span>📍</span>
        <div>
          <strong>Select the place location</strong>
          <p>
            Click anywhere on the map to automatically generate
            latitude and longitude.
          </p>
        </div>
      </div>
    </div>
  );
}
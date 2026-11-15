"use client";

import { useState } from "react";
import { LocationPoint } from "@/lib/trip-planner/types";
import { SRI_LANKA_HUBS } from "@/lib/trip-planner/distance";
import { MapPin, Navigation, Compass, AlertCircle, Check, Search } from "lucide-react";

interface LocationSelectorProps {
  currentLocation: LocationPoint;
  onLocationChange: (loc: LocationPoint) => void;
  className?: string;
}

export default function LocationSelector({
  currentLocation,
  onLocationChange,
  className = "",
}: LocationSelectorProps) {
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsSuccess, setGpsSuccess] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Browser Geolocation API detection
  const handleDetectGPS = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setGpsError("Geolocation is not supported by your browser.");
      return;
    }

    setGpsLoading(true);
    setGpsError(null);
    setGpsSuccess(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLoading(false);
        setGpsSuccess(true);
        const { latitude, longitude } = position.coords;

        // Try to identify nearest hub name for friendly display
        const detected: LocationPoint = {
          name: `Current Location (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`,
          latitude,
          longitude,
        };

        onLocationChange(detected);
        setTimeout(() => setGpsSuccess(false), 4000);
      },
      (error) => {
        setGpsLoading(false);
        let msg = "Could not retrieve your location.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Location permission denied. Please choose a town from the list below.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "GPS location is currently unavailable. Please choose a starting town.";
        } else if (error.code === error.TIMEOUT) {
          msg = "Location request timed out. Please choose a town from the list.";
        }
        setGpsError(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const filteredHubs = SRI_LANKA_HUBS.filter(
    (hub) =>
      hub.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (hub.district && hub.district.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Top action row: GPS detect button + Active starting point indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#123b26] text-[#c99a43]">
            <MapPin size={18} />
          </span>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#718078]">
              Starting Location
            </div>
            <div className="text-sm font-bold text-[#0b2417]">
              {currentLocation.name}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDetectGPS}
          disabled={gpsLoading}
          className="inline-flex items-center gap-2 rounded-xl border border-[#c99a43]/60 bg-white px-3.5 py-2 text-xs font-bold text-[#0b2417] shadow-sm transition hover:bg-[#c99a43] hover:text-[#0b2417] disabled:opacity-50"
        >
          {gpsLoading ? (
            <>
              <Compass size={15} className="animate-spin text-[#c99a43]" />
              <span>Locating with GPS...</span>
            </>
          ) : gpsSuccess ? (
            <>
              <Check size={15} className="text-emerald-600" />
              <span>GPS Detected</span>
            </>
          ) : (
            <>
              <Navigation size={15} className="text-[#c99a43]" />
              <span>Use My Current Location</span>
            </>
          )}
        </button>
      </div>

      {/* GPS Error Message */}
      {gpsError && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-2.5 text-xs text-amber-800 border border-amber-200">
          <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-600" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Manual Selection Dropdown / Search */}
      <div className="relative">
        <div className="flex items-center gap-2 rounded-xl border border-[#0b2417]/15 bg-white px-3 py-2 shadow-sm focus-within:border-[#123b26] focus-within:ring-2 focus-within:ring-[#123b26]/10">
          <Search size={15} className="text-[#718078]" />
          <input
            type="text"
            placeholder="Search Sri Lankan town or starting hub (e.g. Kandy, Galle, Ella, Colombo)..."
            value={searchFilter}
            onChange={(e) => {
              setSearchFilter(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            className="w-full bg-transparent text-xs sm:text-sm text-[#0b2417] placeholder:text-[#718078] outline-none"
          />
        </div>

        {/* Dropdown suggestions */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 z-50 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-[#0b2417]/15 bg-white p-1.5 shadow-xl">
            <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-[#718078]">
              Select Starting Point
            </div>
            {filteredHubs.length === 0 ? (
              <div className="p-3 text-center text-xs text-[#718078]">
                No matching town found. Try another city name.
              </div>
            ) : (
              filteredHubs.map((hub) => {
                const isSelected =
                  currentLocation.latitude === hub.latitude &&
                  currentLocation.longitude === hub.longitude;

                return (
                  <button
                    key={hub.name}
                    type="button"
                    onClick={() => {
                      onLocationChange(hub);
                      setIsDropdownOpen(false);
                      setSearchFilter("");
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition ${
                      isSelected
                        ? "bg-[#123b26] font-bold text-white"
                        : "text-[#0b2417] hover:bg-[#f6f1e8]"
                    }`}
                  >
                    <span>{hub.name}</span>
                    <span
                      className={`text-[15px] ${
                        isSelected ? "text-[#f1cf88]" : "text-[#718078]"
                      }`}
                    >
                      {hub.district}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}


"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { loadSharedTripByToken } from "@/lib/trip-planner/storage";
import { calculateRouteWithOSRM } from "@/lib/trip-planner/osrm";
import { PlaceRecord, RoutePlan, Trip } from "@/lib/trip-planner/types";
import TripMap from "@/components/trips/trip-map";
import {
  Compass,
  MapPin,
  Printer,
  Copy,
  Check,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";

export default function SharedTripPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [routePlan, setRoutePlan] = useState<RoutePlan | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadTrip() {
      setLoading(true);
      const data = await loadSharedTripByToken(token);
      if (isMounted) {
        setTrip(data);
        setLoading(false);

        if (data && data.destinations && data.destinations.length > 0) {
          const waypoints = [
            {
              name: data.start_location_name,
              latitude: data.start_latitude,
              longitude: data.start_longitude,
            },
            ...data.destinations
              .filter((d) => d.place?.latitude && d.place?.longitude)
              .map((d) => ({
                name: d.place!.name,
                latitude: d.place!.latitude,
                longitude: d.place!.longitude,
              })),
          ];

          try {
            const plan = await calculateRouteWithOSRM(waypoints, data.transport_mode);
            if (isMounted) setRoutePlan(plan);
          } catch {}
        }
      }
    }

    void loadTrip();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleCopyLink = async () => {
    if (typeof window !== "undefined") {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch {}
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f1e8] text-sm text-[#718078]">
        <Compass className="animate-spin text-[#c99a43] mr-2" size={24} />
        <span>Loading shared Sri Lanka trip itinerary...</span>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f6f1e8] p-4 text-center">
        <MapPin size={36} className="text-[#c99a43] mb-3" />
        <h2 className="font-display text-2xl font-bold text-[#0b2417]">
          Trip Not Found
        </h2>
        <p className="mt-2 text-sm text-[#718078] max-w-md">
          This itinerary may be private or the shared link is no longer valid.
        </p>
        <Link
          href="/dashboard/trips"
          className="mt-6 rounded-2xl bg-[#123b26] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#c99a43] hover:text-[#0b2417]"
        >
          Explore All Trips
        </Link>
      </div>
    );
  }

  const destinations = trip.destinations || [];

  return (
    <div className="min-h-screen bg-[#f6f1e8] text-[#0b2417] pb-24">
      {/* Top Banner */}
      <div className="border-b border-[#0b2417]/10 bg-white py-4 shadow-xs">
        <div className="container-main">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#c99a43]">
                <span>Shared Community Itinerary</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0b2417] mt-0.5">
                {trip.title}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-[#0b2417] hover:bg-gray-50 shadow-xs"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copied ? "Link Copied!" : "Share Link"}</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#123b26] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#c99a43] hover:text-[#0b2417] shadow-xs"
              >
                <Printer size={14} />
                <span>Print Itinerary</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-main mt-6 space-y-6">
        {/* Trip Meta Overview */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-3xl bg-white p-5 border border-[#0b2417]/10 shadow-sm text-xs">
          <div>
            <span className="text-gray-500 block">Starting Hub:</span>
            <span className="font-bold text-[#0b2417] text-sm">
              {trip.start_location_name}
            </span>
          </div>

          <div>
            <span className="text-gray-500 block">Duration & Travelers:</span>
            <span className="font-bold text-[#0b2417] text-sm">
              {trip.duration_days} Days · {trip.traveler_count} Travelers
            </span>
          </div>

          <div>
            <span className="text-gray-500 block">Transport:</span>
            <span className="font-bold text-[#0b2417] text-sm capitalize">
              {trip.transport_mode}
            </span>
          </div>

          <div>
            <span className="text-gray-500 block">Total Route Distance:</span>
            <span className="font-bold text-emerald-800 text-sm">
              {routePlan ? `${routePlan.totalDistanceKm} km` : "Estimating..."}
            </span>
          </div>
        </div>

        {/* Map View */}
        <div className="rounded-3xl border border-[#0b2417]/10 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#718078]">
            <span>Interactive Road Itinerary</span>
            {routePlan?.isOsrm && (
              <span className="text-emerald-700">OSRM Road Geometry</span>
            )}
          </div>

          <TripMap
            startLocation={{
              name: trip.start_location_name,
              latitude: trip.start_latitude,
              longitude: trip.start_longitude,
            }}
            destinations={destinations
              .map((d) => d.place)
              .filter((p): p is PlaceRecord => p !== undefined)}
            routePlan={routePlan}
            height="500px"
          />
        </div>

        {/* Daily Schedule List */}
        <div className="space-y-4">
          <h3 className="font-display text-xl font-bold text-[#0b2417]">
            Daily Stops & Guidance
          </h3>

          <div className="space-y-3">
            {destinations.map((dest, idx) => {
              const place = dest.place;
              if (!place) return null;

              return (
                <div
                  key={dest.id}
                  className="rounded-2xl border border-[#0b2417]/10 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#0b2417] text-xs font-bold text-[#f1cf88]">
                        {idx + 1}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#c99a43]">
                            Day {dest.day_number || 1} · {dest.visit_time_slot || "Morning"}
                          </span>
                        </div>
                        <h4 className="font-bold text-base text-[#0b2417]">
                          {place.name}
                        </h4>
                        <div className="text-xs text-[#718078] mt-0.5">
                          {place.district} · {place.category_name || "Nature"}
                          {place.entrance_fee && (
                            <span className="ml-2 text-emerald-800 font-medium">
                              Entrance: {place.entrance_fee}
                            </span>
                          )}
                        </div>
                        {place.short_description && (
                          <p className="mt-1.5 text-xs text-gray-600 leading-relaxed">
                            {place.short_description}
                          </p>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/places/${place.slug}`}
                      target="_blank"
                      className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:text-black"
                    >
                      <ExternalLink size={16} />
                    </Link>
                  </div>

                  {/* Safety Advice */}
                  {(place.safety_tips || place.warnings || dest.notes) && (
                    <div className="mt-3 rounded-xl bg-amber-50 p-2.5 text-xs text-amber-950 border border-amber-200/60 space-y-1">
                      {place.warnings && (
                        <div className="flex items-start gap-1 text-rose-900 font-medium">
                          <AlertTriangle size={13} className="shrink-0 mt-0.5 text-rose-600" />
                          <span>{place.warnings}</span>
                        </div>
                      )}
                      {dest.notes && (
                        <div className="text-gray-700">
                          <b>Personal Note:</b> {dest.notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Budget overview if available */}
        {trip.expenses && trip.expenses.length > 0 && (
          <div className="rounded-3xl border border-[#0b2417]/10 bg-white p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-[#0b2417] uppercase tracking-wider">
              Estimated Expenses Summary
            </h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 text-xs">
              {trip.expenses.map((e) => (
                <div key={e.id} className="rounded-xl bg-[#f6f1e8] p-3">
                  <div className="text-gray-500 capitalize">{e.category.replace("_", " ")}</div>
                  <div className="font-bold text-sm text-[#0b2417] mt-0.5">
                    {trip.budget_currency} {e.amount.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-gray-600 mt-1 truncate">{e.title}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

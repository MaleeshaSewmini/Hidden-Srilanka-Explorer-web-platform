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

/* Shared typography: Arial everywhere, black text */
const FONT: React.CSSProperties = {
  fontFamily: "Arial, Helvetica, sans-serif",
  color: "#000000",
};

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
      <div
        style={FONT}
        className="flex min-h-screen items-center justify-center bg-white text-base"
      >
        <Compass className="animate-spin mr-3" size={24} color="#000" />
        <span>Loading shared Sri Lanka trip itinerary...</span>
      </div>
    );
  }

  if (!trip) {
    return (
      <div
        style={FONT}
        className="flex min-h-screen flex-col items-center justify-center bg-white p-6 text-center"
      >
        <MapPin size={40} className="mb-4" color="#000" />
        <h2 className="text-2xl font-bold">Trip Not Found</h2>
        <p className="mt-3 max-w-md text-base">
          This itinerary may be private or the shared link is no longer valid.
        </p>
        <Link
          href="/dashboard/trips"
          className="mt-8 rounded-lg bg-black px-5 py-2.5 text-sm font-bold !text-white hover:bg-neutral-800"
        >
          Explore All Trips
        </Link>
      </div>
    );
  }

  const destinations = trip.destinations || [];

  return (
    <div style={FONT} className="min-h-screen bg-white pb-24">
      {/* Header */}
      <header className="border-b-2 border-black bg-white py-6">
        <div className="container-main">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold">Shared Community Itinerary</p>
              <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{trip.title}</h1>
            </div>

            <div className="flex items-center gap-3 print:hidden">
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 rounded-lg border-2 border-black bg-white px-4 py-2.5 text-sm font-bold hover:bg-neutral-100"
                style={FONT}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? "Link Copied!" : "Share Link"}</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-lg border-2 border-black bg-black px-4 py-2.5 text-sm font-bold !text-white hover:bg-neutral-800"
              >
                <Printer size={16} />
                <span>Print Itinerary</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container-main mt-8 space-y-8">
        {/* Trip overview */}
        <section className="grid grid-cols-1 gap-6 rounded-xl border border-neutral-300 bg-white p-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="block text-sm font-bold">Starting Hub</span>
            <span className="mt-1 block text-lg">{trip.start_location_name}</span>
          </div>

          <div>
            <span className="block text-sm font-bold">Duration &amp; Travelers</span>
            <span className="mt-1 block text-lg">
              {trip.duration_days} Days · {trip.traveler_count} Travelers
            </span>
          </div>

          <div>
            <span className="block text-sm font-bold">Transport</span>
            <span className="mt-1 block text-lg capitalize">{trip.transport_mode}</span>
          </div>

          <div>
            <span className="block text-sm font-bold">Total Route Distance</span>
            <span className="mt-1 block text-lg">
              {routePlan ? `${routePlan.totalDistanceKm} km` : "Estimating..."}
            </span>
          </div>
        </section>

        {/* Map */}
        <section className="space-y-4 rounded-xl border border-neutral-300 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Interactive Road Itinerary</h2>
            {routePlan?.isOsrm && (
              <span className="text-sm font-bold">OSRM Road Geometry</span>
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
        </section>

        {/* Daily schedule */}
        <section className="space-y-5">
          <h2 className="text-2xl font-bold">Daily Stops &amp; Guidance</h2>

          <div className="space-y-4">
            {destinations.map((dest, idx) => {
              const place = dest.place;
              if (!place) return null;

              return (
                <article
                  key={dest.id}
                  className="rounded-xl border border-neutral-300 bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-base font-bold !text-white">
                        {idx + 1}
                      </div>

                      <div>
                        <p className="text-sm font-bold">
                          Day {dest.day_number || 1} · {dest.visit_time_slot || "Morning"}
                        </p>
                        <h3 className="mt-1 text-xl font-bold">{place.name}</h3>
                        <p className="mt-1 text-sm">
                          {place.district} · {place.category_name || "Nature"}
                          {place.entrance_fee && (
                            <span className="ml-3 font-bold">
                              Entrance: {place.entrance_fee}
                            </span>
                          )}
                        </p>
                        {place.short_description && (
                          <p className="mt-3 text-base leading-relaxed">
                            {place.short_description}
                          </p>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/places/${place.slug}`}
                      target="_blank"
                      aria-label={`Open ${place.name}`}
                      className="rounded-lg border-2 border-black p-2 hover:bg-neutral-100 print:hidden"
                    >
                      <ExternalLink size={18} color="#000" />
                    </Link>
                  </div>

                  {/* Safety advice */}
                  {(place.safety_tips || place.warnings || dest.notes) && (
                    <div className="mt-4 space-y-2 rounded-lg border border-neutral-400 bg-neutral-50 p-4 text-sm">
                      {place.warnings && (
                        <div className="flex items-start gap-2 font-bold">
                          <AlertTriangle size={18} className="mt-0.5 shrink-0" color="#000" />
                          <span>{place.warnings}</span>
                        </div>
                      )}
                      {dest.notes && (
                        <div>
                          <b>Personal Note:</b> {dest.notes}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        {/* Budget */}
        {trip.expenses && trip.expenses.length > 0 && (
          <section className="space-y-4 rounded-xl border border-neutral-300 bg-white p-6">
            <h2 className="text-xl font-bold">Estimated Expenses Summary</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {trip.expenses.map((e) => (
                <div
                  key={e.id}
                  className="rounded-lg border border-neutral-300 bg-neutral-50 p-4"
                >
                  <div className="text-sm font-bold capitalize">
                    {e.category.replace("_", " ")}
                  </div>
                  <div className="mt-1 text-xl font-bold">
                    {trip.budget_currency} {e.amount.toLocaleString()}
                  </div>
                  <div className="mt-1 truncate text-sm">{e.title}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
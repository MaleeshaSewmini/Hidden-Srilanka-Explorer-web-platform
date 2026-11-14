"use client";

import { Trip } from "@/lib/trip-planner/types";

interface TripPrintViewProps {
  trip: Trip;
}

export default function TripPrintView({ trip }: TripPrintViewProps) {
  const destinations = trip.destinations || [];

  return (
    <div className="hidden print:block print:p-8 bg-white text-black font-sans leading-normal">
      {/* Print Header */}
      <div className="border-b-2 border-black pb-4 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          {trip.title}
        </h1>
        <p className="text-sm text-gray-700 mt-1">
          Hidden Sri Lanka Explorer · Official Custom Itinerary
        </p>

        <div className="grid grid-cols-4 gap-4 mt-4 text-xs">
          <div>
            <span className="font-bold block text-gray-500">START LOCATION</span>
            <span>{trip.start_location_name}</span>
          </div>
          <div>
            <span className="font-bold block text-gray-500">DURATION</span>
            <span>{trip.duration_days} Day(s) ({destinations.length} stops)</span>
          </div>
          <div>
            <span className="font-bold block text-gray-500">TRAVELERS</span>
            <span>{trip.traveler_count}</span>
          </div>
          <div>
            <span className="font-bold block text-gray-500">TRANSPORT</span>
            <span className="capitalize">{trip.transport_mode}</span>
          </div>
        </div>
      </div>

      {/* Destinations schedule */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold uppercase tracking-wider border-b pb-1">
          Daily Itinerary & Trail Guidance
        </h2>

        {destinations.map((dest, idx) => {
          const place = dest.place;
          return (
            <div key={dest.id} className="border-b border-gray-300 pb-4 break-inside-avoid">
              <div className="flex items-baseline justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm bg-gray-200 px-2 py-0.5 rounded">
                    Stop #{idx + 1} · Day {dest.day_number || 1}
                  </span>
                  <span className="font-bold text-base">
                    {place?.name || "Destination"}
                  </span>
                  <span className="text-xs text-gray-600">
                    ({place?.district || "Sri Lanka"})
                  </span>
                </div>
                <span className="text-xs font-semibold capitalize bg-gray-100 px-2 py-0.5 rounded">
                  {dest.visit_time_slot || "Morning"}
                </span>
              </div>

              {place?.short_description && (
                <p className="text-xs text-gray-700 mt-1.5">
                  {place.short_description}
                </p>
              )}

              {/* Warnings and Notes */}
              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] bg-gray-50 p-2 rounded border border-gray-200">
                <div>
                  <span className="font-bold block">SAFETY & ADVICE:</span>
                  <span>
                    {place?.warnings || place?.safety_tips || "Follow standard island trail precautions."}
                  </span>
                </div>
                <div>
                  <span className="font-bold block">INSIDER TIP / PERSONAL NOTE:</span>
                  <span>{dest.notes || place?.hidden_tips || "Carry sufficient drinking water."}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Budget Summary */}
      {trip.expenses && trip.expenses.length > 0 && (
        <div className="mt-8 pt-4 border-t-2 border-black break-inside-avoid">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-2">
            Estimated Trip Expenses Breakdown
          </h2>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b font-bold">
                <th className="py-1">Category</th>
                <th className="py-1">Item</th>
                <th className="py-1 text-right">Amount ({trip.budget_currency})</th>
              </tr>
            </thead>
            <tbody>
              {trip.expenses.map((e) => (
                <tr key={e.id} className="border-b border-gray-200">
                  <td className="py-1 capitalize font-medium">{e.category.replace("_", " ")}</td>
                  <td className="py-1 text-gray-600">{e.title}</td>
                  <td className="py-1 text-right font-mono font-bold">
                    {e.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
              <tr className="font-bold text-sm">
                <td colSpan={2} className="py-2 text-right">
                  Estimated Total:
                </td>
                <td className="py-2 text-right font-mono">
                  {trip.budget_currency} {trip.estimated_cost?.toLocaleString() || 0}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 text-center text-[10px] text-gray-500 border-t pt-4">
        Planned on Hidden Sri Lanka Explorer · Explore thoughtfully, leave no trace.
      </div>
    </div>
  );
}


"use client";

import { useMemo, useState } from "react";
import { PlaceRecord, TimeSlot, TripDestination } from "@/lib/trip-planner/types";
import { findNearbyAlternatives } from "@/lib/trip-planner/recommendations";
import {
  Calendar,
  ArrowUp,
  ArrowDown,
  Trash2,
  CheckCircle2,
  Circle,
  ShieldAlert,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";

interface ItineraryDayViewProps {
  destinations: TripDestination[];
  allAvailablePlaces: PlaceRecord[];
  durationDays: number;
  onUpdateDestinations: (destinations: TripDestination[]) => void;
  onAddDestination: (place: PlaceRecord, dayNumber: number) => void;
  onMarkVisited: (dest: TripDestination) => void;
}

export default function ItineraryDayView({
  destinations,
  allAvailablePlaces,
  durationDays,
  onUpdateDestinations,
  onAddDestination,
  onMarkVisited,
}: ItineraryDayViewProps) {
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [expandedAlternativesForPlaceId, setExpandedAlternativesForPlaceId] = useState<string | null>(null);

  // Group destinations by day number
  const daysArray = useMemo(() => {
    return Array.from({ length: durationDays }, (_, i) => i + 1);
  }, [durationDays]);

  const currentDayDestinations = useMemo(() => {
    return destinations
      .filter((d) => (d.day_number || 1) === selectedDay)
      .sort((a, b) => a.order_index - b.order_index);
  }, [destinations, selectedDay]);

  // Reordering within the day
  const handleMove = (index: number, direction: "up" | "down") => {
    const list = [...currentDayDestinations];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    // Re-index order_index for this day
    const updatedDayStops = list.map((item, idx) => ({
      ...item,
      order_index: idx,
    }));

    const otherDayStops = destinations.filter(
      (d) => (d.day_number || 1) !== selectedDay
    );

    onUpdateDestinations([...otherDayStops, ...updatedDayStops]);
  };

  // Change destination day assignment
  const handleChangeDay = (destId: string, newDay: number) => {
    const updated = destinations.map((d) =>
      d.id === destId
        ? {
            ...d,
            day_number: newDay,
            order_index: 999, // push to end of target day
          }
        : d
    );
    onUpdateDestinations(updated);
  };

  // Update time slot
  const handleTimeSlotChange = (destId: string, slot: TimeSlot) => {
    const updated = destinations.map((d) =>
      d.id === destId ? { ...d, visit_time_slot: slot } : d
    );
    onUpdateDestinations(updated);
  };

  // Update custom notes
  const handleNotesChange = (destId: string, notes: string) => {
    const updated = destinations.map((d) =>
      d.id === destId ? { ...d, notes } : d
    );
    onUpdateDestinations(updated);
  };

  // Delete stop
  const handleDeleteStop = (destId: string) => {
    const updated = destinations.filter((d) => d.id !== destId);
    onUpdateDestinations(updated);
  };

  return (
    <div className="space-y-4">
      {/* Day Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {daysArray.map((day) => {
          const count = destinations.filter((d) => (d.day_number || 1) === day).length;
          const isActive = selectedDay === day;

          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition shadow-sm ${
                isActive
                  ? "bg-[#123b26] text-[#f1cf88]"
                  : "bg-white text-[#0b2417] hover:bg-[#e9e0d0] border border-[#0b2417]/10"
              }`}
            >
              <span>Day {day}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] ${
                  isActive ? "bg-[#c99a43] text-[#0b2417]" : "bg-gray-100 text-gray-600"
                }`}
              >
                {count} {count === 1 ? "stop" : "stops"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Current Day Itinerary Stops */}
      {currentDayDestinations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#0b2417]/20 p-8 text-center bg-white/50">
          <Calendar size={28} className="mx-auto text-[#718078]/60 mb-2" />
          <h4 className="font-bold text-[#0b2417]">No stops planned for Day {selectedDay}</h4>
          <p className="mt-1 text-xs text-[#718078]">
            Browse the discovery tab or recommendations below to add places to this day.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentDayDestinations.map((dest, idx) => {
            const place = dest.place;
            if (!place) return null;

            const isFirst = idx === 0;
            const isLast = idx === currentDayDestinations.length - 1;
            const showAlternatives = expandedAlternativesForPlaceId === place.id;
            const alternatives = showAlternatives
              ? findNearbyAlternatives(place, allAvailablePlaces, 30, 2)
              : [];

            return (
              <div
                key={dest.id}
                className={`rounded-2xl border bg-white p-4 transition shadow-sm ${
                  dest.is_visited
                    ? "border-emerald-300 bg-emerald-50/20"
                    : "border-[#0b2417]/10 hover:border-[#123b26]/30"
                }`}
              >
                {/* Header row: Number, Place title, Visited toggle, Reorder buttons */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* Stop Number Badge */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#0b2417] text-xs font-bold text-[#f1cf88] shadow-sm">
                      {idx + 1}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/places/${place.slug}`}
                          target="_blank"
                          className="font-bold text-sm sm:text-base text-[#0b2417] hover:text-[#c99a43] transition inline-flex items-center gap-1.5"
                        >
                          {place.name}
                          <ExternalLink size={13} className="text-gray-400" />
                        </Link>

                        {/* Visited Toggle Button */}
                        <button
                          type="button"
                          onClick={() => onMarkVisited(dest)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold transition ${
                            dest.is_visited
                              ? "bg-emerald-700 text-white"
                              : "border border-gray-300 text-gray-600 hover:border-emerald-600 hover:text-emerald-700"
                          }`}
                        >
                          {dest.is_visited ? (
                            <>
                              <CheckCircle2 size={12} /> Visited
                            </>
                          ) : (
                            <>
                              <Circle size={12} /> Mark Visited
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#718078] mt-1">
                        <span>{place.district}</span>
                        {place.nearest_town && <span>· Near {place.nearest_town}</span>}
                        {place.difficulty && (
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-700">
                            {place.difficulty}
                          </span>
                        )}
                        {place.entrance_fee && (
                          <span className="text-emerald-800 font-medium">
                            · Fee: {place.entrance_fee}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Move Up, Move Down, Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => handleMove(idx, "up")}
                      className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                      title="Move stop earlier"
                    >
                      <ArrowUp size={15} />
                    </button>
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => handleMove(idx, "down")}
                      className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                      title="Move stop later"
                    >
                      <ArrowDown size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteStop(dest.id)}
                      className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                      title="Remove from trip"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Second row: Time Slot, Day Switcher, Notes Input */}
                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3 pt-2.5 border-t border-gray-100 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-[#718078] mb-1">
                      Time Slot
                    </label>
                    <select
                      value={dest.visit_time_slot || "morning"}
                      onChange={(e) =>
                        handleTimeSlotChange(dest.id, e.target.value as TimeSlot)
                      }
                      className="w-full rounded-xl border border-gray-200 bg-[#f6f1e8]/50 p-2 text-xs font-semibold text-[#0b2417] outline-none"
                    >
                      <option value="morning">Morning (8 AM - 12 PM)</option>
                      <option value="afternoon">Afternoon (1 PM - 4 PM)</option>
                      <option value="sunset">Sunset / Evening (4 PM - 7 PM)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#718078] mb-1">
                      Assign to Day
                    </label>
                    <select
                      value={dest.day_number || 1}
                      onChange={(e) => handleChangeDay(dest.id, Number(e.target.value))}
                      className="w-full rounded-xl border border-gray-200 bg-[#f6f1e8]/50 p-2 text-xs font-semibold text-[#0b2417] outline-none"
                    >
                      {daysArray.map((d) => (
                        <option key={d} value={d}>
                          Day {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#718078] mb-1">
                      Personal Trail Note
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bring salt for leeches, hire guide"
                      value={dest.notes || ""}
                      onChange={(e) => handleNotesChange(dest.id, e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-[#f6f1e8]/50 p-2 text-xs text-[#0b2417] placeholder:text-[#718078] outline-none"
                    />
                  </div>
                </div>

                {/* Safety warnings & Tips accordion from database */}
                {(place.safety_tips || place.warnings || place.hidden_tips || place.road_condition) && (
                  <div className="mt-2.5 rounded-xl bg-amber-50/80 p-2.5 border border-amber-200/60 text-xs text-amber-950 space-y-1">
                    {place.warnings && (
                      <div className="flex items-start gap-1.5 font-semibold text-rose-900">
                        <AlertTriangle size={13} className="shrink-0 mt-0.5 text-rose-600" />
                        <span>Warning: {place.warnings}</span>
                      </div>
                    )}
                    {place.safety_tips && (
                      <div className="flex items-start gap-1.5 text-amber-900">
                        <ShieldAlert size={13} className="shrink-0 mt-0.5 text-amber-700" />
                        <span>Safety: {place.safety_tips}</span>
                      </div>
                    )}
                    {place.road_condition && (
                      <div className="text-[11px] text-gray-600">
                        Road condition: {place.road_condition}
                      </div>
                    )}
                    {place.hidden_tips && (
                      <div className="flex items-start gap-1.5 text-emerald-950 text-[11px]">
                        <Lightbulb size={13} className="shrink-0 mt-0.5 text-amber-600" />
                        <span>Insider tip: {place.hidden_tips}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Nearby alternative destination toggle */}
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedAlternativesForPlaceId(
                        showAlternatives ? null : place.id
                      )
                    }
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#c99a43] hover:underline"
                  >
                    <span>
                      {showAlternatives
                        ? "Hide nearby alternatives"
                        : "Suggest nearby alternatives (<30 km)"}
                    </span>
                    {showAlternatives ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>

                {/* Nearby alternatives drawer */}
                {showAlternatives && (
                  <div className="mt-2 rounded-xl bg-emerald-50/50 p-2.5 border border-emerald-100">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 mb-1.5">
                      Nearby Alternate Spots (In case of weather or crowds)
                    </div>
                    {alternatives.length === 0 ? (
                      <p className="text-xs text-gray-500">
                        No nearby alternative destinations within 30 km.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {alternatives.map((alt) => (
                          <div
                            key={alt.id}
                            className="flex items-center justify-between rounded-lg bg-white p-2 border border-emerald-200/60 shadow-xs"
                          >
                            <div>
                              <div className="font-bold text-xs text-[#0b2417]">
                                {alt.name}
                              </div>
                              <div className="text-[10px] text-gray-500">
                                {alt.distance_km} km away · {alt.district}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => onAddDestination(alt, selectedDay)}
                              className="rounded-lg bg-[#123b26] px-2 py-1 text-[10px] font-bold text-white hover:bg-[#c99a43] hover:text-[#0b2417]"
                            >
                              + Add to Day {selectedDay}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

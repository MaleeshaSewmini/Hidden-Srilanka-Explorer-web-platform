"use client";

import { useEffect, useMemo, useState } from "react";
import { PlaceRecord, TimeSlot, TripDestination } from "@/lib/trip-planner/types";
import { findNearbyAlternatives } from "@/lib/trip-planner/recommendations";
import {
  Calendar,
  ArrowUp,
  ArrowDown,
  Trash2,
  CheckCircle2,
  Circle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
} from "lucide-react";
import Link from "next/link";

/* ==========================================================================
   ItineraryDayView
   - One card per day. The number of cards always follows `durationDays`,
     the number of days the user chose for the trip.
   - Users can add a day or remove the last day right here. The new length is
     reported through `onChangeDuration`, together with the stops, so the trip
     is saved in one update.
   ========================================================================== */

interface ItineraryDayViewProps {
  destinations: TripDestination[];
  allAvailablePlaces: PlaceRecord[];
  durationDays: number;
  onUpdateDestinations: (destinations: TripDestination[]) => void;
  onAddDestination: (place: PlaceRecord, dayNumber: number) => void;
  onMarkVisited: (dest: TripDestination) => void;
  /** Called when the user adds or removes a day. Save both values together. */
  onChangeDuration?: (days: number, destinations: TripDestination[]) => void;
}

const MAX_DAYS = 60;

const CARD = "bg-white rounded-xl border border-[#e3e6ea]";
const FIELD =
  "w-full rounded-lg border border-[#d3d7dd] bg-white px-3 py-2.5 text-sm text-[#16181d] focus:border-[#a77a2f] focus:outline-none";
const BTN_SECONDARY =
  "inline-flex items-center justify-center gap-2 bg-white border border-[#d3d7dd] hover:border-[#16181d] text-[#16181d] font-bold px-4 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 bg-[#a77a2f] hover:bg-[#8f6824] text-white font-bold px-4 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

export default function ItineraryDayView({
  destinations,
  allAvailablePlaces,
  durationDays,
  onUpdateDestinations,
  onAddDestination,
  onMarkVisited,
  onChangeDuration,
}: ItineraryDayViewProps) {
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [expandedAlternativesForPlaceId, setExpandedAlternativesForPlaceId] =
    useState<string | null>(null);
  const [confirmRemoveDay, setConfirmRemoveDay] = useState(false);

  const totalDays = Number.isFinite(durationDays)
    ? Math.max(1, Math.floor(durationDays))
    : 1;

  // The day cards: exactly one per day the user chose
  const daysArray = useMemo(
    () => Array.from({ length: totalDays }, (_, i) => i + 1),
    [totalDays]
  );

  // If the trip gets shorter, never stay on a day that no longer exists
  const activeDay = Math.min(Math.max(selectedDay, 1), totalDays);
  useEffect(() => {
    setSelectedDay((prev) => Math.min(Math.max(prev, 1), totalDays));
    setConfirmRemoveDay(false);
  }, [totalDays]);

  // Stops planned beyond the last day (old data) are shown on the last day
  const dayOf = (d: TripDestination) =>
    Math.min(Math.max(d.day_number || 1, 1), totalDays);

  // Per-day numbers for the cards
  const dayStats = useMemo(() => {
    const stats = new Map<number, { count: number; visited: number }>();
    daysArray.forEach((day) => stats.set(day, { count: 0, visited: 0 }));
    destinations.forEach((d) => {
      const s = stats.get(dayOf(d));
      if (!s) return;
      s.count += 1;
      if (d.is_visited) s.visited += 1;
    });
    return stats;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destinations, daysArray, totalDays]);

  const currentDayDestinations = useMemo(() => {
    return destinations
      .filter((d) => dayOf(d) === activeDay)
      .sort((a, b) => a.order_index - b.order_index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destinations, activeDay, totalDays]);

  const activeStats = dayStats.get(activeDay) ?? { count: 0, visited: 0 };

  // ───────── Add / remove a day ─────────
  const handleAddDay = () => {
    if (!onChangeDuration || totalDays >= MAX_DAYS) return;
    const next = totalDays + 1;
    onChangeDuration(next, destinations);
    setSelectedDay(next);
  };

  const lastDayCount = dayStats.get(totalDays)?.count ?? 0;

  const removeLastDay = () => {
    if (!onChangeDuration || totalDays <= 1) return;
    const next = totalDays - 1;
    // Stops on the removed day move to the new last day, nothing is lost
    const moved = destinations.map((d) =>
      dayOf(d) > next
        ? {
            ...d,
            day_number: next,
            order_index:
              destinations.filter((x) => dayOf(x) === next).length +
              destinations
                .filter((x) => dayOf(x) === totalDays)
                .findIndex((x) => x.id === d.id),
          }
        : d
    );
    onChangeDuration(next, moved);
    setConfirmRemoveDay(false);
  };

  const handleRemoveDayClick = () => {
    if (lastDayCount > 0) setConfirmRemoveDay(true);
    else removeLastDay();
  };

  // ───────── Stop editing ─────────
  const handleMove = (index: number, direction: "up" | "down") => {
    const list = [...currentDayDestinations];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    const updatedDayStops = list.map((item, idx) => ({
      ...item,
      day_number: activeDay,
      order_index: idx,
    }));

    const otherDayStops = destinations.filter((d) => dayOf(d) !== activeDay);
    onUpdateDestinations([...otherDayStops, ...updatedDayStops]);
  };

  const handleChangeDay = (destId: string, newDay: number) => {
    const updated = destinations.map((d) =>
      d.id === destId
        ? {
            ...d,
            day_number: newDay,
            // goes to the end of the target day
            order_index: destinations.filter(
              (x) => x.id !== destId && dayOf(x) === newDay
            ).length,
          }
        : d
    );
    onUpdateDestinations(updated);
    setSelectedDay(newDay);
  };

  const handleTimeSlotChange = (destId: string, slot: TimeSlot) => {
    onUpdateDestinations(
      destinations.map((d) => (d.id === destId ? { ...d, visit_time_slot: slot } : d))
    );
  };

  const handleNotesChange = (destId: string, notes: string) => {
    onUpdateDestinations(destinations.map((d) => (d.id === destId ? { ...d, notes } : d)));
  };

  const handleDeleteStop = (destId: string) => {
    onUpdateDestinations(destinations.filter((d) => d.id !== destId));
  };

  return (
    <div className="space-y-8">
      {/* ───────── Day cards ───────── */}
      <section aria-labelledby="itinerary-days-title">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 id="itinerary-days-title" className="text-lg font-bold text-[#16181d]">
            {totalDays} day{totalDays !== 1 ? "s" : ""}
          </h3>

          {onChangeDuration && (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleAddDay}
                disabled={totalDays >= MAX_DAYS}
                className={BTN_SECONDARY}
              >
                <Plus className="w-5 h-5" />
                Add a day
              </button>
              <button
                type="button"
                onClick={handleRemoveDayClick}
                disabled={totalDays <= 1}
                className={BTN_SECONDARY}
              >
                <Minus className="w-5 h-5" />
                Remove day {totalDays}
              </button>
            </div>
          )}
        </div>

        {confirmRemoveDay && (
          <div
            className="mb-4 flex flex-wrap items-center justify-between gap-3 bg-white border border-[#e3e6ea] border-l-4 border-l-[#a77a2f] rounded-lg px-5 py-4"
            role="alert"
          >
            <p className="text-base text-[#16181d]">
              Day {totalDays} has {lastDayCount} stop{lastDayCount !== 1 ? "s" : ""}. They will
              move to day {totalDays - 1}.
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setConfirmRemoveDay(false)} className={BTN_SECONDARY}>
                Keep day
              </button>
              <button type="button" onClick={removeLastDay} className={BTN_PRIMARY}>
                Remove day
              </button>
            </div>
          </div>
        )}

        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
          role="tablist"
          aria-label="Trip days"
        >
          {daysArray.map((day) => {
            const stats = dayStats.get(day) ?? { count: 0, visited: 0 };
            const isActive = activeDay === day;
            const pct = stats.count > 0 ? (stats.visited / stats.count) * 100 : 0;

            return (
              <button
                key={day}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedDay(day)}
                className={`text-left rounded-xl border bg-white p-4 transition-colors ${
                  isActive
                    ? "border-[#a77a2f] shadow-[inset_4px_0_0_#a77a2f]"
                    : "border-[#e3e6ea] hover:border-[#c4c9d0]"
                }`}
              >
                <p className={`text-base text-[#16181d] ${isActive ? "font-bold" : "font-bold"}`}>
                  Day {day}
                </p>
                <p className="text-sm text-[#5b616b] mt-1">
                  {stats.count === 0
                    ? "No stops yet"
                    : `${stats.count} ${stats.count === 1 ? "stop" : "stops"}`}
                </p>
                {stats.count > 0 && (
                  <>
                    <div className="h-1.5 bg-[#e9ebee] rounded-full overflow-hidden mt-3">
                      <div
                        className="h-full bg-[#a77a2f] rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-sm text-[#5b616b] mt-2">
                      {stats.visited} of {stats.count} visited
                    </p>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ───────── Selected day ───────── */}
      <section aria-live="polite">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
          <h3 className="text-xl font-bold text-[#16181d]">Day {activeDay}</h3>
          <p className="text-sm text-[#5b616b]">
            {activeStats.count} {activeStats.count === 1 ? "stop" : "stops"},{" "}
            {activeStats.visited} visited
          </p>
        </div>

        {currentDayDestinations.length === 0 ? (
          <div className={`${CARD} border-dashed p-10 text-center`}>
            <Calendar className="w-10 h-10 mx-auto text-[#c4c9d0] mb-3" />
            <h4 className="text-lg font-bold text-[#16181d]">
              No stops planned for day {activeDay}
            </h4>
            <p className="text-base text-[#5b616b] mt-2 max-w-md mx-auto">
              Add places from Discover places, or move a stop here from another day.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
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
                  className={`${CARD} p-5 transition-colors ${
                    dest.is_visited ? "border-emerald-300" : "hover:border-[#c4c9d0]"
                  }`}
                >
                  {/* Header: number, name, visited, reorder */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f1f2f4] text-sm font-bold text-[#16181d]">
                        {idx + 1}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <Link
                            href={`/places/${place.slug}`}
                            target="_blank"
                            className="font-bold text-base text-[#16181d] hover:text-[#a77a2f] transition-colors inline-flex items-center gap-2"
                          >
                            {place.name}
                            <ExternalLink className="w-4 h-4 text-[#5b616b]" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => onMarkVisited(dest)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold border transition-colors ${
                              dest.is_visited
                                ? "bg-emerald-50 border-emerald-600 text-emerald-800"
                                : "bg-white border-[#d3d7dd] text-[#5b616b] hover:border-emerald-600 hover:text-emerald-800"
                            }`}
                          >
                            {dest.is_visited ? (
                              <>
                                <CheckCircle2 className="w-4 h-4" /> Visited
                              </>
                            ) : (
                              <>
                                <Circle className="w-4 h-4" /> Mark visited
                              </>
                            )}
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#5b616b] mt-2">
                          <span>{place.district}</span>
                          {place.nearest_town && <span>Near {place.nearest_town}</span>}
                          {place.difficulty && (
                            <span className="rounded bg-[#f1f2f4] px-2 py-0.5 text-xs font-bold text-[#16181d]">
                              {place.difficulty}
                            </span>
                          )}
                          {place.entrance_fee && <span>Fee: {place.entrance_fee}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => handleMove(idx, "up")}
                        className="rounded-lg p-2.5 text-[#5b616b] hover:bg-[#f1f2f4] hover:text-[#16181d] disabled:opacity-30"
                        title="Move stop earlier"
                        aria-label="Move stop earlier"
                      >
                        <ArrowUp className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => handleMove(idx, "down")}
                        className="rounded-lg p-2.5 text-[#5b616b] hover:bg-[#f1f2f4] hover:text-[#16181d] disabled:opacity-30"
                        title="Move stop later"
                        aria-label="Move stop later"
                      >
                        <ArrowDown className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStop(dest.id)}
                        className="rounded-lg p-2.5 text-[#5b616b] hover:bg-red-50 hover:text-red-600"
                        title="Remove from trip"
                        aria-label="Remove from trip"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Time slot, day, note */}
                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3 pt-5 border-t border-[#e3e6ea]">
                    <div>
                      <label
                        htmlFor={`slot-${dest.id}`}
                        className="block text-sm font-bold text-[#16181d] mb-2"
                      >
                        Time slot
                      </label>
                      <select
                        id={`slot-${dest.id}`}
                        value={dest.visit_time_slot || "morning"}
                        onChange={(e) => handleTimeSlotChange(dest.id, e.target.value as TimeSlot)}
                        className={FIELD}
                      >
                        <option value="morning">Morning (8 AM to 12 PM)</option>
                        <option value="afternoon">Afternoon (1 PM to 4 PM)</option>
                        <option value="sunset">Sunset and evening (4 PM to 7 PM)</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor={`day-${dest.id}`}
                        className="block text-sm font-bold text-[#16181d] mb-2"
                      >
                        Day
                      </label>
                      <select
                        id={`day-${dest.id}`}
                        value={dayOf(dest)}
                        onChange={(e) => handleChangeDay(dest.id, Number(e.target.value))}
                        className={FIELD}
                      >
                        {daysArray.map((d) => (
                          <option key={d} value={d}>
                            Day {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor={`note-${dest.id}`}
                        className="block text-sm font-bold text-[#16181d] mb-2"
                      >
                        Your note
                      </label>
                      <input
                        id={`note-${dest.id}`}
                        type="text"
                        placeholder="Bring salt for leeches, hire a guide"
                        value={dest.notes || ""}
                        onChange={(e) => handleNotesChange(dest.id, e.target.value)}
                        className={FIELD}
                      />
                    </div>
                  </div>

                  {/* Nearby alternatives */}
                  <div className="mt-4 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedAlternativesForPlaceId(showAlternatives ? null : place.id)
                      }
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-[#a77a2f] hover:underline"
                    >
                      {showAlternatives
                        ? "Hide nearby alternatives"
                        : "Suggest nearby alternatives (within 30 km)"}
                      {showAlternatives ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {showAlternatives && (
                    <div className="mt-3 rounded-lg bg-[#f1f2f4] p-4">
                      <p className="text-sm font-bold text-[#16181d] mb-3">
                        Nearby alternatives, in case of weather or crowds
                      </p>
                      {alternatives.length === 0 ? (
                        <p className="text-sm text-[#5b616b]">
                          No alternative destinations within 30 km.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {alternatives.map((alt) => (
                            <div
                              key={alt.id}
                              className="flex items-center justify-between gap-3 rounded-lg bg-white p-3 border border-[#e3e6ea]"
                            >
                              <div className="min-w-0">
                                <p className="font-bold text-sm text-[#16181d] truncate">
                                  {alt.name}
                                </p>
                                <p className="text-sm text-[#5b616b]">
                                  {alt.distance_km} km away, {alt.district}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => onAddDestination(alt, activeDay)}
                                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-[#a77a2f] px-3 py-2 text-sm font-bold text-white hover:bg-[#8f6824] transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                                Day {activeDay}
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
      </section>
    </div>
  );
}
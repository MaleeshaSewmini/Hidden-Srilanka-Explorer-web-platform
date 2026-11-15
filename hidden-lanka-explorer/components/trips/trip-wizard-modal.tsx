"use client";

import { useMemo, useState } from "react";
import { LocationPoint, PlaceRecord, TransportMode, Trip, TripPreference } from "@/lib/trip-planner/types";
import { SRI_LANKA_HUBS } from "@/lib/trip-planner/distance";
import { getRecommendedPlaces } from "@/lib/trip-planner/recommendations";
import { generateDefaultTripExpenses } from "@/lib/trip-planner/budget";
import LocationSelector from "./location-selector";
import {
  X,
  Sparkles,
  Calendar,
  Users,
  Wallet,
  Car,
  Check,
  ArrowRight,
  ArrowLeft,
  Clock,
} from "lucide-react";

interface TripWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  availablePlaces: PlaceRecord[];
  onTripCreated: (trip: Trip) => void;
}

const INTERESTS_LIST = [
  "Waterfalls",
  "Mountains & Hiking",
  "Hidden Nature Pools",
  "Ancient Ruins & History",
  "Spiritual & Cave Temples",
  "Wildlife & Birdwatching",
  "Secret Beaches",
  "Tea Plantations & Valleys",
  "Village Experiences",
  "Photography Spots",
];

const DISTRICTS_LIST = [
  "Badulla",
  "Kandy",
  "Matale",
  "Nuwara Eliya",
  "Ratnapura",
  "Galle",
  "Matara",
  "Hambantota",
  "Anuradhapura",
  "Polonnaruwa",
  "Trincomalee",
  "Jaffna",
  "Ampara",
  "Monaragala",
  "Kegalle",
  "Kurunegala",
];

export default function TripWizardModal({
  isOpen,
  onClose,
  availablePlaces,
  onTripCreated,
}: TripWizardModalProps) {
  // Step 1: Basics, Step 2: Interests & Districts, Step 3: Recommendations & Review
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form states
  const [title, setTitle] = useState("");
  const [startLocation, setStartLocation] = useState<LocationPoint>(SRI_LANKA_HUBS[0]);
  const [startDate, setStartDate] = useState("2026-11-20");
  const [durationDays, setDurationDays] = useState(3);
  const [travelerCount, setTravelerCount] = useState(2);
  const [totalBudget, setTotalBudget] = useState(85000); // LKR
  const [transportMode, setTransportMode] = useState<TransportMode>("driving");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    "Waterfalls",
    "Mountains & Hiking",
  ]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([
    "Badulla",
    "Kandy",
  ]);
  const [pace, setPace] = useState<"relaxed" | "moderate" | "packed">("moderate");
  const [accommodationTier, setAccommodationTier] = useState<"budget" | "mid_range" | "luxury">("mid_range");

  // Selected destinations for the trip
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<string[]>([]);

  // Compute recommendations using algorithm
  const recommendations = useMemo(() => {
    const prefs: TripPreference = {
      interests: selectedInterests,
      preferred_districts: selectedDistricts,
      preferred_categories: [],
      pace,
      accommodation_tier: accommodationTier,
    };

    const tripMonth = startDate ? new Date(startDate).getMonth() + 1 : undefined;

    return getRecommendedPlaces(
      availablePlaces,
      startLocation.latitude,
      startLocation.longitude,
      prefs,
      [],
      tripMonth
    );
  }, [
    availablePlaces,
    startLocation,
    selectedInterests,
    selectedDistricts,
    pace,
    accommodationTier,
    startDate,
  ]);

  // Pre-select top recommendations when moving to step 3
  const handleProceedToRecommendations = () => {
    if (!title.trim()) {
      setTitle(
        `${durationDays}-Day ${selectedInterests[0] || "Hidden Lanka"} Adventure`
      );
    }
    // Auto-select 2-3 places per day from top recommendations
    const idealPlaceCount = Math.min(recommendations.length, durationDays * 2);
    const topIds = recommendations.slice(0, idealPlaceCount).map((p) => p.id);
    setSelectedPlaceIds((prev) => (prev.length > 0 ? prev : topIds));
    setStep(3);
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const toggleDistrict = (district: string) => {
    setSelectedDistricts((prev) =>
      prev.includes(district)
        ? prev.filter((d) => d !== district)
        : [...prev, district]
    );
  };

  const togglePlaceSelection = (id: string) => {
    setSelectedPlaceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleFinishCreateTrip = () => {
    const tripId = `trip-${Date.now()}`;
    const selectedPlacesList = availablePlaces.filter((p) =>
      selectedPlaceIds.includes(p.id)
    );

    // Calculate baseline expenses
    const defaultExpenses = generateDefaultTripExpenses(tripId, {
      travelerCount,
      durationDays,
      totalDistanceKm: 180, // initial estimate
      transportMode,
      accommodationTier,
      selectedPlaces: selectedPlacesList,
    });

    const calculatedEstimatedCost = defaultExpenses.reduce(
      (sum, e) => sum + e.amount,
      0
    );

    // Distribute places evenly across days
    const destinations = selectedPlacesList.map((place, idx) => {
      const day = Math.min(durationDays, Math.floor(idx / 2) + 1);
      const timeSlots: Array<"morning" | "afternoon" | "sunset"> = [
        "morning",
        "afternoon",
        "sunset",
      ];
      const slot = timeSlots[idx % 3];

      return {
        id: `dest-${tripId}-${idx}`,
        trip_id: tripId,
        place_id: place.id,
        day_number: day,
        order_index: idx,
        visit_time_slot: slot,
        is_visited: false,
        place,
      };
    });

    const newTrip: Trip = {
      id: tripId,
      user_id: "",
      title: title.trim() || `${durationDays}-Day Sri Lanka Tour`,
      description: `Personalized route starting from ${startLocation.name} with ${destinations.length} stops.`,
      start_location_name: startLocation.name,
      start_latitude: startLocation.latitude,
      start_longitude: startLocation.longitude,
      start_date: startDate,
      end_date: new Date(
        new Date(startDate).getTime() + (durationDays - 1) * 86400000
      )
        .toISOString()
        .split("T")[0],
      duration_days: durationDays,
      traveler_count: travelerCount,
      budget_currency: "LKR",
      total_budget: totalBudget,
      estimated_cost: calculatedEstimatedCost,
      transport_mode: transportMode,
      status: "planning",
      is_public: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      destinations,
      preferences: {
        trip_id: tripId,
        interests: selectedInterests,
        preferred_districts: selectedDistricts,
        preferred_categories: [],
        pace,
        accommodation_tier: accommodationTier,
      },
      expenses: defaultExpenses,
    };

    onTripCreated(newTrip);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5 backdrop-blur-sm animate-in fade-in">
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-3xl bg-[#f6f1e8] shadow-2xl overflow-hidden border border-[#0b2417]/15">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#0b2417]/10 bg-white px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#123b26] text-[#c99a43]">
              <Sparkles size={18} />
            </span>
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-[#0b2417]">
                Create Personalized Trip
              </h2>
              <div className="text-xs text-[#718078]">
                Step {step} of 3 · Custom algorithmic planning without AI
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#718078] hover:bg-[#e9e0d0] hover:text-[#0b2417]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body with Step Views */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* STEP 1: BASICS & LOCATION */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0b2417]">
                  Trip Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. 4-Day Knuckles & Ella Waterfalls Explorer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#0b2417]/20 bg-white p-3 text-sm text-[#0b2417] outline-none focus:border-[#123b26]"
                />
              </div>

              {/* Starting location component */}
              <div className="rounded-2xl bg-white p-4 border border-[#0b2417]/10">
                <LocationSelector
                  currentLocation={startLocation}
                  onLocationChange={setStartLocation}
                />
              </div>

              {/* Dates & Travelers */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white p-3.5 border border-[#0b2417]/10">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-[#718078]">
                    <Calendar size={14} className="text-[#c99a43]" />
                    <span>Start Date</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1.5 w-full text-xs sm:text-sm font-semibold text-[#0b2417] bg-transparent outline-none"
                  />
                </div>

                <div className="rounded-2xl bg-white p-3.5 border border-[#0b2417]/10">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-[#718078]">
                    <Clock size={14} className="text-[#c99a43]" />
                    <span>Duration</span>
                  </label>
                  <select
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="mt-1.5 w-full text-xs sm:text-sm font-semibold text-[#0b2417] bg-transparent outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 10, 14].map((d) => (
                      <option key={d} value={d}>
                        {d} Day{d > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-2xl bg-white p-3.5 border border-[#0b2417]/10">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-[#718078]">
                    <Users size={14} className="text-[#c99a43]" />
                    <span>Travelers</span>
                  </label>
                  <select
                    value={travelerCount}
                    onChange={(e) => setTravelerCount(Number(e.target.value))}
                    className="mt-1.5 w-full text-xs sm:text-sm font-semibold text-[#0b2417] bg-transparent outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10, 15].map((c) => (
                      <option key={c} value={c}>
                        {c} Traveler{c > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Budget & Transport */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-3.5 border border-[#0b2417]/10">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-[#718078]">
                    <Wallet size={14} className="text-[#c99a43]" />
                    <span>Total Target Budget (LKR)</span>
                  </label>
                  <input
                    type="number"
                    step={5000}
                    value={totalBudget}
                    onChange={(e) => setTotalBudget(Number(e.target.value))}
                    className="mt-1.5 w-full text-sm font-semibold text-[#0b2417] outline-none"
                  />
                  <div className="mt-1 text-[11px] text-[#718078]">
                    ~{(totalBudget / travelerCount).toLocaleString()} LKR per traveler
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-3.5 border border-[#0b2417]/10">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-[#718078]">
                    <Car size={14} className="text-[#c99a43]" />
                    <span>Transportation Mode</span>
                  </label>
                  <select
                    value={transportMode}
                    onChange={(e) => setTransportMode(e.target.value as TransportMode)}
                    className="mt-1.5 w-full text-sm font-semibold text-[#0b2417] outline-none"
                  >
                    <option value="driving">Private Car / Van / Tuk-tuk</option>
                    <option value="transit">Public Bus & Train</option>
                    <option value="cycling">Cycling Tour</option>
                    <option value="walking">Walking & Hiking Trails</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: INTERESTS, DISTRICTS & STYLE */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0b2417]">
                  What are your main travel interests?
                </label>
                <p className="text-xs text-[#718078] mb-2.5">
                  Our ranking algorithm will match destinations tag-by-tag.
                </p>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS_LIST.map((interest) => {
                    const active = selectedInterests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                          active
                            ? "bg-[#123b26] text-[#f1cf88] shadow-sm"
                            : "bg-white text-[#0b2417] border border-[#0b2417]/15 hover:border-[#123b26]"
                        }`}
                      >
                        {active ? "✓ " : "+ "}
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0b2417]">
                  Preferred Districts (Optional)
                </label>
                <p className="text-xs text-[#718078] mb-2.5">
                  Focus destinations in specific regions of Sri Lanka.
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-white rounded-xl border border-[#0b2417]/10">
                  {DISTRICTS_LIST.map((dist) => {
                    const active = selectedDistricts.includes(dist);
                    return (
                      <button
                        key={dist}
                        type="button"
                        onClick={() => toggleDistrict(dist)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                          active
                            ? "bg-[#c99a43] text-[#0b2417]"
                            : "bg-[#f6f1e8] text-[#0b2417] hover:bg-[#e9e0d0]"
                        }`}
                      >
                        {dist}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Travel Pace & Accommodation Tier */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2">
                <div className="rounded-2xl bg-white p-3.5 border border-[#0b2417]/10">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#718078]">
                    Itinerary Pace
                  </label>
                  <div className="mt-2 flex gap-1.5">
                    {(["relaxed", "moderate", "packed"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPace(p)}
                        className={`flex-1 rounded-xl py-2 text-xs font-bold capitalize transition ${
                          pace === p
                            ? "bg-[#123b26] text-white"
                            : "bg-[#f6f1e8] text-[#0b2417]"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-3.5 border border-[#0b2417]/10">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#718078]">
                    Accommodation Tier
                  </label>
                  <div className="mt-2 flex gap-1.5">
                    {(["budget", "mid_range", "luxury"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setAccommodationTier(t)}
                        className={`flex-1 rounded-xl py-2 text-xs font-bold capitalize transition ${
                          accommodationTier === t
                            ? "bg-[#123b26] text-white"
                            : "bg-[#f6f1e8] text-[#0b2417]"
                        }`}
                      >
                        {t.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ALGORITHMIC DESTINATION RECOMMENDATIONS */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="rounded-2xl bg-emerald-950 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-[#f1cf88]">
                      Personalized Recommendations
                    </h3>
                    <p className="text-xs text-white/70">
                      Ranked by distance from {startLocation.name} and interest match.
                    </p>
                  </div>
                  <div className="rounded-full bg-[#c99a43] px-3 py-1 text-xs font-bold text-[#0b2417]">
                    {selectedPlaceIds.length} stops chosen
                  </div>
                </div>
              </div>

              {/* Recommendations list */}
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {recommendations.slice(0, 15).map((place) => {
                  const isSelected = selectedPlaceIds.includes(place.id);

                  return (
                    <div
                      key={place.id}
                      onClick={() => togglePlaceSelection(place.id)}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition ${
                        isSelected
                          ? "border-[#123b26] bg-white shadow-sm"
                          : "border-gray-200 bg-white/70 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition ${
                            isSelected
                              ? "border-[#123b26] bg-[#123b26] text-white"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check size={14} />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-[#0b2417]">
                              {place.name}
                            </h4>
                            <span className="rounded-full bg-[#c99a43]/20 px-2 py-0.5 text-[10px] font-bold text-[#0b2417]">
                              {place.match_score}% Match
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-[#718078] mt-0.5">
                            <span>{place.district}</span>
                            <span>·</span>
                            <span>{place.distance_km} km away</span>
                            {place.match_reasons && place.match_reasons.length > 0 && (
                              <span className="hidden sm:inline text-emerald-800">
                                · {place.match_reasons[0]}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span className="text-xs font-semibold text-[#123b26]">
                        {isSelected ? "Included" : "+ Add"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between border-t border-[#0b2417]/10 bg-white px-6 py-4">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#0b2417]/20 px-4 py-2 text-xs font-bold text-[#0b2417] hover:bg-[#f6f1e8]"
            >
              <ArrowLeft size={14} /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1) setStep(2);
                else if (step === 2) handleProceedToRecommendations();
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#123b26] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#c99a43] hover:text-[#0b2417] transition shadow-md"
            >
              <span>{step === 1 ? "Next: Choose Interests" : "Next: Match Places"}</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinishCreateTrip}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0b2417] px-6 py-2.5 text-xs font-bold text-[#f1cf88] hover:bg-[#c99a43] hover:text-[#0b2417] transition shadow-lg"
            >
              <Sparkles size={15} />
              <span>Generate My Trip Plan</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

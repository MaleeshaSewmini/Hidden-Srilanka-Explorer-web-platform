import { AccommodationTier, PlaceRecord, TransportMode, TripExpense } from "./types";

export type BudgetEstimateParams = {
  travelerCount: number;
  durationDays: number;
  totalDistanceKm: number;
  transportMode: TransportMode;
  accommodationTier: AccommodationTier;
  selectedPlaces: PlaceRecord[];
};

/**
 * Calculates itemized baseline travel estimates for Sri Lanka
 */
export function generateDefaultTripExpenses(
  tripId: string,
  params: BudgetEstimateParams
): TripExpense[] {
  const {
    travelerCount,
    durationDays,
    totalDistanceKm,
    transportMode,
    accommodationTier,
    selectedPlaces,
  } = params;

  const nights = Math.max(0, durationDays - 1);
  const roomsCount = Math.ceil(travelerCount / 2); // 2 people per room standard

  // 1. TRANSPORTATION
  let transportRatePerKm = 140; // private car baseline (fuel + driver)
  let transportBaseDaily = 3500;

  if (transportMode === "transit") {
    transportRatePerKm = 25; // bus / train
    transportBaseDaily = 500;
  } else if (transportMode === "walking" || transportMode === "cycling") {
    transportRatePerKm = 0;
    transportBaseDaily = 1500; // bicycle rental or basic support
  } else if (travelerCount > 4) {
    transportRatePerKm = 210; // KDH van for group
    transportBaseDaily = 6000;
  }

  // Account for road distance (approx 1.25x straight line)
  const estRoadKm = Math.max(40, totalDistanceKm * 1.25);
  const totalTransportCost = Math.round(
    estRoadKm * transportRatePerKm + durationDays * transportBaseDaily
  );

  // 2. ACCOMMODATION (per room / per night)
  let roomNightRate = 14000; // mid-range guest house / boutique hotel
  if (accommodationTier === "budget") {
    roomNightRate = 6000; // homestay / hostel / eco-lodge
  } else if (accommodationTier === "luxury") {
    roomNightRate = 45000; // luxury resort / heritage villa
  }

  const totalAccommodationCost = nights * roomsCount * roomNightRate;

  // 3. FOOD & DINING (per person / per day)
  let foodDailyRate = 3500; // delicious local rice & curry, rotis, tea & tropical fruit
  if (accommodationTier === "luxury") {
    foodDailyRate = 9000;
  } else if (accommodationTier === "budget") {
    foodDailyRate = 2200;
  }

  const totalFoodCost = travelerCount * durationDays * foodDailyRate;

  // 4. ENTRANCE FEES & TICKETS
  let totalEntranceFees = 0;
  selectedPlaces.forEach((place) => {
    // Check if entrance_fee column has a numeric amount or keywords
    const feeStr = (place.entrance_fee || "").toLowerCase();
    if (feeStr.includes("free") || !place.entrance_fee) {
      totalEntranceFees += 0;
    } else {
      const match = feeStr.match(/\d[\d,]*/);
      if (match) {
        const parsedFee = parseFloat(match[0].replace(/,/g, ""));
        totalEntranceFees += parsedFee * travelerCount;
      } else {
        totalEntranceFees += 500 * travelerCount; // modest default for conservation/temple permits
      }
    }
  });

  // 5. ACTIVITIES & LOCAL GUIDES
  // 1 guided trek or excursion per 2 days
  const activitiesCount = Math.max(1, Math.floor(durationDays / 2));
  const guideFeePerActivity = 4500;
  const totalActivitiesCost = activitiesCount * guideFeePerActivity;

  // 6. OTHER / CONTINGENCY BUFFER (around 7% of subtotal)
  const subtotal =
    totalTransportCost +
    totalAccommodationCost +
    totalFoodCost +
    totalEntranceFees +
    totalActivitiesCost;

  const contingencyCost = Math.round(subtotal * 0.07);

  return [
    {
      id: `exp-${tripId}-trans`,
      trip_id: tripId,
      category: "transport",
      title: `${transportMode === "transit" ? "Public Trains & Buses" : "Vehicle Fuel & Hire"} (~${Math.round(estRoadKm)} km road route)`,
      amount: totalTransportCost,
      is_estimated: true,
      notes: "Calculated based on estimated road kilometers and vehicle rates",
    },
    {
      id: `exp-${tripId}-acc`,
      trip_id: tripId,
      category: "accommodation",
      title: `${accommodationTier.replace("_", " ").toUpperCase()} Lodging (${nights} nights, ${roomsCount} room${roomsCount > 1 ? "s" : ""})`,
      amount: totalAccommodationCost,
      is_estimated: true,
      notes: "Eco-lodges, boutique villas, or local homestays",
    },
    {
      id: `exp-${tripId}-food`,
      trip_id: tripId,
      category: "food",
      title: `Food & Meals (${durationDays} days × ${travelerCount} traveler${travelerCount > 1 ? "s" : ""})`,
      amount: totalFoodCost,
      is_estimated: true,
      notes: "Local village meals, fresh fruit, tea & drinking water",
    },
    {
      id: `exp-${tripId}-fees`,
      trip_id: tripId,
      category: "entrance_fees",
      title: `Permits & Site Tickets (${selectedPlaces.length} destination${selectedPlaces.length !== 1 ? "s" : ""})`,
      amount: totalEntranceFees,
      is_estimated: true,
      notes: "Temple donations, wildlife/forest department passes",
    },
    {
      id: `exp-${tripId}-act`,
      trip_id: tripId,
      category: "activities",
      title: "Village Guides & Experiences",
      amount: totalActivitiesCost,
      is_estimated: true,
      notes: "Accredited local guides for waterfall trails & forests",
    },
    {
      id: `exp-${tripId}-other`,
      trip_id: tripId,
      category: "other",
      title: "Contingency & Emergency Buffer",
      amount: contingencyCost,
      is_estimated: true,
      notes: "First aid, leech socks, vehicle repairs or unexpected tips",
    },
  ];
}

/**
 * Calculates sum of expenses and budget health
 */
export function calculateBudgetSummary(
  expenses: TripExpense[],
  totalBudget: number
): {
  totalEstimated: number;
  totalConfirmed: number;
  grandTotal: number;
  difference: number; // positive = under budget, negative = over budget
  percentUsed: number;
  status: "under" | "on_track" | "over";
} {
  let totalEstimated = 0;
  let totalConfirmed = 0;

  expenses.forEach((item) => {
    if (item.is_estimated) {
      totalEstimated += item.amount;
    } else {
      totalConfirmed += item.amount;
    }
  });

  const grandTotal = totalEstimated + totalConfirmed;
  const difference = totalBudget - grandTotal;
  const percentUsed = totalBudget > 0 ? Math.round((grandTotal / totalBudget) * 100) : 100;

  let status: "under" | "on_track" | "over" = "on_track";
  if (totalBudget > 0) {
    if (percentUsed > 105) status = "over";
    else if (percentUsed < 90) status = "under";
    else status = "on_track";
  }

  return {
    totalEstimated,
    totalConfirmed,
    grandTotal,
    difference,
    percentUsed,
    status,
  };
}

/**
 * Formats a currency number in LKR or selected currency
 */
export function formatCurrency(amount: number, currency = "LKR"): string {
  return `${currency} ${amount.toLocaleString()}`;
}


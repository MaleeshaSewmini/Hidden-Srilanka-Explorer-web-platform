"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import {
  LocationPoint,
  PlaceRecord,
  RoutePlan,
  Trip,
  TripDestination,
  TripExpense,
} from "@/lib/trip-planner/types";
import { SRI_LANKA_HUBS } from "@/lib/trip-planner/distance";
import { calculateRouteWithOSRM } from "@/lib/trip-planner/osrm";
import {
  deleteTrip,
  duplicateTrip,
  loadUserTrips,
  markPlaceAsVisited,
  saveTrip,
  unmarkPlaceAsVisited,
  VisitedPlaceRecord,
} from "@/lib/trip-planner/storage";
import { generateDefaultTripExpenses } from "@/lib/trip-planner/budget";
import LocationSelector from "@/components/trips/location-selector";
import NearbyPlacesDiscovery from "@/components/trips/nearby-places-discovery";
import TripWizardModal from "@/components/trips/trip-wizard-modal";
import ItineraryDayView from "@/components/trips/itinerary-day-view";
import BudgetCalculator from "@/components/trips/budget-calculator";
import TripShareModal from "@/components/trips/trip-share-modal";
import TripPrintView from "@/components/trips/trip-print-view";
import NotificationCenter from "@/components/notifications/notification-center";
import {
  MapPin,
  Plus,
  Trash2,
  Copy,
  Share2,
  Printer,
  Route,
  Calendar,
  Users,
  Wallet,
  Clock,
  Navigation,
  Bell,
  AlertTriangle,
  ChevronRight,
  X,
  RefreshCw,
  Eye,
  Pencil,
  Map as MapIcon,
} from "lucide-react";

/* ==========================================================================
   Design tokens
   ink    #16181d   primary text
   muted  #5b616b   secondary text
   line   #e3e6ea   borders and dividers
   page   #f5f6f7   page background
   soft   #f1f2f4   hover and subtle fills
   gold   #77bd96   the one accent (primary action, active item, progress)
   ========================================================================== */

const CARD = "bg-white rounded-xl border border-[#e3e6ea]";
const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 bg-[#a77a2f] hover:bg-[#8f6824] text-white font-bold px-5 py-3 rounded-lg text-sm transition-colors";
const BTN_SECONDARY =
  "inline-flex items-center justify-center gap-2 bg-white border border-[#d3d7dd] hover:border-[#16181d] text-[#16181d] font-bold px-5 py-3 rounded-lg text-sm transition-colors";
const ICON_BTN =
  "p-2.5 text-[#5b616b] hover:text-[#16181d] hover:bg-[#f1f2f4] rounded-lg transition-colors";
const SPINNER =
  "animate-spin w-8 h-8 border-2 border-[#a77a2f] border-t-transparent rounded-full";

/*
  Scoped CSS:
  1. Arial everywhere inside the planner (child components and modals included).
  2. A larger type scale. Tailwind's text-xs / sm / base / lg / xl / 2xl / 3xl are
     raised inside .tp-root, so the child components you did not edit get bigger too.
  3. Safety net: remaps the old dark green and cream classes used inside child
     components to the new neutral palette, until you edit those files directly.
*/
const GLOBAL_CSS = String.raw`
.tp-root, .tp-root * { font-family: Arial, Helvetica, sans-serif; }
.tp-root :focus-visible { outline: 3px solid #2fa783; outline-offset: 2px; }

.tp-root .text-xs   { font-size: 14px; line-height: 20px; }
.tp-root .text-sm   { font-size: 16px; line-height: 24px; }
.tp-root .text-base { font-size: 18px; line-height: 28px; }
.tp-root .text-lg   { font-size: 20px; line-height: 28px; }
.tp-root .text-xl   { font-size: 24px; line-height: 32px; }
.tp-root .text-2xl  { font-size: 28px; line-height: 36px; }
.tp-root .text-3xl  { font-size: 34px; line-height: 42px; }

.tp-root .bg-\[\#123b26\]            { background-color: #ecf3ef; }
.tp-root .bg-\[\#0b2417\]            { background-color: #8f6824; }
.tp-root .hover\:bg-\[\#0b2417\]:hover { background-color: #8f6824; }
.tp-root .text-\[\#123b26\]          { color: #16181d; }
.tp-root .text-\[\#123b26\]\/50,
.tp-root .text-\[\#123b26\]\/60,
.tp-root .text-\[\#123b26\]\/70      { color: #5b616b; }
.tp-root .bg-\[\#f6f1e8\]            { background-color: white; }
.tp-root .hover\:bg-\[\#f6f1e8\]:hover { background-color: #f1f2f4; }
.tp-root .border-\[\#c99a43\]\/20    { border-color: #e3e6ea; }

.tp-root [class~="text-[#5b616b]"],
.tp-root [class~="text-[#718078]"],
.tp-root [class~="text-[#123b26]/50"],
.tp-root [class~="text-[#123b26]/60"],
.tp-root [class~="text-[#123b26]/70"],
.tp-root [class~="text-[#123b26]/80"],
.tp-root [class*="text-gray-"] { color: #000000 !important; }
`;

// TripMap uses Leaflet which requires browser window (ssr: false)
const TripMap = dynamic(() => import("@/components/trips/trip-map"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[#f1f2f4] rounded-xl border border-[#e3e6ea]">
      <div className="text-center space-y-3">
        <div className={`${SPINNER} mx-auto`} />
        <p className="text-sm text-[#5b616b]">Loading map…</p>
      </div>
    </div>
  ),
});

// Leaflet needs the browser window, so this is also client-only
const CurrentLocationMap = dynamic(
  () => import("@/components/trips/current-location-map"),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex items-center justify-center bg-[#f1f2f4] rounded-lg border border-[#e3e6ea]"
        style={{ height: 340 }}
      >
        <div className={SPINNER} />
      </div>
    ),
  }
);

type DashboardTab =
  | "trips"
  | "discover"
  | "itinerary"
  | "budget"
  | "map"
  | "notifications";

const NAV_GROUPS: { label: string; items: { id: DashboardTab; label: string; icon: ReactNode }[] }[] = [
  {
    label: "Plan",
    items: [
      { id: "trips", label: "My trips", icon: <Calendar className="w-5 h-5" /> },
      { id: "discover", label: "Discover places", icon: <MapPin className="w-5 h-5" /> },
      { id: "itinerary", label: "Itinerary", icon: <Route className="w-5 h-5" /> },
    ],
  },
  {
    label: "Review",
    items: [
      { id: "budget", label: "Budget", icon: <Wallet className="w-5 h-5" /> },
      { id: "map", label: "Route map", icon: <MapIcon className="w-5 h-5" /> },
    ],
  },
  {
    label: "Stay informed",
    items: [{ id: "notifications", label: "Reminders", icon: <Bell className="w-5 h-5" /> }],
  },
];

/* ─────────────────────────── Presentational helpers ─────────────────────────── */

function SectionTitle({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <h2 className="text-lg font-bold text-[#16181d] mb-4 flex items-center gap-2.5">
      <span className="text-[#a77a2f]">{icon}</span>
      {children}
    </h2>
  );
}

function EmptyState({
  icon,
  title,
  text,
  children,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  children?: ReactNode;
}) {
  return (
    <div className={`${CARD} flex flex-col items-center justify-center text-center py-20 px-6`}>
      <div className="text-[#c4c9d0] mb-5">{icon}</div>
      <h3 className="text-xl font-bold text-[#16181d] mb-2">{title}</h3>
      <p className="text-base text-[#5b616b] mb-7 max-w-md">{text}</p>
      {children && <div className="flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className={`${CARD} p-5`}>
      <div className="flex items-center gap-2 text-sm text-[#5b616b] mb-2">
        <span className="text-[#a77a2f]">{icon}</span>
        {label}
      </div>
      <div className="text-2xl font-bold text-[#16181d]">{value}</div>
    </div>
  );
}

function MiniStat({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-[#16181d]">
      <span className="text-[#a77a2f]">{icon}</span>
      {children}
    </span>
  );
}

/* ─────────────────────────── Trip edit modal ─────────────────────────── */

const EDIT_CURRENCIES = ["LKR", "USD", "EUR", "GBP", "AUD", "INR"];

const EDIT_STATUSES: { value: Trip["status"]; label: string }[] = [
  { value: "planning", label: "Planning" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const EDIT_INPUT =
  "w-full border border-[#d3d7dd] rounded-lg px-4 py-3 text-base bg-white text-[#16181d] focus:border-[#a77a2f] focus:outline-none";
const EDIT_LABEL = "block text-sm font-bold text-[#16181d] mb-2";
const EDIT_ERROR = "text-sm text-red-700 mt-2";

function TripEditModal({
  trip,
  saving,
  onClose,
  onSave,
}: {
  trip: Trip;
  saving: boolean;
  onClose: () => void;
  /** Resolves true when the trip was saved, false when saving failed. */
  onSave: (updated: Trip) => Promise<boolean>;
}) {
  const [title, setTitle] = useState(trip.title);
  const [startName, setStartName] = useState(trip.start_location_name ?? "");
  const [days, setDays] = useState(String(trip.duration_days));
  const [travellers, setTravellers] = useState(String(trip.traveler_count));
  const [budget, setBudget] = useState(String(trip.total_budget));
  const [currency, setCurrency] = useState(trip.budget_currency);
  const [status, setStatus] = useState<Trip["status"]>(trip.status);
  const [submitted, setSubmitted] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);

  // Focus the first field and close on Escape
  useEffect(() => {
    titleRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const daysNum = Number(days);
  const travellersNum = Number(travellers);
  const budgetNum = Number(budget);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Enter a trip name.";
    if (!startName.trim()) e.startName = "Enter where the trip starts.";
    if (!Number.isInteger(daysNum) || daysNum < 1 || daysNum > 60)
      e.days = "Enter a whole number of days from 1 to 60.";
    if (!Number.isInteger(travellersNum) || travellersNum < 1 || travellersNum > 50)
      e.travellers = "Enter a whole number of travellers from 1 to 50.";
    if (budget.trim() === "" || !Number.isFinite(budgetNum) || budgetNum < 0)
      e.budget = "Enter a budget of 0 or more.";
    return e;
  }, [title, startName, daysNum, travellersNum, budget, budgetNum]);

  const hasErrors = Object.keys(errors).length > 0;

  const dirty =
    title.trim() !== trip.title ||
    startName.trim() !== (trip.start_location_name ?? "") ||
    daysNum !== trip.duration_days ||
    travellersNum !== trip.traveler_count ||
    budgetNum !== trip.total_budget ||
    currency !== trip.budget_currency ||
    status !== trip.status;

  // Stops that sit on days beyond the new length will move to the last day
  const movedStops = useMemo(() => {
    if (!Number.isInteger(daysNum) || daysNum < 1) return 0;
    return (trip.destinations ?? []).filter((d) => d.day_number > daysNum).length;
  }, [trip.destinations, daysNum]);

  const currencyOptions = EDIT_CURRENCIES.includes(trip.budget_currency)
    ? EDIT_CURRENCIES
    : [trip.budget_currency, ...EDIT_CURRENCIES];

  const handleSubmit = async () => {
    setSubmitted(true);
    setSaveFailed(false);
    if (hasErrors) return;

    const updated: Trip = {
      ...trip,
      title: title.trim(),
      start_location_name: startName.trim(),
      duration_days: daysNum,
      traveler_count: travellersNum,
      total_budget: budgetNum,
      budget_currency: currency,
      status,
      destinations: trip.destinations
        ? trip.destinations.map((d) =>
            d.day_number > daysNum ? { ...d, day_number: daysNum } : d
          )
        : trip.destinations,
    };

    const ok = await onSave(updated);
    if (ok) onClose();
    else setSaveFailed(true);
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-trip-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="bg-white rounded-xl border border-[#e3e6ea] shadow-xl w-full max-w-xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-7 pt-7 pb-5 border-b border-[#e3e6ea]">
          <div>
            <h3 id="edit-trip-title" className="text-xl font-bold text-[#16181d]">
              Edit trip
            </h3>
            <p className="text-base text-[#5b616b] mt-1">
              Change the details below, then save.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="p-2 -mr-2 text-[#5b616b] hover:text-[#16181d] hover:bg-[#f1f2f4] rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form
          className="px-7 py-6 space-y-5 overflow-y-auto"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          noValidate
        >
          <div>
            <label htmlFor="trip-title" className={EDIT_LABEL}>
              Trip name
            </label>
            <input
              id="trip-title"
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={EDIT_INPUT}
              maxLength={120}
            />
            {submitted && errors.title && <p className={EDIT_ERROR}>{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="trip-start" className={EDIT_LABEL}>
              Starting point name
            </label>
            <input
              id="trip-start"
              value={startName}
              onChange={(e) => setStartName(e.target.value)}
              className={EDIT_INPUT}
              maxLength={120}
            />
            {submitted && errors.startName && <p className={EDIT_ERROR}>{errors.startName}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="trip-days" className={EDIT_LABEL}>
                Days
              </label>
              <input
                id="trip-days"
                type="number"
                inputMode="numeric"
                min={1}
                max={60}
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className={EDIT_INPUT}
              />
              {submitted && errors.days && <p className={EDIT_ERROR}>{errors.days}</p>}
            </div>

            <div>
              <label htmlFor="trip-travellers" className={EDIT_LABEL}>
                Travellers
              </label>
              <input
                id="trip-travellers"
                type="number"
                inputMode="numeric"
                min={1}
                max={50}
                value={travellers}
                onChange={(e) => setTravellers(e.target.value)}
                className={EDIT_INPUT}
              />
              {submitted && errors.travellers && (
                <p className={EDIT_ERROR}>{errors.travellers}</p>
              )}
            </div>
          </div>

          {movedStops > 0 && (
            <div className="flex items-start gap-3 bg-white border border-[#e3e6ea] border-l-4 border-l-[#a77a2f] rounded-lg px-4 py-3 text-sm text-[#16181d]">
              <AlertTriangle className="w-5 h-5 text-[#a77a2f] shrink-0 mt-0.5" />
              <span>
                {movedStops} stop{movedStops !== 1 ? "s" : ""} planned after day {daysNum} will
                move to day {daysNum}.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-5">
            <div>
              <label htmlFor="trip-budget" className={EDIT_LABEL}>
                Total budget
              </label>
              <input
                id="trip-budget"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className={EDIT_INPUT}
              />
              {submitted && errors.budget && <p className={EDIT_ERROR}>{errors.budget}</p>}
            </div>

            <div>
              <label htmlFor="trip-currency" className={EDIT_LABEL}>
                Currency
              </label>
              <select
                id="trip-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={EDIT_INPUT}
              >
                {currencyOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="trip-status" className={EDIT_LABEL}>
              Status
            </label>
            <select
              id="trip-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as Trip["status"])}
              className={EDIT_INPUT}
            >
              {EDIT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {saveFailed && (
            <p className="text-sm text-red-700" role="alert">
              Your changes couldn&apos;t be saved. Check your connection and try again.
            </p>
          )}
        </form>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 px-7 py-5 border-t border-[#e3e6ea]">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex items-center justify-center bg-white border border-[#d3d7dd] hover:border-[#16181d] text-[#16181d] font-bold px-5 py-3 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !dirty}
            className="inline-flex items-center justify-center gap-2 bg-[#a77a2f] hover:bg-[#8f6824] text-white font-bold px-5 py-3 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving && <RefreshCw className="w-5 h-5 animate-spin" />}
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TripPlannerView() {
  // ─────────────────────────── State ───────────────────────────
  const [activeTab, setActiveTab] = useState<DashboardTab>("trips");
  const [allPlaces, setAllPlaces] = useState<PlaceRecord[]>([]);
  const [placeCategoryNames, setPlaceCategoryNames] = useState<string[]>([]);
  const [userTrips, setUserTrips] = useState<Trip[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [startLocation, setStartLocation] = useState<LocationPoint>(SRI_LANKA_HUBS[0]);
  const [routePlan, setRoutePlan] = useState<RoutePlan | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [error, setError] = useState<string | null>(null);
  const routeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─────────────────────────── Load public places from Supabase ───────────────────────────
  useEffect(() => {
    let cancelled = false;

    const supabase = createClient();

    async function loadPlaces() {
      try {
        const { data, error: placesError } = await supabase
          .from("places")
          .select("*")
          .in("status", ["approved", "published"])
          .order("name");

        if (placesError) throw placesError;
        if (cancelled) return;

        const { data: categories, error: categoriesError } = await supabase
          .from("categories")
          .select("id, name")
          .order("name");
        if (categoriesError) {
          console.error("Failed to load place categories:", categoriesError);
          if (!cancelled) setError("Failed to load place categories.");
        }

        const categoryById = new Map(
          (categories ?? []).map((category) => [
            String(category.id),
            category.name,
          ])
        );
        if (!cancelled) {
          setPlaceCategoryNames(
            (categories ?? [])
              .map((category) => category.name)
              .filter((name): name is string => Boolean(name))
          );
        }

        const catalogPlaces = (data ?? []).map((place) => ({
          ...place,
          category_name:
            place.category_name ??
            place.category ??
            categoryById.get(String(place.category_id)) ??
            "General",
          latitude:
            typeof place.latitude === "number" ? place.latitude : Number.NaN,
          longitude:
            typeof place.longitude === "number" ? place.longitude : Number.NaN,
        }));
        setAllPlaces(catalogPlaces as PlaceRecord[]);
      } catch (placesError) {
        console.error("Failed to load discoverable places:", placesError);
        if (!cancelled) setError("Failed to load places. Please try again.");
      } finally {
        if (!cancelled) setPlacesLoading(false);
      }
    }

    void loadPlaces();
    return () => {
      cancelled = true;
    };
  }, []);

  // ─────────────────────────── Load user trips ───────────────────────────
  useEffect(() => {
    setLoading(true);
    loadUserTrips()
      .then((trips) => {
        setUserTrips(trips);
        if (trips.length > 0 && !activeTrip) {
          setActiveTrip(trips[0]);
        }
      })
      .catch((e) => {
        console.error("Error loading trips:", e);
        setError("Failed to load trips.");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────── Derived destinations as PlaceRecord[] ───────────────────────────
  const tripDestinationPlaces: PlaceRecord[] = useMemo(() => {
    if (!activeTrip?.destinations) return [];
    return activeTrip.destinations
      .map((d) => {
        if (d.place) return d.place;
        return allPlaces.find((p) => p.id === d.place_id);
      })
      .filter((p): p is PlaceRecord => !!p);
  }, [activeTrip, allPlaces]);

  const activeTripDestIds = useMemo(
    () => activeTrip?.destinations?.map((d) => d.place_id) ?? [],
    [activeTrip]
  );

  // ─────────────────────────── OSRM road route calculation ───────────────────────────
  useEffect(() => {
    if (!activeTrip || tripDestinationPlaces.length === 0) {
      setRoutePlan(null);
      return;
    }

    if (routeDebounceRef.current) clearTimeout(routeDebounceRef.current);
    routeDebounceRef.current = setTimeout(() => {
      setRouteLoading(true);
      const waypoints = [startLocation, ...tripDestinationPlaces];
      calculateRouteWithOSRM(waypoints, activeTrip.transport_mode)
        .then(setRoutePlan)
        .catch(() => setRoutePlan(null))
        .finally(() => setRouteLoading(false));
    }, 800);

    return () => {
      if (routeDebounceRef.current) clearTimeout(routeDebounceRef.current);
    };
  }, [activeTrip, tripDestinationPlaces, startLocation]);

  // ─────────────────────────── Trip CRUD handlers ───────────────────────────
  const updateTrip = useCallback(async (updated: Trip) => {
    setSaving(true);
    try {
      const saved = await saveTrip(updated);
      setActiveTrip(saved);
      setUserTrips((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
    } catch (e) {
      console.error("Failed to save trip:", e);
      setError("Failed to save trip changes.");
    } finally {
      setSaving(false);
    }
  }, []);

  // Used by the edit modal. Same as updateTrip, but reports success so the
  // modal can stay open and show an error when saving fails.
  const saveTripEdits = useCallback(async (updated: Trip): Promise<boolean> => {
    setSaving(true);
    try {
      const saved = await saveTrip(updated);
      setActiveTrip(saved);
      setUserTrips((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
      return true;
    } catch (e) {
      console.error("Failed to save trip edits:", e);
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const handleTripCreated = useCallback(async (trip: Trip) => {
    setSaving(true);
    try {
      const saved = await saveTrip(trip);
      setUserTrips((prev) => [saved, ...prev]);
      setActiveTrip(saved);
      setShowWizard(false);
      setActiveTab("itinerary");
    } catch (e) {
      console.error("Failed to create trip:", e);
      setError("Failed to save new trip.");
    } finally {
      setSaving(false);
    }
  }, []);

  const handleDeleteTrip = useCallback(
    async (tripId: string) => {
      try {
        await deleteTrip(tripId);
        setUserTrips((prev) => prev.filter((t) => t.id !== tripId));
        if (activeTrip?.id === tripId) {
          const remaining = userTrips.filter((t) => t.id !== tripId);
          setActiveTrip(remaining[0] ?? null);
        }
        setShowDeleteConfirm(null);
      } catch (e) {
        console.error("Failed to delete trip:", e);
        setError("Failed to delete trip.");
      }
    },
    [activeTrip, userTrips]
  );

  const handleDuplicateTrip = useCallback(async (trip: Trip) => {
    setSaving(true);
    try {
      const dup = await duplicateTrip(trip);
      setUserTrips((prev) => [dup, ...prev]);
      setActiveTrip(dup);
    } catch (e) {
      console.error("Failed to duplicate trip:", e);
      setError("Failed to duplicate trip.");
    } finally {
      setSaving(false);
    }
  }, []);

  // ─────────────────────────── Add / Remove destination ───────────────────────────
  const handleAddPlace = useCallback(
    (place: PlaceRecord) => {
      if (!activeTrip) {
        setError("Select or create a trip first.");
        return;
      }
      if (activeTripDestIds.includes(place.id)) return;

      const dest: TripDestination = {
        id: `dest-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        trip_id: activeTrip.id,
        place_id: place.id,
        day_number: 1,
        order_index: activeTrip.destinations?.length ?? 0,
        visit_time_slot: "morning",
        is_visited: false,
        place,
      };

      const updated: Trip = {
        ...activeTrip,
        destinations: [...(activeTrip.destinations ?? []), dest],
      };
      updateTrip(updated);
    },
    [activeTrip, activeTripDestIds, updateTrip]
  );

  const handleRemovePlace = useCallback(
    (placeId: string) => {
      if (!activeTrip) return;
      const updated: Trip = {
        ...activeTrip,
        destinations: (activeTrip.destinations ?? []).filter(
          (d) => d.place_id !== placeId
        ),
      };
      updateTrip(updated);
    },
    [activeTrip, updateTrip]
  );

  const handleAddDestinationFromItinerary = useCallback(
    (place: PlaceRecord, dayNumber: number) => {
      if (!activeTrip) return;
      const dest: TripDestination = {
        id: `dest-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        trip_id: activeTrip.id,
        place_id: place.id,
        day_number: dayNumber,
        order_index: activeTrip.destinations?.length ?? 0,
        visit_time_slot: "morning",
        is_visited: false,
        place,
      };
      updateTrip({
        ...activeTrip,
        destinations: [...(activeTrip.destinations ?? []), dest],
      });
    },
    [activeTrip, updateTrip]
  );

  // ─────────────────────────── Visited places tracking ───────────────────────────
  const handleMarkVisited = useCallback(
    (dest: TripDestination) => {
      if (!activeTrip) return;
      const place = dest.place ?? allPlaces.find((p) => p.id === dest.place_id);
      const isVisited = !dest.is_visited;
      const visitedAt = isVisited ? new Date().toISOString() : null;

      if (isVisited && place && visitedAt) {
        const record: VisitedPlaceRecord = {
          place_id: dest.place_id,
          place_name: place.name,
          district: place.district,
          latitude: place.latitude,
          longitude: place.longitude,
          visited_at: visitedAt,
          trip_id: activeTrip.id,
          trip_title: activeTrip.title,
        };
        markPlaceAsVisited(record);
      } else if (!isVisited) {
        unmarkPlaceAsVisited(dest.place_id);
      }

      const updated: Trip = {
        ...activeTrip,
        destinations: (activeTrip.destinations ?? []).map((d) =>
          d.id === dest.id
            ? {
                ...d,
                is_visited: isVisited,
                visited_at: visitedAt,
              }
            : d
        ),
      };
      updateTrip(updated);
    },
    [activeTrip, allPlaces, updateTrip]
  );

  // ─────────────────────────── Budget calculations ───────────────────────────
  const handleUpdateExpenses = useCallback(
    (expenses: TripExpense[]) => {
      if (!activeTrip) return;
      const total = expenses.reduce((sum, e) => sum + e.amount, 0);
      updateTrip({ ...activeTrip, expenses, estimated_cost: total });
    },
    [activeTrip, updateTrip]
  );

  const handleUpdateTotalBudget = useCallback(
    (budget: number) => {
      if (!activeTrip) return;
      updateTrip({ ...activeTrip, total_budget: budget });
    },
    [activeTrip, updateTrip]
  );

  const activeTripExpenses = useMemo(() => {
    if (!activeTrip) return [];
    if (activeTrip.expenses && activeTrip.expenses.length > 0) return activeTrip.expenses;
    return generateDefaultTripExpenses(activeTrip.id, {
      travelerCount: activeTrip.traveler_count,
      durationDays: activeTrip.duration_days,
      totalDistanceKm: routePlan?.totalDistanceKm ?? 0,
      transportMode: activeTrip.transport_mode,
      accommodationTier: activeTrip.preferences?.accommodation_tier ?? "mid_range",
      selectedPlaces: tripDestinationPlaces,
    });
  }, [activeTrip, routePlan, tripDestinationPlaces]);

  // ─────────────────────────── Helpers ───────────────────────────
  const statusBadge = (status: Trip["status"]) => {
    const dot: Record<Trip["status"], string> = {
      planning: "bg-sky-500",
      ongoing: "bg-emerald-500",
      completed: "bg-[#b3b9c2]",
      cancelled: "bg-red-500",
    };
    return (
      <span className="inline-flex items-center gap-2 text-sm font-bold text-[#16181d] capitalize">
        <span className={`w-2.5 h-2.5 rounded-full ${dot[status]}`} />
        {status}
      </span>
    );
  };

  const formatDuration = (minutes: number) =>
    `${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}m`;

  const visitedCount = (trip: Trip) =>
    trip.destinations?.filter((d) => d.is_visited).length ?? 0;

  const openTrip = (trip: Trip, tab: DashboardTab = "itinerary") => {
    setActiveTrip(trip);
    setActiveTab(tab);
  };

  const pageMeta: Record<DashboardTab, { title: string; text: string }> = {
    trips: {
      title: "My trips",
      text: "All your trips in one place. Open a trip to plan its days.",
    },
    discover: {
      title: "Discover places",
      text: "Find places near your starting point and add them to your trip.",
    },
    itinerary: {
      title: "Itinerary",
      text: activeTrip
        ? `Plan each day of ${activeTrip.title}.`
        : "Plan each day of your trip.",
    },
    budget: {
      title: "Budget",
      text: "Track your expenses against your total budget.",
    },
    map: {
      title: "Route map",
      text: "See the road route between your stops.",
    },
    notifications: {
      title: "Reminders",
      text: "Alerts and reminders for your upcoming trips.",
    },
  };

  // Use the visitor's GPS position or a searched map location as the trip's starting point.
  // Spreading keeps any other fields your LocationPoint type has.
  const handleUseCurrentLocation = (
    latitude: number,
    longitude: number,
    name = "My current location"
  ) => {
    setStartLocation({
      ...startLocation,
      name,
      latitude,
      longitude,
    });
  };

  // My trips shows the current-location map here. Discover has its own distance
  // map further down, so it asks for the card without a map (one map per page).
  const renderStartLocationCard = (showMap: boolean) => (
    <div className={`${CARD} p-6`}>
      <SectionTitle icon={<Navigation className="w-5 h-5" />}>
        Your starting location
      </SectionTitle>
      <LocationSelector
        currentLocation={startLocation}
        onLocationChange={setStartLocation}
      />

      {showMap && (
        <div className="mt-6 pt-6 border-t border-[#e3e6ea]">
          <CurrentLocationMap
            startLocation={startLocation}
            onUseAsStart={handleUseCurrentLocation}
          />
        </div>
      )}
    </div>
  );

  const TRIP_GRID =
    "lg:grid-cols-[minmax(0,1fr)_60px_120px_120px_100px_260px]";

  return (
    <div className="tp-root min-h-screen bg-[#f5f6f7] text-[#16181d]">
      <style>{GLOBAL_CSS}</style>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-10">
        {/* ───────────── Sidebar ───────────── */}
        <aside className="flex flex-col gap-6 mb-8 lg:mb-0 lg:sticky lg:top-6 lg:self-start">
          <div className="order-1">
            <h1 className="text-2xl font-bold tracking-tight">Trip Planner</h1>
            <button
              onClick={() => setShowWizard(true)}
              className={`${BTN_PRIMARY} w-full mt-4`}
            >
              <Plus className="w-5 h-5" />
              New Trip
            </button>
          </div>

          {/* Current trip, always visible */}
          <div className={`${CARD} p-5 order-3 lg:order-2`}>
            <p className="text-sm text-[#5b616b] mb-3">Current trip</p>
            {activeTrip ? (
              <>
                {userTrips.length > 1 ? (
                  <select
                    value={activeTrip.id}
                    onChange={(e) => {
                      const next = userTrips.find((t) => t.id === e.target.value);
                      if (next) setActiveTrip(next);
                    }}
                    className="w-full border border-[#d3d7dd] rounded-lg px-3 py-2.5 text-base font-bold bg-white text-[#16181d] mb-4"
                    aria-label="Choose current trip"
                  >
                    {userTrips.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-base font-bold mb-4 break-words">{activeTrip.title}</p>
                )}

                <div className="grid grid-cols-2 gap-x-3 gap-y-3 pb-4 border-b border-[#e3e6ea]">
                  <MiniStat icon={<Calendar className="w-4 h-4" />}>
                    {activeTrip.duration_days} days
                  </MiniStat>
                  <MiniStat icon={<Users className="w-4 h-4" />}>
                    {activeTrip.traveler_count}
                  </MiniStat>
                  <MiniStat icon={<MapPin className="w-4 h-4" />}>
                    {activeTrip.destinations?.length ?? 0} stops
                  </MiniStat>
                  <MiniStat icon={<Wallet className="w-4 h-4" />}>
                    {activeTrip.budget_currency} {activeTrip.total_budget.toLocaleString()}
                  </MiniStat>
                </div>

                <div className="pt-4 flex items-center justify-between gap-3">
                  {statusBadge(activeTrip.status)}
                  <button
                    type="button"
                    onClick={() => setEditingTrip(activeTrip)}
                    className="inline-flex items-center gap-2 text-sm font-bold text-[#16181d] hover:text-[#a77a2f] transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit trip
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-[#5b616b]">
                No trip selected. Create one or open a trip from My trips.
              </p>
            )}
          </div>

          {/* Navigation */}
          <nav
            aria-label="Trip planner sections"
            className="order-2 lg:order-3 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible lg:gap-6"
          >
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="flex lg:block gap-1 shrink-0 lg:shrink">
                <p className="hidden lg:block text-sm font-bold text-[#5b616b] px-4 mb-2">
                  {group.label}
                </p>
                <div className="flex lg:flex-col gap-1">
                  {group.items.map((item) => {
                    const active = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        aria-current={active ? "page" : undefined}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm whitespace-nowrap text-left transition-colors ${
                          active
                            ? "bg-white border border-[#e3e6ea] font-bold text-[#16181d] shadow-[inset_4px_0_0_#a77a2f]"
                            : "border border-transparent font-medium text-[#5b616b] hover:bg-white hover:text-[#16181d]"
                        }`}
                      >
                        <span className={active ? "text-[#a77a2f]" : ""}>{item.icon}</span>
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* ───────────── Main content ───────────── */}
        <main className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">{pageMeta[activeTab].title}</h2>
              <p className="text-base text-[#5b616b] mt-2 max-w-2xl">
                {pageMeta[activeTab].text}
              </p>
            </div>
            {saving && (
              <span className="text-sm text-[#5b616b] flex items-center gap-2 pt-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> Saving…
              </span>
            )}
          </div>

          {error && (
            <div className="mb-6 flex items-center justify-between bg-white border border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm">
              <span className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                {error}
              </span>
              <button onClick={() => setError(null)} aria-label="Dismiss error" className="p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* ── MY TRIPS ── */}
          {activeTab === "trips" && (
            <div className="space-y-8">
              {renderStartLocationCard(true)}

              {loading ? (
                <div className="flex justify-center py-16">
                  <div className={SPINNER} />
                </div>
              ) : userTrips.length === 0 ? (
                <EmptyState
                  icon={<MapPin className="w-14 h-14" />}
                  title="No trips yet"
                  text="Pick destinations, see road distances between them and set a budget. Your first trip takes a minute."
                >
                  <button onClick={() => setShowWizard(true)} className={BTN_PRIMARY}>
                    <Plus className="w-5 h-5" />
                    Create your first trip
                  </button>
                </EmptyState>
              ) : (
                <section>
                  <SectionTitle icon={<Calendar className="w-5 h-5" />}>
                    {userTrips.length} trip{userTrips.length !== 1 ? "s" : ""}
                  </SectionTitle>

                  {/* Column headings (desktop) */}
                  <div
                    className={`hidden lg:grid ${TRIP_GRID} gap-4 px-6 pb-3 text-sm font-bold text-[#5b616b]`}
                  >
                    <span>Trip</span>
                    <span>Stops</span>
                    <span>Budget</span>
                    <span>Progress</span>
                    <span>Status</span>
                    <span className="text-right">Actions</span>
                  </div>

                  <div className="space-y-3">
                    {userTrips.map((trip) => {
                      const total = trip.destinations?.length ?? 0;
                      const visited = visitedCount(trip);
                      const isActive = activeTrip?.id === trip.id;
                      return (
                        <div
                          key={trip.id}
                          onClick={() => openTrip(trip)}
                          className={`${CARD} border-l-4 ${
                            isActive ? "border-l-[#a77a2f]" : "border-l-[#e3e6ea]"
                          } px-6 py-5 cursor-pointer hover:border-[#c4c9d0] hover:border-l-[#a77a2f] transition-colors grid grid-cols-2 gap-4 ${TRIP_GRID} lg:items-center`}
                        >
                          {/* Trip */}
                          <div className="col-span-2 lg:col-span-1 min-w-0">
                            <h3 className="text-base font-bold truncate">{trip.title}</h3>
                            <p className="text-sm text-[#5b616b] mt-1 truncate">
                              From {trip.start_location_name}
                            </p>
                            <p className="text-sm text-[#5b616b] mt-0.5">
                              {trip.duration_days} day{trip.duration_days !== 1 ? "s" : ""},{" "}
                              {trip.traveler_count} traveller
                              {trip.traveler_count !== 1 ? "s" : ""}
                            </p>
                          </div>

                          {/* Stops */}
                          <div className="text-base font-bold">
                            <span className="lg:hidden text-sm font-normal text-[#5b616b]">
                              Stops:{" "}
                            </span>
                            {total}
                          </div>

                          {/* Budget */}
                          <div className="text-base font-bold">
                            <span className="lg:hidden text-sm font-normal text-[#5b616b]">
                              Budget:{" "}
                            </span>
                            {trip.budget_currency} {trip.total_budget.toLocaleString()}
                          </div>

                          {/* Progress */}
                          <div className="col-span-2 lg:col-span-1">
                            {total > 0 ? (
                              <>
                                <div className="h-1.5 bg-[#e9ebee] rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[#a77a2f] rounded-full transition-all"
                                    style={{ width: `${(visited / total) * 100}%` }}
                                  />
                                </div>
                                <p className="text-sm text-[#5b616b] mt-2">
                                  {visited} of {total} visited
                                </p>
                              </>
                            ) : (
                              <p className="text-sm text-[#5b616b]">No stops yet</p>
                            )}
                          </div>

                          {/* Status */}
                          <div>{statusBadge(trip.status)}</div>

                          {/* Actions */}
                          <div
                            className="col-span-2 lg:col-span-1 flex items-center gap-1 lg:justify-end"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              title="Edit trip"
                              aria-label="Edit trip"
                              onClick={() => setEditingTrip(trip)}
                              className={ICON_BTN}
                            >
                              <Pencil className="w-5 h-5" />
                            </button>
                            <button
                              title="Open itinerary"
                              aria-label="Open itinerary"
                              onClick={() => openTrip(trip)}
                              className={ICON_BTN}
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              title="Duplicate trip"
                              aria-label="Duplicate trip"
                              onClick={() => handleDuplicateTrip(trip)}
                              className={ICON_BTN}
                            >
                              <Copy className="w-5 h-5" />
                            </button>
                            <button
                              title="Share trip"
                              aria-label="Share trip"
                              onClick={() => {
                                setActiveTrip(trip);
                                setShowShareModal(true);
                              }}
                              className={ICON_BTN}
                            >
                              <Share2 className="w-5 h-5" />
                            </button>
                            <button
                              title="Print itinerary"
                              aria-label="Print itinerary"
                              onClick={() => {
                                setActiveTrip(trip);
                                window.print();
                              }}
                              className={ICON_BTN}
                            >
                              <Printer className="w-5 h-5" />
                            </button>
                            <button
                              title="Delete trip"
                              aria-label="Delete trip"
                              onClick={() => setShowDeleteConfirm(trip.id)}
                              className="p-2.5 text-[#5b616b] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* ── DISCOVER ── */}
          {activeTab === "discover" && (
            <div className="space-y-6">
              {renderStartLocationCard(false)}

              {!activeTrip && (
                <div className="bg-white border border-[#e3e6ea] border-l-4 border-l-[#a77a2f] rounded-xl px-6 py-5 flex items-center gap-3 text-base">
                  <AlertTriangle className="w-6 h-6 text-[#a77a2f] shrink-0" />
                  <span>
                    Select or create a trip to add destinations to it.{" "}
                    <button
                      onClick={() => setShowWizard(true)}
                      className="underline font-bold"
                    >
                      Create a trip
                    </button>
                  </span>
                </div>
              )}

              {placesLoading ? (
                <div className="flex justify-center py-16">
                  <div className={SPINNER} />
                </div>
              ) : (
                <NearbyPlacesDiscovery
                  places={allPlaces}
                  categoryNames={placeCategoryNames}
                  startLocation={startLocation}
                  tripPlaceIds={activeTripDestIds}
                  onAddPlace={handleAddPlace}
                  onRemovePlace={handleRemovePlace}
                  onStartLocationChange={setStartLocation}
                />
              )}
            </div>
          )}

          {/* ── ITINERARY ── */}
          {activeTab === "itinerary" && (
            <div className="space-y-6">
              {!activeTrip ? (
                <EmptyState
                  icon={<Route className="w-14 h-14" />}
                  title="No trip selected"
                  text="Choose a trip from My trips, or create a new one, to plan its days."
                >
                  <button onClick={() => setActiveTab("trips")} className={BTN_SECONDARY}>
                    <ChevronRight className="w-5 h-5" />
                    View trips
                  </button>
                  <button onClick={() => setShowWizard(true)} className={BTN_PRIMARY}>
                    <Plus className="w-5 h-5" />
                    New trip
                  </button>
                </EmptyState>
              ) : (
                <>
                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatTile
                      icon={<Calendar className="w-4 h-4" />}
                      label="Duration"
                      value={`${activeTrip.duration_days} day${activeTrip.duration_days !== 1 ? "s" : ""}`}
                    />
                    <StatTile
                      icon={<MapPin className="w-4 h-4" />}
                      label="Stops"
                      value={activeTrip.destinations?.length ?? 0}
                    />
                    <StatTile
                      icon={<Route className="w-4 h-4" />}
                      label="Distance"
                      value={
                        routeLoading
                          ? "Routing…"
                          : routePlan
                          ? `${routePlan.totalDistanceKm.toFixed(1)} km`
                          : "-"
                      }
                    />
                    <StatTile
                      icon={<Clock className="w-4 h-4" />}
                      label="Driving time"
                      value={
                        routeLoading
                          ? "Routing…"
                          : routePlan
                          ? formatDuration(routePlan.totalDurationMinutes)
                          : "-"
                      }
                    />
                  </div>

                  <ItineraryDayView
                    key={activeTrip.id}
                    destinations={activeTrip.destinations ?? []}
                    allAvailablePlaces={allPlaces}
                    durationDays={
                      Number.isFinite(activeTrip.duration_days)
                        ? Math.max(1, Math.floor(activeTrip.duration_days))
                        : 1
                    }
                    onUpdateDestinations={(destinations) =>
                      updateTrip({ ...activeTrip, destinations })
                    }
                    onAddDestination={handleAddDestinationFromItinerary}
                    onMarkVisited={handleMarkVisited}
                  />

                  <div className={`${CARD} p-5 flex flex-wrap gap-3`}>
                    <button onClick={() => setActiveTab("discover")} className={BTN_PRIMARY}>
                      <Plus className="w-5 h-5" />
                      Add destinations
                    </button>
                    <button onClick={() => setActiveTab("map")} className={BTN_SECONDARY}>
                      <MapIcon className="w-5 h-5" />
                      View map
                    </button>
                    <button onClick={() => setActiveTab("budget")} className={BTN_SECONDARY}>
                      <Wallet className="w-5 h-5" />
                      Budget
                    </button>
                    <button onClick={() => setShowShareModal(true)} className={BTN_SECONDARY}>
                      <Share2 className="w-5 h-5" />
                      Share
                    </button>
                    <button onClick={() => window.print()} className={BTN_SECONDARY}>
                      <Printer className="w-5 h-5" />
                      Print PDF
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── BUDGET ── */}
          {activeTab === "budget" && (
            <div>
              {!activeTrip ? (
                <EmptyState
                  icon={<Wallet className="w-14 h-14" />}
                  title="No trip selected"
                  text="Choose a trip to calculate and manage its expenses."
                >
                  <button onClick={() => setActiveTab("trips")} className={BTN_SECONDARY}>
                    <ChevronRight className="w-5 h-5" />
                    Go to trips
                  </button>
                </EmptyState>
              ) : (
                <BudgetCalculator
                  expenses={activeTripExpenses}
                  totalBudget={activeTrip.total_budget}
                  currency={activeTrip.budget_currency}
                  onUpdateExpenses={handleUpdateExpenses}
                  onUpdateTotalBudget={handleUpdateTotalBudget}
                />
              )}
            </div>
          )}

          {/* ── MAP ── */}
          {activeTab === "map" && (
            <div className="space-y-6">
              {!activeTrip ? (
                <EmptyState
                  icon={<MapIcon className="w-14 h-14" />}
                  title="No trip selected"
                  text="Choose a trip to see its route on the map."
                >
                  <button onClick={() => setActiveTab("trips")} className={BTN_SECONDARY}>
                    <ChevronRight className="w-5 h-5" />
                    Go to trips
                  </button>
                </EmptyState>
              ) : (
                <>
                  {routePlan && (
                    <>
                      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                        <StatTile
                          icon={<Route className="w-4 h-4" />}
                          label="Total distance"
                          value={`${routePlan.totalDistanceKm.toFixed(1)} km`}
                        />
                        <StatTile
                          icon={<Clock className="w-4 h-4" />}
                          label="Driving time"
                          value={formatDuration(routePlan.totalDurationMinutes)}
                        />
                        <StatTile
                          icon={<MapPin className="w-4 h-4" />}
                          label="Stops"
                          value={tripDestinationPlaces.length}
                        />
                      </div>
                      <p className="text-sm text-[#5b616b]">
                        {routePlan.isOsrm
                          ? "Distances and times come from OSRM road routing."
                          : "Road routing is unavailable, so these are straight-line estimates."}
                      </p>
                    </>
                  )}

                  {tripDestinationPlaces.length === 0 ? (
                    <EmptyState
                      icon={<MapPin className="w-14 h-14" />}
                      title="No destinations yet"
                      text="Add places to this trip and the route will appear here."
                    >
                      <button onClick={() => setActiveTab("discover")} className={BTN_PRIMARY}>
                        <Plus className="w-5 h-5" />
                        Discover places
                      </button>
                    </EmptyState>
                  ) : (
                    <div
                      className="rounded-xl overflow-hidden border border-[#e3e6ea]"
                      style={{ height: "560px" }}
                    >
                      <TripMap
                        startLocation={startLocation}
                        destinations={tripDestinationPlaces}
                        routePlan={routePlan}
                        height="560px"
                        interactive={true}
                      />
                    </div>
                  )}

                  {routePlan && routePlan.legs.length > 0 && (
                    <section className={`${CARD} p-6`}>
                      <SectionTitle icon={<Route className="w-5 h-5" />}>Route legs</SectionTitle>
                      <div>
                        {routePlan.legs.map((leg, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between gap-4 py-4 border-b border-[#e3e6ea] last:border-0 text-base"
                          >
                            <span className="flex items-center gap-3 min-w-0">
                              <span className="w-8 h-8 rounded-full bg-[#f1f2f4] text-sm flex items-center justify-center font-bold shrink-0">
                                {i + 1}
                              </span>
                              <span className="truncate">{leg.fromName}</span>
                              <ChevronRight className="w-5 h-5 text-[#a77a2f] shrink-0" />
                              <span className="truncate">{leg.toName}</span>
                            </span>
                            <span className="text-sm text-[#5b616b] shrink-0">
                              {leg.distanceKm.toFixed(1)} km, {Math.round(leg.durationMinutes)} min
                            </span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activeTab === "notifications" && <NotificationCenter userTrips={userTrips} />}
        </main>
      </div>

      {/* ── MODALS ── */}
      {showWizard && (
        <TripWizardModal
          isOpen={showWizard}
          onClose={() => setShowWizard(false)}
          availablePlaces={allPlaces}
          onTripCreated={handleTripCreated}
        />
      )}

      {editingTrip && (
        <TripEditModal
          key={editingTrip.id}
          trip={editingTrip}
          saving={saving}
          onClose={() => setEditingTrip(null)}
          onSave={saveTripEdits}
        />
      )}

      {showShareModal && activeTrip && (
        <TripShareModal
          trip={activeTrip}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          onUpdateTrip={(updated) => updateTrip(updated)}
        />
      )}

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-trip-title"
        >
          <div className="bg-white rounded-xl border border-[#e3e6ea] shadow-xl max-w-md w-full p-7">
            <h3 id="delete-trip-title" className="text-xl font-bold mb-3">
              Delete this trip?
            </h3>
            <p className="text-base text-[#5b616b] mb-7">
              The trip, its itinerary stops and its budget will be permanently deleted. This
              can&apos;t be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className={`${BTN_SECONDARY} flex-1`}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTrip(showDeleteConfirm)}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"
              >
                Delete trip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable PDF view */}
      {activeTrip && <TripPrintView trip={activeTrip} />}
    </div>
  );
}
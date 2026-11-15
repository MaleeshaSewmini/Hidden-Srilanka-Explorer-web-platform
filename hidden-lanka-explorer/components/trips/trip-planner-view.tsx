"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
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
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  X,
  RefreshCw,
  Eye,
} from "lucide-react";

// TripMap uses Leaflet which requires browser window (ssr: false)
const TripMap = dynamic(() => import("@/components/trips/trip-map"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[#f6f1e8] rounded-xl border border-[#c99a43]/20">
      <div className="text-center space-y-2">
        <div className="animate-spin w-8 h-8 border-2 border-[#123b26] border-t-transparent rounded-full mx-auto" />
        <p className="text-sm text-[#123b26]/60">Loading interactive map…</p>
      </div>
    </div>
  ),
});

type DashboardTab = "trips" | "discover" | "itinerary" | "budget" | "map" | "notifications";

export default function TripPlannerView() {
  // ─────────────────────────── State ───────────────────────────
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DashboardTab>("trips");
  const [allPlaces, setAllPlaces] = useState<PlaceRecord[]>([]);
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
  const [error, setError] = useState<string | null>(null);
  const routeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─────────────────────────── Check authentication ───────────────────────────
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data, error: authErr }) => {
      if (!authErr && data?.user) {
        setCurrentUser(data.user);
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setCurrentUser(session.user);
        } else {
          setCurrentUser(null);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // ─────────────────────────── Load places from Supabase (matching website) ───────────────────────────
  useEffect(() => {
    const supabase = createClient();
    async function fetchCatalogPlaces() {
      try {
        // Query places with status in approved or published, just like app/places/page.tsx
        const { data, error: err } = await supabase
          .from("places")
          .select("*")
          .in("status", ["approved", "published"])
          .order("name");

        if (!err && data && data.length > 0) {
          const formatted: PlaceRecord[] = (data as Record<string, unknown>[]).map((p) => ({
            id: String(p.id),
            name: String(p.name || "Unnamed Place"),
            slug: String(p.slug || p.id),
            district: String(p.district || "Sri Lanka"),
            nearest_town: String(p.nearest_town || p.district || ""),
            category_id: p.category_id ? String(p.category_id) : null,
            category_name: String(p.category || p.category_name || "General"),
            short_description: String(p.short_description || (p.description ? String(p.description).substring(0, 160) : "")),
            description: p.description ? String(p.description) : "",
            hero_image_url: p.hero_image_url ? String(p.hero_image_url) : (p.image_url ? String(p.image_url) : "/images/hero/sigiriya.jpg"),
            image_url: p.image_url ? String(p.image_url) : (p.hero_image_url ? String(p.hero_image_url) : "/images/hero/sigiriya.jpg"),
            latitude: typeof p.latitude === "number" ? p.latitude : parseFloat(String(p.latitude)) || 7.8731,
            longitude: typeof p.longitude === "number" ? p.longitude : parseFloat(String(p.longitude)) || 80.7718,
            difficulty: p.difficulty ? String(p.difficulty) : "Moderate",
            best_season: p.best_season ? String(p.best_season) : (p.season ? String(p.season) : "Year-Round"),
            entrance_fee: p.entrance_fee ? String(p.entrance_fee) : null,
            hidden_tips: p.hidden_tips ? String(p.hidden_tips) : null,
            safety_tips: p.safety_tips ? String(p.safety_tips) : null,
            warnings: p.warnings ? String(p.warnings) : null,
            road_condition: p.road_condition ? String(p.road_condition) : null,
            activities: Array.isArray(p.activities) ? (p.activities as string[]) : [],
            rating_avg: typeof p.rating_avg === "number" ? p.rating_avg : 4.8,
            rating_count: typeof p.rating_count === "number" ? p.rating_count : 12,
            like_count: typeof p.like_count === "number" ? p.like_count : 0,
          }));
          setAllPlaces(formatted);
        } else {
          // Fallback if status filter returns 0
          const { data: allData } = await supabase.from("places").select("*").order("name");
          if (allData && allData.length > 0) {
            const formatted: PlaceRecord[] = (allData as Record<string, unknown>[]).map((p) => ({
              id: String(p.id),
              name: String(p.name || "Unnamed Place"),
              slug: String(p.slug || p.id),
              district: String(p.district || "Sri Lanka"),
              nearest_town: String(p.nearest_town || p.district || ""),
              category_id: p.category_id ? String(p.category_id) : null,
              category_name: String(p.category || p.category_name || "General"),
              short_description: String(p.short_description || (p.description ? String(p.description).substring(0, 160) : "")),
              description: p.description ? String(p.description) : "",
              hero_image_url: p.hero_image_url ? String(p.hero_image_url) : (p.image_url ? String(p.image_url) : "/images/hero/sigiriya.jpg"),
              image_url: p.image_url ? String(p.image_url) : (p.hero_image_url ? String(p.hero_image_url) : "/images/hero/sigiriya.jpg"),
              latitude: typeof p.latitude === "number" ? p.latitude : parseFloat(String(p.latitude)) || 7.8731,
              longitude: typeof p.longitude === "number" ? p.longitude : parseFloat(String(p.longitude)) || 80.7718,
              difficulty: p.difficulty ? String(p.difficulty) : "Moderate",
              best_season: p.best_season ? String(p.best_season) : (p.season ? String(p.season) : "Year-Round"),
              entrance_fee: p.entrance_fee ? String(p.entrance_fee) : null,
              hidden_tips: p.hidden_tips ? String(p.hidden_tips) : null,
              safety_tips: p.safety_tips ? String(p.safety_tips) : null,
              warnings: p.warnings ? String(p.warnings) : null,
              road_condition: p.road_condition ? String(p.road_condition) : null,
              activities: Array.isArray(p.activities) ? (p.activities as string[]) : [],
              rating_avg: typeof p.rating_avg === "number" ? p.rating_avg : 4.8,
              rating_count: typeof p.rating_count === "number" ? p.rating_count : 12,
              like_count: typeof p.like_count === "number" ? p.like_count : 0,
            }));
            setAllPlaces(formatted);
          }
        }
      } catch (e) {
        console.error("Failed to load places:", e);
      } finally {
        setPlacesLoading(false);
      }
    }

    void fetchCatalogPlaces();
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
  const updateTrip = useCallback(
    async (updated: Trip) => {
      setSaving(true);
      try {
        const saved = await saveTrip(updated);
        setActiveTrip(saved);
        setUserTrips((prev) =>
          prev.map((t) => (t.id === saved.id ? saved : t))
        );
      } catch (e) {
        console.error("Failed to save trip:", e);
        setError("Failed to save trip changes.");
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const handleTripCreated = useCallback(
    async (trip: Trip) => {
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
    },
    []
  );

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

  const handleDuplicateTrip = useCallback(
    async (trip: Trip) => {
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
    },
    []
  );

  // ─────────────────────────── Add / Remove destination ───────────────────────────
  const handleAddPlace = useCallback(
    async (place: PlaceRecord) => {
      let currentTrip = activeTrip;
      if (!currentTrip) {
        const newTrip: Trip = {
          id: `trip-${Date.now()}`,
          user_id: currentUser?.id || "anonymous",
          title: "My Sri Lanka Trip",
          description: "Trip created from Discover Places",
          start_location_name: startLocation.name,
          start_latitude: startLocation.latitude,
          start_longitude: startLocation.longitude,
          start_date: new Date().toISOString().split("T")[0],
          duration_days: 3,
          traveler_count: 2,
          transport_mode: "driving",
          total_budget: 150000,
          estimated_cost: 0,
          budget_currency: "LKR",
          status: "planning",
          is_public: false,
          destinations: [],
          expenses: [],
          preferences: {
            interests: [],
            preferred_districts: [],
            preferred_categories: [],
            pace: "moderate",
            accommodation_tier: "mid_range",
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        newTrip.expenses = generateDefaultTripExpenses(newTrip.id, {
          travelerCount: newTrip.traveler_count,
          durationDays: newTrip.duration_days,
          totalDistanceKm: 100,
          transportMode: "driving",
          accommodationTier: "mid_range",
          selectedPlaces: [],
        });
        currentTrip = newTrip;
        setUserTrips((prev) => [newTrip, ...prev]);
        setActiveTrip(newTrip);
        await saveTrip(newTrip);
      }

      if ((currentTrip.destinations ?? []).some((d) => d.place_id === place.id)) {
        return;
      }

      const dest: TripDestination = {
        id: `dest-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        trip_id: currentTrip.id,
        place_id: place.id,
        day_number: 1,
        order_index: currentTrip.destinations?.length ?? 0,
        visit_time_slot: "morning",
        is_visited: false,
        place,
      };

      const updated: Trip = {
        ...currentTrip,
        destinations: [...(currentTrip.destinations ?? []), dest],
      };
      await updateTrip(updated);
    },
    [activeTrip, startLocation, updateTrip]
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

      if (dest.is_visited && place) {
        const record: VisitedPlaceRecord = {
          place_id: dest.place_id,
          place_name: place.name,
          district: place.district,
          latitude: place.latitude,
          longitude: place.longitude,
          visited_at: new Date().toISOString(),
          trip_id: activeTrip.id,
          trip_title: activeTrip.title,
        };
        markPlaceAsVisited(record);
      }

      const updated: Trip = {
        ...activeTrip,
        destinations: (activeTrip.destinations ?? []).map((d) =>
          d.id === dest.id
            ? { ...d, is_visited: dest.is_visited, visited_at: dest.is_visited ? new Date().toISOString() : null }
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

  // ─────────────────────────── Status badge helper ───────────────────────────
  const statusBadge = (status: Trip["status"]) => {
    const styles: Record<Trip["status"], string> = {
      planning: "bg-blue-100 text-blue-700",
      ongoing: "bg-green-100 text-green-700",
      completed: "bg-gray-100 text-gray-600",
      cancelled: "bg-red-100 text-red-700",
    };
    return (
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${styles[status]}`}>
        {status}
      </span>
    );
  };

  // ─────────────────────────── Navigation tabs ───────────────────────────
  const tabs: { id: DashboardTab; label: string; icon: React.ReactNode }[] = [
    { id: "trips", label: "My Trips", icon: <Calendar className="w-4 h-4" /> },
    { id: "discover", label: "Discover Places", icon: <MapPin className="w-4 h-4" /> },
    { id: "itinerary", label: "Itinerary", icon: <Route className="w-4 h-4" /> },
    { id: "budget", label: "Budget Calculator", icon: <Wallet className="w-4 h-4" /> },
    { id: "map", label: "Interactive Route Map", icon: <Navigation className="w-4 h-4" /> },
    { id: "notifications", label: "Reminders & Alerts", icon: <Bell className="w-4 h-4" /> },
  ];

  // ─────────────────────────── Auth Protection ───────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f6f1e8] flex items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-[#c99a43]" />
          <p className="text-base font-bold text-[#123b26]">Loading Trip Planner…</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#f6f1e8] flex items-center justify-center px-4 py-16">
        <div className="bg-white rounded-2xl border border-[#c99a43]/30 shadow-md max-w-lg w-full p-8 sm:p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-[#f6f1e8] text-[#c99a43] flex items-center justify-center mx-auto mb-6 border border-[#c99a43]/40">
            <Navigation className="w-8 h-8 text-[#123b26]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#123b26]">
            Sign in to access Trip Planner
          </h2>
          <p className="mt-3 text-base text-[#123b26]/70 leading-relaxed">
            The personalized Trip Planner is available exclusively to signed-in explorers. Choose hidden gems across Sri Lanka, measure live distances from your location, plan day-by-day itineraries, and map your journeys.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/sign-in?redirect=/trips"
              className="inline-flex items-center justify-center bg-[#c99a43] hover:bg-[#b58735] text-[#0b2417] font-bold px-6 py-3 rounded-lg text-sm transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/sign-up?redirect=/trips"
              className="inline-flex items-center justify-center bg-white border border-[#c99a43]/60 hover:bg-[#f6f1e8] text-[#123b26] font-bold px-6 py-3 rounded-lg text-sm transition-colors"
            >
              Create an Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f1e8]">
      {/* Header */}
      <div className="bg-[#123b26] text-white px-4 sm:px-6 py-6 border-b border-[#c99a43]/30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#f6f1e8]">
              Personalized Trip Planner
            </h1>
            <p className="text-[#f1cf88] text-sm mt-1">
              Explore Hidden Sri Lanka with custom route planning, live distances, and budgets
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saving && (
              <span className="text-[#f1cf88] text-sm flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving…
              </span>
            )}
            <button
              onClick={() => setShowWizard(true)}
              className="flex items-center gap-2 bg-[#c99a43] hover:bg-[#f1cf88] text-[#0b2417] font-semibold px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Trip
            </button>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4">
          <div className="flex items-center justify-between bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </span>
            <button onClick={() => setError(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Tab navigation */}
        <div className="flex overflow-x-auto gap-1 bg-white rounded-xl p-1.5 shadow-sm border border-[#c99a43]/20 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                activeTab === tab.id
                  ? "bg-[#123b26] text-[#f6f1e8] shadow"
                  : "text-[#123b26]/70 hover:bg-[#f6f1e8] hover:text-[#123b26]"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── MY TRIPS TAB ── */}
        {activeTab === "trips" && (
          <div className="space-y-6">
            {/* Starting Location selector */}
            <div className="bg-white rounded-xl border border-[#c99a43]/20 shadow-sm p-5">
              <h2 className="text-base font-semibold text-[#123b26] mb-3 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-[#c99a43]" />
                Your Starting Location
              </h2>
              <LocationSelector
                currentLocation={startLocation}
                onLocationChange={setStartLocation}
              />
            </div>

            {/* User Trips */}
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin w-8 h-8 border-2 border-[#123b26] border-t-transparent rounded-full" />
              </div>
            ) : userTrips.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-[#c99a43]/20 shadow-sm">
                <MapPin className="w-14 h-14 text-[#c99a43]/40 mb-4" />
                <h3 className="text-lg font-semibold text-[#123b26] mb-2">No trips created yet</h3>
                <p className="text-[#123b26]/60 text-sm mb-6 max-w-sm">
                  Plan your adventure using real Sri Lanka destinations, automatic distance calculations, and custom budgets.
                </p>
                <button
                  onClick={() => setShowWizard(true)}
                  className="flex items-center gap-2 bg-[#123b26] text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#0b2417] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Your First Trip
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {userTrips.map((trip) => (
                  <div
                    key={trip.id}
                    onClick={() => { setActiveTrip(trip); setActiveTab("itinerary"); }}
                    className={`bg-white rounded-xl border shadow-sm p-5 cursor-pointer hover:shadow-md transition-all ${
                      activeTrip?.id === trip.id
                        ? "border-[#c99a43] ring-2 ring-[#c99a43]/30"
                        : "border-[#c99a43]/20 hover:border-[#c99a43]/50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#123b26] truncate pr-2">{trip.title}</h3>
                        <p className="text-xs text-[#123b26]/50 mt-0.5 truncate">{trip.start_location_name}</p>
                      </div>
                      {statusBadge(trip.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-[#123b26]/60 mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {trip.duration_days} day{trip.duration_days !== 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {trip.traveler_count} traveller{trip.traveler_count !== 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {trip.destinations?.length ?? 0} stops
                      </span>
                      <span className="flex items-center gap-1">
                        <Wallet className="w-3.5 h-3.5" />
                        {trip.budget_currency} {trip.total_budget.toLocaleString()}
                      </span>
                    </div>

                    {/* Visited progress */}
                    {(trip.destinations?.length ?? 0) > 0 && (
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-[#123b26]/50 mb-1">
                          <span>Progress</span>
                          <span>
                            {trip.destinations?.filter((d) => d.is_visited).length ?? 0} /{" "}
                            {trip.destinations?.length ?? 0} visited
                          </span>
                        </div>
                        <div className="h-1.5 bg-[#f6f1e8] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#c99a43] rounded-full transition-all"
                            style={{
                              width: `${
                                ((trip.destinations?.filter((d) => d.is_visited).length ?? 0) /
                                  (trip.destinations?.length ?? 1)) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div
                      className="flex gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        title="View itinerary"
                        onClick={() => { setActiveTrip(trip); setActiveTab("itinerary"); }}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-[#123b26] bg-[#f6f1e8] hover:bg-[#c99a43]/20 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      <button
                        title="Duplicate trip"
                        onClick={() => handleDuplicateTrip(trip)}
                        className="p-1.5 text-[#123b26]/60 hover:text-[#123b26] hover:bg-[#f6f1e8] rounded-lg transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Share trip"
                        onClick={() => { setActiveTrip(trip); setShowShareModal(true); }}
                        className="p-1.5 text-[#123b26]/60 hover:text-[#123b26] hover:bg-[#f6f1e8] rounded-lg transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Print itinerary"
                        onClick={() => { setActiveTrip(trip); window.print(); }}
                        className="p-1.5 text-[#123b26]/60 hover:text-[#123b26] hover:bg-[#f6f1e8] rounded-lg transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Delete trip"
                        onClick={() => setShowDeleteConfirm(trip.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add new trip card */}
                <button
                  onClick={() => setShowWizard(true)}
                  className="border-2 border-dashed border-[#c99a43]/30 rounded-xl p-5 flex flex-col items-center justify-center gap-3 text-[#123b26]/50 hover:border-[#c99a43] hover:text-[#123b26] hover:bg-[#c99a43]/5 transition-all min-h-[200px]"
                >
                  <Plus className="w-8 h-8" />
                  <span className="text-sm font-medium">Plan a new trip</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── DISCOVER TAB ── */}
        {activeTab === "discover" && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-[#c99a43]/20 shadow-sm p-5">
              <h2 className="text-base font-semibold text-[#123b26] mb-3 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-[#c99a43]" />
                Your Starting Location
              </h2>
              <LocationSelector
                currentLocation={startLocation}
                onLocationChange={setStartLocation}
              />
            </div>

            {!activeTrip && (
              <div className="bg-[#c99a43]/10 border border-[#c99a43]/30 rounded-xl px-5 py-4 flex items-center gap-3 text-sm text-[#123b26]">
                <AlertTriangle className="w-5 h-5 text-[#c99a43] shrink-0" />
                <span>
                  Select or create a trip first to add destinations to it.{" "}
                  <button
                    onClick={() => setShowWizard(true)}
                    className="underline font-semibold"
                  >
                    Create a trip
                  </button>
                </span>
              </div>
            )}

            {placesLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin w-8 h-8 border-2 border-[#123b26] border-t-transparent rounded-full" />
              </div>
            ) : (
              <NearbyPlacesDiscovery
                places={allPlaces}
                startLocation={startLocation}
                tripPlaceIds={activeTripDestIds}
                onAddPlace={handleAddPlace}
                onRemovePlace={handleRemovePlace}
              />
            )}
          </div>
        )}

        {/* ── ITINERARY TAB ── */}
        {activeTab === "itinerary" && (
          <div className="space-y-5">
            {!activeTrip ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-[#c99a43]/20 shadow-sm text-center">
                <Route className="w-12 h-12 text-[#c99a43]/40 mb-3" />
                <h3 className="text-base font-semibold text-[#123b26] mb-2">No trip selected</h3>
                <p className="text-sm text-[#123b26]/60 mb-5">
                  Select a trip from My Trips or create a new one to manage its daily itinerary.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setActiveTab("trips")}
                    className="flex items-center gap-2 border border-[#123b26] text-[#123b26] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#f6f1e8] transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                    View Trips
                  </button>
                  <button
                    onClick={() => setShowWizard(true)}
                    className="flex items-center gap-2 bg-[#123b26] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0b2417] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    New Trip
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Active trip summary bar */}
                <div className="bg-white rounded-xl border border-[#c99a43]/20 shadow-sm p-4 flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-[#123b26] truncate">{activeTrip.title}</h2>
                    <p className="text-xs text-[#123b26]/50 truncate">{activeTrip.start_location_name}</p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-[#123b26]/70">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {activeTrip.duration_days}d
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {activeTrip.traveler_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {activeTrip.destinations?.length ?? 0} stops
                    </span>
                    {routeLoading ? (
                      <span className="flex items-center gap-1 text-[#c99a43]">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Routing…
                      </span>
                    ) : routePlan ? (
                      <>
                        <span className="flex items-center gap-1">
                          <Route className="w-3.5 h-3.5" /> {routePlan.totalDistanceKm.toFixed(1)} km
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />{" "}
                          {Math.round(routePlan.totalDurationMinutes / 60)}h{" "}
                          {Math.round(routePlan.totalDurationMinutes % 60)}m
                        </span>
                      </>
                    ) : null}
                  </div>
                  {statusBadge(activeTrip.status)}
                </div>

                <ItineraryDayView
                  destinations={activeTrip.destinations ?? []}
                  allAvailablePlaces={allPlaces}
                  durationDays={activeTrip.duration_days}
                  onUpdateDestinations={(destinations) =>
                    updateTrip({ ...activeTrip, destinations })
                  }
                  onAddDestination={handleAddDestinationFromItinerary}
                  onMarkVisited={handleMarkVisited}
                />

                {/* Quick actions */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setActiveTab("discover")}
                    className="flex items-center gap-2 border border-[#123b26] text-[#123b26] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#f6f1e8] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Destinations
                  </button>
                  <button
                    onClick={() => setActiveTab("map")}
                    className="flex items-center gap-2 border border-[#c99a43] text-[#123b26] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#c99a43]/10 transition-colors"
                  >
                    <Navigation className="w-4 h-4" />
                    View Map
                  </button>
                  <button
                    onClick={() => setActiveTab("budget")}
                    className="flex items-center gap-2 border border-[#c99a43] text-[#123b26] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#c99a43]/10 transition-colors"
                  >
                    <Wallet className="w-4 h-4" />
                    Budget
                  </button>
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="flex items-center gap-2 border border-[#c99a43] text-[#123b26] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#c99a43]/10 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 border border-[#c99a43] text-[#123b26] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#c99a43]/10 transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    Print PDF
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── BUDGET TAB ── */}
        {activeTab === "budget" && (
          <div>
            {!activeTrip ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-[#c99a43]/20 shadow-sm text-center">
                <Wallet className="w-12 h-12 text-[#c99a43]/40 mb-3" />
                <h3 className="text-base font-semibold text-[#123b26] mb-2">No trip selected</h3>
                <p className="text-sm text-[#123b26]/60 mb-5">Select a trip to calculate and manage expenses.</p>
                <button
                  onClick={() => setActiveTab("trips")}
                  className="flex items-center gap-2 border border-[#123b26] text-[#123b26] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#f6f1e8] transition-colors"
                >
                  <ChevronRight className="w-4 h-4" /> Go to Trips
                </button>
              </div>
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

        {/* ── MAP TAB ── */}
        {activeTab === "map" && (
          <div className="space-y-4">
            {/* Route & Map Guidance Banner */}
            <div className="bg-white rounded-xl border border-[#c99a43]/20 shadow-sm p-4 flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5 text-[#123b26]">
                  <Navigation className="w-4 h-4 text-[#c99a43]" />
                  Start: <strong>{startLocation.name}</strong>
                </span>

                {routePlan && routePlan.totalDistanceKm > 0 ? (
                  <>
                    <span className="flex items-center gap-1.5 text-[#123b26]">
                      <Route className="w-4 h-4 text-[#c99a43]" />
                      <strong>{routePlan.totalDistanceKm.toFixed(1)} km</strong> total distance
                    </span>
                    <span className="flex items-center gap-1.5 text-[#123b26]">
                      <Clock className="w-4 h-4 text-[#c99a43]" />
                      <strong>{Math.round(routePlan.totalDurationMinutes / 60)}h {Math.round(routePlan.totalDurationMinutes % 60)}m</strong> driving
                    </span>
                    <span className="flex items-center gap-1.5 text-[#123b26]">
                      <MapPin className="w-4 h-4 text-[#c99a43]" />
                      <strong>{tripDestinationPlaces.length}</strong> stop{tripDestinationPlaces.length !== 1 ? "s" : ""}
                    </span>
                    {routePlan.isOsrm ? (
                      <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> OSRM Road Route
                      </span>
                    ) : (
                      <span className="text-xs text-[#123b26]/70 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                        <Navigation className="w-3.5 h-3.5" /> Haversine Route
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-[#123b26]/70">
                    Showing your starting hub and {allPlaces.length} destinations across Sri Lanka.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("discover")}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#123b26] bg-[#f6f1e8] hover:bg-[#c99a43]/20 px-3 py-1.5 rounded-lg border border-[#c99a43]/40 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Stops from Discover
                </button>
              </div>
            </div>

            {/* Always Render Map Container */}
            <div className="rounded-2xl overflow-hidden border border-[#c99a43]/30 shadow-md bg-white" style={{ height: "560px" }}>
              <TripMap
                startLocation={startLocation}
                destinations={tripDestinationPlaces}
                allPlaces={allPlaces}
                routePlan={routePlan}
                height="560px"
                interactive={true}
                onAddPlace={handleAddPlace}
              />
            </div>

            {tripDestinationPlaces.length === 0 && (
              <div className="bg-white/80 border border-[#c99a43]/30 rounded-xl p-4 flex items-center justify-between gap-3 text-xs text-[#123b26]">
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#c99a43] shrink-0" />
                  Tip: Click any golden marker on the map to add destinations directly to your active itinerary, or switch to Discover tab to filter by radius.
                </span>
                <button
                  onClick={() => setActiveTab("discover")}
                  className="font-bold underline text-[#123b26] shrink-0"
                >
                  Discover Places
                </button>
              </div>
            )}

            {/* Turn-by-turn route breakdown */}
                {routePlan && routePlan.legs.length > 0 && (
                  <div className="bg-white rounded-xl border border-[#c99a43]/20 shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-[#123b26] mb-3">Turn-by-Turn Leg Breakdown</h3>
                    <div className="space-y-2">
                      {routePlan.legs.map((leg, i) => (
                        <div key={i} className="flex items-center justify-between text-sm text-[#123b26]/80 py-2 border-b border-[#f6f1e8] last:border-0">
                          <span className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#123b26] text-white text-xs flex items-center justify-center font-bold shrink-0">
                              {i + 1}
                            </span>
                            <span className="truncate max-w-[200px]">{leg.fromName}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-[#c99a43] shrink-0" />
                            <span className="truncate max-w-[200px]">{leg.toName}</span>
                          </span>
                          <span className="text-[#123b26]/50 text-xs shrink-0 ml-3">
                            {leg.distanceKm.toFixed(1)} km · {Math.round(leg.durationMinutes)} min
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
          </div>
        )}

        {/* ── NOTIFICATIONS TAB ── */}
        {activeTab === "notifications" && (
          <NotificationCenter userTrips={userTrips} />
        )}
      </div>

      {/* ── MODALS ── */}

      {/* Trip Creation Wizard */}
      {showWizard && (
        <TripWizardModal
          isOpen={showWizard}
          onClose={() => setShowWizard(false)}
          availablePlaces={allPlaces}
          onTripCreated={handleTripCreated}
        />
      )}

      {/* Share / Collaboration Modal */}
      {showShareModal && activeTrip && (
        <TripShareModal
          trip={activeTrip}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          onUpdateTrip={(updated) => updateTrip(updated)}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="font-semibold text-[#123b26]">Delete Trip?</h3>
            </div>
            <p className="text-sm text-[#123b26]/70 mb-6">
              This will permanently delete this trip, itinerary stops, and budget data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 border border-gray-200 text-[#123b26] py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTrip(showDeleteConfirm)}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                Delete
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




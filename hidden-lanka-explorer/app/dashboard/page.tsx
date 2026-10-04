"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  CheckCircle2,
  Clock3,
  ImageIcon,
  MapPinned,
  ShieldCheck,
  Star,
  XCircle,
} from "lucide-react";

type PlaceRecord = {
  id: string;
  name?: string | null;
  slug?: string | null;
  district?: string | null;
  category?: string | null;
  category_id?: string | null;
  nearest_town?: string | null;
  address?: string | null;
  short_description?: string | null;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  difficulty?: string | null;
  best_season?: string | null;
  best_time?: string | null;
  visit_duration?: string | null;
  entrance_fee?: string | null;
  opening_hours?: string | null;
  distance_from_colombo?: number | null;
  accessibility?: string | null;
  transport?: string | null;
  road_condition?: string | null;
  activities?: string[] | string | null;
  safety_level?: string | null;
  safety_tips?: string | null;
  warnings?: string | null;
  hero_image_url?: string | null;
  hidden_tips?: string | null;
  status?: string | null;
  created_at?: string | null;
  created_by?: string | null;
  is_verified?: boolean | null;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

const statusMeta: Record<string, { label: string; badge: string; dot: string }> = {
  pending: {
    label: "Pending review",
    badge: "bg-amber-100 text-amber-800 border border-amber-200",
    dot: "bg-amber-500",
  },
  approved: {
    label: "Approved",
    badge: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    dot: "bg-emerald-500",
  },
  published: {
    label: "Approved",
    badge: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "Rejected",
    badge: "bg-rose-100 text-rose-800 border border-rose-200",
    dot: "bg-rose-500",
  },
};

function getPlaceStatus(place: PlaceRecord) {
  const status = (place.status ?? "pending").toLowerCase();
  return statusMeta[status] ?? statusMeta.pending;
}

function formatDate(date?: string | null) {
  if (!date) return "Not available";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Not available";

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatList(value: unknown) {
  if (!value) return "Not added";

  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "Not added";
  }

  if (typeof value === "string") {
    return value.trim() || "Not added";
  }

  return String(value);
}

export default function AdminDashboardPage() {
  const [places, setPlaces] = useState<PlaceRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    void loadPlaces();
  }, []);

  const stats = useMemo(() => {
    const total = places.length;
    const pending = places.filter((place) => (place.status ?? "pending").toLowerCase() === "pending").length;
    const approved = places.filter((place) => {
      const status = (place.status ?? "pending").toLowerCase();
      return status === "approved" || status === "published";
    }).length;

    return {
      total,
      pending,
      approved,
      rejected: places.filter((place) => (place.status ?? "pending").toLowerCase() === "rejected").length,
    };
  }, [places]);

  const selectedPlace =
    places.find((place) => place.id === selectedId) ?? places[0] ?? null;

  async function loadPlaces() {
    try {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("places")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setPlaces(data ?? []);
      if ((data ?? []).length > 0 && !selectedId) {
        setSelectedId(data[0].id);
      }
    } catch (error) {
      console.error("LOAD_PLACES_ERROR", error);
      setErrorMessage("Unable to load places from Supabase. Check the table and RLS policy.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(placeId: string, nextStatus: "approved" | "rejected") {
    try {
      setUpdating(placeId);
      setErrorMessage("");

      const { error } = await supabase
        .from("places")
        .update({
          status: nextStatus,
          is_verified: nextStatus === "approved",
        })
        .eq("id", placeId);

      if (error) {
        throw error;
      }

      await loadPlaces();
    } catch (error) {
      console.error("UPDATE_PLACE_STATUS_ERROR", error);
      setErrorMessage("The status update failed. Please verify the table permissions and fields.");
    } finally {
      setUpdating(null);
    }
  }

  const statsCards = [
    {
      label: "Total places",
      value: stats.total,
      color: "bg-[#0b2417] text-white",
      icon: <MapPinned className="h-5 w-5" />,
    },
    {
      label: "Pending review",
      value: stats.pending,
      color: "bg-amber-100 text-amber-900",
      icon: <Clock3 className="h-5 w-5" />,
    },
    {
      label: "Approved",
      value: stats.approved,
      color: "bg-emerald-100 text-emerald-900",
      icon: <CheckCircle2 className="h-5 w-5" />,
    },
    {
      label: "Rejected",
      value: stats.rejected,
      color: "bg-rose-100 text-rose-900",
      icon: <XCircle className="h-5 w-5" />,
    },
  ];

  return (
    <main className="min-h-screen bg-[#f6f1e8] px-4 py-8 md:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#718078]">
              Moderation board
            </p>
            <h2 className="mt-2 text-3xl font-black text-[#0b2417] md:text-4xl">
              Place review dashboard
            </h2>
          </div>

          <button
            type="button"
            onClick={() => void loadPlaces()}
            className="inline-flex items-center justify-center rounded-full border border-[#0b2417] bg-white px-4 py-2 text-sm font-semibold text-[#0b2417] shadow-sm transition hover:bg-[#0b2417] hover:text-white"
          >
            Refresh data
          </button>
        </div>

        {errorMessage ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statsCards.map((card) => (
            <div key={card.label} className={`rounded-3xl p-5 shadow-sm ${card.color}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium opacity-80">{card.label}</span>
                <span className="rounded-full bg-white/20 p-2">{card.icon}</span>
              </div>

              <div className="mt-5 text-4xl font-black tracking-tight">{card.value}</div>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[420px,minmax(0,1fr)]">
          <aside className="rounded-[28px] border border-[#d9d0bf] bg-white p-4 shadow-[0_12px_30px_rgba(11,36,23,0.06)]">
            <div className="mb-4 flex items-center justify-between px-1">
              <h3 className="text-lg font-bold text-[#0b2417]">Submitted places</h3>
              <span className="rounded-full bg-[#f1e7d6] px-2.5 py-1 text-xs font-semibold text-[#123b26]">
                {places.length} items
              </span>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="rounded-2xl border border-dashed border-[#cdbfa5] bg-[#faf7f0] p-6 text-center text-sm text-[#718078]">
                  Loading places...
                </div>
              ) : places.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#cdbfa5] bg-[#faf7f0] p-6 text-center text-sm text-[#718078]">
                  No place submissions found yet.
                </div>
              ) : (
                places.map((place) => {
                  const meta = getPlaceStatus(place);
                  const isSelected = selectedPlace?.id === place.id;

                  return (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => setSelectedId(place.id)}
                      className={`w-full rounded-3xl border p-3 text-left transition ${
                        isSelected
                          ? "border-[#0b2417] bg-[#f5f0e5] shadow-sm"
                          : "border-[#eae1d3] bg-[#faf7f0] hover:border-[#cdbfa5]"
                      }`}
                    >
                      <div className="mb-3 overflow-hidden rounded-2xl">
                        {place.hero_image_url ? (
                          <img
                            src={place.hero_image_url}
                            alt={place.name ?? "Place image"}
                            className="h-28 w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-28 items-center justify-center bg-gradient-to-br from-[#dfe9e2] to-[#efe4d3] text-[#123b26]">
                            <ImageIcon className="h-8 w-8" />
                          </div>
                        )}
                      </div>

                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-base font-bold text-[#0b2417] line-clamp-2">
                            {place.name ?? "Untitled place"}
                          </h4>
                          <p className="mt-1 text-sm text-[#718078]">
                            {place.district ?? "Unknown district"}
                          </p>
                        </div>

                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.badge}`}>
                          <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                      </div>

                      <p className="mt-3 text-sm text-[#4c5d52] line-clamp-3">
                        {place.short_description || place.description || "No summary provided yet."}
                      </p>

                      <div className="mt-3 flex items-center justify-between text-xs text-[#718078]">
                        <span>Submitted: {formatDate(place.created_at)}</span>
                        <span>{place.is_verified ? "Verified" : "Unverified"}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <div className="rounded-[28px] border border-[#d9d0bf] bg-white p-5 shadow-[0_12px_30px_rgba(11,36,23,0.06)]">
            {selectedPlace ? (
              <>
                <div className="overflow-hidden rounded-[24px] border border-[#e7decf] bg-[#f9f6f1]">
                  {selectedPlace.hero_image_url ? (
                    <img
                      src={selectedPlace.hero_image_url}
                      alt={selectedPlace.name ?? "Selected place"}
                      className="h-72 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-72 items-center justify-center bg-gradient-to-br from-[#dfe9e2] to-[#f2e6d0] text-[#123b26]">
                      <div className="text-center">
                        <ImageIcon className="mx-auto h-10 w-10" />
                        <p className="mt-3 text-sm font-medium">No image attached</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#718078]">
                      {selectedPlace.district ?? "Unknown district"}
                    </p>
                    <h3 className="mt-2 text-3xl font-black text-[#0b2417]">
                      {selectedPlace.name ?? "Unnamed place"}
                    </h3>
                  </div>

                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${getPlaceStatus(selectedPlace).badge}`}>
                    <span className={`h-2.5 w-2.5 rounded-full ${getPlaceStatus(selectedPlace).dot}`} />
                    {getPlaceStatus(selectedPlace).label}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl bg-[#f6f1e8] p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#718078]">Category</p>
                    <p className="mt-2 font-semibold text-[#0b2417]">{selectedPlace.category ?? "Not set"}</p>
                  </div>
                  <div className="rounded-2xl bg-[#f6f1e8] p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#718078]">Town</p>
                    <p className="mt-2 font-semibold text-[#0b2417]">{selectedPlace.nearest_town ?? "Not set"}</p>
                  </div>
                  <div className="rounded-2xl bg-[#f6f1e8] p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#718078]">Difficulty</p>
                    <p className="mt-2 font-semibold text-[#0b2417]">{selectedPlace.difficulty ?? "Not set"}</p>
                  </div>
                  <div className="rounded-2xl bg-[#f6f1e8] p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#718078]">Submitted</p>
                    <p className="mt-2 font-semibold text-[#0b2417]">{formatDate(selectedPlace.created_at)}</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-5 lg:grid-cols-2">
                  <div className="rounded-3xl border border-[#eae1d3] bg-[#faf7f0] p-4">
                    <div className="mb-3 flex items-center gap-2 text-[#123b26]">
                      <ShieldCheck className="h-4 w-4" />
                      <h4 className="font-bold">Overview</h4>
                    </div>
                    <p className="text-sm leading-7 text-[#31433b]">
                      {selectedPlace.description || selectedPlace.short_description || "No description yet."}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-[#eae1d3] bg-[#faf7f0] p-4">
                    <div className="mb-3 flex items-center gap-2 text-[#123b26]">
                      <Star className="h-4 w-4" />
                      <h4 className="font-bold">Highlights</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-[#31433b]">
                      <li><strong>Best season:</strong> {selectedPlace.best_season || "Not set"}</li>
                      <li><strong>Best time:</strong> {selectedPlace.best_time || "Not set"}</li>
                      <li><strong>Visit duration:</strong> {selectedPlace.visit_duration || "Not set"}</li>
                      <li><strong>Entrance fee:</strong> {selectedPlace.entrance_fee || "Not set"}</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-[#eae1d3] bg-[#faf7f0] p-4">
                  <div className="mb-3 flex items-center gap-2 text-[#123b26]">
                    <MapPinned className="h-4 w-4" />
                    <h4 className="font-bold">Location details</h4>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl bg-white p-3 text-sm text-[#31433b]">
                      <span className="block text-xs uppercase tracking-[0.18em] text-[#718078]">Address</span>
                      <span className="mt-2 block font-medium">{selectedPlace.address || "Not provided"}</span>
                    </div>
                    <div className="rounded-2xl bg-white p-3 text-sm text-[#31433b]">
                      <span className="block text-xs uppercase tracking-[0.18em] text-[#718078]">Coordinates</span>
                      <span className="mt-2 block font-medium">
                        {selectedPlace.latitude ?? "-"}, {selectedPlace.longitude ?? "-"}
                      </span>
                    </div>
                    <div className="rounded-2xl bg-white p-3 text-sm text-[#31433b]">
                      <span className="block text-xs uppercase tracking-[0.18em] text-[#718078]">Transport</span>
                      <span className="mt-2 block font-medium">{formatList(selectedPlace.transport)}</span>
                    </div>
                    <div className="rounded-2xl bg-white p-3 text-sm text-[#31433b]">
                      <span className="block text-xs uppercase tracking-[0.18em] text-[#718078]">Road condition</span>
                      <span className="mt-2 block font-medium">{selectedPlace.road_condition || "Not set"}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-5 lg:grid-cols-2">
                  <div className="rounded-3xl border border-[#eae1d3] bg-[#faf7f0] p-4">
                    <h4 className="font-bold text-[#0b2417]">Activities</h4>
                    <p className="mt-3 text-sm text-[#31433b]">{formatList(selectedPlace.activities)}</p>
                  </div>
                  <div className="rounded-3xl border border-[#eae1d3] bg-[#faf7f0] p-4">
                    <h4 className="font-bold text-[#0b2417]">Safety</h4>
                    <p className="mt-3 text-sm text-[#31433b]">
                      <strong>Level:</strong> {selectedPlace.safety_level || "Not set"}<br />
                      <strong>Tips:</strong> {selectedPlace.safety_tips || "Not added"}<br />
                      <strong>Warnings:</strong> {selectedPlace.warnings || "Not added"}
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-[#eae1d3] bg-[#faf7f0] p-4">
                  <h4 className="font-bold text-[#0b2417]">Additional notes</h4>
                  <p className="mt-3 text-sm text-[#31433b]">
                    <strong>Hidden tips:</strong> {selectedPlace.hidden_tips || "Not added"}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={updating === selectedPlace.id || (selectedPlace.status ?? "pending").toLowerCase() === "approved" || (selectedPlace.status ?? "pending").toLowerCase() === "published"}
                    onClick={() => void handleStatusUpdate(selectedPlace.id, "approved")}
                    className="inline-flex items-center gap-2 rounded-full bg-[#0b2417] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#123b26] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {updating === selectedPlace.id ? "Updating..." : "Approve"}
                  </button>

                  <button
                    type="button"
                    disabled={updating === selectedPlace.id || (selectedPlace.status ?? "pending").toLowerCase() === "rejected"}
                    onClick={() => void handleStatusUpdate(selectedPlace.id, "rejected")}
                    className="inline-flex items-center gap-2 rounded-full border border-rose-300 bg-rose-50 px-5 py-2.5 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              </>
            ) : (
              <div className="flex h-full min-h-[400px] items-center justify-center rounded-3xl border border-dashed border-[#cdbfa5] bg-[#faf7f0] p-8 text-center text-[#718078]">
                Select a place to review its details.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

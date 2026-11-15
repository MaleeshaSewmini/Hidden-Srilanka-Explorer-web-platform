"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CheckCircle2,
  Pencil,
  ImageIcon,
  MapPinned,
  Save,
  ShieldCheck,
  Star,
  X,
  XCircle,
  Mail,
  MailOpen,
  Trash2,
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

type PlaceEditForm = {
  name: string;
  slug: string;
  district: string;
  category_id: string;
  nearest_town: string;
  address: string;
  short_description: string;
  description: string;
  latitude: string;
  longitude: string;
  difficulty: string;
  best_season: string;
  best_time: string;
  visit_duration: string;
  entrance_fee: string;
  opening_hours: string;
  distance_from_colombo: string;
  accessibility: string;
  transport: string;
  road_condition: string;
  activities: string;
  safety_level: string;
  safety_tips: string;
  warnings: string;
  hero_image_url: string;
  hidden_tips: string;
};

type FilterTab = "all" | "pending" | "approved" | "rejected";

type MessageRecord = {
  id: string;
  user_id?: string | null;
  name?: string | null;
  email?: string | null;
  subject?: string | null;
  message?: string | null;
  is_read?: boolean | null;
  created_at?: string | null;
};

type MessageFilter = "all" | "unread" | "read";

const supabase = createClient();

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

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;

  if (error && typeof error === "object" && "message" in error) {
    const message = error.message;
    if (typeof message === "string") return message;
  }

  return "An unexpected error occurred.";
}

export default function AdminDashboardPage() {
  const [places, setPlaces] = useState<PlaceRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<PlaceEditForm | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // UI-only state (table filters + review modal)
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);

  // Messages + view state
  const [view, setView] = useState<"places" | "messages">("places");
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [messagesError, setMessagesError] = useState("");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [messageFilter, setMessageFilter] = useState<MessageFilter>("all");

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

  const filteredPlaces = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return places.filter((place) => {
      const status = (place.status ?? "pending").toLowerCase();

      const matchesTab =
        activeTab === "all" ||
        (activeTab === "pending" && status === "pending") ||
        (activeTab === "approved" && (status === "approved" || status === "published")) ||
        (activeTab === "rejected" && status === "rejected");

      const matchesSearch =
        !term ||
        (place.name ?? "").toLowerCase().includes(term) ||
        (place.district ?? "").toLowerCase().includes(term);

      return matchesTab && matchesSearch;
    });
  }, [places, activeTab, searchTerm]);

  const analytics = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return {
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleDateString("en-GB", { month: "short" }),
        count: 0,
      };
    });
    const districtMap = new Map<string, number>();
    let verified = 0;

    places.forEach((place) => {
      if (place.created_at) {
        const d = new Date(place.created_at);
        if (!Number.isNaN(d.getTime())) {
          const month = months.find((m) => m.key === `${d.getFullYear()}-${d.getMonth()}`);
          if (month) month.count += 1;
        }
      }

      const district = place.district?.trim() || "Unknown";
      districtMap.set(district, (districtMap.get(district) ?? 0) + 1);
      if (place.is_verified) verified += 1;
    });

    const districts = [...districtMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const reviewed = stats.approved + stats.rejected;

    return {
      months,
      districts,
      verified,
      approvalRate: reviewed ? Math.round((stats.approved / reviewed) * 100) : 0,
    };
  }, [places, stats]);

  const selectedPlace =
    places.find((place) => place.id === selectedId) ?? places[0] ?? null;

  const loadPlaces = useCallback(async () => {
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

      const sortedPlaces = [...(data ?? [])].sort((a, b) => {
        const aPending = (a.status ?? "pending").toLowerCase() === "pending";
        const bPending = (b.status ?? "pending").toLowerCase() === "pending";

        if (aPending !== bPending) {
          return aPending ? -1 : 1;
        }

        return (
          new Date(b.created_at ?? 0).getTime() -
          new Date(a.created_at ?? 0).getTime()
        );
      });

      setPlaces(sortedPlaces);
      setSelectedId((currentId) =>
        currentId && sortedPlaces.some((place) => place.id === currentId)
          ? currentId
          : sortedPlaces[0]?.id ?? null
      );
    } catch (error) {
      console.error("LOAD_PLACES_ERROR", error);
      setErrorMessage(
        `Unable to load place submissions: ${getErrorMessage(error)}`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async () => {
    try {
      setMessagesLoading(true);
      setMessagesError("");

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rows = (data ?? []) as MessageRecord[];
      setMessages(rows);
      setSelectedMessageId((currentId) =>
        currentId && rows.some((m) => m.id === currentId) ? currentId : rows[0]?.id ?? null,
      );
    } catch (error) {
      console.error("LOAD_MESSAGES_ERROR", error);
      setMessagesError(`Unable to load messages: ${getErrorMessage(error)}`);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (!session) {
        if (event === "INITIAL_SESSION" || event === "SIGNED_OUT") {
          setPlaces([]);
          setSelectedId(null);
          setErrorMessage("Sign in with an account that can review place submissions.");
          setLoading(false);
        }
        return;
      }

      void loadPlaces();
      void loadMessages();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadPlaces, loadMessages]);

  async function handleStatusUpdate(placeId: string, nextStatus: "approved" | "rejected") {
    try {
      setUpdating(placeId);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("places")
        .update({
          status: nextStatus,
          is_verified: nextStatus === "approved",
        })
        .eq("id", placeId)
        .select("id")
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error("No place was updated. Check that you have review access.");
      }

      await loadPlaces();
    } catch (error) {
      console.error("UPDATE_PLACE_STATUS_ERROR", error);
      setErrorMessage("The status update failed. Please verify the table permissions and fields.");
    } finally {
      setUpdating(null);
    }
  }

  function startEditing(place: PlaceRecord) {
    setEditDraft({
      name: place.name ?? "",
      slug: place.slug ?? "",
      district: place.district ?? "",
      category_id: place.category_id ?? "",
      nearest_town: place.nearest_town ?? "",
      address: place.address ?? "",
      short_description: place.short_description ?? "",
      description: place.description ?? "",
      latitude: place.latitude?.toString() ?? "",
      longitude: place.longitude?.toString() ?? "",
      difficulty: place.difficulty ?? "",
      best_season: place.best_season ?? "",
      best_time: place.best_time ?? "",
      visit_duration: place.visit_duration ?? "",
      entrance_fee: place.entrance_fee ?? "",
      opening_hours: place.opening_hours ?? "",
      distance_from_colombo: place.distance_from_colombo?.toString() ?? "",
      accessibility: place.accessibility ?? "",
      transport: place.transport ?? "",
      road_condition: place.road_condition ?? "",
      activities: Array.isArray(place.activities)
        ? place.activities.join(", ")
        : place.activities ?? "",
      safety_level: place.safety_level ?? "",
      safety_tips: place.safety_tips ?? "",
      warnings: place.warnings ?? "",
      hero_image_url: place.hero_image_url ?? "",
      hidden_tips: place.hidden_tips ?? "",
    });
    setErrorMessage("");
  }

  async function handlePlaceEditSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPlace || !editDraft) return;

    const requiredFields: Array<keyof PlaceEditForm> = [
      "name",
      "slug",
      "district",
      "category_id",
      "description",
    ];
    if (requiredFields.some((field) => !editDraft[field].trim())) {
      setErrorMessage("Place name, slug, district, category, and full description are required.");
      return;
    }

    const toNullableNumber = (value: string) =>
      value.trim() ? Number(value) : null;
    const latitude = toNullableNumber(editDraft.latitude);
    const longitude = toNullableNumber(editDraft.longitude);
    const distanceFromColombo = toNullableNumber(editDraft.distance_from_colombo);

    if (
      [latitude, longitude, distanceFromColombo].some(
        (value) => value !== null && !Number.isFinite(value),
      )
    ) {
      setErrorMessage("Latitude, longitude, and distance must be valid numbers.");
      return;
    }

    try {
      setSavingEdit(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("places")
        .update({
          name: editDraft.name.trim(),
          slug: editDraft.slug.trim() || null,
          district: editDraft.district.trim() || null,
          category_id: editDraft.category_id.trim() || null,
          nearest_town: editDraft.nearest_town.trim() || null,
          address: editDraft.address.trim() || null,
          short_description: editDraft.short_description.trim() || null,
          description: editDraft.description.trim() || null,
          latitude,
          longitude,
          difficulty: editDraft.difficulty.trim() || null,
          best_season: editDraft.best_season.trim() || null,
          best_time: editDraft.best_time.trim() || null,
          visit_duration: editDraft.visit_duration.trim() || null,
          entrance_fee: editDraft.entrance_fee.trim() || null,
          opening_hours: editDraft.opening_hours.trim() || null,
          distance_from_colombo: distanceFromColombo,
          accessibility: editDraft.accessibility.trim() || null,
          transport: editDraft.transport.trim() || null,
          road_condition: editDraft.road_condition.trim() || null,
          activities: editDraft.activities
            .split(",")
            .map((activity) => activity.trim())
            .filter(Boolean),
          safety_level: editDraft.safety_level.trim() || null,
          safety_tips: editDraft.safety_tips.trim() || null,
          warnings: editDraft.warnings.trim() || null,
          hero_image_url: editDraft.hero_image_url.trim() || null,
          hidden_tips: editDraft.hidden_tips.trim() || null,
        })
        .eq("id", selectedPlace.id)
        .select("id")
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error(
          "No place was updated. Check that you are signed in with an account allowed to edit places and that the place still exists.",
        );
      }

      setEditDraft(null);
      await loadPlaces();
    } catch (error) {
      const message = getErrorMessage(error);
      console.error("UPDATE_PLACE_ERROR", message);
      setErrorMessage(`Unable to save place changes: ${message}`);
    } finally {
      setSavingEdit(false);
    }
  }

  async function setMessageRead(messageId: string, isRead: boolean) {
    // optimistic update, reverted by reload on failure
    setMessages((current) =>
      current.map((m) => (m.id === messageId ? { ...m, is_read: isRead } : m)),
    );

    try {
      const { data, error } = await supabase
        .from("messages")
        .update({ is_read: isRead })
        .eq("id", messageId)
        .select("id")
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("No message was updated. Check that you have admin access.");
    } catch (error) {
      console.error("UPDATE_MESSAGE_ERROR", error);
      setMessagesError(`Unable to update message: ${getErrorMessage(error)}`);
      await loadMessages();
    }
  }

  async function deleteMessage(messageId: string) {
    if (!window.confirm("Delete this message? This cannot be undone.")) return;

    try {
      setMessagesError("");

      const { data, error } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageId)
        .select("id")
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("No message was deleted. Check that you have admin access.");

      await loadMessages();
    } catch (error) {
      console.error("DELETE_MESSAGE_ERROR", error);
      setMessagesError(`Unable to delete message: ${getErrorMessage(error)}`);
    }
  }

  function openReview(place: PlaceRecord) {
    setSelectedId(place.id);
    setEditDraft(null);
    setDetailOpen(true);
  }

  function closeReview() {
    setDetailOpen(false);
    setEditDraft(null);
  }

  function renderEditField(
    label: string,
    field: keyof PlaceEditForm,
    options: { multiline?: boolean; numeric?: boolean } = {},
  ) {
    if (!editDraft) return null;

    const className =
      "mt-1.5 w-full rounded-lg border border-[#dfe5e0] bg-white px-3 py-2 text-sm text-[#1b3a2c] focus:border-[#1e5a41] focus:outline-none focus:ring-2 focus:ring-[#1e5a41]/10";
    const value = editDraft[field];
    const onChange = (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => setEditDraft({ ...editDraft, [field]: event.target.value });

    return (
      <label key={field} className="block text-sm font-semibold text-[#31433b]">
        {label}
        {options.multiline ? (
          <textarea
            rows={3}
            required={field === "description"}
            value={value}
            onChange={onChange}
            className={className}
          />
        ) : (
          <input
            type={options.numeric ? "number" : "text"}
            step={options.numeric ? "any" : undefined}
            required={
              field === "name" ||
              field === "slug" ||
              field === "category_id" ||
              field === "district"
            }
            value={value}
            onChange={onChange}
            className={className}
          />
        )}
      </label>
    );
  }

  const statsCards = [
    {
      label: "Total places",
      value: stats.total,
      note: "All submissions",
      card: "bg-[#1e5a41] text-white",
      noteColor: "text-white/80",
    },
    {
      label: "Pending review",
      value: stats.pending,
      note: stats.pending === 0 ? "You're all caught up" : "Awaiting review",
      card: "bg-[#fbf3de] text-[#7a5a12]",
      noteColor: "text-[#8a6d2b]",
    },
    {
      label: "Approved",
      value: stats.approved,
      note: "Published places",
      card: "bg-[#e3eee7] text-[#1e5a41]",
      noteColor: "text-[#4d6f5e]",
    },
    {
      label: "Rejected",
      value: stats.rejected,
      note: "Not approved",
      card: "bg-[#f9e8e4] text-[#a8452f]",
      noteColor: "text-[#a0675b]",
    },
  ];

  const donutCircumference = 2 * Math.PI * 40;
  let donutOffset = 0;
  const donutSegments = [
    { label: "Approved", value: stats.approved, color: "#071ea3" },
    { label: "Pending", value: stats.pending, color: "#e0b44c" },
    { label: "Rejected", value: stats.rejected, color: "#c9604f" },
  ].map((segment) => {
    const length = stats.total ? (segment.value / stats.total) * donutCircumference : 0;
    const result = { ...segment, length, offset: donutOffset };
    donutOffset += length;
    return result;
  });
  const maxMonth = Math.max(1, ...analytics.months.map((m) => m.count));
  const maxDistrict = Math.max(1, ...analytics.districts.map((d) => d.count));

  const unreadCount = messages.filter((m) => !m.is_read).length;
  const visibleMessages = messages.filter((m) =>
    messageFilter === "all" ? true : messageFilter === "unread" ? !m.is_read : !!m.is_read,
  );
  const selectedMessage = messages.find((m) => m.id === selectedMessageId) ?? null;

  const tabs: Array<{ key: FilterTab; label: string }> = [
    { key: "all", label: "All places" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  const tabSummary: Record<FilterTab, string> = {
    all: "All submissions",
    pending: "Awaiting review",
    approved: "Published places",
    rejected: "Not approved",
  };

  function renderTableStatus(place: PlaceRecord) {
    const status = (place.status ?? "pending").toLowerCase();
    const style =
      status === "approved" || status === "published"
        ? "bg-[#e3eee7] text-[#1e5a41]"
        : status === "rejected"
          ? "bg-[#fbe4e2] text-[#b4443c]"
          : "bg-[#fbf3de] text-[#8a6d2b]";

    return (
      <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-medium ${style}`}>
        {getPlaceStatus(place).label}
      </span>
    );
  }

  return (
    <main className="min-h-screen bg-white px-4 py-8 md:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[15px] font-semibold uppercase tracking-[0.2em] text-[#4d6f5e]">
              Moderation
            </p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight text-[#14382a] md:text-4xl">
              Place review dashboard
            </h2>
            <p className="mt-2 text-[18px] text-[black]">
              Review community submissions and keep every discovery trustworthy.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              void loadPlaces();
              void loadMessages();
            }}
            className="inline-flex items-center justify-center rounded-lg bg-[#1e5a41] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#174a35]"
          >
            Refresh data
          </button>
        </div>

        {errorMessage ? (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        {/* View switcher */}
        <div className="mb-5 flex items-center gap-1 border-b border-[#e6ebe7]">
          {[
            { key: "places" as const, label: "Places" },
            { key: "messages" as const, label: "Messages" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setView(item.key)}
              className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                view === item.key
                  ? "border-[#1e5a41] text-[#1e5a41]"
                  : "border-transparent text-[#6b7a72] hover:text-[#14382a]"
              }`}
            >
              {item.label}
              {item.key === "messages" && unreadCount > 0 ? (
                <span className="rounded-full bg-[#c9604f] px-1.5 py-0.5 text-[15px] font-semibold leading-none text-white">
                  {unreadCount}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {view === "places" ? (
          <>
        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((card) => (
            <div key={card.label} className={`rounded-2xl px-5 py-4 ${card.card}`}>
              <span className="text-lg font-medium opacity-100">{card.label}</span>
              <div className="mt-3 flex items-end gap-3">
                <span className="text-4xl font-semibold leading-none">{card.value}</span>
                <span className={`pb-0.5 font-size:18px; ${card.noteColor}`}>{card.note}</span>
              </div>
            </div>
          ))}
        </section>

        {/* Analytics */}
        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-[#e6ebe7] bg-white p-5">
            <h3 className="text-base font-semibold text-[#14382a]">Submissions per month</h3>
            <p className="mt-0.5 text-sm text-[black]">Last 6 months</p>
            <div className="mt-5 flex h-36 items-end gap-3">
              {analytics.months.map((month) => (
                <div key={month.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                  <span className="text-[11px] font-medium text-[#14382a]">{month.count}</span>
                  <div
                    className="w-full rounded-t-md bg-[#1e5a41]"
                    style={{ height: `${Math.max(month.count ? 6 : 2, (month.count / maxMonth) * 100)}%`, opacity: month.count ? 1 : 0.2 }}
                  />
                  <span className="text-[10px] text-[#6b7a72]">{month.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#e6ebe7] bg-white p-5">
            <h3 className="text-base font-semibold text-[#14382a]">Status breakdown</h3>
            <p className="mt-0.5 text-base text-[black]">Approval rate {analytics.approvalRate}% of reviewed</p>
            <div className="mt-4 flex items-center gap-5">
              <div className="relative h-32 w-32 shrink-0">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#eef3ef" strokeWidth="12" />
                  {donutSegments.map((segment) =>
                    segment.length > 0 ? (
                      <circle
                        key={segment.label}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={segment.color}
                        strokeWidth="12"
                        strokeDasharray={`${segment.length} ${donutCircumference - segment.length}`}
                        strokeDashoffset={-segment.offset}
                      />
                    ) : null,
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-semibold text-[#14382a]">{stats.total}</span>
                  <span className="text-[10px] text-[#6b7a72]">places</span>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-[#31433b]">
                {donutSegments.map((segment) => (
                  <li key={segment.label} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
                    {segment.label}
                    <span className="font-semibold">{segment.value}</span>
                  </li>
                ))}
                <li className="flex items-center gap-2 pt-1 text-[#6b7a72]">
                  Verified <span className="font-semibold text-[#31433b]">{analytics.verified}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-[#e6ebe7] bg-white p-5">
            <h3 className="text-base font-semibold text-[#14382a]">Top districts</h3>
            <p className="mt-0.5 font-size:19px; text-[black]">Places by district</p>
            <div className="mt-5 space-y-3">
              {analytics.districts.length === 0 ? (
                <p className="text-base text-[#6b7a72]">No data yet.</p>
              ) : (
                analytics.districts.map((district) => (
                  <div key={district.name}>
                    <div className="mb-1 flex justify-between text-base text-[#31433b]">
                      <span>{district.name}</span>
                      <span className="font-semibold">{district.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#eef3ef]">
                      <div
                        className="h-2 rounded-full bg-[#1e5a41]"
                        style={{ width: `${(district.count / maxDistrict) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Table card */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-[#e6ebe7] bg-white shadow-[0_1px_3px_rgba(20,56,42,0.06)]">
          <div className="flex flex-col gap-3 px-6 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-[#14382a]">Submitted places</h3>
              <span className="rounded-full bg-[#e3eee7] px-2.5 py-0.5 text-[11px] font-medium text-[#1e5a41]">
                {places.length} places
              </span>
            </div>

            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by place or district..."
              className="w-full rounded-lg border border-[#e1e7e3] bg-[#f6f8f6] px-3 py-2 text-xs text-[#14382a] placeholder:text-[#8a978f] focus:border-[#1e5a41] focus:outline-none focus:ring-2 focus:ring-[#1e5a41]/10 sm:w-64"
            />
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <div className="flex flex-wrap items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                    activeTab === tab.key
                      ? "bg-[#1e5a41] text-white"
                      : "text-[#4a5a52] hover:bg-[#eef3ef]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <span className="hidden text-base text-[black] sm:block">{tabSummary[activeTab]}</span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="bg-[#eef3ef] text-[15px] font-semibold uppercase tracking-[0.14em] text-[black]">
                  <th className="px-6 py-3">Place</th>
                  <th className="px-3 py-3">District</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Verification</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-base text-[#6b7a72]">
                      Loading places...
                    </td>
                  </tr>
                ) : filteredPlaces.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-base text-[#6b7a72]">
                      {places.length === 0
                        ? "No place submissions found yet."
                        : "No places match your filters."}
                    </td>
                  </tr>
                ) : (
                  filteredPlaces.map((place, index) => (
                    <tr
                      key={place.id}
                      className={`border-b border-[#eef1ee] transition hover:bg-[#f6f9f7] ${
                        index % 2 === 1 ? "bg-[#fafbfa]" : "bg-white"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <span className="w-5 text-[16px] text-[#9aa69f]">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="text-base font-medium text-[black]">
                            {place.name ?? "Untitled place"}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-base text-[black]">
                        {place.district ?? "Unknown district"}
                      </td>
                      <td className="px-3 py-4">{renderTableStatus(place)}</td>
                      <td
                        className={`px-3 py-4 text-base ${
                          place.is_verified ? "text-[#5a6a62]" : "text-[black]"
                        }`}
                      >
                        {place.is_verified ? "Verified" : "Unverified"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openReview(place)}
                          className="rounded-md bg-[#e3eee7] px-4 py-1.5 text-base font-medium text-[black] transition hover:bg-[black] hover:text-white"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-6 py-4 text-base text-[black]">
            <span>
              Showing {filteredPlaces.length} of {places.length} places
            </span>
            <span>Page 1 of 1</span>
          </div>
        </section>

          </>
        ) : (
          <section className="overflow-hidden rounded-2xl border border-[#e6ebe7] bg-white shadow-[0_1px_3px_rgba(20,56,42,0.06)]">
            <div className="flex flex-col gap-3 px-6 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-[#14382a]">Messages from users</h3>
                <span className="rounded-full bg-[#e3eee7] px-2.5 py-0.5 text-[11px] font-medium text-[#1e5a41]">
                  {unreadCount} unread
                </span>
              </div>

              <div className="flex items-center gap-1">
                {(["all", "unread", "read"] as MessageFilter[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMessageFilter(key)}
                    className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize transition ${
                      messageFilter === key
                        ? "bg-[#1e5a41] text-white"
                        : "text-[#4a5a52] hover:bg-[#eef3ef]"
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>

            {messagesError ? (
              <div className="mx-6 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {messagesError}
              </div>
            ) : null}

            <div className="mt-4 grid border-t border-[#eef1ee] lg:grid-cols-[340px,minmax(0,1fr)]">
              <div className="max-h-[560px] overflow-y-auto border-b border-[#eef1ee] lg:border-b-0 lg:border-r">
                {messagesLoading ? (
                  <p className="px-6 py-10 text-center text-sm text-[#6b7a72]">Loading messages...</p>
                ) : visibleMessages.length === 0 ? (
                  <p className="px-6 py-10 text-center text-sm text-[#6b7a72]">
                    {messages.length === 0 ? "No messages yet." : "No messages match this filter."}
                  </p>
                ) : (
                  visibleMessages.map((message) => {
                    const isSelected = selectedMessage?.id === message.id;

                    return (
                      <button
                        key={message.id}
                        type="button"
                        onClick={() => {
                          setSelectedMessageId(message.id);
                          if (!message.is_read) void setMessageRead(message.id, true);
                        }}
                        className={`block w-full border-b border-[#eef1ee] px-5 py-4 text-left transition ${
                          isSelected ? "bg-[#eef3ef]" : "hover:bg-[#f6f9f7]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2 text-sm font-medium text-[#14382a]">
                            {!message.is_read ? (
                              <span className="h-2 w-2 rounded-full bg-[#c9604f]" />
                            ) : null}
                            {message.name || "Anonymous"}
                          </span>
                          <span className="text-[11px] text-[#9aa69f]">{formatDate(message.created_at)}</span>
                        </div>
                        <p className={`mt-1 truncate text-xs ${message.is_read ? "text-[#6b7a72]" : "font-semibold text-[#31433b]"}`}>
                          {message.subject || "No subject"}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-[#6b7a72]">{message.message}</p>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="min-h-[320px] p-6">
                {selectedMessage ? (
                  <>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h4 className="text-xl font-semibold text-[#14382a]">
                          {selectedMessage.subject || "No subject"}
                        </h4>
                        <p className="mt-1 text-sm text-[#5a6a62]">
                          {selectedMessage.name || "Anonymous"}
                          {selectedMessage.email ? ` <${selectedMessage.email}>` : ""}
                        </p>
                        <p className="mt-0.5 text-xs text-[#9aa69f]">{formatDate(selectedMessage.created_at)}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void setMessageRead(selectedMessage.id, !selectedMessage.is_read)}
                          className="inline-flex items-center gap-2 rounded-lg border border-[#dfe5e0] bg-white px-3 py-2 text-xs font-medium text-[#31433b] hover:bg-[#f2f5f3]"
                        >
                          {selectedMessage.is_read ? (
                            <Mail className="h-4 w-4" />
                          ) : (
                            <MailOpen className="h-4 w-4" />
                          )}
                          {selectedMessage.is_read ? "Mark unread" : "Mark read"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteMessage(selectedMessage.id)}
                          className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>

                    <p className="mt-6 whitespace-pre-line text-sm leading-7 text-[#31433b]">
                      {selectedMessage.message}
                    </p>

                    {selectedMessage.email ? (
                      <a
                        href={`mailto:${selectedMessage.email}?subject=${encodeURIComponent(
                          `Re: ${selectedMessage.subject ?? "Your message"}`,
                        )}`}
                        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#1e5a41] px-4 py-2 text-sm font-medium text-white hover:bg-[#174a35]"
                      >
                        <Mail className="h-4 w-4" />
                        Reply by email
                      </a>
                    ) : null}
                  </>
                ) : (
                  <div className="flex h-full min-h-[280px] items-center justify-center text-sm text-[#6b7a72]">
                    Select a message to read it.
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-8 flex flex-col gap-1 text-base text-[black] sm:flex-row sm:items-center sm:justify-between">
          <span>Hidden Lanka Explorer</span>
          <span>Community discoveries. Thoughtfully reviewed.</span>
        </footer>
      </div>

      {/* Review modal */}
      {detailOpen && selectedPlace ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-8"
          onClick={closeReview}
        >
          <div
            className="relative w-full max-w-5xl rounded-2xl bg-white p-5 shadow-2xl md:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={closeReview}
                className="inline-flex items-center gap-2 rounded-full border border-[#dfe5e0] bg-white px-3 py-2 text-sm font-semibold text-[#31433b] hover:bg-[#f2f5f3]"
              >
                <X className="h-4 w-4" />
                Close
              </button>

              <button
                type="button"
                onClick={() => startEditing(selectedPlace)}
                className="inline-flex items-center gap-2 rounded-full border border-[#1e5a41] bg-white px-4 py-2 text-sm font-semibold text-[#1e5a41] transition hover:bg-[#1e5a41] hover:text-white"
              >
                <Pencil className="h-4 w-4" />
                Edit place
              </button>
            </div>

            {errorMessage ? (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errorMessage}
              </div>
            ) : null}

            {editDraft && (
              <form
                onSubmit={(event) => void handlePlaceEditSubmit(event)}
                className="mb-6 space-y-6 rounded-2xl border border-[#e6ebe7] bg-[#f6f8f6] p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-[#14382a]">Edit place details</h3>
                    <p className="mt-1 text-sm text-[#6b7a72]">
                      Update the place information, travel details, and advisories.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditDraft(null)}
                      disabled={savingEdit}
                      className="inline-flex items-center gap-2 rounded-full border border-[#dfe5e0] bg-white px-4 py-2 text-sm font-semibold text-[#31433b] hover:bg-[#f2f5f3] disabled:opacity-60"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingEdit}
                      className="inline-flex items-center gap-2 rounded-full bg-[#1e5a41] px-4 py-2 text-sm font-semibold text-white hover:bg-[#174a35] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Save className="h-4 w-4" />
                      {savingEdit ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {renderEditField("Place name", "name")}
                  {renderEditField("Slug", "slug")}
                  {renderEditField("Category", "category_id")}
                  {renderEditField("District", "district")}
                  {renderEditField("Nearest town", "nearest_town")}
                  {renderEditField("Address", "address")}
                  {renderEditField("Latitude", "latitude", { numeric: true })}
                  {renderEditField("Longitude", "longitude", { numeric: true })}
                  {renderEditField("Difficulty", "difficulty")}
                  {renderEditField("Best season", "best_season")}
                  {renderEditField("Best time", "best_time")}
                  {renderEditField("Visit duration", "visit_duration")}
                  {renderEditField("Entrance fee", "entrance_fee")}
                  {renderEditField("Opening hours", "opening_hours")}
                  {renderEditField("Distance from Colombo (km)", "distance_from_colombo", {
                    numeric: true,
                  })}
                  {renderEditField("Accessibility", "accessibility")}
                  {renderEditField("Transport", "transport")}
                  {renderEditField("Road condition", "road_condition")}
                  {renderEditField("Activities (comma separated)", "activities")}
                  {renderEditField("Safety level", "safety_level")}
                  {renderEditField("Short description", "short_description", {
                    multiline: true,
                  })}
                  {renderEditField("Full description", "description", { multiline: true })}
                  {renderEditField("Safety tips", "safety_tips", { multiline: true })}
                  {renderEditField("Warnings", "warnings", { multiline: true })}
                  {renderEditField("Explorer insider tips", "hidden_tips", {
                    multiline: true,
                  })}
                  {renderEditField("Hero image URL", "hero_image_url")}
                </div>
              </form>
            )}

            <div className="overflow-hidden rounded-2xl border border-[#e6ebe7] bg-[#f6f8f6]">
              {selectedPlace.hero_image_url ? (
                <img
                  src={selectedPlace.hero_image_url}
                  alt={selectedPlace.name ?? "Selected place"}
                  className="h-72 w-full object-cover"
                />
              ) : (
                <div className="flex h-72 items-center justify-center bg-gradient-to-br from-[#e3eee7] to-[#f2f5f3] text-[#1e5a41]">
                  <div className="text-center">
                    <ImageIcon className="mx-auto h-10 w-10" />
                    <p className="mt-3 text-sm font-medium">No image attached</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6b7a72]">
                  {selectedPlace.district ?? "Unknown district"}
                </p>
                <h3 className="mt-2 text-3xl font-bold text-[#14382a]">
                  {selectedPlace.name ?? "Unnamed place"}
                </h3>
              </div>

              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${getPlaceStatus(selectedPlace).badge}`}>
                <span className={`h-2.5 w-2.5 rounded-full ${getPlaceStatus(selectedPlace).dot}`} />
                {getPlaceStatus(selectedPlace).label}
              </span>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl bg-[#f6f8f6] p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-[#6b7a72]">Category</p>
                <p className="mt-2 font-semibold text-[#14382a]">{selectedPlace.category_id ?? "Not set"}</p>
              </div>
              <div className="rounded-xl bg-[#f6f8f6] p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-[#6b7a72]">Town</p>
                <p className="mt-2 font-semibold text-[#14382a]">{selectedPlace.nearest_town ?? "Not set"}</p>
              </div>
              <div className="rounded-xl bg-[#f6f8f6] p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-[#6b7a72]">Difficulty</p>
                <p className="mt-2 font-semibold text-[#14382a]">{selectedPlace.difficulty ?? "Not set"}</p>
              </div>
              <div className="rounded-xl bg-[#f6f8f6] p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-[#6b7a72]">Submitted</p>
                <p className="mt-2 font-semibold text-[#14382a]">{formatDate(selectedPlace.created_at)}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <div className="rounded-2xl border border-[#e6ebe7] bg-white p-4">
                <div className="mb-3 flex items-center gap-2 text-[#1e5a41]">
                  <ShieldCheck className="h-4 w-4" />
                  <h4 className="font-bold">Overview</h4>
                </div>
                <p className="text-sm leading-7 text-[#31433b]">
                  {selectedPlace.description || selectedPlace.short_description || "No description yet."}
                </p>
              </div>

              <div className="rounded-2xl border border-[#e6ebe7] bg-white p-4">
                <div className="mb-3 flex items-center gap-2 text-[#1e5a41]">
                  <Star className="h-4 w-4" />
                  <h4 className="font-bold">Highlights</h4>
                </div>
                <ul className="space-y-2 text-base text-[#31433b]">
                  <li><strong>Best season:</strong> {selectedPlace.best_season || "Not set"}</li>
                  <li><strong>Best time:</strong> {selectedPlace.best_time || "Not set"}</li>
                  <li><strong>Visit duration:</strong> {selectedPlace.visit_duration || "Not set"}</li>
                  <li><strong>Entrance fee:</strong> {selectedPlace.entrance_fee || "Not set"}</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[#e6ebe7] bg-white p-4">
              <div className="mb-3 flex items-center gap-2 text-[#1e5a41]">
                <MapPinned className="h-4 w-4" />
                <h4 className="font-bold">Location details</h4>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl bg-[#f6f8f6] p-3 text-sm text-[#31433b]">
                  <span className="block text-xs uppercase tracking-[0.18em] text-[#6b7a72]">Address</span>
                  <span className="mt-2 block font-medium">{selectedPlace.address || "Not provided"}</span>
                </div>
                <div className="rounded-xl bg-[#f6f8f6] p-3 text-sm text-[#31433b]">
                  <span className="block text-xs uppercase tracking-[0.18em] text-[#6b7a72]">Coordinates</span>
                  <span className="mt-2 block font-medium">
                    {selectedPlace.latitude ?? "-"}, {selectedPlace.longitude ?? "-"}
                  </span>
                </div>
                <div className="rounded-xl bg-[#f6f8f6] p-3 text-sm text-[#31433b]">
                  <span className="block text-xs uppercase tracking-[0.18em] text-[#6b7a72]">Transport</span>
                  <span className="mt-2 block font-medium">{formatList(selectedPlace.transport)}</span>
                </div>
                <div className="rounded-xl bg-[#f6f8f6] p-3 text-sm text-[#31433b]">
                  <span className="block text-xs uppercase tracking-[0.18em] text-[#6b7a72]">Road condition</span>
                  <span className="mt-2 block font-medium">{selectedPlace.road_condition || "Not set"}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <div className="rounded-2xl border border-[#e6ebe7] bg-white p-4">
                <h4 className="font-bold text-[#14382a]">Activities</h4>
                <p className="mt-3 text-sm text-[#31433b]">{formatList(selectedPlace.activities)}</p>
              </div>
              <div className="rounded-2xl border border-[#e6ebe7] bg-white p-4">
                <h4 className="font-bold text-[#14382a]">Safety</h4>
                <p className="mt-3 text-sm text-[#31433b]">
                  <strong>Level:</strong> {selectedPlace.safety_level || "Not set"}<br />
                  <strong>Tips:</strong> {selectedPlace.safety_tips || "Not added"}<br />
                  <strong>Warnings:</strong> {selectedPlace.warnings || "Not added"}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[#e6ebe7] bg-white p-4">
              <h4 className="font-bold text-[#14382a]">Additional notes</h4>
              <p className="mt-3 text-sm text-[#31433b]">
                <strong>Hidden tips:</strong>{" "}
                <span className="whitespace-pre-line">
                  {selectedPlace.hidden_tips || "Not added"}
                </span>
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={updating === selectedPlace.id || (selectedPlace.status ?? "pending").toLowerCase() === "approved" || (selectedPlace.status ?? "pending").toLowerCase() === "published"}
                onClick={() => void handleStatusUpdate(selectedPlace.id, "approved")}
                className="inline-flex items-center gap-2 rounded-full bg-[#1e5a41] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#174a35] disabled:cursor-not-allowed disabled:opacity-60"
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
          </div>
        </div>
      ) : null}
    </main>
  );
}
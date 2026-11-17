"use client";

import { useEffect, useState } from "react";
import { InAppNotification, Trip } from "@/lib/trip-planner/types";
import {
  deleteNotification,
  getNotificationPreferences,
  loadUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  NotificationPreferences,
  saveNotificationPreferences,
  scheduleTripReminder,
} from "@/lib/trip-planner/notifications";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Calendar,
  AlertTriangle,
  Sparkles,
  Info,
  SlidersHorizontal,
  Plus,
} from "lucide-react";

interface NotificationCenterProps {
  userTrips?: Trip[];
  className?: string;
}

export default function NotificationCenter({
  userTrips = [],
  className = "",
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "reminders" | "weather">("all");
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    getNotificationPreferences()
  );
  const [showPreferences, setShowPreferences] = useState(false);

  // New Reminder form modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState(userTrips[0]?.id || "");
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderDate, setReminderDate] = useState("2026-11-20T09:00");
  const [reminderType, setReminderType] = useState<
    "trip_departure" | "packing" | "visit_stop" | "safety_alert"
  >("trip_departure");
  const [reminderNotes, setReminderNotes] = useState("");

  const loadNotifs = async () => {
    const data = await loadUserNotifications();
    setNotifications(data);
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    loadUserNotifications().then((data) => {
      if (active) {
        setNotifications(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const handleMarkRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleTogglePref = (key: keyof NotificationPreferences) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    saveNotificationPreferences(updated);
  };

  const handleScheduleReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderTitle.trim()) return;

    await scheduleTripReminder({
      trip_id: selectedTripId,
      user_id: "",
      reminder_type: reminderType,
      reminder_date: new Date(reminderDate).toISOString(),
      title: reminderTitle.trim(),
      notes: reminderNotes.trim() || undefined,
      is_triggered: false,
    });

    setShowScheduleModal(false);
    setReminderTitle("");
    setReminderNotes("");
    await loadNotifs();
  };

  // Filtered notifications
  const filteredNotifs = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    if (filter === "reminders")
      return n.type === "trip_reminder" || n.type === "destination_reminder";
    if (filter === "weather") return n.type === "weather_alert";
    return true;
  });

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 border border-[#0b2417]/10 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#123b26] text-[#c99a43]">
            <Bell size={20} />
          </span>
          <div>
            <h3 className="font-bold text-[#0b2417] text-base sm:text-lg">
              Notification & Reminder Center
            </h3>
            <p className="text-xs text-[#718078]">
              Stay updated on trip departures, weather alerts, and trail reminders
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {userTrips.length > 0 && (
            <button
              type="button"
              onClick={() => setShowScheduleModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#176b45] px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-[#115c3a] hover:text-white shadow-sm"
            >
              <Plus size={14} /> Schedule Reminder
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowPreferences((s) => !s)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-[#0b2417] hover:bg-gray-50"
          >
            <SlidersHorizontal size={14} className="text-[#c99a43]" />
            <span>Preferences</span>
          </button>

          {notifications.some((n) => !n.is_read) && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-[#0b2417] hover:bg-gray-50"
            >
              <CheckCheck size={14} className="text-emerald-700" />
              <span>Mark all read</span>
            </button>
          )}
        </div>
      </div>

      {/* Preferences Drawer */}
      {showPreferences && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3 shadow-sm animate-in fade-in">
          <h4 className="font-bold text-sm uppercase tracking-wider text-[#0b2417]">
            Notification Preferences
          </h4>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-xs">
            <label className="flex items-center gap-2.5 rounded-xl border p-2.5 cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={preferences.tripReminders}
                onChange={() => handleTogglePref("tripReminders")}
                className="rounded text-[#123b26]"
              />
              <div>
                <div className="font-bold text-[#0b2417]">Trip Reminders</div>
                <div className="text-gray-500 text-[14px]">
                  Alerts 3 days and 1 day before departure
                </div>
              </div>
            </label>

            <label className="flex items-center gap-2.5 rounded-xl border p-2.5 cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={preferences.destinationReminders}
                onChange={() => handleTogglePref("destinationReminders")}
                className="rounded text-[#123b26]"
              />
              <div>
                <div className="font-bold text-[#0b2417]">Destination Visit Alerts</div>
                <div className="text-gray-500 text-[14px]">
                  Morning reminders for planned stop activities
                </div>
              </div>
            </label>

            <label className="flex items-center gap-2.5 rounded-xl border p-2.5 cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={preferences.weatherAlerts}
                onChange={() => handleTogglePref("weatherAlerts")}
                className="rounded text-[#123b26]"
              />
              <div>
                <div className="font-bold text-[#0b2417]">Weather & Safety Updates</div>
                <div className="text-gray-500 text-[14px]">
                  Monsoon conditions, waterfall swells & trail warnings
                </div>
              </div>
            </label>

            <label className="flex items-center gap-2.5 rounded-xl border p-2.5 cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={preferences.newPlacesMatchingInterests}
                onChange={() => handleTogglePref("newPlacesMatchingInterests")}
                className="rounded text-[#123b26]"
              />
              <div>
                <div className="font-bold text-[#0b2417]">New Place Matches</div>
                <div className="text-gray-500 text-[14px]">
                  Notifications when hidden spots matching your interests are published
                </div>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Schedule Reminder Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleScheduleReminder}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4 border border-gray-200"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-bold text-base text-[#0b2417]">
                Schedule In-App Trip Reminder
              </h4>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="p-1 text-gray-400 hover:text-black"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Select Trip
              </label>
              <select
                value={selectedTripId}
                onChange={(e) => setSelectedTripId(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-[#0b2417] outline-none"
              >
                {userTrips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.start_location_name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Reminder Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Check leech socks & water filter before Knuckles"
                value={reminderTitle}
                onChange={(e) => setReminderTitle(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-[#0b2417] outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Reminder Type
                </label>
                <select
                  value={reminderType}
                  onChange={(e) =>
                    setReminderType(
                      e.target.value as
                        | "trip_departure"
                        | "packing"
                        | "visit_stop"
                        | "safety_alert"
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 p-2 text-xs text-[#0b2417] outline-none"
                >
                  <option value="trip_departure">Trip Departure</option>
                  <option value="packing">Gear / Packing</option>
                  <option value="visit_stop">Destination Stop</option>
                  <option value="safety_alert">Safety Check</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2 text-xs text-[#0b2417] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                rows={2}
                placeholder="Specific guidance or trail checklist..."
                value={reminderNotes}
                onChange={(e) => setReminderNotes(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-[#0b2417] outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#176b45] px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-[#115c3a] hover:text-white"
              >
                Set Reminder
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        {(
          [
            { id: "all", label: "All Alerts" },
            { id: "unread", label: "Unread Only" },
            { id: "reminders", label: "Reminders" },
            { id: "weather", label: "Weather & Safety" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`rounded-full px-3 py-1.5 text-base font-bold transition ${
              filter === tab.id
                ? "bg-[]"
                : "bg-white text-gray-900 hover:bg"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="rounded-2xl border border-gray-200 p-8 text-center bg-white text-sm text-gray-500">
          Loading notifications...
        </div>
      ) : filteredNotifs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center bg-white">
          <Bell size={28} className="mx-auto text-gray-300 mb-2" />
          <h5 className="font-bold text-sm text-[#0b2417]">No notifications</h5>
          <p className="text-sm text-[#718078] mt-0.5">
            You are all caught up! Trip reminders and alerts will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifs.map((notif) => (
            <div
              key={notif.id}
              className={`flex items-start justify-between gap-3 rounded-2xl p-4 border transition ${
                notif.is_read
                  ? "border-gray-200 bg-white"
                  : "border-emerald-300 bg-emerald-50/30 shadow-xs"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-50 border border-gray-200">
                  {notif.type === "weather_alert" ? (
                    <AlertTriangle size={16} className="text-amber-600" />
                  ) : notif.type === "trip_reminder" ? (
                    <Calendar size={16} className="text-[#c99a43]" />
                  ) : notif.type === "place_recommendation" ? (
                    <Sparkles size={16} className="text-emerald-600" />
                  ) : (
                    <Info size={16} className="text-[#123b26]" />
                  )}
                </span>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-base text-[#0b2417]">
                      {notif.title}
                    </h4>
                    {!notif.is_read && (
                      <span className="rounded-full bg-[#123b26] px-2 py-0.5 text-[15px] font-bold text-[#f1cf88]">
                        New
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-gray-700 leading-relaxed">
                    {notif.message}
                  </p>

                  <span className="mt-2 block text-[15px] text-gray-400">
                    {new Date(notif.created_at).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {!notif.is_read && (
                  <button
                    type="button"
                    onClick={() => handleMarkRead(notif.id)}
                    className="rounded-lg p-1.5 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50"
                    title="Mark as read"
                  >
                    <Check size={15} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(notif.id)}
                  className="rounded-lg p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                  title="Delete notification"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

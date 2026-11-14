import { createClient } from "@/lib/supabase/client";
import { InAppNotification, TripReminder } from "./types";

const LOCAL_STORAGE_NOTIFS_KEY = "lanka_in_app_notifications";
const LOCAL_STORAGE_PREFS_KEY = "lanka_notification_prefs";

export type NotificationPreferences = {
  tripReminders: boolean;
  destinationReminders: boolean;
  weatherAlerts: boolean;
  newPlacesMatchingInterests: boolean;
};

export const DEFAULT_NOTIF_PREFS: NotificationPreferences = {
  tripReminders: true,
  destinationReminders: true,
  weatherAlerts: true,
  newPlacesMatchingInterests: true,
};

/**
 * Loads user notifications from Supabase or localStorage
 */
export async function loadUserNotifications(): Promise<InAppNotification[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        try {
          localStorage.setItem(LOCAL_STORAGE_NOTIFS_KEY, JSON.stringify(data));
        } catch {}
        return data as InAppNotification[];
      }
    } catch (err) {
      console.warn("Could not load notifications from Supabase, using local store:", err);
    }
  }

  // Local storage fallback
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_NOTIFS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
  }

  // Initial welcome notification if empty
  return [
    {
      id: "notif-welcome",
      user_id: user?.id || "guest",
      type: "general",
      title: "Welcome to Trip Planner!",
      message:
        "Plan your personalized hidden journeys across Sri Lanka with real road routes, budget calculator, and weather safety reminders.",
      is_read: false,
      created_at: new Date().toISOString(),
    },
  ];
}

/**
 * Marks a notification as read
 */
export async function markNotificationAsRead(id: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);
    } catch {}
  }

  if (typeof window !== "undefined") {
    try {
      const current = await loadUserNotifications();
      const updated = current.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      );
      localStorage.setItem(LOCAL_STORAGE_NOTIFS_KEY, JSON.stringify(updated));
    } catch {}
  }
}

/**
 * Marks all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id);
    } catch {}
  }

  if (typeof window !== "undefined") {
    try {
      const current = await loadUserNotifications();
      const updated = current.map((n) => ({ ...n, is_read: true }));
      localStorage.setItem(LOCAL_STORAGE_NOTIFS_KEY, JSON.stringify(updated));
    } catch {}
  }
}

/**
 * Deletes a notification
 */
export async function deleteNotification(id: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    try {
      await supabase.from("notifications").delete().eq("id", id);
    } catch {}
  }

  if (typeof window !== "undefined") {
    try {
      const current = await loadUserNotifications();
      const updated = current.filter((n) => n.id !== id);
      localStorage.setItem(LOCAL_STORAGE_NOTIFS_KEY, JSON.stringify(updated));
    } catch {}
  }
}

/**
 * Creates a new in-app notification
 */
export async function createInAppNotification(
  notification: Omit<InAppNotification, "id" | "created_at">
): Promise<InAppNotification> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const newNotif: InAppNotification = {
    ...notification,
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    user_id: user ? user.id : notification.user_id || "guest",
    created_at: new Date().toISOString(),
  };

  if (user) {
    try {
      await supabase.from("notifications").insert({
        id: newNotif.id,
        user_id: user.id,
        trip_id: newNotif.trip_id || null,
        type: newNotif.type,
        title: newNotif.title,
        message: newNotif.message,
        data: newNotif.data || {},
        is_read: newNotif.is_read,
      });
    } catch {}
  }

  if (typeof window !== "undefined") {
    try {
      const current = await loadUserNotifications();
      const updated = [newNotif, ...current];
      localStorage.setItem(LOCAL_STORAGE_NOTIFS_KEY, JSON.stringify(updated));
    } catch {}
  }

  return newNotif;
}

/**
 * Schedules a trip reminder
 */
export async function scheduleTripReminder(
  reminder: Omit<TripReminder, "id" | "created_at">
): Promise<TripReminder> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const newReminder: TripReminder = {
    ...reminder,
    id: `rem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    user_id: user ? user.id : reminder.user_id || "guest",
    created_at: new Date().toISOString(),
  };

  if (user) {
    try {
      await supabase.from("trip_reminders").insert({
        id: newReminder.id,
        trip_id: newReminder.trip_id,
        user_id: user.id,
        place_id: newReminder.place_id || null,
        reminder_type: newReminder.reminder_type,
        reminder_date: newReminder.reminder_date,
        title: newReminder.title,
        notes: newReminder.notes || null,
        is_triggered: newReminder.is_triggered,
      });
    } catch {}
  }

  // Also create a linked notification for the user
  await createInAppNotification({
    user_id: newReminder.user_id,
    trip_id: newReminder.trip_id,
    type: "trip_reminder",
    title: `Reminder Scheduled: ${newReminder.title}`,
    message: `Scheduled for ${new Date(newReminder.reminder_date).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}. ${newReminder.notes || ""}`,
    is_read: false,
  });

  return newReminder;
}

/**
 * Loads notification preferences
 */
export function getNotificationPreferences(): NotificationPreferences {
  if (typeof window === "undefined") return DEFAULT_NOTIF_PREFS;
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFS_KEY);
    return saved ? { ...DEFAULT_NOTIF_PREFS, ...JSON.parse(saved) } : DEFAULT_NOTIF_PREFS;
  } catch {
    return DEFAULT_NOTIF_PREFS;
  }
}

/**
 * Saves notification preferences
 */
export function saveNotificationPreferences(prefs: NotificationPreferences): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_PREFS_KEY, JSON.stringify(prefs));
  } catch {}
}

"use client";

import { useEffect, useState, useRef } from "react";
import { InAppNotification } from "@/lib/trip-planner/types";
import {
  loadUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/trip-planner/notifications";
import {
  Bell,
  Check,
  CheckCheck,
  Calendar,
  AlertTriangle,
  Sparkles,
  Info,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface NotificationBellProps {
  className?: string;
}

export default function NotificationBell({ className = "" }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load notifications and listen for clicks outside
  useEffect(() => {
    let isMounted = true;

    async function fetchNotifs() {
      const list = await loadUserNotifications();
      if (isMounted) setNotifications(list);
    }

    void fetchNotifs();

    // Check periodically or on focus
    const onFocus = () => void fetchNotifs();
    window.addEventListener("focus", onFocus);

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      isMounted = false;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "weather_alert":
        return <AlertTriangle size={15} className="text-amber-600" />;
      case "trip_reminder":
      case "destination_reminder":
        return <Calendar size={15} className="text-[#c99a43]" />;
      case "place_recommendation":
        return <Sparkles size={15} className="text-emerald-600" />;
      default:
        return <Info size={15} className="text-[#123b26]" />;
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Bell Button */}
      <button
        type="button"
        aria-label="View in-app notifications"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#0b2417]/10 bg-white/70 hover:bg-[#e9e0d0] transition text-[#0b2417]"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#c99a43] text-[11px] font-extrabold text-[#0b2417] shadow-sm animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 top-full z-[1100] mt-2 w-80 sm:w-96 rounded-2xl border border-[#0b2417]/15 bg-white p-3 shadow-2xl animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 px-1">
            <div className="flex items-center gap-1.5 font-bold text-sm text-[#0b2417]">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-[#123b26] px-2 py-0.5 text-[10px] text-[#f1cf88]">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-[#718078] hover:text-[#123b26] transition flex items-center gap-1"
              >
                <CheckCheck size={12} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List of items */}
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 py-1 space-y-1">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#718078]">
                No notifications right now.
              </div>
            ) : (
              notifications.slice(0, 6).map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start justify-between gap-2.5 rounded-xl p-2.5 transition ${
                    notif.is_read ? "bg-white" : "bg-emerald-50/40"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-50 border border-gray-200">
                      {getIcon(notif.type)}
                    </span>
                    <div>
                      <h5 className="font-bold text-xs text-[#0b2417]">
                        {notif.title}
                      </h5>
                      <p className="mt-0.5 text-[11px] text-gray-600 line-clamp-2">
                        {notif.message}
                      </p>
                      <span className="mt-1 block text-[10px] text-gray-400">
                        {new Date(notif.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {!notif.is_read && (
                    <button
                      type="button"
                      onClick={(e) => handleMarkRead(notif.id, e)}
                      className="shrink-0 p-1 text-gray-400 hover:text-emerald-700"
                      title="Mark as read"
                    >
                      <Check size={13} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer view all link */}
          <div className="border-t border-gray-100 pt-2 text-center">
            <Link
              href="/profile?tab=notifications"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#123b26] hover:text-[#c99a43] transition"
            >
              <span>Open Notification Center</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}


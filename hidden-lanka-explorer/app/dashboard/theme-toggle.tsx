"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";
const themeStorageKey = "hidden-lanka-dashboard-theme";
const themeSubscribers = new Set<() => void>();

function getTheme(): Theme {
  return document.documentElement.dataset.dashboardTheme === "dark"
    ? "dark"
    : "light";
}

function subscribeToTheme(onStoreChange: () => void) {
  themeSubscribers.add(onStoreChange);
  return () => themeSubscribers.delete(onStoreChange);
}

function notifyThemeChange() {
  themeSubscribers.forEach((onStoreChange) => onStoreChange());
}

export default function DashboardThemeToggle() {
  const theme = useSyncExternalStore(subscribeToTheme, getTheme, () => "light");

  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem(themeStorageKey);
      if (storedTheme === "dark" || storedTheme === "light") {
        document.documentElement.dataset.dashboardTheme = storedTheme;
        notifyThemeChange();
      }
    } catch (error) {
      console.error("DASHBOARD_THEME_READ_ERROR", error);
    }
  }, []);

  function toggleTheme() {
    const nextTheme = getTheme() === "light" ? "dark" : "light";
    document.documentElement.dataset.dashboardTheme = nextTheme;
    notifyThemeChange();

    try {
      localStorage.setItem(themeStorageKey, nextTheme);
    } catch (error) {
      console.error("DASHBOARD_THEME_SAVE_ERROR", error);
    }
  }

  const isDark = theme === "dark";
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-pressed={isDark}
      className="inline-flex items-center gap-2 rounded-full border border-[#d7cfbf] bg-[#fffdf9] px-3 py-2 text-sm font-semibold text-[#123b26] transition hover:bg-[#f1e7d6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c99a43]"
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
      <span>{isDark ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}

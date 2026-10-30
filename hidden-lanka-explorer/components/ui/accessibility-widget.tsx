"use client";

import { useState, useEffect } from "react";
import {
  Contrast,
  CircleDot,
  Droplet,
  Link2,
  Type,
  MousePointer2,
  Pause,
  RotateCcw,
  X,
  Minus,
  Plus,
} from "lucide-react";

type A11yState = {
  textSize: number; // -1, 0, 1, 2, 3
  highContrast: boolean;
  grayscale: boolean;
  invertColors: boolean;
  underlineLinks: boolean;
  readableFont: boolean;
  bigCursor: boolean;
  pauseMotion: boolean;
};

const defaultA11yState: A11yState = {
  textSize: 0,
  highContrast: false,
  grayscale: false,
  invertColors: false,
  underlineLinks: false,
  readableFont: false,
  bigCursor: false,
  pauseMotion: false,
};

const STORAGE_KEY = "hidden-lanka-a11y";

export default function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<A11yState>(defaultA11yState);

  // Load saved preferences on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({ ...defaultA11yState, ...parsed });
      }
    } catch {
      // Ignore storage errors
    }

    const handleOpen = () => setIsOpen(true);
    const handleToggle = () => setIsOpen((prev) => !prev);

    window.addEventListener("open-a11y", handleOpen);
    window.addEventListener("toggle-a11y", handleToggle);

    return () => {
      window.removeEventListener("open-a11y", handleOpen);
      window.removeEventListener("toggle-a11y", handleToggle);
    };
  }, []);

  // Apply settings to document root element
  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;

    // 1. Text Size
    root.classList.remove(
      "a11y-text-sm",
      "a11y-text-md",
      "a11y-text-lg",
      "a11y-text-xl"
    );
    if (settings.textSize === -1) root.classList.add("a11y-text-sm");
    else if (settings.textSize === 1) root.classList.add("a11y-text-md");
    else if (settings.textSize === 2) root.classList.add("a11y-text-lg");
    else if (settings.textSize === 3) root.classList.add("a11y-text-xl");

    // 2. High Contrast
    root.classList.toggle("a11y-high-contrast", settings.highContrast);

    // 3. Grayscale
    root.classList.toggle("a11y-grayscale", settings.grayscale);

    // 4. Invert Colors
    root.classList.toggle("a11y-invert", settings.invertColors);

    // 5. Underline Links
    root.classList.toggle("a11y-underline-links", settings.underlineLinks);

    // 6. Readable Font
    root.classList.toggle("a11y-readable-font", settings.readableFont);

    // 7. Big Cursor
    root.classList.toggle("a11y-big-cursor", settings.bigCursor);

    // 8. Pause Motion
    root.classList.toggle("a11y-pause-motion", settings.pauseMotion);

    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage errors
    }
  }, [settings]);

  // Adjust text size
  const decreaseText = () => {
    setSettings((prev) => ({
      ...prev,
      textSize: Math.max(-1, prev.textSize - 1),
    }));
  };

  const resetText = () => {
    setSettings((prev) => ({ ...prev, textSize: 0 }));
  };

  const increaseText = () => {
    setSettings((prev) => ({
      ...prev,
      textSize: Math.min(3, prev.textSize + 1),
    }));
  };

  // Toggle single display option
  const toggleOption = (key: keyof Omit<A11yState, "textSize">) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Reset all
  const resetAll = () => {
    setSettings(defaultA11yState);
  };

  return (
    <>
      {/* =====================================================
          FLOATING RED ACCESSIBILITY BUTTON (Right Corner)
          Exact match to user reference image
      ===================================================== */}
      <button
        id="a11y-floating-btn"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open accessibility tools"
        title="Accessibility tools"
        className="fixed bottom-6 right-6 z-[9999] flex h-16 w-16 items-center justify-center rounded-full bg-[#d9222a] text-white shadow-[0_8px_30px_rgba(217,34,42,0.55)] transition-all duration-300 hover:scale-110 hover:bg-[#c01820] focus:outline-none focus:ring-4 focus:ring-red-300 cursor-pointer active:scale-95 border-2 border-white/20"
      >
        {/* Outstretched arms & legs universal accessibility stick figure inside circle */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-8 w-8 text-white"
        >
          <circle cx="12" cy="12" r="10" strokeWidth="2" />
          <circle cx="12" cy="7" r="1.5" fill="currentColor" stroke="none" />
          <path d="M6.8 10h10.4" strokeWidth="2.2" />
          <path d="M12 10v4" strokeWidth="2.2" />
          <path d="M9.2 17.8L12 14l2.8 3.8" strokeWidth="2.2" />
        </svg>
      </button>

      {/* =====================================================
          ACCESSIBILITY PANEL (Opens on Right Side Above Button)
          Matching uploaded reference image
      ===================================================== */}
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:items-end sm:justify-end sm:p-6 pointer-events-none">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity pointer-events-auto cursor-pointer"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel Container */}
          <div className="relative z-10 w-full max-w-[365px] overflow-hidden rounded-[26px] bg-white shadow-2xl transition-all border border-slate-200 pointer-events-auto mb-20 sm:mb-20">
            {/* Header: Royal Blue with icon and close X */}
            <div className="flex items-center justify-between bg-[#004bd6] px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/40">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4.5 w-4.5 text-white"
                  >
                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    <circle cx="12" cy="7" r="1.5" fill="currentColor" stroke="none" />
                    <path d="M7 10h10" />
                    <path d="M12 10v4" />
                    <path d="M9.5 17.5L12 14l2.5 3.5" />
                  </svg>
                </span>
                <h2 className="font-sans text-xl font-bold tracking-tight text-white">
                  Accessibility
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close accessibility panel"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Panel Body */}
            <div className="max-h-[76vh] overflow-y-auto p-5 text-slate-800">
              {/* TEXT SIZE SECTION */}
              <div className="mb-5">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  TEXT SIZE
                </span>

                <div className="mt-2.5 flex items-center justify-between rounded-xl bg-[#f0f4f9] p-1.5 border border-slate-200">
                  <button
                    type="button"
                    onClick={decreaseText}
                    aria-label="Decrease text size"
                    className="flex h-10 flex-1 items-center justify-center rounded-lg font-bold text-slate-700 transition hover:bg-white hover:shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Minus size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={resetText}
                    aria-label="Reset text size"
                    className="flex h-10 flex-1 items-center justify-center rounded-lg font-sans text-lg font-bold text-slate-900 transition hover:bg-white hover:shadow-xs cursor-pointer"
                  >
                    A
                  </button>

                  <button
                    type="button"
                    onClick={increaseText}
                    aria-label="Increase text size"
                    className="flex h-10 flex-1 items-center justify-center rounded-lg font-bold text-slate-700 transition hover:bg-white hover:shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              {/* DISPLAY SECTION */}
              <div className="mb-6">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  DISPLAY
                </span>

                <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                  {/* High contrast */}
                  <button
                    type="button"
                    onClick={() => toggleOption("highContrast")}
                    className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition cursor-pointer ${
                      settings.highContrast
                        ? "border-[#004bd6] bg-[#004bd6]/10 text-[#004bd6] ring-2 ring-[#004bd6]"
                        : "border-slate-200 bg-[#f8fafc] text-slate-800 hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    <Contrast size={24} className="mb-2" />
                    <span className="text-xs font-semibold">High contrast</span>
                  </button>

                  {/* Grayscale */}
                  <button
                    type="button"
                    onClick={() => toggleOption("grayscale")}
                    className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition cursor-pointer ${
                      settings.grayscale
                        ? "border-[#004bd6] bg-[#004bd6]/10 text-[#004bd6] ring-2 ring-[#004bd6]"
                        : "border-slate-200 bg-[#f8fafc] text-slate-800 hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    <CircleDot size={24} className="mb-2" />
                    <span className="text-xs font-semibold">Grayscale</span>
                  </button>

                  {/* Invert colors */}
                  <button
                    type="button"
                    onClick={() => toggleOption("invertColors")}
                    className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition cursor-pointer ${
                      settings.invertColors
                        ? "border-[#004bd6] bg-[#004bd6]/10 text-[#004bd6] ring-2 ring-[#004bd6]"
                        : "border-slate-200 bg-[#f8fafc] text-slate-800 hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    <Droplet size={24} className="mb-2" />
                    <span className="text-xs font-semibold">Invert colors</span>
                  </button>

                  {/* Underline links */}
                  <button
                    type="button"
                    onClick={() => toggleOption("underlineLinks")}
                    className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition cursor-pointer ${
                      settings.underlineLinks
                        ? "border-[#004bd6] bg-[#004bd6]/10 text-[#004bd6] ring-2 ring-[#004bd6]"
                        : "border-slate-200 bg-[#f8fafc] text-slate-800 hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    <Link2 size={24} className="mb-2" />
                    <span className="text-xs font-semibold">Underline links</span>
                  </button>

                  {/* Readable font */}
                  <button
                    type="button"
                    onClick={() => toggleOption("readableFont")}
                    className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition cursor-pointer ${
                      settings.readableFont
                        ? "border-[#004bd6] bg-[#004bd6]/10 text-[#004bd6] ring-2 ring-[#004bd6]"
                        : "border-slate-200 bg-[#f8fafc] text-slate-800 hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    <Type size={24} className="mb-2" />
                    <span className="text-xs font-semibold">Readable font</span>
                  </button>

                  {/* Big cursor */}
                  <button
                    type="button"
                    onClick={() => toggleOption("bigCursor")}
                    className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition cursor-pointer ${
                      settings.bigCursor
                        ? "border-[#004bd6] bg-[#004bd6]/10 text-[#004bd6] ring-2 ring-[#004bd6]"
                        : "border-slate-200 bg-[#f8fafc] text-slate-800 hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    <MousePointer2 size={24} className="mb-2" />
                    <span className="text-xs font-semibold">Big cursor</span>
                  </button>

                  {/* Pause motion */}
                  <button
                    type="button"
                    onClick={() => toggleOption("pauseMotion")}
                    className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition cursor-pointer ${
                      settings.pauseMotion
                        ? "border-[#004bd6] bg-[#004bd6]/10 text-[#004bd6] ring-2 ring-[#004bd6]"
                        : "border-slate-200 bg-[#f8fafc] text-slate-800 hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    <Pause size={24} className="mb-2" />
                    <span className="text-xs font-semibold">Pause motion</span>
                  </button>
                </div>
              </div>

              {/* SOLID RED RESET ALL BUTTON (Exact match to uploaded image) */}
              <button
                type="button"
                onClick={resetAll}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#cc0000] py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#b30000] active:scale-98 cursor-pointer"
              >
                <RotateCcw size={16} />
                <span>Reset all</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


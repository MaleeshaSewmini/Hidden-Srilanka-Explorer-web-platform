"use client";

import Link from "next/link";
import { MapPinned, X } from "lucide-react";
import { useState } from "react";

import { useTrip } from "@/lib/trip-context";

export default function TripPlanner() {
  const { placeIds, clear } = useTrip();
  const [open, setOpen] = useState(false);

  if (placeIds.length === 0) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-5 left-1/2 z-40 w-[calc(100%-24px)] max-w-xl -translate-x-1/2">
        <div className="flex items-center gap-3 rounded-2xl bg-[#0b2417] p-3 text-white shadow-2xl">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#c99a43] text-[#0b2417]">
            <MapPinned size={20} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="font-semibold">
              {placeIds.length} place{placeIds.length !== 1 ? "s" : ""} in trip
            </div>

            <div className="text-xs text-white/50">
              Your trip is saved in this browser.
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#0b2417]"
          >
            View
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center">
          <div className="w-full max-w-lg rounded-3xl bg-[#f6f1e8] p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-3xl text-[#0b2417]">
                Your trip
              </h2>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 hover:bg-black/5"
              >
                <X />
              </button>
            </div>

            <p className="mt-2 text-sm text-[#718078]">
              {placeIds.length} place
              {placeIds.length !== 1 ? "s" : ""} selected.
            </p>

            <Link
              href="/dashboard/trips"
              onClick={() => setOpen(false)}
              className="mt-6 block rounded-2xl bg-[#0b2417] px-5 py-4 text-center font-semibold text-white"
            >
              Open Trip Planner
            </Link>

            <button
              type="button"
              onClick={() => {
                clear();
                setOpen(false);
              }}
              className="mt-3 w-full rounded-2xl border border-[#0b2417]/10 px-5 py-4 text-sm font-semibold"
            >
              Clear trip
            </button>
          </div>
        </div>
      )}
    </>
  );
}
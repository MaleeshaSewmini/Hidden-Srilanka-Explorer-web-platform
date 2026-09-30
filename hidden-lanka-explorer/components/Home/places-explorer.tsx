"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import SectionHeading from "@/components/ui/section-heading";
import PlaceCard from "@/components/places/place-card";
import { places } from "@/lib/demo-data";

type Tab = "Trending" | "Newest" | "Nearby";

export default function PlacesExplorer() {
  const [tab, setTab] = useState<Tab>("Trending");

  const sortedPlaces = useMemo(() => {
    const data = [...places];

    if (tab === "Trending") {
      return data.sort((a, b) => b.likes - a.likes);
    }

    if (tab === "Newest") {
      return data.reverse();
    }

    return data;
  }, [tab]);

  return (
    <section className="section-padding bg-[#ede5d7]">
      <div className="container-main">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Places worth finding"
            title="Hidden gems from across the island."
            description="Explore places shared by our growing community of Sri Lankan explorers."
          />

          <Link
            href="/places"
            className="font-semibold text-[#a77a2f]"
          >
            View all places →
          </Link>
        </div>

        <div className="mt-10 flex gap-2 overflow-x-auto pb-2">
          {(["Trending", "Newest", "Nearby"] as Tab[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium ${
                tab === item
                  ? "bg-[#0b2417] text-white"
                  : "bg-white text-[#718078]"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedPlaces.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      </div>
    </section>
  );
}

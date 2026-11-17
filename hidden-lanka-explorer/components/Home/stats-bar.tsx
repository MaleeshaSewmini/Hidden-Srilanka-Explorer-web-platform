"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Stat = {
  label: string;
  value: number;
};

function CountUp({ value }: { value: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 1800;
    let startTime: number | undefined;
    let frameId = 0;

    const animate = (time: number) => {
      if (startTime === undefined) {
        startTime = time;
      }

      const progress = Math.min(
        (time - startTime) / duration,
        1
      );

      const eased = 1 - Math.pow(1 - progress, 4);

      setCount(Math.floor(eased * value));

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [value]);

  return <>{count.toLocaleString()}</>;
}

export default function StatsBar() {
  const [stats, setStats] = useState<Stat[] | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      try {
        const supabase = createClient();
        const [placesResult, districtsResult, photosResult, explorersResult] =
          await Promise.all([
            supabase
              .from("places")
              .select("id", { count: "exact", head: true })
              .in("status", ["approved", "published"]),
            supabase
              .from("places")
              .select("district")
              .in("status", ["approved", "published"]),
            supabase
              .from("place_photos")
              .select("id", { count: "exact", head: true })
              .in("status", ["approved", "published"]),
            supabase
              .from("profiles")
              .select("id", { count: "exact", head: true }),
          ]);

        if (placesResult.error) throw placesResult.error;
        if (districtsResult.error) throw districtsResult.error;
        if (photosResult.error) throw photosResult.error;
        if (explorersResult.error) throw explorersResult.error;
        if (
          placesResult.count === null ||
          photosResult.count === null ||
          explorersResult.count === null
        ) {
          throw new Error("A community statistic was missing from Supabase.");
        }

        const districtCount = new Set(
          (districtsResult.data ?? [])
            .map((place) => place.district?.trim())
            .filter((district): district is string => Boolean(district))
        ).size;

        if (!cancelled) {
          setStats([
            { value: placesResult.count, label: "Hidden Places" },
            { value: districtCount, label: "Districts Covered" },
            { value: photosResult.count, label: "Community Photos" },
            { value: explorersResult.count, label: "Explorers" },
          ]);
        }
      } catch (error) {
        console.error("Failed to load homepage statistics:", error);
        if (!cancelled) {
          setStatsError("Community statistics could not be loaded.");
        }
      }
    }

    void loadStats();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="bg-[#292F38] text-white">
      <div className="container-main mx-auto max-w-5xl grid grid-cols-2 divide-white/10 md:grid-cols-4 md:divide-x">
        {statsError ? (
          <p
            className="col-span-2 py-4 text-center text-sm text-white md:col-span-4"
            role="alert"
          >
            {statsError}
          </p>
        ) : (
          (stats ?? [
            { value: 0, label: "Hidden Places" },
            { value: 0, label: "Districts Covered" },
            { value: 0, label: "Community Photos" },
            { value: 0, label: "Explorers" },
          ]).map(({ value, label }) => (
            <div key={label} className="px-2 py-3 text-center md:px-8">
              <div
                className="font-display text-3xl text-[#f1cf88] sm:text-4xl"
                role={stats ? undefined : "status"}
              >
                {stats ? <CountUp value={value} /> : "…"}
              </div>

              <div className="mt-1 text-sm text-white/55">{label}</div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
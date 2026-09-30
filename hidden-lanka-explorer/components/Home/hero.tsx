"use client";

import Link from "next/link";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { useState } from "react";

const categories = [
  "Beaches",
  "Temples",
  "Waterfalls",
  "Wildlife",
  "Highlands",
  "Ruins",
];

export default function Hero() {
  const [query, setQuery] = useState("");

  return (
    <section className="relative min-h-[720px] overflow-hidden bg-[#0b2417]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1588598198321-9735fd524f09?auto=format&fit=crop&w=2200&q=85')",
        }}
      />

      <div className="absolute inset-0 bg-[#06150d]/60" />

      <div className="absolute inset-0 bg-gradient-to-t from-[#0b2417] via-transparent to-[#0b2417]/30" />

      <div className="container-main relative flex min-h-[720px] items-center py-20">
        <div className="max-w-4xl text-white">
          <div className="mb-5 flex items-center gap-2 text-sm text-[#f1cf88]">
            <Sparkles size={16} />
            Beyond the guidebooks
          </div>

          <h1 className="font-display text-6xl leading-[0.95] sm:text-7xl lg:text-8xl">
            Sri Lanka&apos;s
            <br />
            <span className="text-[#f1cf88]">Untold Places.</span>
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
            Discover hidden beaches, ancient temples, secret waterfalls,
            forgotten villages and wild landscapes shared by people who know
            Sri Lanka beyond the usual tourist trail.
          </p>

          <form
            className="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();

              if (!query.trim()) return;

              window.location.href = `/places?search=${encodeURIComponent(
                query.trim()
              )}`;
            }}
          >
            <div className="flex flex-1 items-center gap-3 rounded-2xl bg-white px-5 py-4 text-[#17231c] shadow-2xl">
              <Search size={20} className="text-[#718078]" />

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search hidden places..."
                className="w-full bg-transparent outline-none placeholder:text-[#9aa49f]"
              />
            </div>

            <button
              type="submit"
              className="rounded-2xl bg-[#c99a43] px-7 py-4 font-semibold text-[#0b2417] transition hover:bg-[#e1b45e]"
            >
              Search
            </button>
          </form>

          <div className="mt-6 flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link
                key={category}
                href={`/places?category=${encodeURIComponent(category)}`}
                className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur-sm transition hover:bg-white hover:text-[#0b2417]"
              >
                {category}
              </Link>
            ))}
          </div>

          <Link
            href="/places"
            className="mt-8 inline-flex items-center gap-2 font-semibold text-[#f1cf88]"
          >
            Explore hidden Sri Lanka
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
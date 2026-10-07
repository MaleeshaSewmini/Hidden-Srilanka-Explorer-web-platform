"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";

import {
  Search,
  Plus,
  RefreshCw,
  Compass,
} from "lucide-react";

import PlaceCard from "@/components/places/place-card";
import { PlaceDetail } from "@/components/places/place-detail-modal";
import { createClient } from "@/lib/supabase/client";

const CATEGORIES = [
  "All",
  "Nature",
  "Temples",
  "Beaches",
  "Wildlife",
  "Waterfalls",
  "Ruins",
  "Villages",
  "Caves",
];
const DISTRICTS = [
  "Ampara",
  "Anuradhapura",
  "Badulla",
  "Batticaloa",
  "Colombo",
  "Galle",
  "Gampaha",
  "Hambantota",
  "Jaffna",
  "Kalutara",
  "Kandy",
  "Kegalle",
  "Kilinochchi",
  "Kurunegala",
  "Mannar",
  "Matale",
  "Matara",
  "Monaragala",
  "Mullaitivu",
  "Nuwara Eliya",
  "Polonnaruwa",
  "Puttalam",
  "Ratnapura",
  "Trincomalee",
  "Vavuniya",
];
const heroImages = [
  "/images/places/s1.jpg",
  "/images/places/s2.jpg",
];

async function fetchPlaces(category = "All", district = "All") {
  const supabase = createClient();
  let query = supabase
    .from("places")
    .select("*")
    .in("status", ["approved", "published"])
    .order("created_at", { ascending: false });

  if (category !== "All") {
    query = query.ilike("category", category);
  }

  if (district !== "All") {
    query = query.ilike("district", district);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data ?? [];
}





export default function PlacesPage() {
  const [places, setPlaces] = useState<PlaceDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDistrict, setSelectedDistrict] = useState("All");

  const [currentImage, setCurrentImage] = useState(0);

useEffect(() => {
  const interval = setInterval(() => {
    setCurrentImage((prev) => (prev + 1) % heroImages.length);
  }, 5000);

  return () => clearInterval(interval);
}, []);


const nextImage = () => {
  setCurrentImage((prev) => (prev + 1) % heroImages.length);
};

const previousImage = () => {
  setCurrentImage(
    (prev) => (prev - 1 + heroImages.length) % heroImages.length
  );
};

  async function loadPlaces(category = "All", district = "All") {
    try {
      setLoading(true);
      setErrorMessage("");

      setPlaces(await fetchPlaces(category, district));
    } catch (error) {
      console.error("LOAD_PLACES_ERROR", error);
      setPlaces([]);
      setErrorMessage("Could not load places from Supabase. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    fetchPlaces()
      .then((data) => {
        if (!cancelled) setPlaces(data);
      })
      .catch((error: unknown) => {
        console.error("LOAD_PLACES_ERROR", error);
        if (!cancelled) {
          setPlaces([]);
          setErrorMessage("Could not load places from Supabase. Please try again.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredPlaces = places;

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadPlaces(selectedCategory, selectedDistrict);
    document.getElementById("places-results")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <main className="min-h-screen bg-[#f7f3eb] pb-20 font-sans text-[#24352b]">

      {/* =====================================================
    HERO SECTION
===================================================== */}
<section className="relative min-h-[580px] overflow-hidden text-white">

  {/* =====================================================
      FULL HERO BACKGROUND IMAGE
  ===================================================== */}
  <div className="absolute inset-0">

    <Image
      src={heroImages[currentImage]}
      alt="Hidden Sri Lanka destination"
      fill
      priority
      className="object-cover transition-opacity duration-900 ease-in-out"
    />

    {/* Dark overlay */}
    <div className="absolute inset-0 bg-black/45" />

    {/* Green bottom gradient */}
    <div className="absolute inset-0 bg-gradient-to-t from-[#102b20] via-black/10 to-black/20" />

  </div>


  {/* =====================================================
      DECORATIVE BLUR
  ===================================================== */}
  <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#c58b45]/20 blur-3xl" />

  <div className="absolute -bottom-40 left-10 h-96 w-96 rounded-full bg-[#48745b]/30 blur-3xl" />


  {/* =====================================================
      HERO CONTENT
  ===================================================== */}
  <div className="container-main relative z-10 flex min-h-[580px] items-center">

    <div className="w-full">

      <div className="max-w-4xl">

        {/* =====================================================
            BLURRED TEXT AREA
        ===================================================== */}
        <div className="rounded-3xl border border-white/15 bg-black/25 p-6 shadow-2xl backdrop-blur-md md:p-8">

          {/* Small label */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d9b36c]/25 bg-[#d9b36c]/10 px-4 py-2 text-base font-sans font-medium text-[#f2d79d]">

           

            Discover the lesser-known island

          </div>


          {/* Heading */}
          <h1 className="font-display text-4xl font-semibold leading-[0.96] tracking-[-0.04em] sm:text-5xl md:text-6xl">

            Explore

            <span className="mt-2 block text-[#f5d188] drop-shadow-[0_8px_30px_rgba(245,209,136,0.25)]">
              Hidden Sri Lanka
            </span>

          </h1>


          {/* Description */}
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">

            Discover beautiful places beyond the usual tourist routes,
            shared by local travellers and reviewed by our community.

          </p>


          {/* =====================================================
              CATEGORY + DISTRICT SEARCH
          ===================================================== */}
          <form
            onSubmit={handleSearch}
            className="mt-6 grid gap-3 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-md sm:grid-cols-[1fr_1fr_auto]"
          >

            {/* Category */}
            <select
              aria-label="Filter places by category"
              className="h-12 rounded-xl border border-white/15 bg-[#102b20]/90 px-4 text-sm font-medium text-white outline-none transition focus:border-[#d3a052] focus:ring-2 focus:ring-[#d3a052]/30"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category === "All" ? "All Categories" : category}
                </option>
              ))}
            </select>


            {/* District */}
            <select
              aria-label="Filter places by district"
              className="h-12 rounded-xl border border-white/15 bg-[#102b20]/90 px-4 text-sm font-medium text-white outline-none transition focus:border-[#d3a052] focus:ring-2 focus:ring-[#d3a052]/30"
              value={selectedDistrict}
              onChange={(event) => setSelectedDistrict(event.target.value)}
            >
              <option value="All">All Districts</option>
              {DISTRICTS.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>


            {/* Search button */}
            <button
              type="submit"
              disabled={loading}
              className="h-12 rounded-xl bg-[#d3a052] px-6 text-sm font-black text-[#102b20] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#e0b369]"
            >
              <span className="inline-flex items-center gap-2">
                <Search size={16} />
                {loading ? "Searching..." : "Search Places"}
              </span>
            </button>

          </form>


          {/* Contribute button */}
          <Link
            href="/places/new"
            className="mt-5 inline-flex w-fit items-center justify-center gap-2 rounded-2xl border border-[#d3a052]/50 bg-[#d3a052]/15 px-5 py-3 text-sm font-bold text-[#f5d188] transition hover:bg-[#d3a052]/25"
          >
            <Plus size={18} />
            Contribute a Place
          </Link>

        </div>

      </div>

    </div>

  </div>


  {/* =====================================================
      PREVIOUS BUTTON
  ===================================================== */}
  <button
    type="button"
    onClick={previousImage}
    aria-label="Previous image"
    className="absolute left-5 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white shadow-lg backdrop-blur-md transition hover:bg-black/50"
  >
    <ChevronLeft size={22} />
  </button>


  {/* =====================================================
      NEXT BUTTON
  ===================================================== */}
  <button
    type="button"
    onClick={nextImage}
    aria-label="Next image"
    className="absolute right-5 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white shadow-lg backdrop-blur-md transition hover:bg-black/50"
  >
    <ChevronRight size={22} />
  </button>


  {/* =====================================================
      CAROUSEL DOTS
  ===================================================== */}
  <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">

    {heroImages.map((_, index) => (
      <button
        key={index}
        type="button"
        onClick={() => setCurrentImage(index)}
        aria-label={`Go to slide ${index + 1}`}
        className={`h-2.5 rounded-full transition-all duration-300 ${
          currentImage === index
            ? "w-8 bg-[#d3a052]"
            : "w-2.5 bg-white/50 hover:bg-white/80"
        }`}
      />
    ))}

  </div>
      </section>

      {/* =====================================================
          PLACES SECTION
      ===================================================== */}
      <section id="places-results" className="container-main mt-12 scroll-mt-8">

        {/* Section heading */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <p className="mb-2 text-sm font-semibold tracking-wide text-[#b07835]">
              EXPLORE THE COLLECTION
            </p>

           <h2 className="font-display text-4xl font-semibold tracking-[-0.03em] text-[#18372a] sm:text-5xl">
            Places worth discovering
           </h2>

           <p className="mt-2 text-lg font-semibold text-[#334f41]">
            {filteredPlaces.length} hidden destinations waiting to be explored
          </p>
          </div>

          <button
            type="button"
            onClick={() => void loadPlaces(selectedCategory, selectedDistrict)}
            disabled={loading}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#18372a]/10 bg-white px-4 py-2.5 text-sm font-semibold text-[#18372a] shadow-sm transition hover:bg-[#f0eadf]"
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

        </div>

        {errorMessage ? (
          <div role="alert" className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
            {errorMessage}
          </div>
        ) : null}

        {/* =====================================================
            LOADING
        ===================================================== */}
        {loading ? (
          <div className="flex h-72 items-center justify-center rounded-3xl border border-[#d9cfbd] bg-white text-base text-[#718078] shadow-sm">
            Loading hidden destinations...
          </div>

        ) : filteredPlaces.length === 0 ? (

          /* =====================================================
              EMPTY STATE
          ===================================================== */
          <div className="rounded-3xl border border-dashed border-[#cdbfa5] bg-white px-6 py-16 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#edf2ec]">
              <Compass
                size={28}
                className="text-[#315b43]"
              />
            </div>

            <h3 className="mt-5 font-display text-3xl font-semibold text-[#18372a] sm:text-4xl">
              No places found
            </h3>

            <p className="mx-auto mt-3 max-w-md text-lg leading-7 text-[#718078]">
              We could not find any destinations matching your current
              search and filters.
            </p>

            <button
              type="button"
              onClick={() => {
                setSelectedCategory("All");
                setSelectedDistrict("All");
                void loadPlaces();
              }}
              className="mt-6 rounded-xl bg-[#18372a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#28543c]"
            >
              Reset Filters
            </button>

          </div>

        ) : (

          /* =====================================================
              PLACES GRID
          ===================================================== */
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPlaces.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
              />
            ))}
          </div>

        )}

      </section>

    </main>
  );
}
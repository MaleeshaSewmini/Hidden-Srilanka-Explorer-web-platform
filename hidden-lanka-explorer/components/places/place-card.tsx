"use client";

import Image from "next/image";
import { Bookmark, Heart, MapPin, Plus, Eye, Compass } from "lucide-react";
import { useState } from "react";

import { useTrip } from "@/lib/trip-context";
import PlaceDetailModal, { PlaceDetail } from "@/components/places/place-detail-modal";

const CATEGORY_EMOJIS: Record<string, string> = {
  nature: "🌿",
  temples: "🛕",
  beaches: "🏝️",
  wildlife: "🐘",
  waterfalls: "💧",
  ruins: "🏛️",
  villages: "🏡",
  caves: "⛰️",
};

export type PlaceCardProps = {
  place: PlaceDetail & {
    image?: string | null;
    rating?: number | null;
    reviews?: number | null;
    likes?: number | null;
    distance?: string | null;
  };
};

export default function PlaceCard({ place }: PlaceCardProps) {
  const { placeIds, addPlace, removePlace } = useTrip();

  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState<number>(
    place.likes ?? (place as any).like_count ?? 12
  );
  const [showModal, setShowModal] = useState(false);

  const inTrip = placeIds.includes(place.id);

  function toggleLike(e: React.MouseEvent) {
    e.stopPropagation();
    setLiked((value) => !value);
    setLikes((value: number) => value + (liked ? -1 : 1));
  }

  function toggleTrip(e: React.MouseEvent) {
    e.stopPropagation();
    if (inTrip) {
      removePlace(place.id);
    } else {
      addPlace(place.id);
    }
  }

  // Only use image if the user actually uploaded one. NO Unsplash fallback!
  const rawImage =
    place.hero_image_url ||
    place.image_url ||
    place.image ||
    null;

  const hasImage = Boolean(rawImage && typeof rawImage === "string" && rawImage.trim().length > 0);

  const categoryName = place.category || "Hidden Gem";
  const categoryKey = categoryName.toLowerCase();
  const categoryEmoji = CATEGORY_EMOJIS[categoryKey] || "🌿";

  const difficultyText = place.difficulty || "Moderate";
  const seasonText = place.best_season || place.season || "Year-Round";
  const distanceText = place.distance_from_colombo
    ? `${place.distance_from_colombo} km`
    : place.distance || "Hidden Gem";

  return (
    <>
      <article className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-[#0b2417]/10 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
        {/* Top Image or Authentic No-Image Placeholder */}
        <div>
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#0b2417]">
            {hasImage ? (
              <Image
                src={rawImage!}
                alt={place.name}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition duration-700 group-hover:scale-105"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#0b2417] via-[#123b26] to-[#1c5538] p-5 text-center">
                <span className="text-4xl drop-shadow-sm">{categoryEmoji}</span>
                <span className="mt-2 text-xs font-bold uppercase tracking-wider text-[#f1cf88]">
                  {categoryName}
                </span>
                <span className="mt-1 flex items-center gap-1 text-[11px] text-white/60">
                  <Compass size={12} className="text-[#f1cf88]" /> Verified Place
                </span>
              </div>
            )}

            {/* Badges on Card */}
            <div className="absolute left-3.5 top-3.5 rounded-full bg-[#0b2417]/85 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
              {categoryName}
            </div>

            <div className="absolute right-3.5 top-3.5 rounded-full bg-white/100 px-3 py-1 text-xs font-semibold text-[#0b2417] shadow-sm backdrop-blur-md">
              ★ {place.rating ?? 4.8}
            </div>
          </div>

          {/* Card Body */}
          <div className="p-5">
  <div className="flex items-center gap-1.5 text-[20px] font-medium text-[#718078]">
    <MapPin size={14} className="text-[#a06a1d]" />
    <span>{place.district || "Sri Lanka"}</span>
    <span className="text-[#b2bfb6]">•</span>
    <span>{distanceText}</span>
  </div>

            <h3
              onClick={() => setShowModal(true)}
              className="mt-2 line-clamp-1 cursor-pointer font-display text-[1.7rem] leading-tight font-bold text-[#0b2417] transition hover:text-[#a06a1d]"
            >
              {place.name}
            </h3>

            <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#61746a]">
              {place.short_description ||
                place.description ||
                "A stunning hidden gem ready to be explored."}
            </p>

            {/* Quick Specs */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-[#f6f1e8] p-2.5">
                <div className="text-[11px] text-[#718078]">Difficulty</div>
                <div className="mt-0.5 font-semibold text-[#0b2417]">
                  {difficultyText}
                </div>
              </div>

              <div className="rounded-xl bg-[#f6f1e8] p-2.5">
                <div className="text-[11px] text-[#718078]">Best season</div>
                <div className="mt-0.5 font-semibold text-[#0b2417]">
                  {seasonText}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Footer: See More Button & Actions */}
        <div className="p-5 pt-0">
  <button
    type="button"
    onClick={() => setShowModal(true)}
            className="mb-3.5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#c58b45] py-2.5 font-display text-base font-semibold text-[#102b20] transition hover:bg-[#d3a052] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c58b45] focus-visible:ring-offset-2"
  >
            <Eye size={14} />
    See More
  </button>

          <div className="flex items-center justify-between border-t border-[#0b2417]/10 pt-3 text- text-[#718078]">
            <span>{place.reviews ?? 12} reviews</span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Like place"
                onClick={toggleLike}
                className={`rounded-full p-1.5 transition ${
                  liked ? "bg-rose-50 text-rose-500" : "hover:bg-[#f6f1e8]"
                }`}
              >
                <Heart size={16} fill={liked ? "currentColor" : "none"} />
              </button>

              <span className="mr-1 text-xs font-semibold text-[#5a6b62]">{likes}</span>

              <button
                type="button"
                aria-label="Add to trip"
                onClick={toggleTrip}
                className={`rounded-full p-1.5 transition ${
                  inTrip
                    ? "bg-[#0b2417] text-white"
                    : "hover:bg-[#f6f1e8] text-[#0b2417]"
                }`}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* Modal with Cross Mark Close */}
      <PlaceDetailModal
        place={place}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onLike={() => {
          setLiked((v) => !v);
          setLikes((v: number) => v + (liked ? -1 : 1));
        }}
        onTripToggle={() => {
          if (inTrip) removePlace(place.id);
          else addPlace(place.id);
        }}
        isLiked={liked}
        inTrip={inTrip}
      />
    </>
  );
}
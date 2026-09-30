"use client";

import Image from "next/image";
import Link from "next/link";
import { Bookmark, Heart, MapPin, Plus } from "lucide-react";
import { useState } from "react";

import { useTrip } from "@/lib/trip-context";

type PlaceCardProps = {
  place: {
    id: string;
    name: string;
    slug: string;
    category: string;
    district: string;
    image: string;
    rating: number;
    reviews: number;
    likes: number;
    difficulty: string;
    season: string;
    distance: string;
  };
};

export default function PlaceCard({ place }: PlaceCardProps) {
  const { placeIds, addPlace, removePlace } = useTrip();

  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(place.likes);

  const inTrip = placeIds.includes(place.id);

  function toggleLike() {
    setLiked((value) => !value);
    setLikes((value) => value + (liked ? -1 : 1));
  }

  function toggleTrip() {
    if (inTrip) {
      removePlace(place.id);
    } else {
      addPlace(place.id);
    }
  }

  return (
    <article className="group overflow-hidden rounded-3xl border border-[#0b2417]/10 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={place.image}
          alt={place.name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition duration-700 group-hover:scale-105"
        />

        <div className="absolute left-4 top-4 rounded-full bg-[#0b2417]/85 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          {place.category}
        </div>

        <div className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#0b2417]">
          ★ {place.rating}
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-1 text-xs text-[#718078]">
          <MapPin size={14} />
          {place.district} · {place.distance}
        </div>

        <Link href={`/places/${place.slug}`}>
          <h3 className="mt-2 font-display text-2xl text-[#0b2417] hover:text-[#a77a2f]">
            {place.name}
          </h3>
        </Link>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl bg-[#f6f1e8] p-3">
            <div className="text-[#718078]">Difficulty</div>
            <div className="mt-1 font-semibold">{place.difficulty}</div>
          </div>

          <div className="rounded-xl bg-[#f6f1e8] p-3">
            <div className="text-[#718078]">Best season</div>
            <div className="mt-1 font-semibold">{place.season}</div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-[#0b2417]/10 pt-4">
          <div className="flex items-center gap-1 text-sm text-[#718078]">
            {place.reviews} reviews
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Like place"
              onClick={toggleLike}
              className={`rounded-full p-2 ${
                liked
                  ? "bg-red-50 text-red-500"
                  : "hover:bg-[#f6f1e8]"
              }`}
            >
              <Heart size={18} fill={liked ? "currentColor" : "none"} />
            </button>

            <span className="mr-1 text-xs text-[#718078]">{likes}</span>

            <button
              type="button"
              aria-label="Bookmark place"
              className="rounded-full p-2 hover:bg-[#f6f1e8]"
            >
              <Bookmark size={18} />
            </button>

            <button
              type="button"
              aria-label="Add to trip"
              onClick={toggleTrip}
              className={`rounded-full p-2 ${
                inTrip
                  ? "bg-[#0b2417] text-white"
                  : "hover:bg-[#f6f1e8]"
              }`}
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
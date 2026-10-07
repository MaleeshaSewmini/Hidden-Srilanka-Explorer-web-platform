"use client";

import { useEffect } from "react";
import Image from "next/image";
import {
  X,
  MapPin,
  Compass,
  Calendar,
  Clock,
  Sparkles,
  Shield,
  AlertTriangle,
  Car,
  Footprints,
  Tag,
  Share2,
  Bookmark,
  Heart,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

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

export type PlaceDetail = {
  id: string;
  name: string;
  slug?: string | null;
  category?: string | null;
  district?: string | null;
  nearest_town?: string | null;
  address?: string | null;
  image?: string | null;
  hero_image_url?: string | null;
  image_url?: string | null;
  short_description?: string | null;
  description?: string | null;
  hidden_tips?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  difficulty?: string | null;
  season?: string | null;
  best_season?: string | null;
  best_time?: string | null;
  visit_duration?: string | null;
  entrance_fee?: string | null;
  opening_hours?: string | null;
  distance?: string | null;
  distance_from_colombo?: number | null;
  accessibility?: string | null;
  transport?: string[] | string | null;
  road_condition?: string | null;
  activities?: string[] | string | null;
  safety_level?: string | null;
  safety_tips?: string | null;
  warnings?: string | null;
  is_verified?: boolean | null;
  rating?: number | null;
  reviews?: number | null;
  likes?: number | null;
  created_at?: string | null;
};

type PlaceDetailModalProps = {
  place: PlaceDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onLike?: () => void;
  onTripToggle?: () => void;
  isLiked?: boolean;
  inTrip?: boolean;
};

function formatList(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [String(value)];
}

export default function PlaceDetailModal({
  place,
  isOpen,
  onClose,
  onLike,
  onTripToggle,
  isLiked = false,
  inTrip = false,
}: PlaceDetailModalProps) {
  // Close on Escape key press
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !place) return null;

  // Only use image if user uploaded one. NO Unsplash fallback!
  const rawImage =
    place.hero_image_url ||
    place.image_url ||
    place.image ||
    null;

  const hasImage = Boolean(rawImage && typeof rawImage === "string" && rawImage.trim().length > 0);

  const categoryName = place.category || "Hidden Gem";
  const categoryKey = categoryName.toLowerCase();
  const categoryEmoji = CATEGORY_EMOJIS[categoryKey] || "🌿";

  const seasonText = place.best_season || place.season || "Year-Round";
  const distanceText = place.distance_from_colombo
    ? `${place.distance_from_colombo} km from Colombo`
    : place.distance || null;

  const activitiesList = formatList(place.activities);
  const transportList = formatList(place.transport);

  const googleMapsUrl =
    place.latitude && place.longitude
      ? `https://www.google.com/maps?q=${place.latitude},${place.longitude}`
      : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-place-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-8"
    >
      {/* Dark backdrop blur */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-[#d9d0bf] bg-white shadow-2xl transition-all">
        {/* Sticky Cross Close Button at top right */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-[#0b2417]/80 text-white shadow-lg backdrop-blur-md transition duration-200 hover:scale-105 hover:bg-[#0b2417] focus:outline-none focus:ring-2 focus:ring-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto">
          {/* Hero Banner (Photo OR Authentic No-Image Header) */}
          <div className="relative aspect-[16/9] w-full max-h-[380px] overflow-hidden bg-[#0b2417] sm:aspect-[21/9]">
            {hasImage ? (
              <>
                <Image
                  src={rawImage!}
                  alt={place.name}
                  fill
                  priority
                  unoptimized
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />
              </>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#0b2417] via-[#123b26] to-[#1c5538] p-8 text-center text-[#f1cf88]">
                <span className="text-5xl drop-shadow-md">{categoryEmoji}</span>
                <span className="mt-2 text-xs font-bold uppercase tracking-widest text-[#f1cf88]">
                  {categoryName}
                </span>
                <span className="mt-1 text-xs text-white/60">
                  {place.district ? `${place.district} District` : "Sri Lanka"}
                </span>
              </div>
            )}

            {/* Badges on Hero */}
            <div className="absolute left-5 top-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#0b2417]/90 px-3.5 py-1 text-xs font-semibold text-[#f1cf88] shadow-sm backdrop-blur-md">
                {categoryName}
              </span>

              {place.is_verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/90 px-3 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-md">
                  <CheckCircle2 size={13} /> Verified
                </span>
              )}
            </div>

            {/* Hero Bottom Title Info */}
            <div className="absolute bottom-5 left-5 right-5 text-white">
              <div className="flex items-center gap-2 text-sm font-medium text-white/80">
                <MapPin size={14} className="text-[#f1cf88]" />
                <span>
                  {place.district ? `${place.district} District` : "Sri Lanka"}
                </span>
                {place.nearest_town && <span>• {place.nearest_town}</span>}
                {distanceText && <span>• {distanceText}</span>}
              </div>

              <h2
                id="modal-place-title"
                className="mt-1.5 font-display text-2xl font-bold text-white sm:text-3xl md:text-4xl"
              >
                {place.name}
              </h2>
            </div>
          </div>

          {/* Modal Inner Content */}
          <div className="space-y-6 p-5 sm:p-7 md:p-8">
            {/* Action Bar (Trip & Like) */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eae1d3] pb-4">
              <div className="flex items-center gap-3">
                {place.rating ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-base font-bold text-amber-900 border border-amber-200">
                    ★ {place.rating}
                    <span className="text-base font-normal text-black">
                      ({place.reviews || 0} reviews)
                    </span>
                  </span>
                ) : null}

                {place.difficulty && (
                  <span className="rounded-full bg-[#f6f1e8] px-3 py-1 text-base font-semibold text-[#0b2417]">
                    Difficulty: <strong>{place.difficulty}</strong>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {onLike && (
                  <button
                    type="button"
                    onClick={onLike}
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-base font-semibold transition ${
                      isLiked
                        ? "bg-rose-50 text-rose-600 border border-rose-200"
                        : "bg-[#f6f1e8] text-[#0b2417] hover:bg-[#ede5d7]"
                    }`}
                  >
                    <Heart size={14} fill={isLiked ? "currentColor" : "none"} />
                    {isLiked ? "Liked" : "Like"}
                  </button>
                )}

                {onTripToggle && (
                  <button
                    type="button"
                    onClick={onTripToggle}
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-base font-semibold transition ${
                      inTrip
                        ? "bg-[#0b2417] text-white"
                        : "bg-[#0b2417]/10 text-[#0b2417] hover:bg-[#0b2417]/15"
                    }`}
                  >
                    <Bookmark size={14} />
                    {inTrip ? "Saved in Trip" : "Save to Trip"}
                  </button>
                )}

                {googleMapsUrl && (
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#c99a43] px-4 py-2 text-xs font-bold text-[#0b2417] transition hover:bg-[#dfb157]"
                  >
                    <Compass size={14} />
                    Open Map
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border-2 border-[#a06a1d] bg-[#faf7f0] p-3.5">
                <span className="flex items-center gap-1.5 text-[18px] font-semibold uppercase tracking-wider text-black">
                  <Calendar size={15} className="text-[#a06a1d]" /> Best Season
                </span>
                <p className="mt-1 text-sm font-bold text-[#0b2417]">
                  {seasonText}
                </p>
              </div>

              <div className="rounded-2xl border-2 border-[#a06a1d] bg-[#faf7f0] p-3.5">
                <span className="flex items-center gap-1.5 text-[18px] font-semibold uppercase tracking-wider text-black">
                  <Clock size={15} className="text-[#a06a1d]" /> Best Time
                </span>
                <p className="mt-1 text-sm font-bold text-[#0b2417]">
                  {place.best_time || "Morning / Afternoon"}
                </p>
              </div>

              <div className="rounded-2xl border-2 border-[#a06a1d] bg-[#faf7f0] p-3.5">
                <span className="flex items-center gap-1.5 text-[18px] font-semibold uppercase tracking-wider text-black">
                  <Footprints size={15} className="text-[#a06a1d]" /> Duration
                </span>
                <p className="mt-1 text-sm font-bold text-[#0b2417]">
                  {place.visit_duration || "1 - 3 hours"}
                </p>
              </div>

              <div className="rounded-2xl border-2 border-[#a06a1d] bg-[#faf7f0] p-3.5">
                <span className="flex items-center gap-1.5 text-[18px] font-semibold uppercase tracking-wider text-black">
                  <Car size={13} className="text-[#a06a1d]" /> Road
                </span>
                <p className="mt-1 text-sm font-bold text-[#0b2417]">
                  {place.road_condition || "Accessible"}
                </p>
              </div>
            </div>

            {/* Full Description Section */}
            <div>
              <h3 className="text-base font-bold text-[#0b2417]">
                About This Hidden Gem
              </h3>
              <p className="mt-3 text-[17px] leading-loose text-slate-800 tracking-wide whitespace-pre-line font-normal">
                {place.description ||
                  place.short_description ||
                  "A pristine, lesser-known attraction in Sri Lanka offering unspoiled natural beauty and tranquil heritage."}
              </p>
            </div>

            {/* Insider / Hidden Tips Box */}
            {place.hidden_tips && (
              <div className="rounded-2xl border-l-4 border-[#c99a43] bg-[#fbf8f2] p-4.5 shadow-sm">
                <div className="flex items-center gap-2 text-[#a06a1d]">
                  <Sparkles size={16} />
                  <h4 className="text-sm font-bold">Explorer Insider Tips</h4>
                </div>
                <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[#4b5d53]">
                  {place.hidden_tips}
                </p>
              </div>
            )}

            {/* Location & Navigation Section */}
            {(place.address || (place.latitude && place.longitude)) && (
              <div className="rounded-2xl border-2 border-[#a06a1d] bg-[#faf7f0] p-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="flex items-center gap-1.5 text-[18px] font-semibold uppercase tracking-wider text-black">
                    <MapPin size={16} className="text-[#0b2417]" />
                    Location & Directions
                  </h4>
                  {googleMapsUrl && (
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-[#a06a1d] hover:underline"
                    >
                      View on Google Maps →
                    </a>
                  )}
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2 text-base  text-zinc-800">
                  {place.address && (
                    <div>
                      <span className="font-semibold  text-zinc-800">Address : </span>
                      <strong className="font-medium">{place.address}</strong>
                    </div>
                  )}

                  {place.nearest_town && (
                    <div>
                      <span className="font-semibold  text-zinc-800">Nearest Town : </span>
                      <strong className="font-medium">{place.nearest_town}</strong>
                    </div>
                  )}

                  {place.latitude && place.longitude && (
                    <div>
                      <span className="font-semibold  text-zinc-800">Coordinates : </span>
                      <span className="font-mono">
                       <strong className="font-bold">{place.latitude.toFixed(5)}</strong>, <strong className="font-bold">{place.longitude.toFixed(5)}</strong>
                      </span>
                    </div>
                  )}

                  {place.accessibility && (
                    <div>
                      <span className="font-semibold  text-zinc-800">Accessibility : </span>
                      <strong className="font-medium">{place.accessibility}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Activities Tags */}
            {activitiesList.length > 0 && (
              <div>
                <h4 className="flex items-center gap-1.5 text-[18px] font-semibold uppercase tracking-wider text-black">
                  <Tag size={15} /> Recommended Activities
                </h4>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {activitiesList.map((activity) => (
                    <span
                      key={activity}
                      className="rounded-full bg-[#f1e7d6] px-3 py-1 text-base font-semibold text-[#123b26]"
                    >
                      {activity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Transport Options */}
            {transportList.length > 0 && (
              <div>
                <h4 className="flex items-center gap-1.5 text-[18px] font-semibold uppercase tracking-wider text-black">
                  <Car size={20} /> Suitable Transport
                </h4>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {transportList.map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-[#f1e7d6] px-3 py-1 text-base font-semibold text-[#123b26]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing & Hours Grid */}
            {(place.entrance_fee || place.opening_hours) && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-base text-zinc-800">
                {place.entrance_fee && (
                  <div className="rounded-2xl border-l-4 border-[#c99a43] bg-[#fbf8f2] p-4.5 shadow-sm">
                    <span className="font-semibold text-black">Entrance Fee:</span>
                    <p className="mt-1 font-bold text-[#0b2417]">{place.entrance_fee}</p>
                  </div>
                )}
                {place.opening_hours && (
                  <div className="rounded-2xl border-l-4 border-[#c99a43] bg-[#fbf8f2] p-4.5 shadow-sm">
                    <span className="font-semibold text-black">Opening Hours:</span>
                    <p className="mt-1 font-bold text-[#0b2417]">{place.opening_hours}</p>
                  </div>
                )}
              </div>
            )}

            {/* Safety & Advisory */}
            {(place.safety_level || place.safety_tips || place.warnings) && (
              <div className="rounded-2xl border-2 border-[#a06a1d] bg-[#faf7f0] p-3.5">
                <div className="flex items-center gap-2 text-amber-900">
                  <Shield size={16} />
                  <h4 className="text-base font-bold">Safety & Travel Advisory</h4>
                </div>

                <div className="mt-2 space-y-1.5 text-base text-amber-1000">
                  {place.safety_level && (
                    <p>
                      <strong>Safety Level :</strong> <strong className="font-medium">{place.safety_level}</strong>
                    </p>
                  )}
                  {place.safety_tips && (
                    <p>
                      <strong>Safety Tips :</strong> {place.safety_tips}
                    </p>
                  )}
                  {place.warnings && (
                    <p className="flex items-start gap-1 text-rose-800">
                      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                      <span>
                        <strong>Warning:</strong> <strong className="font-medium">{place.warnings}</strong>
                      </span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer with Close Button */}
        <div className="flex items-center justify-between border-t border-[#eae1d3] bg-[#faf7f0] px-6 py-4">
          <span className="text-base font-medium italic text-black">
            Hidden Lanka Explorer Community
          </span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#0b2417] px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#123b26]"
          >
            <X size={14} /> Close
          </button>
        </div>
      </div>
    </div>
  );
}

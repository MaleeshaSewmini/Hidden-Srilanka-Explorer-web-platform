"use client";

import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  Heart,
  Bookmark,
  MapPin,
  Compass,
  Globe,
  Settings,
  LogOut,
  ArrowRight,
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

import PlaceCard from "@/components/places/place-card";
import { PlaceDetail } from "@/components/places/place-detail-modal";
import { useTrip } from "@/lib/trip-context";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

const CATEGORIES = [
  "Waterfalls",
  "Beaches",
  "Mountains",
  "Wildlife",
  "Culture",
  "Food",
  "Caves",
  "Temples",
  "Ruins",
  "Villages",
];

const LANGUAGES = ["Sinhala", "English", "Tamil"];

const DISTRICTS = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle",
  "Gampaha", "Hambantota", "Jaffna", "Kalutara", "Kandy", "Kegalle",
  "Kilinochchi", "Kurunegala", "Mannar", "Matale", "Matara", "Monaragala",
  "Mullaitivu", "Nuwara Eliya", "Polonnaruwa", "Puttalam", "Ratnapura",
  "Trincomalee", "Vavuniya",
];

type UserProfile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  district: string | null;
  travel_style: string | null;
  favorite_categories: string[];
  experience_level: string | null;
  languages: string[];
  website_url: string | null;
  created_at?: string | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const { placeIds, likedPlaceIds } = useTrip();

  const [activeTab, setActiveTab] = useState<"saved" | "likes" | "edit">("saved");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Places lists
  const [savedPlaces, setSavedPlaces] = useState<PlaceDetail[]>([]);
  const [likedPlaces, setLikedPlaces] = useState<PlaceDetail[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState<{
    display_name: string;
    username: string;
    bio: string;
    district: string;
    travel_style: string;
    experience_level: string;
    website_url: string;
    favorite_categories: string[];
    languages: string[];
  }>({
    display_name: "",
    username: "",
    bio: "",
    district: "",
    travel_style: "",
    experience_level: "",
    website_url: "",
    favorite_categories: [],
    languages: [],
  });
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editSuccessMessage, setEditSuccessMessage] = useState("");
  const [editErrorMessage, setEditErrorMessage] = useState("");

  // 1. Load User and Profile from Supabase
  useEffect(() => {
    async function loadUserData() {
      try {
        setLoading(true);
        const { data: authData, error: authErr } = await supabase.auth.getUser();

        if (authErr || !authData?.user) {
          setUser(null);
          setLoading(false);
          return;
        }

        const currentUser = authData.user;
        setUser(currentUser);

        // Fetch user profile from public.profiles
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .maybeSingle();

        if (profileData) {
          const loaded: UserProfile = {
            id: profileData.id,
            username: profileData.username || currentUser.email?.split("@")[0] || "explorer",
            display_name: profileData.display_name || "Explorer",
            avatar_url: profileData.avatar_url,
            bio: profileData.bio,
            district: profileData.district,
            travel_style: profileData.travel_style,
            favorite_categories: Array.isArray(profileData.favorite_categories)
              ? profileData.favorite_categories
              : [],
            experience_level: profileData.experience_level,
            languages: Array.isArray(profileData.languages) ? profileData.languages : [],
            website_url: profileData.website_url,
            created_at: profileData.created_at,
          };
          setProfile(loaded);
          setEditForm({
            display_name: loaded.display_name,
            username: loaded.username,
            bio: loaded.bio || "",
            district: loaded.district || "",
            travel_style: loaded.travel_style || "",
            experience_level: loaded.experience_level || "",
            website_url: loaded.website_url || "",
            favorite_categories: loaded.favorite_categories,
            languages: loaded.languages,
          });
        } else {
          // Fallback if not yet created in table (e.g. from user_metadata)
          const meta = currentUser.user_metadata || {};
          const fallback: UserProfile = {
            id: currentUser.id,
            username: meta.username || currentUser.email?.split("@")[0] || "explorer",
            display_name: meta.display_name || meta.full_name || "Explorer",
            avatar_url: meta.avatar_url || null,
            bio: meta.bio || null,
            district: meta.district || null,
            travel_style: meta.travel_style || null,
            favorite_categories: Array.isArray(meta.favorite_categories) ? meta.favorite_categories : [],
            experience_level: meta.experience_level || null,
            languages: Array.isArray(meta.languages) ? meta.languages : [],
            website_url: meta.website_url || null,
          };
          setProfile(fallback);
          setEditForm({
            display_name: fallback.display_name,
            username: fallback.username,
            bio: fallback.bio || "",
            district: fallback.district || "",
            travel_style: fallback.travel_style || "",
            experience_level: fallback.experience_level || "",
            website_url: fallback.website_url || "",
            favorite_categories: fallback.favorite_categories,
            languages: fallback.languages,
          });
        }
      } catch (err) {
        console.error("LOAD_PROFILE_ERROR", err);
      } finally {
        setLoading(false);
      }
    }

    void loadUserData();
  }, []);

  // 2. Fetch Places for Saved Trips & Liked Places
  useEffect(() => {
    async function loadPlacesDetails() {
      const allIds = Array.from(new Set([...placeIds, ...likedPlaceIds]));
      if (allIds.length === 0) {
        setSavedPlaces([]);
        setLikedPlaces([]);
        return;
      }

      try {
        setLoadingPlaces(true);
        const { data, error } = await supabase
          .from("places")
          .select("*")
          .in("id", allIds);

        if (error) throw error;

        const placesMap = new Map((data || []).map((p) => [p.id, p]));

        const saved = placeIds
          .map((id: string) => placesMap.get(id))
          .filter(Boolean) as PlaceDetail[];

        const liked = likedPlaceIds
          .map((id: string) => placesMap.get(id))
          .filter(Boolean) as PlaceDetail[];

        setSavedPlaces(saved);
        setLikedPlaces(liked);
      } catch (err) {
        console.error("FETCH_PROFILE_PLACES_ERROR", err);
      } finally {
        setLoadingPlaces(false);
      }
    }

    void loadPlacesDetails();
  }, [placeIds, likedPlaceIds]);

  // Handle Photo File selection
  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setEditErrorMessage("Please choose a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setEditErrorMessage("Image must be smaller than 5MB.");
      return;
    }

    setEditErrorMessage("");
    setNewPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  // Handle Edit Profile submission
  async function handleUpdateProfile(e: FormEvent) {
    e.preventDefault();
    if (!user) return;

    setSavingProfile(true);
    setEditSuccessMessage("");
    setEditErrorMessage("");

    try {
      let finalAvatarUrl = profile?.avatar_url || null;

      if (newPhoto) {
        const ext =
          newPhoto.type === "image/png"
            ? "png"
            : newPhoto.type === "image/webp"
              ? "webp"
              : "jpg";
        const path = `${user.id}/avatar-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, newPhoto, { upsert: true, contentType: newPhoto.type });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        finalAvatarUrl = urlData.publicUrl;
      }

      const updatedPayload = {
        id: user.id,
        username: editForm.username.trim().toLowerCase(),
        display_name: editForm.display_name.trim(),
        avatar_url: finalAvatarUrl,
        bio: editForm.bio.trim() || null,
        district: editForm.district || null,
        travel_style: editForm.travel_style || null,
        experience_level: editForm.experience_level || null,
        website_url: editForm.website_url.trim() || null,
        favorite_categories: editForm.favorite_categories,
        languages: editForm.languages,
        updated_at: new Date().toISOString(),
      };

      const { error: upsertErr } = await supabase
        .from("profiles")
        .upsert(updatedPayload, { onConflict: "id" });

      if (upsertErr) throw upsertErr;

      setProfile((prev) => (prev ? { ...prev, ...updatedPayload } : updatedPayload));
      setEditSuccessMessage("Profile updated successfully!");
      setNewPhoto(null);
      setPhotoPreview(null);
      setTimeout(() => setEditSuccessMessage(""), 4000);
    } catch (error: unknown) {
      console.error("UPDATE_PROFILE_ERROR", error);
      setEditErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to update profile. Please try again."
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f3eb] p-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-[#102b20]" />
          <p className="font-display text-lg font-bold text-[#102b20]">
            Loading your explorer profile...
          </p>
        </div>
      </main>
    );
  }

  // Not signed in state
  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f3eb] px-4 py-16">
        <div className="w-full max-w-md rounded-3xl border border-[#d9d0bf] bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#102b20] text-[#f1cf88]">
            <Compass size={32} />
          </div>
          <h2 className="mt-5 font-display text-2xl font-bold text-[#0b2417]">
            Explorer Profile
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#61746a]">
            Sign in to view your personalized explorer profile, access saved trips, and manage liked destinations.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/auth/sign-in"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#102b20] py-3 text-sm font-bold text-white transition hover:bg-[#183f2e]"
            >
              Sign In
            </Link>
            <Link
              href="/auth/sign-up"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#0b2417]/20 bg-[#faf7f0] py-3 text-sm font-bold text-[#0b2417] transition hover:bg-[#f6f1e8]"
            >
              Create Account
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const avatarSrc = photoPreview || profile?.avatar_url || null;
  const initial = (profile?.display_name || user.email || "E")[0].toUpperCase();

  return (
    <main className="min-h-screen bg-[#f7f3eb] pb-24 font-sans text-[#24352b]">
      {/* =====================================================
          PROFILE HERO BANNER
      ===================================================== */}
      <section className="relative bg-gradient-to-b from-[#102b20] via-[#16382a] to-[#1d4635] pt-12 pb-24 text-white">
        <div className="container-main">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            {/* Left: Avatar & User Identity */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-full border-4 border-[#f1cf88] bg-[#0b2417] shadow-xl">
                {avatarSrc ? (
                  <Image
                    src={avatarSrc}
                    alt={profile?.display_name || "Profile"}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-display text-4xl font-bold text-[#f1cf88]">
                    {initial}
                  </div>
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
                    {profile?.display_name || "Explorer"}
                  </h1>
                  {profile?.district && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-[#f1cf88] backdrop-blur-md">
                      <MapPin size={12} /> {profile.district}
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm font-medium text-white/70">
                  @{profile?.username || user.email?.split("@")[0]}
                </p>

                {profile?.bio && (
                  <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-white/85 italic">
                    &ldquo;{profile.bio}&rdquo;
                  </p>
                )}

                {/* Badges for Travel Style, Level, & Website */}
                <div className="mt-3.5 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                  {profile?.travel_style && (
                    <span className="rounded-full bg-[#c99a43]/30 px-3 py-1 font-semibold text-[#f1cf88] border border-[#c99a43]/40">
                      🎒 {profile.travel_style}
                    </span>
                  )}
                  {profile?.experience_level && (
                    <span className="rounded-full bg-white/10 px-3 py-1 font-medium text-white/90">
                      🧭 {profile.experience_level} Explorer
                    </span>
                  )}
                  {profile?.website_url && (
                    <a
                      href={profile.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-white hover:text-[#f1cf88]"
                    >
                      <Globe size={12} /> Website
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Stats & Quick Sign-out */}
            <div className="flex flex-col sm:flex-row md:flex-col items-center gap-3">
              <div className="flex gap-4 rounded-2xl bg-black/30 p-3.5 backdrop-blur-md border border-white/10 text-center">
                <div className="px-3">
                  <span className="block font-display text-2xl font-bold text-[#f1cf88]">
                    {placeIds.length}
                  </span>
                  <span className="text-[11px] font-medium uppercase tracking-wider text-white/70">
                    Saved Trips
                  </span>
                </div>
                <div className="h-8 w-px bg-white/20 my-auto" />
                <div className="px-3">
                  <span className="block font-display text-2xl font-bold text-rose-300">
                    {likedPlaceIds.length}
                  </span>
                  <span className="text-[11px] font-medium uppercase tracking-wider text-white/70">
                    Liked Places
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white/80 transition hover:bg-rose-900/50 hover:text-white"
              >
                <LogOut size={13} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          TAB NAVIGATION CONTROLS
      ===================================================== */}
      <div className="container-main -mt-10 relative z-20">
        <div className="flex rounded-2xl border border-[#d9d0bf] bg-white p-1.5 shadow-lg max-w-xl mx-auto">
          <button
            type="button"
            onClick={() => setActiveTab("saved")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-xs sm:text-sm font-bold transition ${
              activeTab === "saved"
                ? "bg-[#102b20] text-[#f1cf88] shadow-sm"
                : "text-[#61746a] hover:text-[#102b20]"
            }`}
          >
            <Bookmark size={15} />
            Saved for Trips ({placeIds.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("likes")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-xs sm:text-sm font-bold transition ${
              activeTab === "likes"
                ? "bg-[#102b20] text-rose-300 shadow-sm"
                : "text-[#61746a] hover:text-[#102b20]"
            }`}
          >
            <Heart size={15} />
            Liked Places ({likedPlaceIds.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("edit")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-xs sm:text-sm font-bold transition ${
              activeTab === "edit"
                ? "bg-[#102b20] text-white shadow-sm"
                : "text-[#61746a] hover:text-[#102b20]"
            }`}
          >
            <Settings size={15} />
            Edit Profile
          </button>
        </div>
      </div>

      {/* =====================================================
          TAB 1: SAVED FOR TRIPS
      ===================================================== */}
      {activeTab === "saved" && (
        <section className="container-main mt-10">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#102b20]">
                Saved Trip Destinations
              </h2>
              <p className="text-xs text-[#61746a]">
                Places you saved to your itinerary while browsing the Explore section.
              </p>
            </div>
            <Link
              href="/places"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#a06a1d] hover:underline"
            >
              Browse more places <ArrowRight size={13} />
            </Link>
          </div>

          {loadingPlaces ? (
            <div className="flex h-64 items-center justify-center rounded-3xl border border-[#d9d0bf] bg-white text-sm text-[#718078]">
              Loading your saved trips...
            </div>
          ) : savedPlaces.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#cdbfa5] bg-white p-12 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#faf7f0] text-[#a06a1d]">
                <Bookmark size={24} />
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-[#102b20]">
                No places saved to your trip yet
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#61746a] max-w-md mx-auto">
                Explore waterfalls, ancient ruins, and secret beaches across Sri Lanka. Click the &ldquo;+&rdquo; button on any place card to save it here!
              </p>
              <Link
                href="/places"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#102b20] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#183f2e]"
              >
                <Compass size={14} /> Explore Hidden Sri Lanka
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {savedPlaces.map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* =====================================================
          TAB 2: LIKED PLACES
      ===================================================== */}
      {activeTab === "likes" && (
        <section className="container-main mt-10">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#102b20]">
                Liked Places
              </h2>
              <p className="text-xs text-[#61746a]">
                Destinations you gave a heart to in the Explorer section.
              </p>
            </div>
            <Link
              href="/places"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#a06a1d] hover:underline"
            >
              Find more favorites <ArrowRight size={13} />
            </Link>
          </div>

          {loadingPlaces ? (
            <div className="flex h-64 items-center justify-center rounded-3xl border border-[#d9d0bf] bg-white text-sm text-[#718078]">
              Loading liked places...
            </div>
          ) : likedPlaces.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#cdbfa5] bg-white p-12 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                <Heart size={24} />
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-[#102b20]">
                No liked places yet
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#61746a] max-w-md mx-auto">
                Discover Sri Lanka&apos;s hidden beauty. Tap the heart icon on any destination card to keep a collection of your favorite places here!
              </p>
              <Link
                href="/places"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#102b20] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#183f2e]"
              >
                <Compass size={14} /> Go to Explore Section
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {likedPlaces.map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* =====================================================
          TAB 3: EDIT PROFILE FORM
      ===================================================== */}
      {activeTab === "edit" && (
        <section className="container-main mt-10 max-w-3xl">
          <div className="rounded-3xl border border-[#d9d0bf] bg-white p-6 sm:p-10 shadow-xl">
            <div className="flex items-center gap-2 pb-4 border-b border-[#eee5d5]">
              <Settings className="text-[#a06a1d]" size={22} />
              <div>
                <h2 className="font-display text-2xl font-bold text-[#102b20]">
                  Update Explorer Profile
                </h2>
                <p className="text-xs text-[#61746a]">
                  Modify your traveler persona, change preferences, and tell others about yourself.
                </p>
              </div>
            </div>

            {editSuccessMessage && (
              <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                <CheckCircle2 size={16} />
                {editSuccessMessage}
              </div>
            )}

            {editErrorMessage && (
              <div className="mt-5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
                <AlertCircle size={16} />
                {editErrorMessage}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="mt-6 space-y-6">
              {/* Photo Upload */}
              <div className="flex items-center gap-5">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-[#d9d0bf] bg-[#faf7f0]">
                  {avatarSrc ? (
                    <Image
                      src={avatarSrc}
                      alt="Avatar Preview"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-display text-2xl font-bold text-[#102b20]">
                      {initial}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#102b20]">
                    Profile Photo
                  </label>
                  <label className="mt-1.5 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#d9d0bf] bg-[#faf7f0] px-4 py-2 text-xs font-semibold text-[#102b20] transition hover:bg-[#f6f1e8]">
                    <Camera size={14} /> Choose New Photo
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                  <span className="block mt-1 text-[11px] text-[#718078]">
                    PNG, JPG, or WEBP up to 5MB
                  </span>
                </div>
              </div>

              {/* Display Name & Username */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#102b20]">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.display_name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, display_name: e.target.value })
                    }
                    className="mt-1.5 w-full rounded-xl border border-[#d9d0bf] bg-white px-3.5 py-2.5 text-xs text-[#102b20] focus:border-[#102b20] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#102b20]">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.username}
                    onChange={(e) =>
                      setEditForm({ ...editForm, username: e.target.value })
                    }
                    className="mt-1.5 w-full rounded-xl border border-[#d9d0bf] bg-white px-3.5 py-2.5 text-xs text-[#102b20] focus:border-[#102b20] focus:outline-none"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#102b20]">
                  Bio (Short Explorer Story)
                </label>
                <textarea
                  rows={3}
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Tell fellow travelers what you love about exploring hidden Sri Lanka..."
                  className="mt-1.5 w-full rounded-xl border border-[#d9d0bf] bg-white px-3.5 py-2.5 text-xs text-[#102b20] focus:border-[#102b20] focus:outline-none leading-relaxed"
                />
              </div>

              {/* District & Travel Style */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#102b20]">
                    District
                  </label>
                  <select
                    value={editForm.district}
                    onChange={(e) =>
                      setEditForm({ ...editForm, district: e.target.value })
                    }
                    className="mt-1.5 w-full rounded-xl border border-[#d9d0bf] bg-white px-3.5 py-2.5 text-xs text-[#102b20] focus:border-[#102b20] focus:outline-none"
                  >
                    <option value="">Select your home or base district</option>
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#102b20]">
                    Travel Style
                  </label>
                  <select
                    value={editForm.travel_style}
                    onChange={(e) =>
                      setEditForm({ ...editForm, travel_style: e.target.value })
                    }
                    className="mt-1.5 w-full rounded-xl border border-[#d9d0bf] bg-white px-3.5 py-2.5 text-xs text-[#102b20] focus:border-[#102b20] focus:outline-none"
                  >
                    <option value="">Choose your primary style</option>
                    <option value="Hiker & Nature Lover">Hiker & Nature Lover</option>
                    <option value="Road Tripper">Road Tripper</option>
                    <option value="Heritage & Culture Explorer">Heritage & Culture Explorer</option>
                    <option value="Solo Backpacker">Solo Backpacker</option>
                    <option value="Photographer">Photographer</option>
                    <option value="Wildlife Enthusiast">Wildlife Enthusiast</option>
                  </select>
                </div>
              </div>

              {/* Experience Level & Website */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#102b20]">
                    Experience Level
                  </label>
                  <select
                    value={editForm.experience_level}
                    onChange={(e) =>
                      setEditForm({ ...editForm, experience_level: e.target.value })
                    }
                    className="mt-1.5 w-full rounded-xl border border-[#d9d0bf] bg-white px-3.5 py-2.5 text-xs text-[#102b20] focus:border-[#102b20] focus:outline-none"
                  >
                    <option value="">Select level</option>
                    <option value="Beginner">Beginner Explorer</option>
                    <option value="Intermediate">Intermediate Explorer</option>
                    <option value="Seasoned Pathfinder">Seasoned Pathfinder</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#102b20]">
                    Website or Social Link
                  </label>
                  <input
                    type="url"
                    value={editForm.website_url}
                    onChange={(e) =>
                      setEditForm({ ...editForm, website_url: e.target.value })
                    }
                    placeholder="https://instagram.com/yourhandle"
                    className="mt-1.5 w-full rounded-xl border border-[#d9d0bf] bg-white px-3.5 py-2.5 text-xs text-[#102b20] focus:border-[#102b20] focus:outline-none"
                  />
                </div>
              </div>

              {/* Favorite Categories */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#102b20]">
                  Favorite Categories
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => {
                    const isSelected = editForm.favorite_categories.includes(cat);
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => {
                          const updated = isSelected
                            ? editForm.favorite_categories.filter((c) => c !== cat)
                            : [...editForm.favorite_categories, cat];
                          setEditForm({ ...editForm, favorite_categories: updated });
                        }}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                          isSelected
                            ? "bg-[#102b20] text-[#f1cf88]"
                            : "bg-[#faf7f0] text-[#718078] hover:bg-[#f6f1e8]"
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Languages Spoken */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#102b20]">
                  Languages Spoken
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {LANGUAGES.map((lang) => {
                    const isSelected = editForm.languages.includes(lang);
                    return (
                      <button
                        type="button"
                        key={lang}
                        onClick={() => {
                          const updated = isSelected
                            ? editForm.languages.filter((l) => l !== lang)
                            : [...editForm.languages, lang];
                          setEditForm({ ...editForm, languages: updated });
                        }}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                          isSelected
                            ? "bg-[#a06a1d] text-white"
                            : "bg-[#faf7f0] text-[#718078] hover:bg-[#f6f1e8]"
                        }`}
                      >
                        {lang}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-[#eee5d5]">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#102b20] px-8 py-3 text-xs font-bold text-white transition hover:bg-[#183f2e] disabled:opacity-50"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Saving Changes...
                    </>
                  ) : (
                    <>
                       Save Profile Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </section>
      )}
    </main>
  );
}

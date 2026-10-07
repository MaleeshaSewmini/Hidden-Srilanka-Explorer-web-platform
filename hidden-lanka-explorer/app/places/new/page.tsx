"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import "./add-places.css";

const PlaceLocationPicker = dynamic(
  () => import("@/components/Home/map-section"),
  {
    ssr: false,
    loading: () => (
      <div className="map-loading">
        <div className="loading-spinner" />
        <span>Loading map...</span>
      </div>
    ),
  }
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

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

const ACTIVITIES = [
  "Hiking",
  "Photography",
  "Swimming",
  "Camping",
  "Wildlife Watching",
  "Bird Watching",
  "Sightseeing",
  "Cultural Experience",
  "Water Activities",
  "Picnic",
];

const TRANSPORT_OPTIONS = [
  "Car",
  "Bus",
  "Tuk-tuk",
  "Motorcycle",
  "Walking",
  "Train",
];

type Category = {
  id: string;
  name: string;
};

export default function AddPlacePage() {
  const router = useRouter();

  // =====================================================
  // CATEGORY
  // =====================================================

  const [categories, setCategories] = useState<Category[]>(
    []
  );

  const [loadingCategories, setLoadingCategories] =
    useState(true);

  // =====================================================
  // SUBMISSION
  // =====================================================

  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState("");

  const [errorMessage, setErrorMessage] = useState("");

  // =====================================================
  // BASIC INFORMATION
  // =====================================================

  const [name, setName] = useState("");

  const [categoryId, setCategoryId] = useState("");

  const [district, setDistrict] = useState("");

  const [nearestTown, setNearestTown] = useState("");

  const [address, setAddress] = useState("");

  const [shortDescription, setShortDescription] =
    useState("");

  const [description, setDescription] = useState("");

  // =====================================================
  // LOCATION
  // =====================================================

  const [latitude, setLatitude] = useState<number | null>(
    null
  );

  const [longitude, setLongitude] =
    useState<number | null>(null);

  // =====================================================
  // VISIT INFORMATION
  // =====================================================

  const [difficulty, setDifficulty] =
    useState("Moderate");

  const [bestSeason, setBestSeason] = useState("");

  const [bestTime, setBestTime] = useState("");

  const [visitDuration, setVisitDuration] = useState("");

  const [entranceFee, setEntranceFee] = useState("");

  const [openingHours, setOpeningHours] = useState("");

  const [distanceFromColombo, setDistanceFromColombo] =
    useState("");

  const [accessibility, setAccessibility] = useState("");

  // =====================================================
  // TRAVEL
  // =====================================================

  const [transport, setTransport] = useState("");

  const [roadCondition, setRoadCondition] =
    useState("Good");

  // =====================================================
  // ACTIVITIES
  // =====================================================

  const [activities, setActivities] = useState<string[]>(
    []
  );

  // =====================================================
  // SAFETY
  // =====================================================

  const [safetyLevel, setSafetyLevel] =
    useState("Moderate");

  const [safetyTips, setSafetyTips] = useState("");

  const [warnings, setWarnings] = useState("");

  // =====================================================
  // IMAGE
  // =====================================================

  const [heroImage, setHeroImage] =
    useState<File | null>(null);

  const [imagePreview, setImagePreview] =
    useState<string | null>(null);

  // =====================================================
  // HIDDEN TIPS
  // =====================================================

  const [hiddenTips, setHiddenTips] = useState("");

  // =====================================================
  // LOAD CATEGORIES
  // =====================================================

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoadingCategories(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("name", {
          ascending: true,
        });

      if (error) {
        console.error(
          "CATEGORY ERROR:",
          error.message
        );

        setErrorMessage(
          "Unable to load categories. Please check your categories table."
        );

        return;
      }

      setCategories(data ?? []);
    } catch (error) {
      console.error(
        "CATEGORY LOAD ERROR:",
        error
      );

      setErrorMessage(
        "Unable to load categories."
      );
    } finally {
      setLoadingCategories(false);
    }
  }

  // =====================================================
  // ACTIVITIES
  // =====================================================

  function handleActivityChange(
    activity: string
  ) {
    setActivities((current) =>
      current.includes(activity)
        ? current.filter(
            (item) => item !== activity
          )
        : [...current, activity]
    );
  }

  // =====================================================
  // IMAGE
  // =====================================================

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrorMessage(
        "Please select a valid image file."
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(
        "Image must be smaller than 5MB."
      );
      return;
    }

    setErrorMessage("");

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setHeroImage(file);

    setImagePreview(previewUrl);
  }

  function removeImage() {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setHeroImage(null);

    setImagePreview(null);
  }

  // =====================================================
  // CURRENT LOCATION
  // =====================================================

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setErrorMessage(
        "Geolocation is not supported by your browser."
      );

      return;
    }

    setErrorMessage("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(
          position.coords.latitude.toFixed(6)
        );

        const lng = Number(
          position.coords.longitude.toFixed(6)
        );

        setLatitude(lat);

        setLongitude(lng);
      },
      () => {
        setErrorMessage(
          "Unable to access your current location. Please select the location manually on the map."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  // =====================================================
  // SLUG
  // =====================================================

  function createSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  // =====================================================
  // IMAGE UPLOAD
  // =====================================================

  async function uploadHeroImage(
    userId: string,
    placeSlug: string
  ) {
    if (!heroImage) {
      return null;
    }

    const extension =
      heroImage.name
        .split(".")
        .pop()
        ?.toLowerCase() || "jpg";

    const filePath =
      `${userId}/${placeSlug}-${Date.now()}.${extension}`;

    const {
      error: uploadError,
    } = await supabase.storage
      .from("place-images")
      .upload(
        filePath,
        heroImage,
        {
          cacheControl: "3600",
          upsert: false,
          contentType: heroImage.type,
        }
      );

    if (uploadError) {
      throw new Error(
        uploadError.message
      );
    }

    const {
      data,
    } = supabase.storage
      .from("place-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  // =====================================================
  // SUBMIT
  // =====================================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");

    setErrorMessage("");

    // ---------------------------------------------------
    // VALIDATION
    // ---------------------------------------------------

    if (!name.trim()) {
      setErrorMessage(
        "Please enter the place name."
      );
      return;
    }

    if (!categoryId) {
      setErrorMessage(
        "Please select a category."
      );
      return;
    }

    if (!district) {
      setErrorMessage(
        "Please select a district."
      );
      return;
    }

    if (!description.trim()) {
      setErrorMessage(
        "Please provide a description."
      );
      return;
    }

    if (
      latitude === null ||
      longitude === null
    ) {
      setErrorMessage(
        "Please select the place location on the map."
      );
      return;
    }

    // ---------------------------------------------------
    // START
    // ---------------------------------------------------

    try {
      setSubmitting(true);

      // -------------------------------------------------
      // CURRENT USER
      // -------------------------------------------------

      const {
        data: {
          user,
        },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (userError) {
        throw new Error(
          userError.message
        );
      }

      if (!user) {
        throw new Error(
          "You must be signed in to add a place."
        );
      }

      // -------------------------------------------------
      // SLUG
      // -------------------------------------------------

      const baseSlug =
        createSlug(name);

      if (!baseSlug) {
        throw new Error(
          "Unable to create a valid place slug."
        );
      }

      // Add timestamp to make slug unique
      const slug =
        `${baseSlug}-${Date.now()}`;

      // -------------------------------------------------
      // IMAGE
      // -------------------------------------------------

      let imageUrl: string | null =
        null;

      if (heroImage) {
        imageUrl =
          await uploadHeroImage(
            user.id,
            slug
          );
      }

      // -------------------------------------------------
      // DATABASE OBJECT
      // -------------------------------------------------

      const placeData = {
        created_by: user.id,

        category_id: categoryId,

        slug,

        name: name.trim(),

        district,

        nearest_town:
          nearestTown.trim() || null,

        address:
          address.trim() || null,

        short_description:
          shortDescription.trim() || null,

        description:
          description.trim(),

        latitude,

        longitude,

        difficulty,

        best_season:
          bestSeason.trim() || null,

        best_time:
          bestTime.trim() || null,

        visit_duration:
          visitDuration.trim() || null,

        entrance_fee:
          entranceFee.trim() || null,

        opening_hours:
          openingHours.trim() || null,

        distance_from_colombo:
          distanceFromColombo
            ? Number(
                distanceFromColombo
              )
            : null,

        accessibility:
          accessibility.trim() || null,

        transport:
          transport || null,

        road_condition:
          roadCondition || null,

        activities,

        safety_level:
          safetyLevel,

        safety_tips:
          safetyTips.trim() || null,

        warnings:
          warnings.trim() || null,

        hero_image_url:
          imageUrl,

        hidden_tips:
          hiddenTips.trim() || null,

        status: "pending",

        is_verified: false,

        view_count: 0,

        like_count: 0,

        rating_avg: 0,

        rating_count: 0,
      };

      console.log(
        "Submitting place:",
        placeData
      );

      // -------------------------------------------------
      // INSERT
      // -------------------------------------------------

      const {
        error: insertError,
      } = await supabase
        .from("places")
        .insert(placeData);

      // -------------------------------------------------
      // DATABASE ERROR
      // -------------------------------------------------

      if (insertError) {
        console.error(
          "PLACES INSERT ERROR"
        );

        console.error(
          "Code:",
          insertError.code
        );

        console.error(
          "Message:",
          insertError.message
        );

        console.error(
          "Details:",
          insertError.details
        );

        console.error(
          "Hint:",
          insertError.hint
        );

        throw new Error(
          insertError.message ||
            "Failed to save the place."
        );
      }

      // -------------------------------------------------
      // SUCCESS
      // -------------------------------------------------

      setMessage(
        "Place submitted successfully! It will be reviewed before appearing publicly."
      );

      resetForm();

      /*
       * Redirect user to the places page
       * after showing the success message.
       */
      setTimeout(() => {
        router.push("/places");
      }, 1500);

    } catch (error) {
      console.error(
        "ADD PLACE ERROR:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while submitting the place."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // =====================================================
  // RESET
  // =====================================================

  function resetForm() {
    setName("");

    setCategoryId("");

    setDistrict("");

    setNearestTown("");

    setAddress("");

    setShortDescription("");

    setDescription("");

    setLatitude(null);

    setLongitude(null);

    setDifficulty("Moderate");

    setBestSeason("");

    setBestTime("");

    setVisitDuration("");

    setEntranceFee("");

    setOpeningHours("");

    setDistanceFromColombo("");

    setAccessibility("");

    setTransport("");

    setRoadCondition("Good");

    setActivities([]);

    setSafetyLevel("Moderate");

    setSafetyTips("");

    setWarnings("");

    setHiddenTips("");

    removeImage();
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <main className="add-place-page">
      <div className="add-place-container">

        {/* HEADER */}


          <div className="page-header">
  <Link href="/places" className="back-link">
    ← Back to places
  </Link>


          <h1>
            Add a Hidden Place
          </h1>

          <p>
            Share a beautiful,
            interesting, or
            lesser-known place in
            Sri Lanka with other
            explorers.
          </p>
        </div>

        {/* SUCCESS */}

        {message && (
          <div className="alert success">
            <span>✓</span>

            <div>
              {message}
            </div>
          </div>
        )}

        {/* ERROR */}

        {errorMessage && (
          <div className="alert error">
            <span>!</span>

            <div>
              {errorMessage}
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="place-form"
        >

          {/* =================================================
              BASIC INFORMATION
          ================================================= */}

          <section className="form-card">

            <div className="section-heading">

              <div className="section-icon">
                📍
              </div>

              <div>
                <h2>
                  Basic Information
                </h2>

                <p>
                  Tell us about the
                  place you want to
                  share.
                </p>
              </div>

            </div>

            <div className="form-grid">

              {/* PLACE NAME */}

              <div className="form-group full">

                <label>
                  Place Name{" "}
                  <span>*</span>
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(
                      e.target.value
                    )
                  }
                  placeholder="e.g. Bambarakanda Falls"
                  required
                />

              </div>

              {/* CATEGORY */}

              <div className="form-group">

                <label>
                  Category{" "}
                  <span>*</span>
                </label>

                <select
                  value={categoryId}
                  onChange={(e) =>
                    setCategoryId(
                      e.target.value
                    )
                  }
                  required
                >

                  <option value="">
                    {loadingCategories
                      ? "Loading categories..."
                      : "Select category"}
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={
                          category.id
                        }
                        value={
                          category.id
                        }
                      >
                        {
                          category.name
                        }
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* DISTRICT */}

              <div className="form-group">

                <label>
                  District{" "}
                  <span>*</span>
                </label>

                <select
                  value={district}
                  onChange={(e) =>
                    setDistrict(
                      e.target.value
                    )
                  }
                  required
                >

                  <option value="">
                    Select district
                  </option>

                  {DISTRICTS.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* NEAREST TOWN */}

              <div className="form-group">

                <label>
                  Nearest Town
                </label>

                <input
                  type="text"
                  value={nearestTown}
                  onChange={(e) =>
                    setNearestTown(
                      e.target.value
                    )
                  }
                  placeholder="e.g. Haputale"
                />

              </div>

              {/* ADDRESS */}

              <div className="form-group">

                <label>
                  Address
                </label>

                <input
                  type="text"
                  value={address}
                  onChange={(e) =>
                    setAddress(
                      e.target.value
                    )
                  }
                  placeholder="Road, village or area"
                />

              </div>

              {/* SHORT DESCRIPTION */}

              <div className="form-group full">

                <label>
                  Short Description
                </label>

                <input
                  type="text"
                  value={
                    shortDescription
                  }
                  onChange={(e) =>
                    setShortDescription(
                      e.target.value
                    )
                  }
                  maxLength={180}
                  placeholder="A short description for place cards"
                />

                <small>
                  {
                    shortDescription.length
                  }
                  /180
                </small>

              </div>

              {/* DESCRIPTION */}

              <div className="form-group full">

                <label>
                  Description{" "}
                  <span>*</span>
                </label>

                <textarea
                  value={
                    description
                  }
                  onChange={(e) =>
                    setDescription(
                      e.target.value
                    )
                  }
                  rows={6}
                  placeholder="Describe the place, what visitors can see, and what makes it special..."
                  required
                />

              </div>

            </div>

          </section>

          {/* =================================================
              LOCATION
          ================================================= */}

          <section className="form-card">

            <div className="section-heading">

              <div className="section-icon">
                🗺️
              </div>

              <div>
                <h2>
                  Location
                </h2>

                <p>
                  Click on the map to
                  automatically
                  generate coordinates.
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={
                useCurrentLocation
              }
              className="location-button"
            >
              📍 Use My Current Location
            </button>

            <PlaceLocationPicker
              latitude={latitude}
              longitude={longitude}
              onLocationChange={(
                lat,
                lng
              ) => {
                setLatitude(
                  Number(
                    lat.toFixed(6)
                  )
                );

                setLongitude(
                  Number(
                    lng.toFixed(6)
                  )
                );
              }}
            />

            <div className="coordinate-grid">

              <div className="coordinate-box">

                <label>
                  Latitude
                </label>

                <input
                  value={
                    latitude ?? ""
                  }
                  readOnly
                  placeholder="Automatically generated"
                />

              </div>

              <div className="coordinate-box">

                <label>
                  Longitude
                </label>

                <input
                  value={
                    longitude ?? ""
                  }
                  readOnly
                  placeholder="Automatically generated"
                />

              </div>

            </div>

            {latitude !== null &&
              longitude !== null && (
                <div className="location-selected">
                  ✓ Location selected successfully
                </div>
              )}

          </section>

          {/* =================================================
              VISIT INFORMATION
          ================================================= */}

          <section className="form-card">

            <div className="section-heading">

              <div className="section-icon">
                🌿
              </div>

              <div>
                <h2>
                  Visit Information
                </h2>

                <p>
                  Help travelers
                  plan their visit.
                </p>
              </div>

            </div>

            <div className="form-grid">

              {/* DIFFICULTY */}

              <div className="form-group">

                <label>
                  Difficulty
                </label>

                <select
                  value={
                    difficulty
                  }
                  onChange={(e) =>
                    setDifficulty(
                      e.target.value
                    )
                  }
                >

                  <option value="Easy">
                    Easy
                  </option>

                  <option value="Moderate">
                    Moderate
                  </option>

                  <option value="Hard">
                    Hard
                  </option>

                  <option value="Very Hard">
                    Very Hard
                  </option>

                </select>

              </div>

              {/* BEST SEASON */}

              <div className="form-group">

                <label>
                  Best Season
                </label>

                <input
                  value={
                    bestSeason
                  }
                  onChange={(e) =>
                    setBestSeason(
                      e.target.value
                    )
                  }
                  placeholder="e.g. December - April"
                />

              </div>

              {/* BEST TIME */}

              <div className="form-group">

                <label>
                  Best Time
                </label>

                <input
                  value={
                    bestTime
                  }
                  onChange={(e) =>
                    setBestTime(
                      e.target.value
                    )
                  }
                  placeholder="e.g. 6:00 AM - 10:00 AM"
                />

              </div>

              {/* VISIT DURATION */}

              <div className="form-group">

                <label>
                  Visit Duration
                </label>

                <input
                  value={
                    visitDuration
                  }
                  onChange={(e) =>
                    setVisitDuration(
                      e.target.value
                    )
                  }
                  placeholder="e.g. 2 - 3 hours"
                />

              </div>

              {/* ENTRANCE FEE */}

              <div className="form-group">

                <label>
                  Entrance Fee
                </label>

                <input
                  value={
                    entranceFee
                  }
                  onChange={(e) =>
                    setEntranceFee(
                      e.target.value
                    )
                  }
                  placeholder="e.g. Rs. 500 / Free"
                />

              </div>

              {/* OPENING HOURS */}

              <div className="form-group">

                <label>
                  Opening Hours
                </label>

                <input
                  value={
                    openingHours
                  }
                  onChange={(e) =>
                    setOpeningHours(
                      e.target.value
                    )
                  }
                  placeholder="e.g. 6:00 AM - 6:00 PM"
                />

              </div>

              {/* DISTANCE */}

              <div className="form-group">

                <label>
                  Distance from Colombo (km)
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={
                    distanceFromColombo
                  }
                  onChange={(e) =>
                    setDistanceFromColombo(
                      e.target.value
                    )
                  }
                  placeholder="e.g. 180"
                />

              </div>

              {/* ACCESSIBILITY */}

              <div className="form-group">

                <label>
                  Accessibility
                </label>

                <input
                  value={
                    accessibility
                  }
                  onChange={(e) =>
                    setAccessibility(
                      e.target.value
                    )
                  }
                  placeholder="e.g. Moderate trail"
                />

              </div>

            </div>

          </section>

          {/* =================================================
              TRAVEL & ACCESS
          ================================================= */}

          <section className="form-card">

            <div className="section-heading">

              <div className="section-icon">
                🚗
              </div>

              <div>
                <h2>
                  Travel & Access
                </h2>

                <p>
                  Give visitors
                  useful transportation
                  information.
                </p>
              </div>

            </div>

            <div className="form-grid">

              {/* TRANSPORT */}

              <div className="form-group">

                <label>
                  Transport
                </label>

                <select
                  value={
                    transport
                  }
                  onChange={(e) =>
                    setTransport(
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    Select transport
                  </option>

                  {TRANSPORT_OPTIONS.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* ROAD CONDITION */}

              <div className="form-group">

                <label>
                  Road Condition
                </label>

                <select
                  value={
                    roadCondition
                  }
                  onChange={(e) =>
                    setRoadCondition(
                      e.target.value
                    )
                  }
                >

                  <option value="Excellent">
                    Excellent
                  </option>

                  <option value="Good">
                    Good
                  </option>

                  <option value="Moderate">
                    Moderate
                  </option>

                  <option value="Poor">
                    Poor
                  </option>

                </select>

              </div>

            </div>

          </section>

          {/* =================================================
              ACTIVITIES
          ================================================= */}

          <section className="form-card">

            <div className="section-heading">

              <div className="section-icon">
                🥾
              </div>

              <div>
                <h2>
                  Activities
                </h2>

                <p>
                  Select activities
                  visitors can enjoy.
                </p>
              </div>

            </div>

            <div className="activity-grid">

              {ACTIVITIES.map(
                (activity) => {

                  const selected =
                    activities.includes(
                      activity
                    );

                  return (
                    <button
                      key={
                        activity
                      }
                      type="button"
                      className={`activity-chip ${
                        selected
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        handleActivityChange(
                          activity
                        )
                      }
                    >

                      <span>
                        {selected
                          ? "✓"
                          : "+"}
                      </span>

                      {activity}

                    </button>
                  );
                }
              )}

            </div>

          </section>

          {/* =================================================
              SAFETY
          ================================================= */}

          <section className="form-card">

            <div className="section-heading">

              <div className="section-icon">
                ⚠️
              </div>

              <div>
                <h2>
                  Safety Information
                </h2>

                <p>
                  Help visitors
                  understand possible
                  risks.
                </p>
              </div>

            </div>

            <div className="form-grid">

              {/* SAFETY LEVEL */}

              <div className="form-group">

                <label>
                  Safety Level
                </label>

                <select
                  value={
                    safetyLevel
                  }
                  onChange={(e) =>
                    setSafetyLevel(
                      e.target.value
                    )
                  }
                >

                  <option value="Low">
                    Low
                  </option>

                  <option value="Moderate">
                    Moderate
                  </option>

                  <option value="High">
                    High
                  </option>

                </select>

              </div>

              {/* SAFETY TIPS */}

              <div className="form-group full">

                <label>
                  Safety Tips
                </label>

                <textarea
                  value={
                    safetyTips
                  }
                  onChange={(e) =>
                    setSafetyTips(
                      e.target.value
                    )
                  }
                  rows={4}
                  placeholder="e.g. Wear proper shoes and carry drinking water..."
                />

              </div>

              {/* WARNINGS */}

              <div className="form-group full">

                <label>
                  Warnings
                </label>

                <textarea
                  value={
                    warnings
                  }
                  onChange={(e) =>
                    setWarnings(
                      e.target.value
                    )
                  }
                  rows={4}
                  placeholder="e.g. Strong currents during heavy rain..."
                />

              </div>

            </div>

          </section>

          {/* =================================================
              HERO IMAGE
          ================================================= */}

          <section className="form-card">

            <div className="section-heading">

              <div className="section-icon">
                📸
              </div>

              <div>
                <h2>
                  Hero Image
                </h2>

                <p>
                  Upload a main image
                  representing this
                  place.
                </p>
              </div>

            </div>

            {!imagePreview ? (
              <label className="image-upload">

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={
                    handleImageChange
                  }
                />

                <div className="upload-icon">
                  📷
                </div>

                <strong>
                  Click to upload an image
                </strong>

                <span>
                  JPG, PNG or WEBP ·
                  Maximum 5MB
                </span>

              </label>
            ) : (
              <div className="image-preview-wrapper">

                <img src={
                    imagePreview
                  }
                  alt="Place preview"
                  className="image-preview"
                />

                <button type="button" onClick={removeImage}
                  className="remove-image">
                  Remove image
                </button>

              </div>
            )}

          </section>

          {/* =================================================
              HIDDEN TIPS
          ================================================= */}

          <section className="form-card">

            <div className="section-heading">

              <div className="section-icon">
                💡
              </div>

              <div>
                <h2>
                  Hidden Tips
                </h2>

                <p>
                  Share useful local
                  knowledge with
                  explorers.
                </p>
              </div>

            </div>

            <div className="form-group">

              <label>
                Hidden Tips
              </label>

              <textarea
                value={
                  hiddenTips
                }
                onChange={(e) =>
                  setHiddenTips(
                    e.target.value
                  )
                }
                rows={5}
                placeholder="e.g. Visit before 8 AM for fewer crowds..."
              />

            </div>

          </section>

          {/* =================================================
              SUBMIT
          ================================================= */}

          <div className="submit-area">

            <div>

              <strong>
                Your place will be reviewed
              </strong>

              <p>
                Submitted places are
                reviewed before
                appearing publicly.
              </p>

            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={
                submitting
              }
            >

              {submitting ? (
                <>
                  <span className="button-spinner" />

                  Submitting...
                </>
              ) : (
                <>
                  Submit Place →
                </>
              )}

            </button>

          </div>

        </form>
      </div>
    </main>
  );
}
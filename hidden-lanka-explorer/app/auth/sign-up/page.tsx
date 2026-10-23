
"use client";

import Link from "next/link";
import { Roboto } from "next/font/google";
import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@supabase/supabase-js";
import { Eye, EyeOff } from "lucide-react";

function getPasswordStrength(pass: string) {
  if (!pass) {
    return { score: 0, label: "", color: "#dfe5df" };
  }

  let score = 0;
  const hasLength = pass.length >= 8;
  const hasMixedCase = /[a-z]/.test(pass) && /[A-Z]/.test(pass);
  const hasNumber = /\d/.test(pass);
  const hasSpecial = /[^A-Za-z0-9]/.test(pass);
  const isLong = pass.length >= 12;


  if (hasLength) score++;
  if (hasMixedCase) score++;
  if (hasNumber) score++;
  if (hasSpecial || isLong) score++;

  if (pass.length < 8) {
    return { score: 1, label: "Weak", color: "#e05345" };
  }

  if (score <= 1) {
    return { score: 1, label: "Weak", color: "#e05345" };
  } else if (score === 2) {
    return { score: 2, label: "Fair", color: "#e5a53d" };
  } else if (score === 3) {
    return { score: 3, label: "Good", color: "#589c67" };
  } else {
    return { score: 4, label: "Strong", color: "#244d37" };
  }
}

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);

const categories = [
  "Waterfalls",
  "Beaches",
  "Mountains",
  "Wildlife",
  "Culture",
  "Food",
];

const languages = ["Sinhala", "English", "Tamil"];

const districts = [
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

export default function SignUpPage() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [bio, setBio] = useState("");
  const [district, setDistrict] = useState("");
  const [travelStyle, setTravelStyle] = useState("");
  const [favoriteCategories, setFavoriteCategories] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success",
  );
  const [busy, setBusy] = useState(false);
  const strength = getPasswordStrength(password);

  useEffect(() => {
    if (!photo) {
      setPreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(photo);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [photo]);

  function showMessage(
    text: string,
    type: "success" | "error" = "error",
  ) {
    setMessage(text);
    setMessageType(type);
  }

  function toggleItem(
    item: string,
    current: string[],
    update: (value: string[]) => void,
  ) {
    update(
      current.includes(item)
        ? current.filter((value) => value !== item)
        : [...current, item],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim();
    const cleanDisplayName = displayName.trim();
    const cleanWebsite = websiteUrl.trim();

    if (!/^[a-zA-Z0-9_]{3,24}$/.test(cleanUsername)) {
      showMessage(
        "Username must be 3–24 characters and contain only letters, numbers, or underscores.",
      );
      return;
    }

    if (cleanDisplayName.length === 0) {
      showMessage("Please enter your display name.");
      return;
    }

    if (password.length < 8) {
      showMessage("Please use a password with at least 8 characters.");
      return;
    }

    if (photo) {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
      ];

      if (!allowedTypes.includes(photo.type)) {
        showMessage("Please choose a JPG, PNG, or WebP image.");
        return;
      }

      if (photo.size > 5 * 1024 * 1024) {
        showMessage("Choose a profile photo smaller than 5 MB.");
        return;
      }
    }

    if (cleanWebsite) {
      try {
        const parsedUrl = new URL(cleanWebsite);

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          showMessage("Please enter a valid HTTP or HTTPS website URL.");
          return;
        }
      } catch {
        showMessage("Please enter a valid website URL.");
        return;
      }
    }

    setBusy(true);

    const profile = {
      username: cleanUsername,
      display_name: cleanDisplayName,
      bio: bio.trim() || null,
      district: district || null,
      travel_style: travelStyle || null,
      favorite_categories: favoriteCategories,
      experience_level: experienceLevel || null,
      languages: selectedLanguages,
      website_url: cleanWebsite || null,
    };

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: profile,
        },
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error("Account creation could not be completed.");
      }

      // Save the profile and upload the avatar when a session exists.
      if (data.session) {
        let avatarUrl: string | null = null;

        if (photo) {
          const extension =
            photo.type === "image/png"
              ? "png"
              : photo.type === "image/webp"
                ? "webp"
                : "jpg";

          const path = `${data.user.id}/avatar-${Date.now()}.${extension}`;

          const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(path, photo, {
              upsert: true,
              contentType: photo.type,
            });

          if (uploadError) {
            throw uploadError;
          }

          avatarUrl = supabase.storage
            .from("avatars")
            .getPublicUrl(path).data.publicUrl;
        }

        const { error: profileError } = await supabase
          .from("profiles")
          .upsert(
            {
              id: data.user.id,
              ...profile,
              avatar_url: avatarUrl,
            },
            { onConflict: "id" },
          );

        if (profileError) {
          throw profileError;
        }

        setPassword("");
        setPhoto(null);

        showMessage(
          "Your explorer profile is ready. Welcome to Hidden Sri Lanka!",
          "success",
        );
      } else {
        showMessage(
          "Your account has been created! Check your email to confirm it. Your profile details were included in your sign-up metadata. Sign in after confirmation to complete your profile setup.",
          "success",
        );
      }
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Could not create your account. Please try again.",
        "error",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={`page ${roboto.className}`}>
      <section className="card">
        {/* Left hero section */}
        <aside className="hero">
          <Link href="/" className="brand" aria-label="Hidden Sri Lanka home">
           
          </Link>

          <div className="hero-content">
            <p className="hero-kicker">YOUR ISLAND. YOUR WAY.</p>

            <h1>
              Meet the island
              <br />
              beyond the map.
            </h1>

            <p className="hero-description">
              Build your explorer profile and share the places that make
              Sri Lanka unforgettable.
            </p>

            <div className="hero-features">
              <span>Discover hidden places</span>
              <span>Share local experiences</span>
              <span>Connect with explorers</span>
            </div>
          </div>

          <small className="hero-footer">
            Explore thoughtfully. Leave a lighter footprint.
          </small>
        </aside>

        {/* Sign-up form */}
        <div className="form-panel">
          <Link href="/" className="back">
            <span aria-hidden="true">←</span> Back to explore
          </Link>

          <p className="kicker">CREATE YOUR EXPLORER PROFILE</p>

          <h2>Let&apos;s get to know you</h2>

          <p className="intro">
            A few details help other explorers discover what you love.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {/* Profile photo */}
            <label className="photo-picker">
              <span className="avatar">
                {preview ? (
                  <img src={preview} alt="Profile photo preview" />
                ) : (
                  <span aria-hidden="true">＋</span>
                )}
              </span>

              <span className="photo-text">
                <strong>
                  {photo ? "Change profile photo" : "Add a profile photo"}
                </strong>
                <small>JPG, PNG, or WebP · up to 5 MB</small>
              </span>

              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                aria-label="Choose a profile photo"
                onChange={(event) =>
                  setPhoto(event.target.files?.[0] ?? null)
                }
              />
            </label>

            {/* Username and display name */}
            <div className="two-columns">
              <label className="field">
                Username
                <input
                  required
                  minLength={3}
                  maxLength={23}
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="e.g. explorer123"
                />
                <span className="field-hint">
                  Letters, numbers, and underscores
                </span>
              </label>

              <label className="field">
                Display name
                <input
                  required
                  maxLength={60}
                  autoComplete="name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Your name"
                />
              </label>
            </div>

            {/* Email */}
            <label className="field">
              Email address
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </label>

            {/* Password */}
            <label className="field">
              Password
              <div className="password-input-wrapper">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setShowPassword((prev) => !prev);
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={19} strokeWidth={2} />
                  ) : (
                    <Eye size={19} strokeWidth={2} />
                  )}
                </button>
              </div>

              {/* Password strength line */}
              <div className="strength-line-track" aria-hidden="true">
                <div
                  className="strength-line-fill"
                  style={{
                    width: `${password ? (strength.score / 4) * 100 : 0}%`,
                    backgroundColor: strength.color,
                  }}
                />
              </div>

              <div className="password-hint-row">
                <span className="field-hint">
                  Use at least 8 characters.
                </span>
                {password && (
                  <span
                    className="strength-label"
                    style={{ color: strength.color }}
                  >
                    {strength.label}
                  </span>
                )}
              </div>
            </label>

            {/* Bio */}
            <label className="field">
              Short bio <span className="optional">Optional</span>
              <textarea
                maxLength={180}
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder="Tell the community what you love about exploring..."
              />
              <span className="character-count">
                {bio.length}/180 characters
              </span>
            </label>

            {/* District and travel style */}
            <div className="two-columns">
              <label className="field">
                Your district
                <select
                  value={district}
                  onChange={(event) => setDistrict(event.target.value)}
                >
                  <option value="">Choose a district</option>
                  {districts.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                Travel style
                <select
                  value={travelStyle}
                  onChange={(event) => setTravelStyle(event.target.value)}
                >
                  <option value="">Choose your style</option>
                  <option value="Hiking">Hiking</option>
                  <option value="Adventure">Adventure</option>
                  <option value="Relaxing">Relaxing</option>
                  <option value="Culture">Culture</option>
                  <option value="Wildlife">Wildlife</option>
                  <option value="Road trips">Road trips</option>
                </select>
              </label>
            </div>

            {/* Favorite categories */}
            <fieldset>
              <legend>
                Favorite places{" "}
                <span className="optional">Choose any</span>
              </legend>

              <p className="fieldset-description">
                What kind of places do you enjoy discovering?
              </p>

              <div className="chips">
                {categories.map((item) => {
                  const selected = favoriteCategories.includes(item);

                  return (
                    <button
                      key={item}
                      type="button"
                      className={selected ? "chip selected" : "chip"}
                      aria-pressed={selected}
                      onClick={() =>
                        toggleItem(
                          item,
                          favoriteCategories,
                          setFavoriteCategories,
                        )
                      }
                    >
                      <span className="chip-check" aria-hidden="true">
                        {selected ? "✓ " : ""}
                      </span>
                      {item}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Experience and website */}
            <div className="two-columns">
              <label className="field">
                Experience level
                <select
                  value={experienceLevel}
                  onChange={(event) =>
                    setExperienceLevel(event.target.value)
                  }
                >
                  <option value="">Choose level</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Experienced">Experienced</option>
                </select>
              </label>

              <label className="field">
                Website <span className="optional">Optional</span>
                <input
                  type="url"
                  autoComplete="url"
                  value={websiteUrl}
                  onChange={(event) => setWebsiteUrl(event.target.value)}
                  placeholder="https://example.com"
                />
              </label>
            </div>

            {/* Languages */}
            <fieldset>
              <legend>Languages you speak</legend>

              <p className="fieldset-description">
                Help other explorers know which languages you speak.
              </p>

              <div className="chips">
                {languages.map((item) => {
                  const selected = selectedLanguages.includes(item);

                  return (
                    <button
                      key={item}
                      type="button"
                      className={selected ? "chip selected" : "chip"}
                      aria-pressed={selected}
                      onClick={() =>
                        toggleItem(
                          item,
                          selectedLanguages,
                          setSelectedLanguages,
                        )
                      }
                    >
                      <span className="chip-check" aria-hidden="true">
                        {selected ? "✓ " : ""}
                      </span>
                      {item}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Feedback */}
            {message && (
              <div
                className={`message ${messageType}`}
                role={messageType === "error" ? "alert" : "status"}
                aria-live="polite"
              >
                <span className="message-icon" aria-hidden="true">
                  {messageType === "success" ? "✓" : "!"}
                </span>
                <p>{message}</p>
              </div>
            )}

            {/* Submit */}
            <button className="submit" type="submit" disabled={busy}>
              {busy ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  Creating your profile...
                </>
              ) : (
                <>
                  Create explorer profile
                  <span className="submit-arrow" aria-hidden="true">
                    →
                  </span>
                </>
              )}
            </button>

            <p className="privacy-note">
              Your journey starts here. You can update your profile details
              later.
            </p>
          </form>

          <p className="signin">
            Already have an account?{" "}
            <Link href="/auth/sign-in">  Sign in</Link>
          </p>
        </div>
      </section>

      <style jsx>{`
        .page {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 40px 24px;
          background: #f2f4ed;
          color: #20372b;
          font-family: inherit;
          -webkit-font-smoothing: antialiased;
        }

        .card {
          width: min(100%, 1160px);
          display: grid;
          grid-template-columns: 0.82fr 1.18fr;
          background: #ffffff;
          border: 1px solid #e7ece5;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 22px 70px #18392716;
          animation: card-enter 0.6s ease-out both;
        }

        .hero {
          padding: 42px 38px;
          min-height: 700px;
          color: white;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 35px;
          background:
            linear-gradient(180deg, #183a2cce, #173426ed),
            url("https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=85")
              center / cover;
        }

        .brand {
          width: fit-content;
          color: white;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 2.5px;
          text-decoration: none;
        }

        .brand span {
          color: #e5c77b;
        }

        .hero-content {
          animation: content-enter 0.7s ease-out 0.1s both;
        }

        .hero-kicker,
        .kicker {
          font-size: 20px;
          font-weight: 800;
          letter-spacing: 1.8px;
          line-height: 5;
        }

        .hero-kicker {
          color: #e5c77b;
        }

        .kicker {
          color: #b08b43;
          margin: 0 0 10px;
        }

        .hero h1 {
          font-size: clamp(36px, 3.5vw, 48px);
          font-weight: 500;
          line-height: 1.15;
          letter-spacing: -1px;
          margin: 18px 0;
        }

        .hero-description {
          color: #e0e9e2;
          line-height: 1.85;
          font-size: 16px;
          max-width: 330px;
        }

        .hero-features {
          display: grid;
          gap: 14px;
          margin-top: 30px;
        }

        .hero-features span {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #edf3ed;
          font-size: 14px;
          line-height: 1.6;
        }

        .hero-features span::before {
          content: "✓";
          display: grid;
          place-items: center;
          flex: 0 0 23px;
          width: 23px;
          height: 23px;
          border: 1px solid #e5c77b80;
          border-radius: 50%;
          color: #e5c77b;
          font-size: 12px;
        }

        .hero-footer {
          color: #d7e1d8;
          font-size: 13px;
          line-height: 1.7;
        }

        .form-panel {
          padding: 20px clamp(24px, 4.5vw, 58px);
          min-width: 0;
          animation: content-enter 0.6s ease-out 0.1s both;
        }

        .back {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 25px;
          color: #65776c;
          text-decoration: none;
          font-size: 15px;
          line-height: 1.6;
          transition:
            color 0.2s ease,
            transform 0.2s ease;
        }

        .back:hover {
          color: #244d37;
          transform: translateX(-3px);
        }

        .form-panel h2 {
          font-size: clamp(28px, 3vw, 36px);
          font-weight: 500;
          line-height: 1.25;
          letter-spacing: -0.7px;
          margin: 8px 0 12px;
        }

        .intro {
          color: #030303;
          font-size: 18px;
          line-height: 1.8;
          margin: 0 0 28px;
        }

        form {
          display: grid;
          gap: 20px;
        }

        .photo-picker {
          position: relative;
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          margin-bottom: 4px;
          padding: 13px;
          border: 1px dashed #d6e0d4;
          border-radius: 12px;
          background: #fbfcf9;
          transition:
            background 0.25s ease,
            border-color 0.25s ease,
            transform 0.25s ease;
        }

        .photo-picker:hover {
          background: #f2f6ef;
          border-color: #77957b;
          transform: translateY(-2px);
        }

        .photo-picker:focus-within {
          outline: 3px solid #66836b55;
          outline-offset: 3px;
        }

        .photo-picker input {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        .avatar {
          flex: 0 0 64px;
          width: 64px;
          height: 64px;
          display: grid;
          place-items: center;
          overflow: hidden;
          border-radius: 50%;
          background: #edf2eb;
          color: #58735d;
          font-size: 30px;
          transition: transform 0.3s ease;
        }

        .photo-picker:hover .avatar {
          transform: scale(1.05);
        }

        .avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .photo-text {
          min-width: 2;
        }

        .photo-picker strong,
        .photo-picker small {
          display: block;
        }

        .photo-picker strong {
          font-size: 15px;
          font-weight: 700;
          line-height: 1.6;
        }

        .photo-picker small {
          margin-top: 5px;
          color: #080806;
          font-size: 15px;
          line-height: 1.6;
        }

        .two-columns {
          display: grid;
          grid-template-columns: repeat(1, minmax(0, 1fr));
          gap: 18px;
        }

        .field {
          display: grid;
          gap: 9px;
          min-width: 0;
          font-size: 17px;
          font-weight: 600;
          line-height: 1.5;
        }

        .field input,
        .field select,
        .field textarea {
          box-sizing: border-box;
          width: 100%;
          min-height: 49px;
          padding: 12px 14px;
          border: 1px solid #dfe5df;
          border-radius: 9px;
          outline: none;
          background: #ffffff;
          color: #20372b;
          font-family: inherit;
          font-size: 15px;
          font-weight: 400;
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            background 0.2s ease;
        }

        .field input::placeholder,
        .field textarea::placeholder {
          color: #929d94;
          opacity: 1;
        }

        .field input:hover,
        .field select:hover,
        .field textarea:hover {
          border-color: #b8c8b9;
        }

        .field input:focus,
        .field select:focus,
        .field textarea:focus {
          border-color: #66836b;
          background: #fdfefc;
          box-shadow: 0 0 0 4px #66836b20;
        }

        .field select {
          cursor: pointer;
        }

        .field textarea {
          min-height: 100px;
          resize: vertical;
          line-height: 1.7;
        }

        .field-hint {
          color: #758178;
          font-size: 15px;
          font-weight: 500;
          line-height: 1.6;
        }

        .password-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .password-input-wrapper input {
          padding-right: 46px;
        }

        .password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          padding: 6px;
          color: #758178;
          cursor: pointer;
          border-radius: 6px;
          transition:
            color 0.2s ease,
            background 0.2s ease;
        }

        .password-toggle:hover {
          color: #244d37;
          background: #f0f4ee;
        }

        .password-toggle:focus-visible {
          outline: 2px solid #66836b;
          outline-offset: 1px;
        }

        .strength-line-track {
          width: 100%;
          height: 4px;
          background: #e8eee7;
          border-radius: 4px;
          overflow: hidden;
          margin-top: -2px;
        }

        .strength-line-fill {
          height: 100%;
          border-radius: 4px;
          transition:
            width 0.3s ease,
            background-color 0.3s ease;
        }

        .password-hint-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 18px;
        }

        .strength-label {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.3px;
          transition: color 0.3s ease;
        }

        .character-count {
          color: #758178;
          text-align: right;
          font-size: 12px;
          font-weight: 400;
        }

        .optional {
          color: #4d4e4d;
          font-size: 15px;
          font-weight: 500;
          margin-left: 6px;
        }

        fieldset {
          min-width: 0;
          border: 0;
          padding: 0;
          margin: 0;
        }

        legend {
          font-size: 15px;
          font-weight: 600;
          line-height: 1.6;
          margin-bottom: 7px;
          padding: 0;
        }

        .fieldset-description {
          margin: 0 0 12px;
          color: #040b06;
          font-size: 15px;
          line-height: 1.7;
        }

        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 42px;
          border: 1px solid #dfe5df;
          border-radius: 24px;
          background: #ffffff;
          color: #516258;
          padding: 9px 15px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition:
            background 0.2s ease,
            color 0.2s ease,
            border-color 0.2s ease,
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .chip:hover {
          border-color: #78957c;
          background: #f4f7f1;
          transform: translateY(-2px);
        }

        .chip.selected {
          border-color: #315c40;
          background: #eaf1e9;
          color: #244c34;
          box-shadow: inset 0 0 0 1px #315c4018;
        }

        .chip:active {
          transform: scale(0.97);
        }

        .chip-check {
          white-space: pre;
        }

        .submit {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          min-height: 54px;
          border: 0;
          border-radius: 10px;
          padding: 14px 20px;
          background: #ddd744;
          color: #090909;
          font-family: inherit;
          font-size: 16px;
          font-weight: 700;
          line-height: 1.5;
          cursor: pointer;
          box-shadow: 0 5px 14px #244d3720;
          transition:
            background 0.25s ease,
            transform 0.25s ease,
            box-shadow 0.25s ease,
            opacity 0.2s ease;
        }

        .submit:hover:not(:disabled) {
         
          transform: translateY(-2px);
          box-shadow: 0 9px 20px #244d3730;
        }

        .submit:active:not(:disabled) {
          transform: translateY(0) scale(0.99);
        }

        .submit:disabled {
          opacity: 0.75;
          cursor: wait;
          box-shadow: none;
        }

        .submit-arrow {
          font-size: 21px;
          line-height: 1;
          transition: transform 0.2s ease;
        }

        .submit:hover:not(:disabled) .submit-arrow {
          transform: translateX(4px);
        }

        .spinner {
          width: 17px;
          height: 17px;
          border: 2px solid #ffffff70;
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        .message {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          margin: 0;
          padding: 14px;
          border: 1px solid;
          border-radius: 10px;
          font-size: 14px;
          line-height: 1.75;
          overflow-wrap: anywhere;
          animation: message-enter 0.3s ease-out both;
        }

        .message p {
          margin: 0;
          min-width: 0;
        }

        .message.success {
          border-color: #d6e5d5;
          background: #f1f7ef;
          color: #315d3b;
        }

        .message.error {
          border-color: #f0d2cd;
          background: #fff5f3;
          color: #9b3025;
        }

        .message-icon {
          display: grid;
          place-items: center;
          flex: 0 0 22px;
          width: 22px;
          height: 22px;
          border: 1px solid currentColor;
          border-radius: 50%;
          font-size: 12px;
          font-weight: 800;
          line-height: 1;
          margin-top: 1px;
        }

        .privacy-note {
          margin: -5px 0 0;
          color: #0c0f0c;
          text-align: center;
          font-size: 15px;
          font-weight: 500;
          line-height: 1.8;
        }

        .signin {
          text-align: center;
          color: #040705;
          font-size: 15px;
          line-height: 1.8;
          margin: 24px 0 0;
        }

        .signin a {
          color: #383e3a;
          font-weight: 900;
          text-decoration: none;
          text-underline-offset: 4px;
        }

        .signin a:hover {
          color: #193c2a;
          text-decoration: underline;
        }

        .back:focus-visible,
        .brand:focus-visible,
        .signin a:focus-visible,
        .chip:focus-visible,
        .submit:focus-visible {
          outline: 3px solid #c58b45;
          outline-offset: 4px;
        }

        @keyframes card-enter {
          from {
            opacity: 0;
            transform: translateY(16px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes content-enter {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes message-enter {
          from {
            opacity: 0;
            transform: translateY(5px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Tablet screens */
        @media (max-width: 900px) {
          .page {
            padding: 28px 18px;
          }

          .card {
            grid-template-columns: 0.75fr 1.25fr;
          }

          .hero {
            padding: 30px 25px;
            min-height: 620px;
          }

          .hero h1 {
            font-size: 36px;
          }

          .form-panel {
            padding: 32px 26px;
          }

          .two-columns {
            gap: 12px;
          }
        }

        /* Mobile screens */
        @media (max-width: 680px) {
          .page {
            display: block;
            padding: 16px 12px;
          }

          .card {
            width: 100%;
            grid-template-columns: 1fr;
            border-radius: 18px;
          }

          .hero {
            min-height: auto;
            gap: 30px;
            padding: 28px 24px;
            background-position: center 45%;
          }

          .hero h1 {
            font-size: clamp(32px, 8vw, 40px);
          }

          .hero-description {
            max-width: 440px;
            font-size: 15px;
          }

          .hero-features {
            gap: 11px;
            margin-top: 22px;
          }

          .form-panel {
            padding: 28px 24px;
          }

          .intro {
            margin-bottom: 24px;
          }

          form {
            gap: 18px;
          }

          .field input,
          .field select,
          .field textarea {
            font-size: 16px;
          }

          .chip {
            min-height: 44px;
          }
        }

        /* Small mobile screens */
        @media (max-width: 420px) {
          .page {
            padding: 10px 8px;
          }

          .hero {
            padding: 24px 20px;
            gap: 25px;
          }

          .hero h1 {
            font-size: 32px;
          }

          .form-panel {
            padding: 24px 18px;
          }

          .form-panel h2 {
            font-size: 28px;
          }

          .two-columns {
            grid-template-columns: 1fr;
            gap: 18px;
          }

          .photo-picker {
            gap: 12px;
            padding: 10px;
          }

          .avatar {
            flex-basis: 56px;
            width: 56px;
            height: 56px;
          }

          .chips {
            gap: 8px;
          }

          .chip {
            padding: 9px 12px;
            font-size: 13px;
          }
        }

        /* Respect reduced-motion preferences */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </main>
  );
}

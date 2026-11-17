"use client";

import Link from "next/link";
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
    return { score: 1, label: "Weak", color: "#c93c2e" };
  }

  if (score <= 1) {
    return { score: 1, label: "Weak", color: "#c93c2e" };
  } else if (score === 2) {
    return { score: 2, label: "Fair", color: "#d68a14" };
  } else if (score === 3) {
    return { score: 3, label: "Good", color: "#3f8a55" };
  } else {
    return { score: 4, label: "Strong", color: "#1f5a3a" };
  }
}

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
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

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

      // Send welcome email
      try {
        const emailRes = await fetch("/api/send-welcome-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: cleanEmail,
            displayName: cleanDisplayName,
          }),
        });
        const emailData = await emailRes.json();
        if (!emailRes.ok) {
          console.warn("Welcome email failed:", emailData.error);
        } else {
          console.log("Welcome email sent successfully:", emailData);
        }
      } catch (emailErr) {
        console.error("Failed to trigger welcome email:", emailErr);
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
    <main className="page">
      <section className="card">
        {/* Left hero section */}
        <aside className="hero">
          <Link href="/" className="brand" aria-label="Hidden Sri Lanka home">
            Hidden Sri Lanka
          </Link>

          <div className="hero-content">
            <p className="hero-kicker">Your island. Your way.</p>

            <h1>
              Meet the island
              <br />
              beyond the map.
            </h1>

            <p className="hero-description">
              Build your explorer profile and share the places that make Sri
              Lanka unforgettable.
            </p>

            <ul className="hero-features">
              <li>Discover hidden places</li>
              <li>Share local experiences</li>
              <li>Connect with explorers</li>
            </ul>
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

          <header className="form-header">
            <h2>Create your account</h2>
            <p className="intro">
              A few details help other explorers discover what you love.
            </p>
          </header>

          <form onSubmit={handleSubmit} noValidate>
            {/* Section: Account */}
            <div className="section">
              <h3 className="section-title">Account details</h3>

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
                  <small>JPG, PNG, or WebP, up to 5 MB</small>
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

              <div className="two-columns">
                <label className="field">
                  Username
                  <input
                    required
                    minLength={3}
                    maxLength={24}
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
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff size={22} strokeWidth={2} />
                    ) : (
                      <Eye size={22} strokeWidth={2} />
                    )}
                  </button>
                </div>

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
                  <span className="field-hint">Use at least 8 characters.</span>
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
            </div>

            {/* Section: Profile */}
            <div className="section">
              <h3 className="section-title">About you</h3>

              <label className="field">
                <span>
                  Short bio <span className="optional">Optional</span>
                </span>
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
                  <span>
                    Website <span className="optional">Optional</span>
                  </span>
                  <input
                    type="url"
                    autoComplete="url"
                    value={websiteUrl}
                    onChange={(event) => setWebsiteUrl(event.target.value)}
                    placeholder="https://example.com"
                  />
                </label>
              </div>
            </div>

            {/* Section: Preferences */}
            <div className="section">
              <h3 className="section-title">Your interests</h3>

              <fieldset>
                <legend>
                  Favorite places <span className="optional">Choose any</span>
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
            </div>

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
                "Create account"
              )}
            </button>

            <p className="privacy-note">
              You can update your profile details at any time.
            </p>
          </form>

          <p className="signin">
            Already have an account? <Link href="/auth/sign-in">Sign in</Link>
          </p>
        </div>
      </section>

      <style jsx>{`
        .page {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 40px 24px;
          background: #eef1ec;
          color: #1b2e24;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 16px;
          -webkit-font-smoothing: antialiased;
        }

        .page :global(*) {
          font-family: Arial, Helvetica, sans-serif;
        }

        .card {
          width: min(100%, 1240px);
          display: grid;
          grid-template-columns: 0.8fr 1.2fr;
          background: #ffffff;
          border: 1px solid #dfe6dd;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 24px 70px rgba(24, 57, 39, 0.14);
          animation: card-enter 0.5s ease-out both;
        }

        /* ---------- Hero ---------- */
        .hero {
          padding: 48px 44px;
          color: #ffffff;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 40px;
          background:
            linear-gradient(180deg, rgba(20, 52, 38, 0.86), rgba(18, 46, 33, 0.95)),
            url("https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=85")
              center / cover;
        }

        .brand {
          width: fit-content;
          color: #ffffff;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 0.3px;
          text-decoration: none;
        }

        .hero-kicker {
          margin: 0;
          color: #e8cf8a;
          font-size: 17px;
          font-weight: 700;
          letter-spacing: 0.4px;
        }

        .hero h1 {
          font-size: clamp(34px, 3.2vw, 46px);
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.8px;
          margin: 16px 0 20px;
        }

        .hero-description {
          margin: 0;
          color: #e6eee8;
          line-height: 1.7;
          font-size: 18px;
          max-width: 400px;
        }

        .hero-features {
          list-style: none;
          padding: 0;
          margin: 34px 0 0;
          display: grid;
          gap: 16px;
        }

        .hero-features li {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #f2f6f2;
          font-size: 16px;
          line-height: 1.5;
        }

        .hero-features li::before {
          content: "✓";
          display: grid;
          place-items: center;
          flex: 0 0 28px;
          width: 28px;
          height: 28px;
          border: 1px solid rgba(232, 207, 138, 0.6);
          border-radius: 50%;
          color: #e8cf8a;
          font-size: 14px;
        }

        .hero-footer {
          color: #d3dfd6;
          font-size: 14px;
          line-height: 1.6;
        }

        /* ---------- Form panel ---------- */
        .form-panel {
          padding: 36px clamp(24px, 4.5vw, 64px) 44px;
          min-width: 0;
        }

        .back {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 28px;
          color: #55675c;
          text-decoration: none;
          font-size: 15px;
          line-height: 1.5;
          transition: color 0.2s ease;
        }

        .back:hover {
          color: #1f5a3a;
          text-decoration: underline;
          text-underline-offset: 4px;
        }

        .form-header {
          margin-bottom: 32px;
        }

        .form-header h2 {
          font-size: clamp(28px, 2.8vw, 36px);
          font-weight: 700;
          line-height: 1.2;
          letter-spacing: -0.6px;
          margin: 0 0 12px;
          color: #14281d;
        }

        .intro {
          margin: 0;
          color: #3e4f45;
          font-size: 17px;
          line-height: 1.6;
        }

        form {
          display: grid;
          gap: 32px;
        }

        .section {
          display: grid;
          gap: 22px;
          padding-top: 28px;
          border-top: 1px solid #e3e9e1;
        }

        .section:first-of-type {
          padding-top: 0;
          border-top: 0;
        }

        .section-title {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: #14281d;
          line-height: 1.3;
        }

        .photo-picker {
          position: relative;
          display: flex;
          align-items: center;
          gap: 18px;
          cursor: pointer;
          padding: 16px;
          border: 1px dashed #c3d0c1;
          border-radius: 12px;
          background: #f9fbf8;
          transition:
            background 0.2s ease,
            border-color 0.2s ease;
        }

        .photo-picker:hover {
          background: #f0f5ee;
          border-color: #6f8f74;
        }

        .photo-picker:focus-within {
          outline: 3px solid rgba(63, 110, 80, 0.4);
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
          flex: 0 0 72px;
          width: 72px;
          height: 72px;
          display: grid;
          place-items: center;
          overflow: hidden;
          border-radius: 50%;
          background: #e6eee4;
          color: #3f6a4b;
          font-size: 32px;
        }

        .avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .photo-text {
          min-width: 0;
        }

        .photo-picker strong,
        .photo-picker small {
          display: block;
        }

        .photo-picker strong {
          font-size: 16px;
          font-weight: 700;
          line-height: 1.5;
          color: #14281d;
        }

        .photo-picker small {
          margin-top: 4px;
          color: #4a5a50;
          font-size: 14px;
          line-height: 1.5;
        }

        .two-columns {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
        }

        .field {
          display: grid;
          gap: 10px;
          min-width: 0;
          font-size: 16px;
          font-weight: 700;
          line-height: 1.4;
          color: #14281d;
        }

        .field input,
        .field select,
        .field textarea {
          box-sizing: border-box;
          width: 100%;
          min-height: 52px;
          padding: 14px 16px;
          border: 1px solid #c9d3c8;
          border-radius: 10px;
          outline: none;
          background: #ffffff;
          color: #14281d;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 16px;
          font-weight: 400;
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .field input::placeholder,
        .field textarea::placeholder {
          color: #7b877f;
          opacity: 1;
        }

        .field input:hover,
        .field select:hover,
        .field textarea:hover {
          border-color: #8fa793;
        }

        .field input:focus,
        .field select:focus,
        .field textarea:focus {
          border-color: #2f6b47;
          box-shadow: 0 0 0 4px rgba(47, 107, 71, 0.18);
        }

        .field select {
          cursor: pointer;
        }

        .field textarea {
          min-height: 120px;
          resize: vertical;
          line-height: 1.6;
        }

        .field-hint {
          color: #55655b;
          font-size: 14px;
          font-weight: 400;
          line-height: 1.5;
        }

        .password-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .password-input-wrapper input {
          padding-right: 56px;
        }

        .password-toggle {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          padding: 8px;
          color: #55655b;
          cursor: pointer;
          border-radius: 8px;
          transition:
            color 0.2s ease,
            background 0.2s ease;
        }

        .password-toggle:hover {
          color: #1f5a3a;
          background: #eef3ec;
        }

        .password-toggle:focus-visible {
          outline: 3px solid #2f6b47;
          outline-offset: 1px;
        }

        .strength-line-track {
          width: 100%;
          height: 6px;
          background: #e3e9e1;
          border-radius: 6px;
          overflow: hidden;
        }

        .strength-line-fill {
          height: 100%;
          border-radius: 6px;
          transition:
            width 0.3s ease,
            background-color 0.3s ease;
        }

        .password-hint-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 22px;
        }

        .strength-label {
          font-size: 14px;
          font-weight: 700;
        }

        .character-count {
          color: #55655b;
          text-align: right;
          font-size: 13px;
          font-weight: 400;
        }

        .optional {
          color: #55655b;
          font-size: 14px;
          font-weight: 400;
          margin-left: 6px;
        }

        fieldset {
          min-width: 0;
          border: 0;
          padding: 0;
          margin: 0;
        }

        legend {
          font-size: 16px;
          font-weight: 700;
          line-height: 1.4;
          margin-bottom: 6px;
          padding: 0;
          color: #14281d;
        }

        .fieldset-description {
          margin: 0 0 14px;
          color: #3e4f45;
          font-size: 15px;
          line-height: 1.6;
        }

        fieldset + fieldset {
          margin-top: 4px;
        }

        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          border: 1px solid #c9d3c8;
          border-radius: 999px;
          background: #ffffff;
          color: #33463b;
          padding: 10px 20px;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 15px;
          font-weight: 400;
          cursor: pointer;
          transition:
            background 0.2s ease,
            color 0.2s ease,
            border-color 0.2s ease;
        }

        .chip:hover {
          border-color: #6f8f74;
          background: #f2f6f0;
        }

        .chip.selected {
          border-color: #1f5a3a;
          background: #1f5a3a;
          color: #ffffff;
          font-weight: 700;
        }

        .chip-check {
          white-space: pre;
        }

        .submit {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
          min-height: 56px;
          border: 0;
          border-radius: 10px;
          padding: 16px 24px;
          background: #ddd744;
          color: #090909;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 17px;
          font-weight: 700;
          line-height: 1.4;
          cursor: pointer;
          box-shadow: 0 5px 14px rgba(36, 77, 55, 0.2);
          transition:
            background 0.2s ease,
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .submit:hover:not(:disabled) {
          background: #cfc93a;
          transform: translateY(-2px);
          box-shadow: 0 9px 20px rgba(36, 77, 55, 0.3);
        }

        .submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit:disabled {
          opacity: 0.75;
          cursor: wait;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(9, 9, 9, 0.25);
          border-top-color: #090909;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        .message {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin: 0;
          padding: 16px 18px;
          border: 1px solid;
          border-radius: 10px;
          font-size: 15px;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .message p {
          margin: 0;
          min-width: 0;
        }

        .message.success {
          border-color: #b9d6bc;
          background: #eef7ee;
          color: #1f5a2f;
        }

        .message.error {
          border-color: #efc3bd;
          background: #fff3f1;
          color: #9b2a1f;
        }

        .message-icon {
          display: grid;
          place-items: center;
          flex: 0 0 26px;
          width: 26px;
          height: 26px;
          border: 1.5px solid currentColor;
          border-radius: 50%;
          font-size: 14px;
          font-weight: 700;
          line-height: 1;
          margin-top: 1px;
        }

        .privacy-note {
          margin: -14px 0 0;
          color: #4a5a50;
          text-align: center;
          font-size: 14px;
          line-height: 1.6;
        }

        .signin {
          text-align: center;
          color: #2c3d33;
          font-size: 16px;
          line-height: 1.6;
          margin: 28px 0 0;
        }

        .signin :global(a) {
          color: #1f5a3a;
          font-weight: 700;
          text-decoration: underline;
          text-underline-offset: 4px;
        }

        .signin :global(a:hover) {
          color: #14391f;
        }

        .back:focus-visible,
        .brand:focus-visible,
        .signin :global(a:focus-visible),
        .chip:focus-visible,
        .submit:focus-visible {
          outline: 3px solid #c58b45;
          outline-offset: 4px;
        }

        @keyframes card-enter {
          from {
            opacity: 0;
            transform: translateY(14px);
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

        /* Tablet */
        @media (max-width: 1000px) {
          .card {
            grid-template-columns: 0.7fr 1.3fr;
          }

          .hero {
            padding: 36px 28px;
          }

          .hero h1 {
            font-size: 32px;
          }

          .form-panel {
            padding: 32px 28px 40px;
          }
        }

        /* Mobile */
        @media (max-width: 760px) {
          .page {
            display: block;
            padding: 16px 12px;
          }

          .card {
            width: 100%;
            grid-template-columns: 1fr;
            border-radius: 16px;
          }

          .hero {
            gap: 28px;
            padding: 30px 24px;
          }

          .hero-description {
            max-width: 480px;
          }

          .form-panel {
            padding: 28px 22px 36px;
          }

          .two-columns {
            grid-template-columns: 1fr;
            gap: 22px;
          }
        }

        /* Small mobile */
        @media (max-width: 420px) {
          .page {
            padding: 8px;
          }

          .hero {
            padding: 24px 20px;
          }

          .hero h1 {
            font-size: 30px;
          }

          .form-panel {
            padding: 24px 16px 32px;
          }

          .photo-picker {
            gap: 14px;
            padding: 12px;
          }

          .avatar {
            flex-basis: 60px;
            width: 60px;
            height: 60px;
          }

          .chip {
            padding: 10px 16px;
            font-size: 14px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </main>
  );
}
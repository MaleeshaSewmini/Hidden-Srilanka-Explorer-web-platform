"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);

const categories = ["Waterfalls", "Beaches", "Mountains", "Wildlife", "Culture", "Food"];
const languages = ["Sinhala", "English", "Tamil"];

type Profile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
  district: string;
  travel_style: string;
  favorite_categories: string[];
  experience_level: string;
  languages: string[];
  website_url: string;
};

const emptyProfile: Omit<Profile, "id"> = {
  username: "",
  display_name: "",
  avatar_url: null,
  bio: "",
  district: "",
  travel_style: "",
  favorite_categories: [],
  experience_level: "",
  languages: [],
  website_url: "",
};

export default function ProfilePage() {
  const [userId, setUserId] = useState("");
  const [profile, setProfile] = useState(emptyProfile);
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError || !authData.user) {
        setMessage("Please sign in to view your profile.");
        setLoading(false);
        return;
      }

      const user = authData.user;
      setUserId(user.id);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        setMessage(`Could not load profile: ${error.message}`);
      } else if (data) {
        setProfile({
          ...emptyProfile,
          ...data,
          favorite_categories: data.favorite_categories ?? [],
          languages: data.languages ?? [],
        });
      } else {
        // Fallback in case the signup trigger did not create the row.
        const metadata = user.user_metadata ?? {};
        setProfile({
          ...emptyProfile,
          username: metadata.username ?? "",
          display_name: metadata.display_name ?? "",
          bio: metadata.bio ?? "",
          district: metadata.district ?? "",
          travel_style: metadata.travel_style ?? "",
          favorite_categories: metadata.favorite_categories ?? [],
          experience_level: metadata.experience_level ?? "",
          languages: metadata.languages ?? [],
          website_url: metadata.website_url ?? "",
        });
      }

      setLoading(false);
    }

    loadProfile();
  }, []);

  function toggleValue(
    key: "favorite_categories" | "languages",
    value: string,
  ) {
    setProfile((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!userId) {
      setMessage("Please sign in before saving your profile.");
      return;
    }

    setSaving(true);

    try {
      let avatarUrl = profile.avatar_url;

      if (photo) {
        if (photo.size > 5 * 1024 * 1024) {
          throw new Error("Choose a photo smaller than 5 MB.");
        }

        const extension = photo.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${userId}/avatar-${Date.now()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, photo, { upsert: true, contentType: photo.type });

        if (uploadError) throw uploadError;

        avatarUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      }

      const { error } = await supabase.from("profiles").upsert(
        {
          id: userId,
          ...profile,
          username: profile.username.trim().toLowerCase(),
          display_name: profile.display_name.trim(),
          avatar_url: avatarUrl,
        },
        { onConflict: "id" },
      );

      if (error) throw error;

      setProfile((current) => ({ ...current, avatar_url: avatarUrl }));
      setPhoto(null);
      setMessage("Your profile has been updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="page"><p>Loading your profile…</p></main>;

  if (!userId) {
    return (
      <main className="page">
        <section className="card">
          <h1>Sign in to view your profile</h1>
          <p>{message}</p>
          <a className="button" href="/auth/login">Go to sign in</a>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="card">
        <a className="back" href="/">← Back to explore</a>
        <p className="kicker">YOUR EXPLORER ACCOUNT</p>
        <h1>Your profile</h1>
        <p className="intro">Update your details and tell the community how you like to explore.</p>

        <form onSubmit={saveProfile}>
          <label className="photo">
            <span className="avatar">
              {photo
                ? <img src={URL.createObjectURL(photo)} alt="Selected profile" />
                : profile.avatar_url
                  ? <img src={profile.avatar_url} alt="Your profile" />
                  : "＋"}
            </span>
            <span><strong>Change profile photo</strong><small>Image up to 5 MB</small></span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
            />
          </label>

          <div className="grid">
            <label>Username
              <input required minLength={3} maxLength={24} value={profile.username}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })} />
            </label>
            <label>Display name
              <input required value={profile.display_name}
                onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} />
            </label>
            <label>District
              <input value={profile.district}
                onChange={(e) => setProfile({ ...profile, district: e.target.value })} />
            </label>
            <label>Travel style
              <select value={profile.travel_style}
                onChange={(e) => setProfile({ ...profile, travel_style: e.target.value })}>
                <option value="">Choose a style</option>
                <option>Hiking</option><option>Adventure</option><option>Relaxing</option>
                <option>Culture</option><option>Wildlife</option><option>Road trips</option>
              </select>
            </label>
            <label>Experience level
              <select value={profile.experience_level}
                onChange={(e) => setProfile({ ...profile, experience_level: e.target.value })}>
                <option value="">Choose a level</option>
                <option>Beginner</option><option>Intermediate</option><option>Experienced</option>
              </select>
            </label>
            <label>Website
              <input type="url" placeholder="https://"
                value={profile.website_url}
                onChange={(e) => setProfile({ ...profile, website_url: e.target.value })} />
            </label>
          </div>

          <label className="full">Short bio
            <textarea maxLength={180} value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="What do you love about exploring Sri Lanka?" />
          </label>

          <fieldset>
            <legend>Favorite categories</legend>
            <div className="chips">
              {categories.map((item) => (
                <button type="button" key={item}
                  className={profile.favorite_categories.includes(item) ? "chip selected" : "chip"}
                  onClick={() => toggleValue("favorite_categories", item)}>
                  {item}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>Languages</legend>
            <div className="chips">
              {languages.map((item) => (
                <button type="button" key={item}
                  className={profile.languages.includes(item) ? "chip selected" : "chip"}
                  onClick={() => toggleValue("languages", item)}>
                  {item}
                </button>
              ))}
            </div>
          </fieldset>

          {message && <p role="status" className="message">{message}</p>}
          <button className="save" disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </button>
        </form>
      </section>

      <style jsx>{`
        .page { min-height:100vh; background:#f2f4ed; padding:36px 16px; color:#20372b; font-family:Arial,sans-serif; }
        .card { max-width:760px; margin:auto; background:white; padding:clamp(22px,5vw,48px); border-radius:18px; box-shadow:0 18px 55px #18392717; }
        .back { color:#65776c; text-decoration:none; font-size:13px; }
        .kicker { margin-top:28px; color:#a17d31; font-size:10px; font-weight:bold; letter-spacing:2px; }
        h1 { margin:8px 0; font:500 36px Georgia,serif; }
        .intro { color:#718077; font-size:14px; margin-bottom:25px; }
        form { display:grid; gap:17px; }
        .photo { display:flex; align-items:center; gap:13px; cursor:pointer; }
        .photo input { display:none; }
        .avatar { width:62px; height:62px; display:grid; place-items:center; overflow:hidden; border-radius:50%; background:#edf2eb; color:#58735d; font-size:25px; }
        .avatar img { width:100%; height:100%; object-fit:cover; }
        .photo strong,.photo small { display:block; }.photo small { color:#89938b; margin-top:5px; font-size:11px; }
        .grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        label:not(.photo) { display:grid; gap:7px; font-size:12px; font-weight:700; }
        input,select,textarea { box-sizing:border-box; width:100%; border:1px solid #dfe5df; border-radius:7px; padding:11px; background:white; color:#20372b; font:13px Arial; }
        textarea { min-height:85px; resize:vertical; }
        fieldset { border:0; padding:0; margin:0; } legend { font-size:12px; font-weight:bold; margin-bottom:9px; }
        .chips { display:flex; flex-wrap:wrap; gap:8px; }
        .chip { border:1px solid #dfe5df; border-radius:20px; background:white; padding:8px 12px; color:#516258; cursor:pointer; }
        .chip.selected { border-color:#315c40; background:#eaf1e9; color:#244c34; }
        .save,.button { display:inline-block; border:0; border-radius:8px; padding:13px 18px; background:#244d37; color:white; font-weight:bold; text-decoration:none; cursor:pointer; }
        .save:disabled { opacity:.65; cursor:wait; }.message { color:#315d3b; font-size:13px; }
        @media(max-width:550px) { .grid { grid-template-columns:1fr; } }
      `}</style>
    </main>
  );
}
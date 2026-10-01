"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);

const categories = ["Waterfalls", "Beaches", "Mountains", "Wildlife", "Culture", "Food"];
const languages = ["Sinhala", "English", "Tamil"];
const districts = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle",
  "Gampaha", "Hambantota", "Jaffna", "Kalutara", "Kandy", "Kegalle",
  "Kilinochchi", "Kurunegala", "Mannar", "Matale", "Matara", "Monaragala",
  "Mullaitivu", "Nuwara Eliya", "Polonnaruwa", "Puttalam", "Ratnapura",
  "Trincomalee", "Vavuniya",
];

export default function SignUpPage() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!photo) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  function toggleItem(
    item: string,
    current: string[],
    update: (value: string[]) => void,
  ) {
    update(current.includes(item)
      ? current.filter((value) => value !== item)
      : [...current, item]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
      setMessage("Username must be 3–24 characters: letters, numbers, or underscores.");
      return;
    }
    if (password.length < 8) {
      setMessage("Use a password with at least 8 characters.");
      return;
    }
    if (photo && photo.size > 5 * 1024 * 1024) {
      setMessage("Choose a profile photo smaller than 5 MB.");
      return;
    }

    setBusy(true);

    const profile = {
      username: username.toLowerCase(),
      display_name: displayName.trim(),
      bio: bio.trim() || null,
      district: district || null,
      travel_style: travelStyle || null,
      favorite_categories: favoriteCategories,
      experience_level: experienceLevel || null,
      languages: selectedLanguages,
      website_url: websiteUrl.trim() || null,
    };

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: profile,
        },
      });

      if (error) throw error;

      // Upload and save the photo only when Supabase has created a session.
      if (data.user && data.session) {
        let avatarUrl: string | null = null;

        if (photo) {
          const extension = photo.name.split(".").pop()?.toLowerCase() || "jpg";
          const path = `${data.user.id}/avatar-${Date.now()}.${extension}`;

          const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(path, photo, { upsert: true, contentType: photo.type });

          if (uploadError) throw uploadError;

          avatarUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
        }

        const { error: profileError } = await supabase
          .from("profiles")
          .upsert(
            { id: data.user.id, ...profile, avatar_url: avatarUrl },
            { onConflict: "id" },
          );

        if (profileError) throw profileError;
      }

      setMessage(
        data.session
          ? "Your explorer profile is ready. Welcome to Hidden Sri Lanka!"
          : "Account created! Check your email to confirm it. Your profile details are saved; sign in to upload your photo.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create your account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <section className="card">
        <aside className="hero">
          <div className="brand">HIDDEN <span>SRILANKA</span></div>
          <div>
            <p className="hero-kicker">YOUR ISLAND. YOUR WAY.</p>
            <h1>Meet the island<br />beyond the map.</h1>
            <p>Build your explorer profile and share the places that make Sri Lanka unforgettable.</p>
          </div>
          <small>Explore thoughtfully. Leave a lighter footprint.</small>
        </aside>

        <div className="form-panel">
          <a className="back" href="/">← Back to explore</a>
          <p className="kicker">CREATE YOUR EXPLORER PROFILE</p>
          <h2>Let’s get to know you</h2>
          <p className="intro">A few details help other explorers discover what you love.</p>

          <form onSubmit={handleSubmit}>
            <label className="photo-picker">
              <span className="avatar">
                {preview ? <img src={preview} alt="Profile photo preview" /> : "＋"}
              </span>
              <span><strong>Add a profile photo</strong><small>JPG, PNG, or WebP · up to 5 MB</small></span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
              />
            </label>

            <div className="two-columns">
              <label className="field">Username
                <input required minLength={3} maxLength={24} value={username}
                  onChange={(e) => setUsername(e.target.value)} placeholder="e.g. maleesha" />
              </label>
              <label className="field">Display name
                <input required value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
              </label>
            </div>

            <label className="field">Email address
              <input required type="email" autoComplete="email" value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </label>

            <label className="field">Password
              <input required type="password" minLength={8} autoComplete="new-password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters" />
            </label>

            <label className="field">Short bio <span className="optional">Optional</span>
              <textarea maxLength={180} value={bio} onChange={(e) => setBio(e.target.value)}
                placeholder="Tell the community what you love about exploring..." />
            </label>

            <div className="two-columns">
              <label className="field">Your district
                <select value={district} onChange={(e) => setDistrict(e.target.value)}>
                  <option value="">Choose a district</option>
                  {districts.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="field">Travel style
                <select value={travelStyle} onChange={(e) => setTravelStyle(e.target.value)}>
                  <option value="">Choose your style</option>
                  <option>Hiking</option><option>Adventure</option>
                  <option>Relaxing</option><option>Culture</option>
                  <option>Wildlife</option><option>Road trips</option>
                </select>
              </label>
            </div>

            <fieldset>
              <legend>Favorite places <span className="optional">Choose any</span></legend>
              <div className="chips">
                {categories.map((item) => (
                  <button key={item} type="button"
                    className={favoriteCategories.includes(item) ? "chip selected" : "chip"}
                    aria-pressed={favoriteCategories.includes(item)}
                    onClick={() => toggleItem(item, favoriteCategories, setFavoriteCategories)}>
                    {item}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="two-columns">
              <label className="field">Experience level
                <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}>
                  <option value="">Choose level</option>
                  <option>Beginner</option><option>Intermediate</option><option>Experienced</option>
                </select>
              </label>
              <label className="field">Website <span className="optional">Optional</span>
                <input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://" />
              </label>
            </div>

            <fieldset>
              <legend>Languages you speak</legend>
              <div className="chips">
                {languages.map((item) => (
                  <button key={item} type="button"
                    className={selectedLanguages.includes(item) ? "chip selected" : "chip"}
                    aria-pressed={selectedLanguages.includes(item)}
                    onClick={() => toggleItem(item, selectedLanguages, setSelectedLanguages)}>
                    {item}
                  </button>
                ))}
              </div>
            </fieldset>

            {message && <p className="message" role="status">{message}</p>}
            <button className="submit" disabled={busy}>
              {busy ? "Creating your profile…" : "Create explorer profile"}
            </button>
          </form>

          <p className="signin">Already have an account? <Link href="/auth/sign-in">Sign in</Link></p>
        </div>
      </section>

      <style jsx>{`
        .page { min-height:100vh;
         display:grid; 
         place-items:center; 
         padding:30px 16px; 
         background:#f2f4ed; color:#20372b; 
         font-family:inherit; 
         }
        .card {
         width:min(100%,1060px); 
         display:grid; 
         grid-template-columns:.82fr 1.18fr; 
         background:white; border-radius:22px; 
         overflow:hidden; 
         box-shadow:0 22px 70px #1839271c; 
         }
        .hero { padding:38px; 
        min-height:650px; color:white;
         display:flex; 
         flex-direction:column; 
         justify-content:space-between;
          background:linear-gradient(180deg,#183a2cc9,#173426e8),url("https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=85") center/cover; 
          }
        .brand { font-size:13px; 
        font-weight:800; 
        letter-spacing:3px; }.brand span { color:#e5c77b; 
        }
        .hero-kicker,.kicker { font-size:10px;
         font-weight:800; 
         letter-spacing:2px; 
         color:#b08b43; 
         }
        .hero-kicker { color:#e5c77b; 
        } h1 { font:500 42px/1.12 Georgia,serif; 
         }
        .hero p:not(.hero-kicker) { color:#e0e9e2; 
        line-height:1.7; 
        font-size:14px;
         max-width:300px; 
         }
        .hero small { color:#d7e1d8; }.form-panel { padding:32px clamp(22px,5vw,54px); 
        }
        .back { display:inline-block;
         margin-bottom:20px; color:#65776c; 
         text-decoration:none; 
         ont-size:13px; 
         }
        h2 { font:500 31px Georgia,serif;
         margin:8px 0; }.intro { color:#718077; font-size:13px; 
         margin:0 0 20px; 
         }
        form { display:grid; gap:13px; }.photo-picker { display:flex; align-items:center; 
        gap:12px; 
        cursor:pointer; 
        margin-bottom:3px;
         }
        .photo-picker input { display:none; }.avatar { width:54px; height:54px;
         display:grid; 
         place-items:center;
          overflow:hidden; 
          border-radius:50%;
           background:#edf2eb; 
           color:#58735d; 
           font-size:25px; 
           }
        .avatar img { width:100%; 
        height:100%; object-fit:cover; 
        }.photo-picker strong,.photo-picker small { display:block; }.photo-picker strong { font-size:13px; }.photo-picker small,.optional { color:#89938b; font-size:10px; margin-left:4px; 
        }
        .photo-picker small { margin:5px 0 0; }.two-columns { display:grid; grid-template-columns:1fr 1fr; gap:12px;
         }
        .field { display:grid;
         gap:6px; 
         font-size:15px; 
         font-weight:700; 
         }.field input,.field select,.field textarea { box-sizing:border-box;
          width:100%; 
          padding:12px; 
          border:1px solid #dfe5df; border-radius:7px; 
          outline:none; background:white; color:#20372b; font:13px Arial; 
          }
        .field textarea { min-height:65px; resize:vertical; }.field input:focus,.field select:focus,.field textarea:focus { border-color:#66836b; box-shadow:0 0 0 3px #66836b1c; }
        fieldset { border:0; padding:0; margin:0; 
        } 
        legend {
         font-size:12px; 
        font-weight:700;
         margin-bottom:8px; 
         }.chips {
          display:flex; f
          lex-wrap:wrap; 
          gap:8px; 
          }
        .chip { border:1px solid #dfe5df; border-radius:20px; background:white; color:#516258; padding:7px 11px; font-size:11px; cursor:pointer; }
        .chip.selected { border-color:#315c40; background:#eaf1e9; color:#244c34; }
        .submit { width:100%; border:0; border-radius:8px; padding:13px; background:#244d37; color:white; font-weight:700; cursor:pointer; }
        .submit:hover { background:#193c2a; }.submit:disabled { opacity:.65; cursor:wait; }
        .message { margin:0; color:#315d3b; font-size:12px; line-height:1.5; }.signin { text-align:center; color:#718077; font-size:12px; margin:18px 0 0; }.signin a { color:#315d3c; font-weight:700; }
        @media(max-width:760px) { .card { grid-template-columns:1fr; }.hero { min-height:220px; padding:25px; }.hero h1 { font-size:33px; margin:10px 0; }.hero small { display:none; } }
        @media(max-width:440px) { .two-columns { grid-template-columns:1fr; }.form-panel { padding:25px 20px; } }
      `}</style>
    </main>
  );
}
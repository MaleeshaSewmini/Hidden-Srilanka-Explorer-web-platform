"use client";
 
import { useEffect, useRef, useState, FormEvent, ChangeEvent, ReactNode } from "react";
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
  Pencil,
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
 
/* ==========================================================================
   LOOK & FEEL
   A field-journal feel: forest-green cover, taped polaroid, passport stamps,
   handwritten notes, flat colour and hard offset shadows. No glow, no glass.
 
   Palette   forest #333333 · linen #ffffff · paper #fbfaf3 · ink #1f2a24
             turmeric #b1b1b1 · stamp-blue #2f5d8a · chilli #b8402f  tumerics #f2e420
             inks #757575
   Fonts     Fraunces (headings) · Caveat (handwriting) · Instrument Sans (UI)
   ========================================================================== */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Instrument+Sans:wght@400;500;600;700&display=swap');
 
.hs-root{
  --forest:#333333; --forest-2:#444444; --linen:#ffffff; --paper:#fbfaf3; --ink:#1f2a24; --muted:#5b685f;
  --turmeric:#b1b1b1; --blue:#2f5d8a; --chilli:#b8402f; --cream:#f4efe0;
  --serif:'Fraunces',Georgia,'Times New Roman',serif;
  --hand:'Caveat','Segoe Print','Bradley Hand',cursive;
  --sans:'Instrument Sans',system-ui,-apple-system,'Segoe UI',sans-serif;
  --ease:cubic-bezier(.2,.8,.2,1);
  background:var(--linen); color:var(--ink); font-family:var(--sans);
}
.hs-root :focus-visible{ outline:3px solid var(--blue); outline-offset:3px; border-radius:8px; }
.hs-serif{ font-family:var(--serif); } .hs-hand{ font-family:var(--hand); }
 
/* ---------- hero ---------- */
.hs-hero{ position:relative; background:var(--forest); color:var(--cream); padding:28px 0 96px; overflow:hidden; }
.hs-contours,.hs-trail{ position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }
.hs-draw{ stroke-dasharray:1; stroke-dashoffset:1; animation:hs-draw 3.2s .3s var(--ease) forwards; }
@keyframes hs-draw{ to{ stroke-dashoffset:0 } }
.hs-torn{ position:absolute; left:0; bottom:-1px; width:100%; height:30px; display:block; }
.hs-top{ display:flex; justify-content:flex-end; position:relative; z-index:2; }
.hs-hero-inner{ position:relative; z-index:2; }
.hs-hero-inner .hs-name,.hs-hero-inner .hs-sub,.hs-hero-inner .hs-line{ text-shadow:0 2px 14px rgba(0,0,0,.5); }
 
/* collage of hidden places behind the hero */
.hs-collage{ position:absolute; inset:-24px; z-index:0; display:grid; grid-template-columns:repeat(6,1fr); grid-auto-rows:170px;
  grid-auto-flow:dense; gap:16px; padding:8px; transform:rotate(-2deg) scale(1.05); pointer-events:none; }
.hs-photo-bg{ position:absolute; inset:-4%; z-index:0; background-color:var(--forest); background-size:cover; background-position:center 40%;
  background-repeat:no-repeat; filter:saturate(1.08) contrast(1.04); animation:hs-kb 28s ease-in-out infinite alternate; }
.hs-shade{ position:absolute; inset:0; z-index:1; background:rgba(34,34,34,.72); pointer-events:none; }
.hs-trail{ z-index:1; }
.hs-tile{ position:relative; margin:0; background:#fff; padding:6px 6px 26px; box-shadow:3px 5px 0 rgba(0,0,0,.4);
  transform:rotate(var(--tr)); animation:hs-pin .8s var(--ease) both; animation-delay:calc(var(--i) * 80ms); }
.hs-tile:nth-child(1){ grid-column:span 2; grid-row:span 2; }
.hs-tile:nth-child(4){ grid-column:span 2; }
.hs-tile:nth-child(7){ grid-row:span 2; }
.hs-tile:nth-child(11){ grid-column:span 2; }
.hs-tile-in{ position:absolute; inset:6px 6px 26px; overflow:hidden; background:var(--tone); }
.hs-tile-fb{ position:absolute; inset:0; display:grid; place-items:center; padding:8px; text-align:center;
  font-family:var(--serif); font-weight:700; font-size:14px; color:rgba(255,255,255,.85); background:var(--tone); }
.hs-tile-in img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; animation:hs-kb 20s ease-in-out infinite alternate; }
.hs-tile figcaption{ position:absolute; left:0; right:0; bottom:2px; text-align:center; font-family:var(--hand); font-size:17px; line-height:1; color:var(--ink); }
@keyframes hs-pin{ from{ opacity:0; transform:translateY(-20px) rotate(calc(var(--tr) - 8deg)) } to{ opacity:1; transform:rotate(var(--tr)) } }
@keyframes hs-kb{ from{ transform:scale(1) } to{ transform:scale(1.09) translate(-1.5%,-1%) } }
.hs-hero-grid{ display:grid; grid-template-columns:auto 1fr; gap:48px; align-items:center; margin-top:8px; }

@keyframes hs-drop{ from{ opacity:0; transform:translateY(-26px) rotate(-10deg) } to{ opacity:1; transform:translateY(0) rotate(var(--r,-3deg)) } }
@keyframes hs-up{ from{ opacity:0; transform:translateY(16px) } to{ opacity:1; transform:none } }
.hs-in-2,.hs-in-3,.hs-in-4{ opacity:0; animation:hs-up .7s var(--ease) forwards; }
.hs-in-2{ animation-delay:.35s } .hs-in-3{ animation-delay:.5s } .hs-in-4{ animation-delay:.65s }

/* polaroid */
.hs-polaroid{ --r:-3deg; position:relative; margin:0; background:#fff; padding:12px 12px 14px; width:244px;
  box-shadow:6px 8px 0 rgba(0,0,0,.28); transform:rotate(var(--r)); animation:hs-drop .9s var(--ease) both;
  transition:transform .45s var(--ease); }
.hs-polaroid:hover{ transform:rotate(-0.5deg) translateY(-4px); }
.hs-photo{ position:relative; aspect-ratio:1/1; background:#d8dccc; overflow:hidden; }
.hs-initial{ display:grid; place-items:center; width:100%; height:100%; font-family:var(--serif); font-weight:700; font-size:5rem; color:var(--forest); }
.hs-polaroid figcaption{ margin-top:8px; text-align:center; font-family:var(--hand); font-size:1.7rem; line-height:1; color:var(--ink); }
.hs-tape{ position:absolute; top:-14px; left:50%; width:92px; height:28px; transform:translateX(-50%) rotate(2deg);
  background:rgba(206, 197, 177, 0.82); display:flex; align-items:center; justify-content:center; gap:6px;
  font-size:11px; font-weight:700; color:var(--ink); cursor:pointer; border:0; transition:transform .3s var(--ease), background .2s; }
.hs-tape:hover{ transform:translateX(-50%) rotate(-2deg) scale(1.08); background:var(--turmeric); }

/* name, note, stamps */
.hs-name{ font-family:var(--Arial); font-weight:400; font-size:clamp(2.4rem,6vw,4.4rem); line-height:1.02; letter-spacing:-.02em; margin:0; color:var(--cream); }
.hs-sub{ margin:10px 0 0; font-size:17px; color:rgba(230, 229, 225, 0.72); }
.hs-note{ position:relative; display:inline-block; max-width:34rem; margin-top:20px; padding:14px 20px 16px;
  background:#f6efcf; color:var(--ink); font-family:var(--Aptos Display); font-size:1rem; line-height:1.15; font-weight:500;
  transform:rotate(-1deg); box-shadow:4px 5px 0 rgba(0,0,0,.28); }
.hs-note::before{ content:""; position:absolute; top:-9px; left:22px; width:54px; height:18px; background:rgba(47,93,138,.55); transform:rotate(-4deg); }
.hs-stamps{ display:flex; flex-wrap:wrap; gap:14px; margin-top:24px; }
.hs-stamp{ display:inline-flex; align-items:center; gap:6px; padding:6px 12px; font-family:var(--Arial); font-weight:700; font-size:13px;
  color:var(--c,#f0b93a); border:2px solid var(--c,#f0b93a); outline:1px solid var(); outline-offset:2px; border-radius:4px;
  transform:rotate(var(--sr,-2deg)); transition:transform .25s var(--ease); cursor:default; }
.hs-stamp:nth-child(2){ --sr:2deg; --c:#cfe3c4; } .hs-stamp:nth-child(3){ --sr:-1deg; --c:#f4efe0; } .hs-stamp:nth-child(4){ --sr:1.5deg; --c:#9cc3e6; }
.hs-stamp:hover{ transform:rotate(0) scale(1.06); }
.hs-line{ margin:22px 0 0; font-size:15px; line-height:1.7; color:rgba(244,239,224,.85); max-width:36rem; }
.hs-ulink{ color:var(--turmerics); font-weight:700; background:linear-gradient(currentColor,currentColor) 0 100%/100% 2px no-repeat;
  padding:0 0 1px; transition:background-size .3s var(--ease), color .2s; cursor:pointer; }

.hs-ghost-link{ color:var(--cream); font-size:14px; font-weight:600; padding:6px 2px; background:linear-gradient(currentColor,currentColor) 0 100%/0 2px no-repeat;
  transition:background-size .3s var(--ease); cursor:pointer; }
.hs-ghost-link:hover{ background-size:100% 2px; }

/* ---------- tabs (folder tabs) ---------- */
.hs-tabs{ display:flex; gap:6px; border-bottom:2px solid var(--ink); }
.hs-tab{ display:flex; align-items:center; gap:8px; margin-bottom:-2px; padding:11px 18px; font-size:14px; font-weight:600; color:var(--muted);
  border:2px solid transparent; border-bottom:2px solid transparent; border-radius:12px 12px 0 0; cursor:pointer;
  transition:background .2s, color .2s, transform .25s var(--ease); }
.hs-tab:hover{ color:var(--ink); background:rgba(31,42,36,.06); transform:translateY(-2px); }
.hs-tab[aria-selected="true"]{ background:var(--turmeric); color:var(--ink); border-color:var(--ink); border-bottom-color:var(--turmeric); transform:none; }
.hs-count{ display:inline-grid; place-items:center; min-width:22px; height:22px; padding:0 6px; border-radius:99px; font-size:12px; background:var(--ink); color:var(--paper); }
.hs-panel{ animation:hs-up .5s var(--ease) both; }

/* ---------- reveal on scroll ---------- */
.hs-reveal{ opacity:0; transform:translateY(20px); transition:opacity .6s var(--ease), transform .6s var(--ease); }
.hs-reveal.hs-seen{ opacity:1; transform:none; }

/* ---------- cards ---------- */
.hs-card{ transform:rotate(var(--cr,0deg)); transition:transform .4s var(--ease); }
.hs-card:hover{ transform:rotate(0) translateY(-6px); }
.hs-paper{ background:var(--paper); border:2px solid var(--ink); border-radius:16px; box-shadow:6px 6px 0 var(--ink); }
.hs-empty{ text-align:center; padding:48px 24px; background:var(--paper); border:2px dashed var(--ink); border-radius:16px; }

.hs-empty:hover .hs-empty-ico{ transform:rotate(6deg) scale(1.08); }
.hs-skel{ height:280px; border-radius:16px; background:#d9ddcd; animation:hs-pulse 1.3s ease-in-out infinite; }
@keyframes hs-pulse{ 50%{ opacity:.5 } }

/* ---------- buttons + form ---------- */
.hs-btn{ display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:12px 22px; font-family:var(--Arial); font-size:17px; font-weight:400;
  color:var(--paper); background:var(--forest); border:2px solid var(--ink); border-radius:10px;  cursor:pointer;
  transition:transform .15s var(--ease), box-shadow .15s var(--ease), background .2s; }
.hs-btn:hover{ transform:translate(-1px,-1px); box-shadow:5px 5px 0 var(--ink); background:var(--forest-2); }
.hs-btn:active{ transform:translate(3px,3px); box-shadow:1px 1px 0 var(--ink); }
.hs-btn:disabled{ opacity:.6; cursor:wait; transform:translate(2px,2px); box-shadow:2px 2px 0 var(--ink); }
.hs-btn.light{ background:var(--paper); color:var(--ink); }
.hs-label{ display:block; font-size:18px; font-weight:500; color:var(--ink); }
.hs-hint{ font-size:12.5px; color:var(--muted); }
.hs-input{ display:block; width:100%; margin-top:6px; padding:11px 13px; font-family:var(--sans); font-size:15px; color:var(--ink);
  background:#fff; border:1.5px solid var(--ink); border-radius:8px; transition:box-shadow .2s, transform .2s; }
.hs-input:focus{ outline:none; box-shadow:3px 3px 0 var(--turmeric); transform:translate(-1px,-1px); }
.hs-pick{ padding:8px 14px; font-size:14px; font-weight:600; color:var(--ink); background:var(--paper); border:1.5px solid var(--ink); border-radius:8px; cursor:pointer;
  transition:transform .2s var(--ease), background .2s, box-shadow .2s; }
.hs-pick:hover{ transform:translateY(-2px); box-shadow:2px 3px 0 var(--ink); }
.hs-pick:active{ transform:translateY(0); box-shadow:none; }
.hs-pick.on{ background:var(--turmeric); box-shadow:2px 2px 0 var(--ink); transform:rotate(-1.5deg); }
.hs-msg{ display:flex; align-items:center; gap:10px; margin-top:20px; padding:12px 14px; font-size:14px; font-weight:600; border:2px solid var(--ink); border-radius:10px; animation:hs-up .4s var(--ease) both; }
.hs-msg.ok{ background:#d9ecd0; } .hs-msg.err{ background:#f6d6cf; }
.hs-todo{ margin-top:20px; padding:12px 16px; background:#f6efcf; border:1.5px dashed var(--ink); border-radius:10px; font-family:var(--Arial); font-size:1rem; line-height:1.15; }

/* ---------- responsive ---------- */
@media (max-width:900px){
  .hs-hero-grid{ grid-template-columns:1fr; gap:36px; justify-items:center; text-align:center; }
  .hs-stamps{ justify-content:center; } 
  .hs-note{ text-align:left; }
}
@media (max-width:640px){
  .hs-hero{ padding-bottom:72px; }
  .hs-polaroid{ width:200px; }
  .hs-initial{ font-size:4rem; }
  .hs-tab{ padding:10px 12px; font-size:13px; }
  .hs-paper{ box-shadow:4px 4px 0 var(--ink); border-radius:14px; }
  .hs-btn{ width:100%; }
  .hs-note{ font-size:1.45rem; }
}
@media (hover:none){ .hs-card:hover,.hs-polaroid:hover{ transform:rotate(var(--cr,var(--r,0deg))); } }
@media (prefers-reduced-motion:reduce){
  .hs-root *,.hs-root *::before,.hs-root *::after{ animation-duration:.001ms !important; animation-delay:0s !important; transition-duration:.001ms !important; }
  .hs-in-2,.hs-in-3,.hs-in-4,.hs-reveal{ opacity:1 !important; transform:none !important; }
  .hs-draw{ stroke-dashoffset:0; }
}
`;

/* ==========================================================================
   SMALL UI HELPERS (presentation only)
   ========================================================================== */

// Gently lifts content in the first time it scrolls into view
function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -5% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`hs-reveal ${seen ? "hs-seen" : ""}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// "waterfalls, caves and temples"
function joinList(items: string[]) {
  const l = items.map((i) => i.toLowerCase());
  if (l.length <= 1) return l.join("");
  return `${l.slice(0, -1).join(", ")} and ${l[l.length - 1]}`;
}

const TILTS = [-0.8, 0.6, -0.4, 0.9, -0.6, 0.5];

function HeroBackdrop() {
  return (
    <>
      {/* faint topographic lines */}
      <svg className="hs-contours" viewBox="0 0 1440 520" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <g fill="none" stroke="rgba(244,239,224,.09)" strokeWidth="1.5">
          <path d="M980 60 C1120 20 1300 90 1340 210 C1380 330 1250 440 1100 420 C940 400 860 300 880 190 C890 120 920 80 980 60Z" />
          <path d="M1000 110 C1100 85 1240 130 1280 220 C1310 310 1220 390 1110 375 C990 360 930 290 940 205 C945 160 960 125 1000 110Z" />
          <path d="M1030 160 C1100 145 1190 175 1215 235 C1235 295 1175 340 1110 330 C1040 320 1000 275 1005 225 C1008 195 1015 168 1030 160Z" />
        </g>
      </svg>
      {/* a dashed trail that draws itself once */}
      <svg className="hs-trail" viewBox="0 0 1440 520" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <mask id="hsTrailMask">
            <path
              className="hs-draw"
              pathLength={1}
              d="M-20 440 C140 360 220 470 400 400 S640 250 820 330 S1100 470 1260 300 S1400 190 1470 230"
              fill="none"
              stroke="#fff"
              strokeWidth="10"
            />
          </mask>
        </defs>
        <path
          mask="url(#hsTrailMask)"
          d="M-20 440 C140 360 220 470 400 400 S640 250 820 330 S1100 470 1260 300 S1400 190 1470 230"
          fill="none"
          stroke="rgba(2, 157, 188, 0.55)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="2 12"
        />
      </svg>
    </>
  );
}

function TornEdge() {
  return (
    <svg className="hs-torn" viewBox="0 0 1440 30" preserveAspectRatio="none" aria-hidden>
      <path
        fill="#e9ebdf"
        d="M0 30 L0 14 L40 8 L85 16 L130 6 L190 15 L250 9 L300 17 L360 7 L420 14 L480 5 L545 13 L610 8 L670 16 L735 7 L800 14 L860 6 L930 15 L990 9 L1050 17 L1115 8 L1180 14 L1240 6 L1300 15 L1360 9 L1410 13 L1440 8 L1440 30 Z"
      />
    </svg>
  );
}

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
      <main className="hs-root flex min-h-screen items-center justify-center p-6 text-center">
        <style>{STYLES}</style>
        <div className="flex flex-col items-center gap-3">
          <Compass className="animate-spin text-[#27402f]" style={{ animationDuration: "3s" }} size={34} />
          <p className="hs-serif text-lg font-bold text-[#27402f]">Loading your profile...</p>
        </div>
      </main>
    );
  }

  // Not signed in state
  if (!user) {
    return (
      <main className="hs-root flex min-h-screen items-center justify-center px-4 py-16" style={{ background: "#27402f" }}>
        <style>{STYLES}</style>
        <div className="hs-paper w-full max-w-md p-8 text-center sm:p-10">
          <div className="hs-empty-ico">
            <Compass size={28} />
          </div>
          <h2 className="hs-serif mt-6 text-3xl font-bold">Sign in to see your profile</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#5b685f]">
            Your saved trips, liked places and explorer details live here once you&apos;re signed in.
          </p>
          <div className="mt-7 flex flex-col gap-3">
            <Link href="/auth/sign-in" className="hs-btn">Sign in</Link>
            <Link href="/auth/sign-up" className="hs-btn light">Create an account</Link>
          </div>
        </div>
      </main>
    );
  }

  const avatarSrc = photoPreview || profile?.avatar_url || null;
  const initial = (profile?.display_name || user.email || "E")[0].toUpperCase();
  const handle = profile?.username || user.email?.split("@")[0];

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  const missing = [
    !profile?.avatar_url && "a photo",
    !profile?.bio && "a short bio",
    !profile?.district && "your home district",
    !profile?.travel_style && "your travel style",
    !profile?.experience_level && "your experience level",
    !profile?.website_url && "a link",
    (profile?.favorite_categories?.length || 0) === 0 && "favourite categories",
    (profile?.languages?.length || 0) === 0 && "languages",
  ].filter(Boolean) as string[];

  const goEdit = () => {
    setActiveTab("edit");
    setTimeout(
      () => document.getElementById("hs-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" }),
      60
    );
  };

  const tabs: { id: "saved" | "likes" | "edit"; label: string; short: string; icon: ReactNode; count?: number }[] = [
    { id: "saved", label: "Saved for trips", short: "Saved", icon: <Bookmark size={16} />, count: placeIds.length },
    { id: "likes", label: "Liked places", short: "Liked", icon: <Heart size={16} />, count: likedPlaceIds.length },
    { id: "edit", label: "Edit profile", short: "Edit", icon: <Pencil size={16} /> },
  ];

  return (
    <main className="hs-root min-h-screen pb-24">
      <style>{STYLES}</style>

      {/* =====================================================
          HERO
      ===================================================== */}
      <section className="hs-hero">
        <HeroBackdrop />
        <div className="container-main hs-hero-inner">
          <div className="hs-top">
            <button type="button" onClick={handleSignOut} className="hs-ghost-link">
              Sign out
            </button>
          </div>

          <div className="hs-hero-grid">
            <figure className="hs-polaroid">
              <div className="hs-photo">
                {avatarSrc ? (
                  <Image src={avatarSrc} alt={profile?.display_name || "Profile"} fill unoptimized className="object-cover" />
                ) : (
                  <div className="hs-initial">{initial}</div>
                )}
              </div>
              <figcaption>@{handle}</figcaption>
              <button type="button" className="hs-tape" onClick={goEdit} aria-label="Change profile photo">
                <Camera size={13} /> Change
              </button>
            </figure>

            <div>
              <h1 className="hs-name hs-in-2">{profile?.display_name || "Explorer"}</h1>
              {memberSince && <p className="hs-sub hs-in-2">Exploring Sri Lanka with us since {memberSince}</p>}

              {profile?.bio && <p className="hs-note hs-in-3">{profile.bio}</p>}

              {(profile?.district || profile?.travel_style || profile?.experience_level || profile?.website_url) && (
                <div className="hs-stamps hs-in-3">
                  {profile?.district && (
                    <span className="hs-stamp">
                      <MapPin size={13} /> {profile.district}
                    </span>
                  )}
                  {profile?.travel_style && <span className="hs-stamp">{profile.travel_style}</span>}
                  {profile?.experience_level && <span className="hs-stamp">{profile.experience_level} explorer</span>}
                  {profile?.website_url && (
                    <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="hs-stamp" style={{ cursor: "pointer" }}>
                      <Globe size={13} /> Website
                    </a>
                  )}
                </div>
              )}

              <p className="hs-line hs-in-4">
                <button type="button" className="hs-ulink" onClick={() => setActiveTab("saved")}>
                  {placeIds.length} {placeIds.length === 1 ? "place" : "places"} saved
                </button>{" "}
                for trips and{" "}
                <button type="button" className="hs-ulink" onClick={() => setActiveTab("likes")}>
                  {likedPlaceIds.length} liked
                </button>
                .
                {profile && profile.favorite_categories.length > 0 && (
                  <> Into {joinList(profile.favorite_categories)}.</>
                )}
                {profile && profile.languages.length > 0 && <> Speaks {joinList(profile.languages)}.</>}
                {missing.length > 0 && (
                  <>
                    {" "}
                    <button type="button" className="hs-ulink" onClick={goEdit}>
                      Finish your profile
                    </button>{" "}
                    ({missing.length} to go).
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
        <TornEdge />
      </section>

      {/* =====================================================
          TABS
      ===================================================== */}
      <div id="hs-tabs" className="container-main mt-6 scroll-mt-4">
        <div className="hs-tabs" role="tablist" aria-label="Profile sections">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              onClick={() => setActiveTab(t.id)}
              className="hs-tab"
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.short}</span>
              {t.count !== undefined && <span className="hs-count">{t.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* =====================================================
          TAB 1: SAVED FOR TRIPS
      ===================================================== */}
      {activeTab === "saved" && (
        <section key="saved" className="hs-panel container-main mt-10">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-Arial text-3xl font-medium">Saved trip destinations</h2>
              <p className="mt-1 text-[15px] text-[#5b685f]">
                Places you saved to your itinerary while browsing Explore.
              </p>
            </div>
            <Link href="/places" className="group inline-flex items-center gap-1.5 text-sm font-bold text-[#2f5d8a]">
              Browse more places
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1.5" />
            </Link>
          </div>

          {loadingPlaces ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="hs-skel" />
              ))}
            </div>
          ) : savedPlaces.length === 0 ? (
            <Reveal>
              <div className="hs-empty">
                <div className="hs-empty-ico">
                  
                </div>
                <h3 className="font-Arial mt-5 text-2xl font-medium">Nothing saved yet</h3>
                <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-[#5b685f]">
                  Find a waterfall nobody told you about, then tap the &ldquo;+&rdquo; on its card. It will wait for you here.
                </p>
                <Link href="/places" className="hs-btn mt-6">
                  <Compass size={16} /> Explore hidden Sri Lanka
                </Link>
              </div>
            </Reveal>
          ) : (
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {savedPlaces.map((place, i) => (
                <Reveal key={place.id} delay={(i % 4) * 70}>
                  <div className="hs-card" style={{ ["--cr" as string]: `${TILTS[i % TILTS.length]}deg` }}>
                    <PlaceCard place={place} />
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </section>
      )}

      {/* =====================================================
          TAB 2: LIKED PLACES
      ===================================================== */}
      {activeTab === "likes" && (
        <section key="likes" className="hs-panel container-main mt-10">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-Arial text-3xl font-medium">Liked places</h2>
              <p className="mt-1 text-[20px] text-[#5b685f]">Destinations you gave a heart to in Explore.</p>
            </div>
            <Link href="/places" className="group inline-flex items-center gap-1.5 text-sm font-bold text-[#2f5d8a]">
              Find more favourites
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1.5" />
            </Link>
          </div>

          {loadingPlaces ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="hs-skel" />
              ))}
            </div>
          ) : likedPlaces.length === 0 ? (
            <Reveal>
              <div className="hs-empty">
                
                <h3 className="font-Arial text-3xl font-medium">No hearts yet</h3>
                <p className="mx-auto mt-2 max-w-md text-[18px] leading-relaxed text-[#5b685f]">
                  Tap the heart on any place that makes you want to pack a bag. Your favourites will collect here.
                </p>
                <Link href="/places" className="hs-btn mt-6">
                  Go to Explore
                </Link>
              </div>
            </Reveal>
          ) : (
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {likedPlaces.map((place, i) => (
                <Reveal key={place.id} delay={(i % 4) * 70}>
                  <div className="hs-card" style={{ ["--cr" as string]: `${TILTS[(i + 2) % TILTS.length]}deg` }}>
                    <PlaceCard place={place} />
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </section>
      )}

      {/* =====================================================
          TAB 3: EDIT PROFILE FORM
      ===================================================== */}
      {activeTab === "edit" && (
        <section key="edit" className="hs-panel container-main mt-10 max-w-3xl">
          <div className="hs-paper p-5 sm:p-10">
            <h2 className="font-Arial text-3xl font-medium">Edit your profile</h2>
            <p className="mt-1 text-[18px] text-[#5b685f]">
              This is how other explorers in the community will see you.
            </p>

            {missing.length > 0 && (
              <p className="hs-todo">Still blank: {joinList(missing)}.</p>
            )}

            {editSuccessMessage && (
              <div className="hs-msg ok" role="status">
                <CheckCircle2 size={18} />
                {editSuccessMessage}
              </div>
            )}

            {editErrorMessage && (
              <div className="hs-msg err" role="alert">
                <AlertCircle size={18} />
                {editErrorMessage}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="mt-8 space-y-8">
              {/* Photo Upload */}
              <Reveal>
                <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
                  <div className="hs-polaroid" style={{ width: 120, padding: "7px 7px 9px", ["--r" as string]: "2deg" }}>
                    <div className="hs-photo">
                      {avatarSrc ? (
                        <Image src={avatarSrc} alt="Avatar preview" fill unoptimized className="object-cover" />
                      ) : (
                        <div className="hs-initial" style={{ fontSize: "2.6rem" }}>{initial}</div>
                      )}
                    </div>
                  </div>

                  <div className="text-center sm:text-left">
                    <span className="hs-label">Profile photo</span>
                    <label className="hs-btn light mt-2 cursor-pointer !py-2.5 !text-[13px]">
                      <Camera size={15} /> Choose a new photo
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handlePhotoChange}
                        className="sr-only"
                      />
                    </label>
                    <span className="hs-hint mt-2 block">PNG, JPG or WebP, up to 5MB</span>
                  </div>
                </div>
              </Reveal>

              {/* Display Name & Username */}
              <Reveal>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="hs-label" htmlFor="display_name">Display name</label>
                    <input
                      id="display_name"
                      type="text"
                      required
                      value={editForm.display_name}
                      onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                      className="hs-input"
                    />
                  </div>

                  <div>
                    <label className="hs-label" htmlFor="username">Username</label>
                    <input
                      id="username"
                      type="text"
                      required
                      value={editForm.username}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                      className="hs-input"
                    />
                  </div>
                </div>
              </Reveal>

              {/* Bio */}
              <Reveal>
                <div>
                  <label className="hs-label" htmlFor="bio">A few words about you</label>
                  <textarea
                    id="bio"
                    rows={4}
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="Tell fellow travellers what you love about exploring hidden Sri Lanka..."
                    className="hs-input leading-relaxed"
                  />
                </div>
              </Reveal>

              {/* District & Travel Style */}
              <Reveal>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="hs-label" htmlFor="district">Home district</label>
                    <select
                      id="district"
                      value={editForm.district}
                      onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                      className="hs-input"
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
                    <label className="hs-label" htmlFor="travel_style">Travel style</label>
                    <select
                      id="travel_style"
                      value={editForm.travel_style}
                      onChange={(e) => setEditForm({ ...editForm, travel_style: e.target.value })}
                      className="hs-input"
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
              </Reveal>

              {/* Experience Level & Website */}
              <Reveal>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="hs-label" htmlFor="experience_level">Experience level</label>
                    <select
                      id="experience_level"
                      value={editForm.experience_level}
                      onChange={(e) => setEditForm({ ...editForm, experience_level: e.target.value })}
                      className="hs-input"
                    >
                      <option value="">Select level</option>
                      <option value="Beginner">Beginner Explorer</option>
                      <option value="Intermediate">Intermediate Explorer</option>
                      <option value="Seasoned Pathfinder">Seasoned Pathfinder</option>
                    </select>
                  </div>

                  <div>
                    <label className="hs-label" htmlFor="website_url">Website or social link</label>
                    <input
                      id="website_url"
                      type="url"
                      value={editForm.website_url}
                      onChange={(e) => setEditForm({ ...editForm, website_url: e.target.value })}
                      placeholder="https://instagram.com/yourhandle"
                      className="hs-input"
                    />
                  </div>
                </div>
              </Reveal>

              {/* Favorite Categories */}
              <Reveal>
                <div>
                  <span className="hs-label">What are you into?</span>
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    {CATEGORIES.map((cat) => {
                      const isSelected = editForm.favorite_categories.includes(cat);
                      return (
                        <button
                          type="button"
                          key={cat}
                          aria-pressed={isSelected}
                          onClick={() => {
                            const updated = isSelected
                              ? editForm.favorite_categories.filter((c) => c !== cat)
                              : [...editForm.favorite_categories, cat];
                            setEditForm({ ...editForm, favorite_categories: updated });
                          }}
                          className={`hs-pick ${isSelected ? "on" : ""}`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Reveal>

              {/* Languages Spoken */}
              <Reveal>
                <div>
                  <span className="hs-label">Languages you speak</span>
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    {LANGUAGES.map((lang) => {
                      const isSelected = editForm.languages.includes(lang);
                      return (
                        <button
                          type="button"
                          key={lang}
                          aria-pressed={isSelected}
                          onClick={() => {
                            const updated = isSelected
                              ? editForm.languages.filter((l) => l !== lang)
                              : [...editForm.languages, lang];
                            setEditForm({ ...editForm, languages: updated });
                          }}
                          className={`hs-pick ${isSelected ? "on" : ""}`}
                        >
                          {lang}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Reveal>

              {/* Submit Button */}
              <Reveal>
                <div className="border-t-2  pt-6">
                  <button type="submit" disabled={savingProfile} className="hs-btn sm:min-w-[220px]">
                    {savingProfile ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Saving...
                      </>
                    ) : (
                      "Save changes"
                    )}
                  </button>
                </div>
              </Reveal>
            </form>
          </div>
        </section>
      )}
    </main>
  );
}
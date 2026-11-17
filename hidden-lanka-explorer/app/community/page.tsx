"use client";

import { useState, useEffect, useMemo, useRef, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart, Search, X, Trash2, Star, ChevronDown, ChevronLeft, ChevronRight, ExternalLink,
  MessageSquare, HelpCircle, AlertTriangle, Users, Leaf, Bookmark, MapPin, ArrowRight, Check, MessageCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/* ==========================================================================
   TYPES & DATA MODELS  (unchanged)
   ========================================================================== */

type TabType = "reviews" | "discussions" | "tips" | "contributors" | "chats" | "ethics";

type RealPlace = {
  id: string;
  name: string;
  slug: string;
  district: string | null;
  nearest_town: string | null;
  category_id: string | null;
  category_name?: string;
  category_emoji?: string;
  short_description: string | null;
  description: string | null;
  hidden_tips: string | null;
  safety_tips: string | null;
  hero_image_url: string | null;
  difficulty: string | null;
  best_season: string | null;
  activities: string[] | null;
  like_count: number | null;
  rating_avg: number | null;
  rating_count: number | null;
  created_at: string;
};

type CommunityReview = {
  id: string;
  place_id: string;
  place_name: string;
  place_district: string;
  place_image: string | null;
  author_id?: string | null;
  author_name: string;
  author_handle: string;
  rating: number;
  title: string;
  body: string;
  key_tip?: string | null;
  created_at: string;
  likes: number;
  comments: ReviewComment[];
};

type ReviewComment = {
  id: string;
  review_id: string;
  author_id?: string | null;
  author_name: string;
  author_handle: string;
  text: string;
  created_at: string;
};

type CommunityDiscussion = {
  id: string;
  place_id?: string | null;
  place_name?: string | null;
  title: string;
  category: string;
  district: string;
  author_id?: string | null;
  author_name: string;
  author_handle: string;
  created_at: string;
  upvotes: number;
  replies: DiscussionReply[];
};

type DiscussionReply = {
  id: string;
  discussion_id: string;
  author_id?: string | null;
  author_name: string;
  author_handle: string;
  text: string;
  created_at: string;
};

type CommunityTip = {
  id: string;
  place_id?: string | null;
  place_name?: string | null;
  title: string;
  district: string;
  category: string;
  author_name: string;
  author_handle: string;
  severity: "essential" | "warning" | "info";
  text: string;
  helpful_count: number;
  created_at: string;
};

type RealProfile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  district: string | null;
  travel_style: string | null;
  favorite_categories: string[] | null;
  created_at: string;
};

type CommunityConversation = {
  id: string;
  participant_one: string;
  participant_two: string;
  created_at: string;
};

type CommunityMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

/* STORAGE KEYS  (unchanged) */
const STORAGE_REVIEWS_KEY = "lanka_real_community_reviews";
const STORAGE_DISCUSSIONS_KEY = "lanka_real_community_discussions";
const STORAGE_TIPS_KEY = "lanka_real_community_tips";
const STORAGE_LIKES_KEY = "lanka_real_community_likes";

/* ==========================================================================
   LOOK & FEEL  (presentation only)
   Forest green + amber, three-column layout: section nav | feed | side cards.
   Hero image: /footer.jpg (falls back to deep green if missing).
   ========================================================================== */
const STYLES = `
.cm-root{
  --green:#123d30; --green2:#1d5844; --leaf:#e6efe3; --amber:#e9b44c; --cream:#fbf4e3; --bg:white;
  --ink:#16251f; --text:#2a3a33; --muted:#66756d; --line:#e4e8e1; --red:#b3261e;
  --ease:cubic-bezier(.22,1,.36,1);
  font-family:Inter,"Segoe UI",Arial,Helvetica,sans-serif; background:var(--bg); color:var(--text); overflow-x:clip; font-size:14px; line-height:1.55;
}
.cm-root *{ font-family:inherit; }
.cm-root :focus-visible{ outline:2px solid var(--green2); outline-offset:2px; border-radius:6px; }
.cm-hide-scroll{ scrollbar-width:none; } .cm-hide-scroll::-webkit-scrollbar{ display:none; }

.cm-toast{ position:fixed; left:20px; bottom:20px; z-index:70; max-width:calc(150vw - 40px); padding:12px 16px; border-radius:8px;
  background:var(--green); color:#fff; font-size:14px; box-shadow:0 8px 24px rgba(115, 125, 121, 0.3); animation:cm-toast .35s var(--ease) both; }
@keyframes cm-toast{ from{ opacity:0; transform:translateY(12px) } to{ opacity:1; transform:none } }

/* ----- hero ----- */
.cm-hero{ position:relative; isolation:isolate; overflow:hidden; color:#fff; padding:64px 0 56px; background:var(--green); }
.cm-hero-bg{ position:absolute; inset:0; z-index:-3; background:url('/footer.jpg') center 40% / cover no-repeat, var(--green); }
.cm-hero-shade{ position:absolute; inset:0; z-index:-2; background:linear-gradient(95deg, rgba(107, 113, 111, 0.95) 0%, rgba(14,52,40,.8) 48%, rgba(18,61,48,.45) 100%); }
.cm-eyebrow{ margin:0 0 14px; font-size:13px; font-weight:600; letter-spacing:.14em; text-transform:uppercase; color:rgba(255,255,255,.7); }
.cm-mask{ display:block; padding:.06em .2em .12em 0; margin:-.06em 0 -.12em; }
.cm-line{ display:block; opacity:0; transform:translateX(calc(-1 * min(90vw,900px)));
  transition:transform 1.1s cubic-bezier(.16,1,.3,1), opacity .5s ease-out; transition-delay:calc(var(--i) * 120ms); }
.cm-in .cm-line{ opacity:1; transform:none; }
.cm-h1{ margin:0; max-width:34rem; font-size:clamp(2rem,4.6vw,3.1rem); font-weight:500; line-height:1.12; letter-spacing:-.015em; }
.cm-lead{ margin:16px 0 0; max-width:30rem; font-size:19px; line-height:1.65; color:rgba(255,255,255,.8); }
.cm-cta{ display:flex; flex-wrap:wrap; align-items:center; gap:12px 24px; margin-top:24px; }
.cm-chip-loc{ position:absolute; right:0; bottom:-30px; display:inline-flex; align-items:center; gap:7px; padding:8px 14px; border-radius:8px; font-size:16px; font-weight:400; color:black; background:rgba(30, 31, 30, 0.88); }
.cm-herowrap{ position:relative; }
.cm-fade{ opacity:0; } .cm-in .cm-fade{ animation:cm-fadein .8s ease-out both; animation-delay:calc(.7s + var(--d,0) * .12s); }
@keyframes cm-fadein{ from{ opacity:0 } to{ opacity:1 } }

/* ----- buttons ----- */
.cm-btn{ display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:10px 18px; border-radius:8px; font-size:16px; font-weight:600; cursor:pointer;
  border:1px solid transparent; text-decoration:none; transition:background .2s, color .2s, border-color .2s; }
.cm-btn.dark{ background:var(--green); color:#fff; } .cm-btn.dark:hover{ background:var(--green2); }
.cm-btn.amber{ background:var(--amber); color:var(--green); } .cm-btn.amber:hover{ background:#f1c366; }
.cm-btn.line{ background:#fff; color:var(--ink); border-color:#cfd8d2; } .cm-btn.line:hover{ border-color:var(--green); }
.cm-btn.sm{ padding:8px 14px; }
.cm-textbtn{ display:inline-flex; align-items:center; gap:6px; padding:4px 0; font-size:16px; font-weight:600; color:#fff; cursor:pointer; }
.cm-textbtn:hover{ text-decoration:underline; text-underline-offset:4px; }
.cm-link{ display:inline-flex; align-items:center; gap:5px; font-size:16px; font-weight:600; color:var(--green2); text-decoration:none; cursor:pointer; }
.cm-link:hover{ text-decoration:underline; text-underline-offset:3px; }

/* ----- place filter ----- */
.cm-filter{ padding:34px 0 24px; }
.cm-filter-top{ display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:12px 20px; }
.cm-filter h2{ margin:0; font-size:22px; font-weight:700; letter-spacing:-.01em; color:var(--ink); }
.cm-filter p{ margin:2px 0 0; font-size:16px; color:var(black); }
.cm-search{ position:relative; width:min(100%,280px); }
.cm-search svg.s{ position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#7b8d85; pointer-events:none; }
.cm-search input{ width:100%; padding:9px 32px 9px 36px; font-size:15px; color:var(--ink); background:#fff; border:1px solid var(--line); border-radius:8px; }
.cm-search input:focus{ outline:none; border-color:var(--green2); box-shadow:0 0 0 3px rgba(29,88,68,.12); }
.cm-search button{ position:absolute; right:6px; top:50%; transform:translateY(-50%); display:grid; place-items:center; width:24px; height:24px; color:#7b8d85; cursor:pointer; }
.cm-pbar{ display:flex; align-items:center; gap:10px; margin-top:16px; }
.cm-chips{ flex:1; min-width:0; display:flex; align-items:center; gap:8px; overflow-x:auto; padding:2px 0; }
.cm-chip{ white-space:nowrap; padding:8px 16px; border-radius:999px; font-size:15px; font-weight:500; color:var(--ink); background:#fff; border:1px solid var(--line); cursor:pointer;
  transition:background .2s, color .2s, border-color .2s; }
.cm-chip small{ margin-left:6px; font-size:12px; font-weight:400; color:var(--muted); }
.cm-chip:hover{ border-color:var(--green); }
.cm-chip[aria-pressed="true"]{ background:var(--green); border-color:var(--green); color:#fff; } .cm-chip[aria-pressed="true"] small{ color:rgba(255,255,255,.7); }
.cm-arrows{ display:flex; gap:6px; }
.cm-arrow{ display:grid; place-items:center; width:30px; height:30px; border-radius:999px; background:#fff; border:1px solid var(--line); color:var(--ink); cursor:pointer; transition:border-color .2s; }
.cm-arrow:hover{ border-color:var(--green); }
.cm-nomatch{ font-size:13px; color:var(--muted); padding:7px 4px; white-space:nowrap; }

/* ----- 3-column layout ----- */
.cm-shell{ padding:8px 0 72px; }
.cm-layout{ display:grid; grid-template-columns:210px minmax(0,1fr) 270px; gap:24px; align-items:start; }
.cm-side, .cm-rail2{ position:sticky; top:84px; display:flex; flex-direction:column; gap:14px; }
.cm-card{ background:#fff; border:1px solid var(--line); border-radius:12px; padding:16px; }

/* left nav */
.cm-navcard{ background:#fff; border:1px solid var(--line); border-radius:12px; padding:14px 10px; }
.cm-navlabel{ margin:0 8px 8px; font-size:16px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:var(--muted); }
.cm-nav{ display:flex; flex-direction:column; gap:2px; }
.cm-navbtn{ display:flex; align-items:center; gap:10px; width:100%; padding:9px 10px; border-radius:8px; font-size:15px; font-weight:500; color:var(--text); text-align:left; cursor:pointer; transition:background .2s, color .2s; }
.cm-navbtn svg{ flex-shrink:0; color:var(--muted); }
.cm-navbtn span{ flex:1; }
.cm-navbtn small{ font-size:11px; color:var(--muted); }
.cm-navbtn:hover{ background:var(--bg); }
.cm-navbtn[aria-selected="true"], .cm-navbtn[aria-pressed="true"]{ background:var(--leaf); color:var(--green); font-weight:600; }
.cm-navbtn[aria-selected="true"] svg, .cm-navbtn[aria-pressed="true"] svg{ color:var(--green2); }
.cm-sep{ height:1px; margin:8px 6px; background:var(--line); }
.cm-stat h3{ margin:0; font-size:17px; font-weight:700; line-height:1.25; color:var(--ink); }
.cm-stat dl{ margin:12px 0 0; display:grid; gap:6px; font-size:15px; color:var(--muted); font-weight:700;}
.cm-stat dl div{ display:flex; align-items:baseline; gap:6px; } .cm-stat dt{ order:2;  } .cm-stat dd{ order:1; margin:0; font-size:18px; font-weight:700; color:var(--ink); }
.cm-stat .cm-link{ margin-top:14px; font-size:14px; }

/* banner */
.cm-banner{ display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px 20px; padding:16px 20px; background:var(#898b88); border:1px solid #898b88; border-radius:12px; }
.cm-banner b{ display:block; font-size:15px; color:var(white); } .cm-banner span{ font-size:16px; color:var(--muted); }

/* panel head */
.cm-panel{ margin-top:22px; }
.cm-phead{ display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:10px 16px; }
.cm-phead h2{ margin:0; font-size:19px; font-weight:700; letter-spacing:-.01em; color:var(--ink); }
.cm-phead p{ margin:2px 0 0; font-size:15px; color:var(black); font-weight:500; }
.cm-tools{ display:flex; flex-wrap:wrap; align-items:center; gap:10px; }
.cm-tools .cm-search{ width:210px; }
.cm-select{ padding:8px 10px; font-size:12px; font-weight:500; color:var(--ink); background:#fff; border:1px solid var(--line); border-radius:8px; cursor:pointer; }
.cm-list{ display:flex; flex-direction:column; gap:16px; margin-top:16px; }
.cm-up{ opacity:0; animation:cm-fadein .5s ease-out both; animation-delay:calc(var(--i) * 50ms); }
.cm-empty{ padding:36px 24px; margin-top:16px; text-align:center; background:#fff; border:1px dashed #c9d4cc; border-radius:12px; }
.cm-empty h3{ margin:0; font-size:18px; font-weight:700; color:var(--ink); } .cm-empty p{ margin:6px auto 0; max-width:30rem; color:var(--muted); }
.cm-empty .cm-btn{ margin-top:16px; }

/* review card */
.cm-post{ padding:20px; background:#fff; border:1px solid var(--line); border-radius:12px; }
.cm-post-top{ display:flex; align-items:center; gap:10px; }
.cm-avatar{ position:relative; display:grid; place-items:center; width:34px; height:34px; flex-shrink:0; border-radius:50%; overflow:hidden; background:var(--leaf); color:var(--green); font-size:13px; font-weight:700; }
.cm-avatar.lg{ width:46px; height:46px; font-size:17px; }
.cm-who{ flex:1; min-width:0; line-height:1.3; } .cm-who b{ display:block; font-size:13px; color:var(--ink); } .cm-who small{ font-size:11px; color:var(--muted); }
.cm-tagrow{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:14px; }
.cm-tag{ display:inline-block; padding:3px 8px; border-radius:4px; font-size:10px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:var(--green2); background:var(--leaf); }
.cm-tag.q{ color:#8a5a0c; background:#fbefd4; }
.cm-stars{ display:flex; gap:1px; color:var(--amber); }
.cm-title{ margin:10px 0 0; font-size:19px; font-weight:700; line-height:1.3; letter-spacing:-.01em; color:var(--ink); }
.cm-where{ display:flex; align-items:center; gap:6px; margin-top:6px; font-size:12px; color:var(--green2); font-weight:500; }
.cm-photo{ position:relative; width:100%; aspect-ratio:16/9; margin-top:14px; border-radius:10px; overflow:hidden; background:var(--leaf); }
.cm-body{ margin:14px 0 0; line-height:1.7; color:var(--text); font-size:14px; }
.cm-note{ margin:12px 0 0; padding:8px 12px; border-left:3px solid var(--amber); background:var(--cream); border-radius:0 8px 8px 0; font-size:13px; } .cm-note b{ color:var(--ink); }
.cm-acts{ display:flex; flex-wrap:wrap; align-items:center; gap:6px 20px; margin-top:16px; padding-top:12px; border-top:1px solid var(--line); font-size:12px; color:var(--muted); }
.cm-act{ display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:600; color:var(--muted); cursor:pointer; transition:color .2s; }
.cm-act:hover{ color:var(--ink); } .cm-act.rm:hover{ color:var(--red); }
.cm-act[aria-pressed="true"]{ color:var(--red); } .cm-act[aria-pressed="true"] svg{ fill:var(--red); }
.cm-replies{ margin-top:14px; padding:12px 14px; background:var(--bg); border-radius:10px; }
.cm-reply{ display:flex; justify-content:space-between; gap:10px; margin-bottom:12px; font-size:13px; }
.cm-reply p{ margin:2px 0 0; color:var(--text); } .cm-reply .nm{ font-weight:700; color:var(--ink); } .cm-reply small{ margin-left:8px; font-size:11px; color:var(--muted); }
.cm-inline{ display:flex; gap:8px; }
.cm-inline input{ flex:1; min-width:0; padding:9px 12px; font-size:13px; color:var(--ink); background:#fff; border:1px solid var(--line); border-radius:8px; }
.cm-inline input:focus{ outline:none; border-color:var(--green2); box-shadow:0 0 0 3px rgba(29,88,68,.12); }
.cm-meta{ font-size:12px; color:var(--muted); }

/* discussions */
.cm-qhead{ display:flex; align-items:flex-start; justify-content:space-between; gap:16px; }
.cm-qhead h3{ margin:8px 0 0; font-size:17px; font-weight:700; line-height:1.3; color:var(--ink); }
.cm-toggle{ display:inline-flex; align-items:center; gap:6px; flex-shrink:0; font-size:12px; font-weight:600; color:var(--green2); cursor:pointer; }
.cm-toggle:hover{ text-decoration:underline; text-underline-offset:3px; } .cm-toggle svg{ transition:transform .3s var(--ease); } .cm-toggle[aria-expanded="true"] svg{ transform:rotate(180deg); }

/* tips */
.cm-tip{ padding:18px 20px; background:#fff; border:1px solid var(--line); border-left:4px solid var(--c); border-radius:12px; }
.cm-sev{ font-size:11px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:var(--c); }
.cm-tip h3{ margin:4px 0 0; font-size:17px; font-weight:700; line-height:1.3; color:var(--ink); }
.cm-tip p{ margin:8px 0 0; line-height:1.65; color:var(--text); }

/* profiles */
.cm-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:14px; margin-top:16px; }
.cm-profile{ display:flex; flex-direction:column; gap:10px; height:100%; padding:16px; border:1px solid var(--line); border-radius:12px; background:#fff; }
.cm-profile.me{ border-color:var(--green2); }
.cm-profile .nm{ font-size:14px; font-weight:700; color:var(--ink); } .cm-profile p{ margin:0; font-size:13px; color:var(--text); }

/* private chats */
.cm-chat-layout{ display:grid; grid-template-columns:minmax(220px,.8fr) minmax(0,1.2fr); gap:14px; margin-top:16px; }
.cm-chat-sidebar,.cm-chat-window{ min-width:0; padding:16px; border:1px solid var(--line); border-radius:12px; background:#fff; }
.cm-chat-sidebar{ display:grid; align-content:start; gap:18px; }
.cm-chat-sidebar h3{ margin:0 0 10px; font-size:15px; color:var(--ink); }
.cm-chat-list{ display:grid; gap:7px; max-height:220px; overflow-y:auto; }
.cm-chat-person{ display:flex; align-items:center; gap:9px; min-width:0; padding:9px; border:1px solid var(--line); border-radius:9px; background:#fff; }
.cm-chat-person[aria-pressed="true"]{ border-color:var(--green2); background:var(--leaf); }
.cm-chat-person-info{ flex:1; min-width:0; text-align:left; }
.cm-chat-person-info b,.cm-chat-person-info small{ display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.cm-chat-person-info b{ color:var(--ink); font-size:13px; }
.cm-chat-person-info small{ color:var(--muted); font-size:11px; }
.cm-chat-invite{ flex-shrink:0; padding:6px 8px; border-radius:7px; color:var(--green2); font-size:11px; font-weight:700; cursor:pointer; }
.cm-chat-invite:hover{ background:var(--leaf); }
.cm-chat-window{ display:flex; flex-direction:column; min-height:420px; }
.cm-chat-window-head{ display:flex; align-items:center; gap:10px; padding-bottom:12px; border-bottom:1px solid var(--line); }
.cm-chat-window-head b{ color:var(--ink); }
.cm-chat-messages{ display:flex; flex:1; flex-direction:column; align-items:flex-start; gap:9px; min-height:280px; max-height:440px; padding:14px 0; overflow-y:auto; }
.cm-chat-bubble{ max-width:82%; padding:9px 12px; border-radius:12px 12px 12px 3px; background:var(--leaf); color:var(--text); overflow-wrap:anywhere; }
.cm-chat-bubble.me{ align-self:flex-end; border-radius:12px 12px 3px 12px; background:var(--green); color:#fff; }
.cm-chat-bubble p{ margin:0; white-space:pre-wrap; }
.cm-chat-bubble time{ display:block; margin-top:4px; font-size:10px; opacity:.72; }
.cm-chat-compose{ display:flex; align-items:flex-end; gap:8px; padding-top:12px; border-top:1px solid var(--line); }
.cm-chat-compose textarea{ flex:1; min-width:0; min-height:42px; max-height:120px; resize:vertical; padding:10px 12px; border:1px solid var(--line); border-radius:8px; color:var(--ink); font:inherit; }
.cm-chat-error{ margin-top:12px; padding:10px 12px; border-radius:8px; background:#fff0ee; color:var(--red); font-size:13px; }

/* ethics */
.cm-ethic{ display:flex; gap:14px; padding:18px 20px; background:#fff; border:1px solid var(--line); border-radius:12px; }
.cm-ethic .ic{ display:grid; place-items:center; width:30px; height:30px; flex-shrink:0; border-radius:50%; background:var(--leaf); color:var(--green2); }
.cm-ethic h3{ margin:0; font-size:15px; font-weight:700; color:var(--ink); } .cm-ethic p{ margin:4px 0 0; line-height:1.65; color:var(--text); }

/* right rail cards */
.cm-wisdom{ background:var(--cream); border-color:#f0e2bd; }
.cm-green{ background:var(--leaf); border-color:#d5e3d0; }
.cm-rc h4{ margin:0; font-size:18px; font-weight:700; line-height:1.3; color:var(--ink); }
.cm-rc p{ margin:6px 0 0; font-size:16px; line-height:1.6; color:var(--text); font-weight:500; }
.cm-rc .cm-link{ margin-top:12px; font-size:15px; }
.cm-rc .k{ margin:0 0 6px; font-size:10px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:var(--muted); }
.cm-rc .ph{ position:relative; width:100%; aspect-ratio:16/10; margin-bottom:12px; border-radius:8px; overflow:hidden; background:var(--leaf); }
.cm-rc ul{ margin:10px 0 0; padding:0; list-style:none; display:grid; gap:6px; font-size:16px; }
.cm-rc li{ display:flex; align-items:center; gap:8px; } .cm-rc li svg{ color:var(--green2); flex-shrink:0; }

/* ----- modal ----- */
.cm-overlay{ position:fixed; inset:0; z-index:80; display:flex; align-items:flex-start; justify-content:center; padding:16px; overflow-y:auto; background:rgba(8,28,21,.62); animation:cm-fadein .2s ease-out both; }
.cm-modal{ position:relative; width:100%; max-width:34rem; margin:40px 0; padding:28px; background:#fff; border-radius:14px; box-shadow:0 24px 60px rgba(0,0,0,.35); animation:cm-pop .3s var(--ease) both; }
@keyframes cm-pop{ from{ opacity:0; transform:translateY(14px) } to{ opacity:1; transform:none } }
.cm-close{ position:absolute; top:16px; right:16px; display:grid; place-items:center; width:34px; height:34px; border-radius:8px; color:var(--muted); cursor:pointer; transition:background .2s, color .2s; }
.cm-close:hover{ background:var(--bg); color:var(--ink); }
.cm-modal h3{ margin:0; padding-right:40px; font-size:20px; font-weight:700; line-height:1.25; color:var(--ink); }
.cm-mtabs{ display:flex; gap:20px; margin-top:18px; border-bottom:1px solid var(--line); }
.cm-mtabs button{ position:relative; padding:10px 0; font-size:13px; font-weight:600; color:var(--muted); cursor:pointer; }
.cm-mtabs button[aria-pressed="true"]{ color:var(--green); } .cm-mtabs button[aria-pressed="true"]::after{ content:""; position:absolute; left:0; right:0; bottom:-1px; height:2px; background:var(--green); }
.cm-form{ display:flex; flex-direction:column; gap:16px; margin-top:20px; }
.cm-label{ display:block; font-size:13px; font-weight:600; color:var(--ink); }
.cm-field{ display:block; width:100%; margin-top:6px; padding:10px 12px; font-size:14px; line-height:1.5; color:var(--ink); background:#fff; border:1px solid #cfd8d2; border-radius:8px; transition:border-color .2s, box-shadow .2s; }
.cm-field:focus{ outline:none; border-color:var(--green2); box-shadow:0 0 0 3px rgba(29,88,68,.14); }
.cm-two{ display:grid; gap:14px; grid-template-columns:1fr 1fr; }
.cm-rate{ display:flex; gap:4px; margin-top:6px; }
.cm-rate button{ display:grid; place-items:center; width:36px; height:36px; color:#b3c0b8; cursor:pointer; border-radius:8px; transition:color .15s, background .15s; }
.cm-rate button:hover{ background:var(--bg); } .cm-rate button.on{ color:var(--amber); } .cm-rate button.on svg{ fill:var(--amber); }
.cm-sevpick{ display:flex; gap:8px; margin-top:6px; }
.cm-sevpick button{ flex:1; padding:9px 0; border-radius:8px; font-size:13px; font-weight:600; color:var(--muted); background:#fff; border:1px solid #cfd8d2; cursor:pointer; transition:background .2s, color .2s, border-color .2s; }
.cm-sevpick button:hover{ border-color:var(--green); } .cm-sevpick button[aria-pressed="true"]{ background:var(--green); border-color:var(--green); color:#fff; }
.cm-modal-foot{ display:flex; justify-content:flex-end; gap:10px; padding-top:16px; border-top:1px solid var(--line); }

@media (max-width:1100px){
  .cm-layout{ grid-template-columns:210px minmax(0,1fr); }
  .cm-rail2{ position:static; grid-column:1 / -1; display:grid; grid-template-columns:repeat(2,1fr); }
}
@media (max-width:820px){
  .cm-layout{ grid-template-columns:1fr; }
  .cm-chat-layout{ grid-template-columns:1fr; }
  .cm-side{ position:static; }
  .cm-nav{ flex-direction:row; overflow-x:auto; } .cm-navbtn{ width:auto; white-space:nowrap; }
  .cm-stat{ display:none; }
  .cm-chip-loc{ display:none; }
  .cm-hero{ padding:52px 0 40px; }
}
@media (max-width:560px){
  .cm-grid,.cm-two,.cm-rail2{ grid-template-columns:1fr; } .cm-modal{ padding:22px 18px; margin:16px 0; }
  .cm-tools .cm-search{ width:100%; } .cm-search{ width:100%; }
}
@media (prefers-reduced-motion:reduce){
  .cm-line,.cm-fade,.cm-up{ opacity:1 !important; transform:none !important; transition:none !important; animation:none !important; }
}

/* ----- NEW: hero image slider (added only; nothing above was changed) ----- */
.cm-slides{ position:absolute; inset:0; z-index:-3; overflow:hidden; }
.cm-slide{ position:absolute; inset:0; transform:translateX(100%); }
.cm-slide.on{ transform:none; transition:transform 1s var(--ease); }
.cm-slide.prev{ transform:translateX(-100%); transition:transform 1s var(--ease); }
.cm-slide img{ width:100% !important; height:100% !important; object-fit:cover !important; object-position:center 40%; }
.cm-chip-loc.cm-slidechip{ gap:10px; }
.cm-slidename{ color:#fff; text-decoration:none; font-weight:600; animation:cm-namein .6s var(--ease) both; }
.cm-slidename:hover{ text-decoration:underline; text-underline-offset:3px; }
@keyframes cm-namein{ from{ opacity:0; transform:translateY(8px) } to{ opacity:1; transform:none } }
.cm-dots{ display:inline-flex; gap:5px; margin-left:4px; }
.cm-dots button{ width:7px; height:7px; border-radius:999px; background:rgba(255,255,255,.4); cursor:pointer; transition:width .3s, background .3s; }
.cm-dots button[aria-pressed="true"]{ width:20px; background:var(--amber); }
.cm-hbtn{ display:grid; place-items:center; width:22px; height:22px; border-radius:999px; color:#fff; background:rgba(255,255,255,.14); cursor:pointer; }
.cm-hbtn:hover{ background:rgba(215, 205, 205, 0.28); }
@media (prefers-reduced-motion:reduce){
  .cm-slide,.cm-slide.on,.cm-slide.prev,.cm-slidename{ transition:none !important; animation:none !important; }
}

/* ----- cards stand out on white page ----- */
.cm-shell{ background:light gray; padding-top:28px; border-top:1px solid var(--line); }

.cm-shell .cm-card,
.cm-shell .cm-navcard,
.cm-shell .cm-post,
.cm-shell .cm-tip,
.cm-shell .cm-profile,
.cm-shell .cm-ethic,
.cm-shell .cm-empty{
  border-color:#d9e2d6;
  box-shadow:0 1px 2px rgba(18,61,48,.06), 0 6px 18px rgba(18,61,48,.07);
}

/* things that used var(--bg) and are now invisible on white */
.cm-replies{ background:#f4f7f2; }
.cm-navbtn:hover{ background:#eef3ec; }
.cm-close:hover{ background:#eef3ec; }
.cm-rate button:hover{ background:#eef3ec; }
`;

function Line({ i, children }: { i: number; children: ReactNode }) {
  return (
    <span className="cm-mask">
      <span className="cm-line" style={{ ["--i" as string]: i }}>
        {children}
      </span>
    </span>
  );
}

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="cm-stars" role="img" aria-label={`Rated ${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} strokeWidth={1.8} fill={i < rating ? "currentColor" : "none"} aria-hidden />
      ))}
    </div>
  );
}

function PanelHead({ title, text, right }: { title: string; text?: string; right?: ReactNode }) {
  return (
    <div className="cm-phead">
      <div>
        <h2>{title}</h2>
        {text && <p>{text}</p>}
      </div>
      {right}
    </div>
  );
}

function Empty({
  title,
  text,
  actionLabel,
  onAction,
}: {
  title: string;
  text: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="cm-empty">
      <h3>{title}</h3>
      <p>{text}</p>
      <button type="button" onClick={onAction} className="cm-btn dark">
        {actionLabel}
      </button>
    </div>
  );
}

export default function CommunityPage() {
  const [supabase] = useState(() => createClient());

  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email?: string;
    name?: string;
    handle?: string;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<TabType>("reviews");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlaceFilter, setSelectedPlaceFilter] = useState("all");

  const [placeSearch, setPlaceSearch] = useState("");
  const chipsRef = useRef<HTMLDivElement>(null);

  const [places, setPlaces] = useState<RealPlace[]>([]);
  const [profiles, setProfiles] = useState<RealProfile[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [chatConversations, setChatConversations] = useState<CommunityConversation[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<CommunityMessage[]>([]);
  const [chatMessagesConversationId, setChatMessagesConversationId] = useState<string | null>(null);
  const [chatDraft, setChatDraft] = useState("");
  const [chatInboxLoading, setChatInboxLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const [reviews, setReviews] = useState<CommunityReview[]>([]);
  const [discussions, setDiscussions] = useState<CommunityDiscussion[]>([]);
  const [tips, setTips] = useState<CommunityTip[]>([]);

  const [likedItems, setLikedItems] = useState<Record<string, boolean>>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"review" | "discussion" | "tip">("review");
  const [expandedDiscussionId, setExpandedDiscussionId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [heroIn, setHeroIn] = useState(false);

  // NEW: hero slider state (current + previous slide index, hover pause)
  const [hero, setHero] = useState({ cur: 0, prev: -1 });
  const [heroPaused, setHeroPaused] = useState(false);

  // UI only: feed sort and "liked posts" view
  const [sortOrder, setSortOrder] = useState<"recent" | "liked">("recent");
  const [showLikedOnly, setShowLikedOnly] = useState(false);

  const [formPlaceId, setFormPlaceId] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [formBody, setFormBody] = useState("");
  const [formKeyTip, setFormKeyTip] = useState("");
  const [formAuthorName, setFormAuthorName] = useState("");
  const [formAuthorHandle, setFormAuthorHandle] = useState("");
  const [formSeverity, setFormSeverity] = useState<"essential" | "warning" | "info">("info");
  const [formDistrict, setFormDistrict] = useState("");
  const [formCategory, setFormCategory] = useState("Nature");

  const [replyInputText, setReplyInputText] = useState<Record<string, string>>({});
  const [commentInputText, setCommentInputText] = useState<Record<string, string>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const id = requestAnimationFrame(() => setHeroIn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isModalOpen]);

  /* ========================================================================
     FETCH REAL PLACES, CATEGORIES, PROFILES & REVIEWS ON MOUNT  (unchanged)
     ======================================================================== */
  useEffect(() => {
    let isMounted = true;

    async function loadRealData() {
      try {
        setLoadingData(true);

        // 1. Get current logged in user
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user && isMounted) {
          const userMeta = authData.user.user_metadata || {};
          const displayName =
            userMeta.display_name || userMeta.full_name || authData.user.email?.split("@")[0] || "Explorer";
          const handle = userMeta.username ? `@${userMeta.username}` : `@${displayName.toLowerCase().replace(/\s+/g, "_")}`;
          setCurrentUser({
            id: authData.user.id,
            email: authData.user.email,
            name: displayName,
            handle,
          });
          setFormAuthorName(displayName);
          setFormAuthorHandle(handle);
        }

        // 2. Fetch categories
        const { data: catData } = await supabase
          .from("categories")
          .select("id, name, slug, emoji");

        const cMap: Record<string, { name: string; emoji: string }> = {};
        if (catData) {
          catData.forEach((c) => {
            cMap[c.id] = { name: c.name, emoji: c.emoji || "🌿" };
          });
        }

        // 3. Fetch real uploaded places
        const { data: placesData, error: placesErr } = await supabase
          .from("places")
          .select(`
            id,
            name,
            slug,
            district,
            nearest_town,
            category_id,
            short_description,
            description,
            hidden_tips,
            safety_tips,
            hero_image_url,
            difficulty,
            best_season,
            activities,
            like_count,
            rating_avg,
            rating_count,
            created_at
          `)
          .in("status", ["approved", "published"])
          .order("created_at", { ascending: false });

        if (!placesErr && placesData && isMounted) {
          const enhancedPlaces = placesData.map((p) => ({
            ...p,
            category_name: p.category_id && cMap[p.category_id] ? cMap[p.category_id].name : "Nature",
            category_emoji: p.category_id && cMap[p.category_id] ? cMap[p.category_id].emoji : "🌿",
          }));
          setPlaces(enhancedPlaces);
          if (enhancedPlaces.length > 0 && !formPlaceId) {
            setFormPlaceId(enhancedPlaces[0].id);
          }
        }

        // 4. Fetch real registered profiles
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (profilesData && isMounted) {
          setProfiles(profilesData);
        }

        // Purge any legacy mock storage keys from browser
        if (typeof window !== "undefined") {
          localStorage.removeItem("lanka_custom_stories");
          localStorage.removeItem("lanka_custom_discussions");
          localStorage.removeItem("lanka_custom_tips");
          localStorage.removeItem("lanka_community_posts");
          localStorage.removeItem("lanka_community_likes");
          localStorage.removeItem("lanka_community_upvotes");
          localStorage.removeItem("lanka_community_helpful");
          localStorage.removeItem("lanka_community_following");
        }

        // 5. Fetch real reviews from Supabase reviews table
        const { data: dbReviews } = await supabase
          .from("reviews")
          .select("id, place_id, user_id, rating, body, created_at")
          .order("created_at", { ascending: false });

        const loadedReviews: CommunityReview[] = [];
        const profileById = new Map((profilesData || []).map((p) => [p.id, p]));
        if (dbReviews && dbReviews.length > 0) {
          dbReviews.forEach((r) => {
            const reviewer = profileById.get(r.user_id);
            const matchedPlace = placesData?.find((p) => p.id === r.place_id);
            loadedReviews.push({
              id: r.id,
              place_id: r.place_id,
              place_name: matchedPlace?.name || "Uploaded Place",
              place_district: matchedPlace?.district || "Sri Lanka",
              place_image: matchedPlace?.hero_image_url || null,
              author_id: r.user_id,
              author_name: reviewer?.display_name || reviewer?.username || "",
              author_handle: reviewer?.username ? `@${reviewer.username}` : "",
              rating: r.rating || 5,
              title: `Review for ${matchedPlace?.name || "Place"}`,
              body: r.body || "",
              created_at: r.created_at,
              likes: 0,
              comments: [],
            });
          });
        }

        // Merge locally submitted non-demo reviews
        const savedReviews = localStorage.getItem(STORAGE_REVIEWS_KEY);
        if (savedReviews && isMounted) {
          try {
            const parsed: CommunityReview[] = JSON.parse(savedReviews);
            const nonDemoOnly = parsed.filter(
              (r) =>
                !r.id.startsWith("story-") &&
                r.author_name !== "Community Explorer" &&
                !r.title.includes("Heeloya") &&
                !r.title.includes("Ritigala") &&
                !r.title.includes("Rangala") &&
                !r.title.includes("Tangalle") &&
                !r.title.includes("Golumale")
            );
            const reviewKey = (r: CommunityReview) => `${r.place_id}|${(r.body || "").trim().toLowerCase()}`;
            const existingIds = new Set(loadedReviews.map((r) => r.id));
            const existingKeys = new Set(loadedReviews.map(reviewKey));
            nonDemoOnly.forEach((r) => {
              const key = reviewKey(r);
              if (existingIds.has(r.id) || existingKeys.has(key)) return;
              existingIds.add(r.id);
              existingKeys.add(key);
              loadedReviews.push(r);
            });
          } catch (e) {
            console.error(e);
          }
        }
        if (isMounted) setReviews(loadedReviews);

        // 6. Load user-added discussions
        const savedDiscussions = localStorage.getItem(STORAGE_DISCUSSIONS_KEY);
        if (savedDiscussions && isMounted) {
          try {
            const parsed: CommunityDiscussion[] = JSON.parse(savedDiscussions);
            const nonDemoOnly = parsed.filter(
              (d) =>
                !/^disc-\d{1,3}$/.test(d.id) &&
                !d.title.includes("Illukkumbura") &&
                !d.title.includes("Pitawala") &&
                !d.title.includes("Dikwella")
            );
            setDiscussions(nonDemoOnly);
          } catch (e) {
            console.error(e);
          }
        }

        // 7. Load user-added tips
        const savedTips = localStorage.getItem(STORAGE_TIPS_KEY);
        if (savedTips && isMounted) {
          try {
            const parsed: CommunityTip[] = JSON.parse(savedTips);
            const nonDemoOnly = parsed.filter(
              (t) =>
                !/^tip-\d{1,3}$/.test(t.id) &&
                !t.title.includes("Leech Protection") &&
                !t.title.includes("Train Booking") &&
                !t.title.includes("Temple Etiquette") &&
                !t.title.includes("Kalpitiya")
            );
            setTips(nonDemoOnly);
          } catch (e) {
            console.error(e);
          }
        }

        // 8. Load user likes
        const savedLikes = localStorage.getItem(STORAGE_LIKES_KEY);
        if (savedLikes && isMounted) {
          try {
            setLikedItems(JSON.parse(savedLikes));
          } catch (e) {
            console.error(e);
          }
        }
      } catch (err) {
        console.error("COMMUNITY_DATA_LOAD_ERROR:", err);
      } finally {
        if (isMounted) setLoadingData(false);
      }
    }

    loadRealData();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const currentUserProfile = profiles.find((profile) => profile.id === currentUser?.id) || null;
  const currentUserId = currentUser?.id;
  const currentUserProfileId = currentUserProfile?.id;

  useEffect(() => {
    if (activeTab !== "chats" || !currentUserId || !currentUserProfileId) return;

    let isActive = true;

    const loadConversations = async (showLoading = false) => {
      if (showLoading) setChatInboxLoading(true);
      try {
        const { data, error } = await supabase
          .from("community_conversations")
          .select("id, participant_one, participant_two, created_at")
          .or(`participant_one.eq.${currentUserId},participant_two.eq.${currentUserId}`)
          .order("created_at", { ascending: false });

        if (!isActive) return;
        if (error) {
          setChatError(`Could not load your chats: ${error.message}`);
          setChatInboxLoading(false);
          return;
        }

        const conversations: CommunityConversation[] = data || [];
        setChatConversations(conversations);
        setSelectedChatId((selectedId) =>
          selectedId && conversations.some((conversation) => conversation.id === selectedId)
            ? selectedId
            : conversations[0]?.id || null
        );
        setChatInboxLoading(false);
      } catch (error) {
        if (!isActive) return;
        setChatError(
          `Could not load your chats: ${error instanceof Error ? error.message : "Unexpected error"}`
        );
        setChatInboxLoading(false);
      }
    };

    void loadConversations(true);
    const refreshId = window.setInterval(() => void loadConversations(), 10000);

    return () => {
      isActive = false;
      window.clearInterval(refreshId);
    };
  }, [activeTab, currentUserId, currentUserProfileId, supabase]);

  useEffect(() => {
    if (activeTab !== "chats" || !selectedChatId || !currentUserId || !currentUserProfileId) return;

    let isActive = true;

    const loadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from("community_messages")
          .select("id, conversation_id, sender_id, body, created_at")
          .eq("conversation_id", selectedChatId)
          .order("created_at", { ascending: false })
          .limit(100);

        if (!isActive) return;
        if (error) {
          setChatError(`Could not load messages: ${error.message}`);
          return;
        }
        setChatMessagesConversationId(selectedChatId);
        const messages: CommunityMessage[] = data || [];
        setChatMessages(messages.reverse());
      } catch (error) {
        if (!isActive) return;
        setChatError(
          `Could not load messages: ${error instanceof Error ? error.message : "Unexpected error"}`
        );
      }
    };

    void loadMessages();
    const refreshId = window.setInterval(loadMessages, 3000);

    return () => {
      isActive = false;
      window.clearInterval(refreshId);
    };
  }, [activeTab, currentUserId, currentUserProfileId, selectedChatId, supabase]);

  const availableDistricts = useMemo(() => {
    const set = new Set<string>();
    places.forEach((p) => {
      if (p.district) set.add(p.district);
    });
    return Array.from(set).sort();
  }, [places]);

  const chipPlaces = useMemo(() => {
    const q = placeSearch.trim().toLowerCase();
    if (!q) return places;
    return places.filter(
      (p) =>
        p.id === selectedPlaceFilter ||
        p.name.toLowerCase().includes(q) ||
        (p.district || "").toLowerCase().includes(q) ||
        (p.nearest_town || "").toLowerCase().includes(q)
    );
  }, [places, placeSearch, selectedPlaceFilter]);

  const scrollChips = (dir: 1 | -1) =>
    chipsRef.current?.scrollBy({ left: dir * 300, behavior: "smooth" });

  /* ========================================================================
     NEW: HERO SLIDER LOGIC
     Uses uploaded places that have a hero image (max 6). Auto-advances every
     5s, pauses while the pointer is over the hero.
     ======================================================================== */
  const heroSlides = useMemo(
    () => places.filter((p) => p.hero_image_url).slice(0, 6),
    [places]
  );

  // Clamp in case the slide list shrinks while an index is active
  const heroIdx = heroSlides.length ? Math.min(hero.cur, heroSlides.length - 1) : 0;

  const goHero = (n: number) =>
    setHero((h) => (n === h.cur ? h : { cur: n, prev: h.cur }));

  const stepHero = (dir: 1 | -1) =>
    goHero((heroIdx + dir + heroSlides.length) % heroSlides.length);

  useEffect(() => {
    if (heroSlides.length < 2 || heroPaused) return;
    const t = setInterval(() => {
      setHero((h) => ({ cur: (h.cur + 1) % heroSlides.length, prev: h.cur }));
    }, 5000);
    return () => clearInterval(t);
  }, [heroSlides.length, heroPaused]);

  /* ========================================================================
     HANDLERS  (all unchanged)
     ======================================================================== */
  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPlaceId) {
      alert("Please select an uploaded place from the website.");
      return;
    }
    if (!formBody.trim()) {
      alert("Please provide review text.");
      return;
    }

    const selectedPlace = places.find((p) => p.id === formPlaceId);
    const placeName = selectedPlace ? selectedPlace.name : "Uploaded Place";
    const placeDistrict = selectedPlace?.district || "Sri Lanka";
    const placeImage = selectedPlace?.hero_image_url || null;

    const authorName = formAuthorName.trim() || currentUser?.name || "";
    if (!authorName) {
      alert("Please enter your name.");
      return;
    }
    const authorHandle = formAuthorHandle.trim()
      ? formAuthorHandle.startsWith("@")
        ? formAuthorHandle
        : `@${formAuthorHandle}`
      : currentUser?.handle || `@${authorName.toLowerCase().replace(/\s+/g, "_")}`;

    const newReview: CommunityReview = {
      id: "rev-" + Date.now(),
      place_id: formPlaceId,
      place_name: placeName,
      place_district: placeDistrict,
      place_image: placeImage,
      author_id: currentUser?.id || null,
      author_name: authorName,
      author_handle: authorHandle,
      rating: formRating,
      title: formTitle.trim() || `Experience at ${placeName}`,
      body: formBody.trim(),
      key_tip: formKeyTip.trim() || null,
      created_at: new Date().toISOString(),
      likes: 0,
      comments: [],
    };

    if (currentUser?.id) {
      try {
        await supabase.from("reviews").insert({
          place_id: formPlaceId,
          user_id: currentUser.id,
          rating: formRating,
          body: formBody.trim(),
        });
      } catch (err) {
        console.warn("Could not insert to reviews table (falling back to local state):", err);
      }
    }

    const updated = [newReview, ...reviews];
    setReviews(updated);
    localStorage.setItem(STORAGE_REVIEWS_KEY, JSON.stringify(updated));

    setFormTitle("");
    setFormBody("");
    setFormKeyTip("");
    setIsModalOpen(false);
    showToast(`Review for ${placeName} published!`);
  };

  const handleRemoveReview = (reviewId: string) => {
    if (!confirm("Are you sure you want to remove this review?")) return;
    const updated = reviews.filter((r) => r.id !== reviewId);
    setReviews(updated);
    localStorage.setItem(STORAGE_REVIEWS_KEY, JSON.stringify(updated));
    showToast("Review removed.");
  };

  const handleAddComment = (reviewId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = commentInputText[reviewId]?.trim();
    if (!text) return;

    const authorName = currentUser?.name || "Fellow Explorer";
    const authorHandle = currentUser?.handle || `@${authorName.toLowerCase().replace(/\s+/g, "_")}`;

    const newComment: ReviewComment = {
      id: "comm-" + Date.now(),
      review_id: reviewId,
      author_id: currentUser?.id || null,
      author_name: authorName,
      author_handle: authorHandle,
      text,
      created_at: new Date().toISOString(),
    };

    const updated = reviews.map((r) => {
      if (r.id === reviewId) {
        return {
          ...r,
          comments: [...(r.comments || []), newComment],
        };
      }
      return r;
    });

    setReviews(updated);
    localStorage.setItem(STORAGE_REVIEWS_KEY, JSON.stringify(updated));
    setCommentInputText((prev) => ({ ...prev, [reviewId]: "" }));
    showToast("Comment added!");
  };

  const handleRemoveComment = (reviewId: string, commentId: string) => {
    const updated = reviews.map((r) => {
      if (r.id === reviewId) {
        return {
          ...r,
          comments: r.comments.filter((c) => c.id !== commentId),
        };
      }
      return r;
    });
    setReviews(updated);
    localStorage.setItem(STORAGE_REVIEWS_KEY, JSON.stringify(updated));
    showToast("Comment removed.");
  };

  const handleToggleLike = (id: string) => {
    const isLiked = !!likedItems[id];
    const newLiked = { ...likedItems, [id]: !isLiked };
    setLikedItems(newLiked);
    localStorage.setItem(STORAGE_LIKES_KEY, JSON.stringify(newLiked));

    const updated = reviews.map((r) =>
      r.id === id ? { ...r, likes: Math.max(0, r.likes + (isLiked ? -1 : 1)) } : r
    );
    setReviews(updated);
    localStorage.setItem(STORAGE_REVIEWS_KEY, JSON.stringify(updated));
    showToast(isLiked ? "Removed like" : "Liked");
  };

  const handleAddDiscussion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const selectedPlace = places.find((p) => p.id === formPlaceId);
    const authorName = formAuthorName.trim() || currentUser?.name || "Community Explorer";
    const authorHandle = formAuthorHandle.trim()
      ? formAuthorHandle.startsWith("@")
        ? formAuthorHandle
        : `@${formAuthorHandle}`
      : currentUser?.handle || `@${authorName.toLowerCase().replace(/\s+/g, "_")}`;

    const newDisc: CommunityDiscussion = {
      id: "disc-" + Date.now(),
      place_id: formPlaceId || null,
      place_name: selectedPlace ? selectedPlace.name : null,
      title: formTitle.trim(),
      category: formCategory,
      district: selectedPlace?.district || formDistrict || "Sri Lanka",
      author_id: currentUser?.id || null,
      author_name: authorName,
      author_handle: authorHandle,
      created_at: new Date().toISOString(),
      upvotes: 0,
      replies: [],
    };

    const updated = [newDisc, ...discussions];
    setDiscussions(updated);
    localStorage.setItem(STORAGE_DISCUSSIONS_KEY, JSON.stringify(updated));
    setFormTitle("");
    setIsModalOpen(false);
    showToast("Discussion question posted!");
  };

  const handleRemoveDiscussion = (discId: string) => {
    if (!confirm("Are you sure you want to remove this discussion?")) return;
    const updated = discussions.filter((d) => d.id !== discId);
    setDiscussions(updated);
    localStorage.setItem(STORAGE_DISCUSSIONS_KEY, JSON.stringify(updated));
    showToast("Discussion removed.");
  };

  const handleAddReply = (discId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = replyInputText[discId]?.trim();
    if (!text) return;

    const authorName = currentUser?.name || "Local Guide";
    const authorHandle = currentUser?.handle || `@${authorName.toLowerCase().replace(/\s+/g, "_")}`;

    const newReply: DiscussionReply = {
      id: "reply-" + Date.now(),
      discussion_id: discId,
      author_id: currentUser?.id || null,
      author_name: authorName,
      author_handle: authorHandle,
      text,
      created_at: new Date().toISOString(),
    };

    const updated = discussions.map((d) => {
      if (d.id === discId) {
        return {
          ...d,
          replies: [...d.replies, newReply],
        };
      }
      return d;
    });

    setDiscussions(updated);
    localStorage.setItem(STORAGE_DISCUSSIONS_KEY, JSON.stringify(updated));
    setReplyInputText((prev) => ({ ...prev, [discId]: "" }));
    showToast("Reply submitted!");
  };

  const handleAddTip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formBody.trim()) return;

    const selectedPlace = places.find((p) => p.id === formPlaceId);
    const authorName = formAuthorName.trim() || currentUser?.name || "Community Explorer";
    const authorHandle = formAuthorHandle.trim()
      ? formAuthorHandle.startsWith("@")
        ? formAuthorHandle
        : `@${formAuthorHandle}`
      : currentUser?.handle || `@${authorName.toLowerCase().replace(/\s+/g, "_")}`;

    const newTip: CommunityTip = {
      id: "tip-" + Date.now(),
      place_id: formPlaceId || null,
      place_name: selectedPlace ? selectedPlace.name : null,
      title: formTitle.trim(),
      district: selectedPlace?.district || formDistrict || "Sri Lanka",
      category: formCategory,
      author_name: authorName,
      author_handle: authorHandle,
      severity: formSeverity,
      text: formBody.trim(),
      helpful_count: 0,
      created_at: new Date().toISOString(),
    };

    const updated = [newTip, ...tips];
    setTips(updated);
    localStorage.setItem(STORAGE_TIPS_KEY, JSON.stringify(updated));
    setFormTitle("");
    setFormBody("");
    setIsModalOpen(false);
    showToast("Trail tip shared!");
  };

  const handleRemoveTip = (tipId: string) => {
    if (!confirm("Remove this trail tip?")) return;
    const updated = tips.filter((t) => t.id !== tipId);
    setTips(updated);
    localStorage.setItem(STORAGE_TIPS_KEY, JSON.stringify(updated));
    showToast("Tip removed.");
  };

  // Filtered lists  (unchanged)
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const matchPlace = selectedPlaceFilter === "all" || r.place_id === selectedPlaceFilter;
      const matchSearch =
        !searchQuery ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.place_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.author_name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchPlace && matchSearch;
    });
  }, [reviews, selectedPlaceFilter, searchQuery]);

  const filteredDiscussions = useMemo(() => {
    return discussions.filter((d) => {
      const matchPlace = selectedPlaceFilter === "all" || d.place_id === selectedPlaceFilter;
      const matchSearch =
        !searchQuery ||
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.author_name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchPlace && matchSearch;
    });
  }, [discussions, selectedPlaceFilter, searchQuery]);

  const filteredTips = useMemo(() => {
    return tips.filter((t) => {
      const matchPlace = selectedPlaceFilter === "all" || t.place_id === selectedPlaceFilter;
      const matchSearch =
        !searchQuery ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.text.toLowerCase().includes(searchQuery.toLowerCase());
      return matchPlace && matchSearch;
    });
  }, [tips, selectedPlaceFilter, searchQuery]);

  // UI only: sort + liked-only view on top of the filtered reviews
  const visibleReviews = useMemo(() => {
    let list = showLikedOnly ? filteredReviews.filter((r) => likedItems[r.id]) : filteredReviews;
    if (sortOrder === "liked") list = [...list].sort((a, b) => b.likes - a.likes);
    else list = [...list].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    return list;
  }, [filteredReviews, showLikedOnly, likedItems, sortOrder]);

  /* ========================================================================
     UI HELPERS (presentation only)
     ======================================================================== */
  const openModal = (type: "review" | "discussion" | "tip") => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const startChatWith = async (profile: RealProfile) => {
    if (!currentUser) {
      setChatError("Sign in to invite an explorer to chat.");
      setActiveTab("chats");
      return;
    }
    if (!currentUserProfile) {
      setChatError("Create your community profile before starting a chat.");
      setActiveTab("chats");
      return;
    }
    if (profile.id === currentUser.id) return;

    const [participantOne, participantTwo] = [currentUser.id, profile.id].sort();
    setChatError(null);

    try {
      const findConversation = () =>
        supabase
          .from("community_conversations")
          .select("id, participant_one, participant_two, created_at")
          .eq("participant_one", participantOne)
          .eq("participant_two", participantTwo)
          .maybeSingle();

      const { data: existingConversation, error: lookupError } = await findConversation();
      if (lookupError) {
        setChatError(`Could not invite this explorer: ${lookupError.message}`);
        setActiveTab("chats");
        return;
      }

      let conversation: CommunityConversation | null = existingConversation;
      if (!conversation) {
        const { data: createdConversation, error: createError } = await supabase
          .from("community_conversations")
          .insert({
            participant_one: participantOne,
            participant_two: participantTwo,
          })
          .select("id, participant_one, participant_two, created_at")
          .single();

        if (createError?.code === "23505") {
          const { data: racedConversation, error: retryError } = await findConversation();
          if (retryError || !racedConversation) {
            setChatError(`Could not open this chat: ${retryError?.message || createError.message}`);
            setActiveTab("chats");
            return;
          }
          conversation = racedConversation;
        } else if (createError || !createdConversation) {
          setChatError(`Could not invite this explorer: ${createError?.message || "Unexpected error"}`);
          setActiveTab("chats");
          return;
        } else {
          conversation = createdConversation;
        }
      }

      const chat = conversation;
      setChatConversations((existing) => [
        chat,
        ...existing.filter((item) => item.id !== chat.id),
      ]);
      setSelectedChatId(chat.id);
      setChatDraft("");
      setChatError(null);
      setActiveTab("chats");
    } catch (error) {
      setChatError(
        `Could not invite this explorer: ${error instanceof Error ? error.message : "Unexpected error"}`
      );
      setActiveTab("chats");
    }
  };

  const sendChatMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = chatDraft.trim();
    if (!body || !currentUser || !currentUserProfile || !selectedChatId || chatSending) return;

    setChatSending(true);
    setChatError(null);
    try {
      const { data, error } = await supabase
        .from("community_messages")
        .insert({
          conversation_id: selectedChatId,
          sender_id: currentUser.id,
          body,
        })
        .select("id, conversation_id, sender_id, body, created_at")
        .single();

      if (error || !data) {
        setChatError(`Could not send your message: ${error?.message || "Unexpected error"}`);
        return;
      }

      setChatMessagesConversationId(selectedChatId);
      setChatMessages((messages) => [
        ...(chatMessagesConversationId === selectedChatId ? messages : []),
        data,
      ]);
      setChatDraft("");
    } catch (error) {
      setChatError(
        `Could not send your message: ${error instanceof Error ? error.message : "Unexpected error"}`
      );
    } finally {
      setChatSending(false);
    }
  };

  const goTab = (id: TabType) => {
    setActiveTab(id);
    setShowLikedOnly(false);
  };

  const profileCount = profiles.length > 0 ? profiles.length : currentUser ? 1 : 0;

  const allNavItems: { id: TabType; label: string; count?: number; icon: ReactNode }[] = [
    { id: "reviews", label: "Reviews & field notes", count: filteredReviews.length, icon: <MessageSquare size={16} /> },
    { id: "discussions", label: "Questions & answers", count: filteredDiscussions.length, icon: <HelpCircle size={16} /> },
    { id: "tips", label: "Trail tips & alerts", count: filteredTips.length, icon: <AlertTriangle size={16} /> },
    { id: "contributors", label: "Community profiles", count: profiles.length, icon: <Users size={16} /> },
    { id: "chats", label: "Private chats", count: chatConversations.length, icon: <MessageCircle size={16} /> },
    { id: "ethics", label: "Traveler ethics", icon: <Leaf size={16} /> },
  ];
  const navItems = allNavItems.filter(
    ({ id }) => id !== "chats" || Boolean(currentUser && currentUserProfile)
  );

  const selectedChat = chatConversations.find((conversation) => conversation.id === selectedChatId) || null;
  const visibleChatMessages =
    chatMessagesConversationId === selectedChatId ? chatMessages : [];
  const chatPartner = selectedChat
    ? profiles.find(
        (profile) =>
          profile.id ===
          (selectedChat.participant_one === currentUser?.id
            ? selectedChat.participant_two
            : selectedChat.participant_one)
      ) || null
    : null;

  const SEVERITY_META = {
    essential: { label: "Essential", color: "#b4620f" },
    warning: { label: "Warning", color: "#b3261e" },
    info: { label: "Info", color: "#2a5fa8" },
  } as const;

  const ETHICS: { title: string; text: string }[] = [
    {
      title: "Pack it in, pack it out",
      text: "Always take back plastic bottles, food wrappers and wet wipes from remote waterfalls and mountain trails.",
    },
    {
      title: "Respect sacred ground",
      text: "Cover shoulders and knees at historical temples, remove footwear before stone compounds, and keep a quiet, respectful manner.",
    },
    {
      title: "Protect island wildlife",
      text: "Never feed wild elephants near forest highways, keep your distance from marine nesting sites, and do not use bright flashes.",
    },
    {
      title: "Support village livelihoods",
      text: "Hire accredited local village guides, eat at small wayside eateries, and buy fresh fruit from roadside growers.",
    },
  ];

  const latestTip = tips[0];
  const featuredPlace = places.find((p) => p.hero_image_url) || null;

  const searchBox = (
    <div className="cm-search">
      <Search size={15} className="s" aria-hidden />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search reviews or tips"
        aria-label="Search reviews, discussions and tips"
      />
      {searchQuery && (
        <button type="button" onClick={() => setSearchQuery("")} aria-label="Clear search">
          <X size={14} />
        </button>
      )}
    </div>
  );

  return (
    <div className={`cm-root min-h-screen ${heroIn ? "cm-in" : ""}`}>
      <style>{STYLES}</style>

      {toastMessage && (
        <div className="cm-toast" role="status">
          {toastMessage}
        </div>
      )}

      {/* HERO */}
      <section
        className="cm-hero"
        onMouseEnter={() => setHeroPaused(true)}
        onMouseLeave={() => setHeroPaused(false)}
      >
        <div className="cm-hero-bg" aria-hidden />

        {/* NEW: sliding place images (sits above the /footer.jpg fallback) */}
        <div className="cm-slides" aria-hidden>
          {heroSlides.map((p, i) => (
            <div
              key={p.id}
              className={`cm-slide ${i === heroIdx ? "on" : i === hero.prev ? "prev" : ""}`}
            >
              <Image
                src={p.hero_image_url as string}
                alt=""
                fill
                unoptimized
                priority={i === 0}
                sizes="100vw"
                style={{ objectFit: "cover" }}
              />
            </div>
          ))}
        </div>

        <div className="cm-hero-shade" aria-hidden />

        <div className="container-main">
          <div className="cm-herowrap">
           
            <h1 className="cm-h1">
              <Line i={0}>Real places. Real stories.</Line>
              <Line i={1}>Your kind of explorers.</Line>
            </h1>

            <p className="cm-lead cm-fade" style={{ ["--d" as string]: 0 }}>
              Field notes, local wisdom, and honest advice from people who’ve taken the road less travelled.
            </p>

            <div className="cm-cta cm-fade" style={{ ["--d" as string]: 1 }}>
              <button type="button" onClick={() => openModal("review")} className="cm-btn amber">
                Write a review
              </button>
              <button type="button" onClick={() => openModal("discussion")} className="cm-textbtn">
                Ask the community <ArrowRight size={14} aria-hidden />
              </button>
              <button type="button" onClick={() => openModal("tip")} className="cm-textbtn">
                Share a trail tip
              </button>
            </div>
            
            {/* NEW: chip now shows the current slide's place name + district, with dots and arrows */}
            {heroSlides.length > 0 ? (
              <div className="cm-chip-loc cm-slidechip cm-fade" style={{ ["--d" as string]: 2 }}>
                <MapPin size={13} aria-hidden />
                <Link
                  key={heroSlides[heroIdx].id}
                  href={`/places?search=${encodeURIComponent(heroSlides[heroIdx].name)}`}
                  className="cm-slidename"
                >
                  {heroSlides[heroIdx].name}
                  {heroSlides[heroIdx].district ? ` · ${heroSlides[heroIdx].district}` : ""}
                </Link>
                {heroSlides.length > 1 && (
                  <>
                    <span className="cm-dots">
                      {heroSlides.map((p, i) => (
                        <button
                          key={p.id}
                          type="button"
                          aria-label={`Show ${p.name}`}
                          aria-pressed={i === heroIdx}
                          onClick={() => goHero(i)}
                        />
                      ))}
                    </span>
                    <button type="button" className="cm-hbtn" onClick={() => stepHero(-1)} aria-label="Previous place">
                      <ChevronLeft size={14} />
                    </button>
                    <button type="button" className="cm-hbtn" onClick={() => stepHero(1)} aria-label="Next place">
                      <ChevronRight size={14} />
                    </button>
                  </>
                )}
              </div>
            ) : (
              <span className="cm-chip-loc cm-fade" style={{ ["--d" as string]: 2 }}>
                <MapPin size={13} aria-hidden /> The hill country, Sri Lanka
              </span>
            )}
          </div>
        </div>
      </section>

      {/* PLACE FILTER */}
      <section className="cm-filter">
        <div className="container-main">
          <div className="cm-filter-top">
            <div>
              <h2>Find your corner of the island</h2>
              <p>Follow the places you’re curious about.</p>
            </div>
            <div className="cm-search">
              <Search size={15} className="s" aria-hidden />
              <input
                type="text"
                value={placeSearch}
                onChange={(e) => setPlaceSearch(e.target.value)}
                placeholder="Search places or districts"
                aria-label="Search places"
              />
              {placeSearch && (
                <button type="button" onClick={() => setPlaceSearch("")} aria-label="Clear place search">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="cm-pbar">
            <div className="cm-chips cm-hide-scroll" ref={chipsRef}>
              <button
                type="button"
                aria-pressed={selectedPlaceFilter === "all"}
                onClick={() => setSelectedPlaceFilter("all")}
                className="cm-chip"
              >
                All places<small>{places.length}</small>
              </button>
              {chipPlaces.map((place) => (
                <button
                  key={place.id}
                  type="button"
                  aria-pressed={selectedPlaceFilter === place.id}
                  onClick={() => setSelectedPlaceFilter(place.id)}
                  className="cm-chip"
                >
                  {place.name}
                  {place.district && <small>{place.district}</small>}
                </button>
              ))}
              {placeSearch && chipPlaces.length === 0 && (
                <span className="cm-nomatch">No places match “{placeSearch}”</span>
              )}
            </div>
            <Link href="/places" className="cm-link" style={{ whiteSpace: "nowrap" }}>
              View all places
            </Link>
            <div className="cm-arrows">
              <button type="button" className="cm-arrow" onClick={() => scrollChips(-1)} aria-label="Scroll places left">
                <ChevronLeft size={16} />
              </button>
              <button type="button" className="cm-arrow" onClick={() => scrollChips(1)} aria-label="Scroll places right">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* THREE-COLUMN COMMUNITY AREA */}
      <section className="cm-shell">
        <div className="container-main">
          <div className="cm-layout">
            {/* LEFT: section nav + stats */}
            <aside className="cm-side">
              <div className="cm-navcard">
                <p className="cm-navlabel">Community</p>
                <div className="cm-nav" role="tablist" aria-label="Community sections" aria-orientation="vertical">
                  {navItems.map(({ id, label, count, icon }) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={activeTab === id && !showLikedOnly}
                      onClick={() => goTab(id)}
                      className="cm-navbtn"
                    >
                      {icon}
                      <span>{label}</span>
                      {count !== undefined && <small>{count}</small>}
                    </button>
                  ))}
                </div>
                <div className="cm-sep" />
                <button
                  type="button"
                  aria-pressed={showLikedOnly}
                  onClick={() => {
                    setActiveTab("reviews");
                    setShowLikedOnly((v) => !v);
                  }}
                  className="cm-navbtn"
                >
                  <Bookmark size={16} />
                  <span>Liked posts</span>
                </button>
              </div>

              <div className="cm-card cm-stat">
                <h3>Small island. Big discoveries.</h3>
                {loadingData ? (
                  <p className="cm-meta" style={{ margin: "10px 0 0" }}>Loading community data...</p>
                ) : (
                  <dl>
                    <div><dt>Places</dt><dd>{places.length}</dd></div>
                    <div><dt>Districts</dt><dd>{availableDistricts.length}</dd></div>
                    <div><dt>Reviews</dt><dd>{reviews.length}</dd></div>
                    <div><dt>Active explorers</dt><dd>{profileCount}</dd></div>
                  </dl>
                )}
                <button type="button" onClick={() => openModal("review")} className="cm-link">
                  Be part of the beginning <ArrowRight size={12} aria-hidden />
                </button>
              </div>
            </aside>

            {/* CENTER: feed */}
            <main style={{ minWidth: 0 }}>
              <div className="cm-banner">
                <div>
                  <b>Every discovery has a story.</b>
                  <span>Share yours with fellow explorers.</span>
                </div>
                <button type="button" onClick={() => openModal("review")} className="cm-btn dark">
                  Write a review
                </button>
              </div>

              {/* TAB 1: REVIEWS */}
              {activeTab === "reviews" && (
                <div key="reviews" className="cm-panel">
                  <PanelHead
                    title={showLikedOnly ? "Liked posts" : "Reviews & field notes"}
                    text={showLikedOnly ? "Reviews you have liked." : "What people found when they actually went."}
                    right={
                      <div className="cm-tools">
                        {searchBox}
                        <select
                          className="cm-select"
                          value={sortOrder}
                          onChange={(e) => setSortOrder(e.target.value as "recent" | "liked")}
                          aria-label="Sort reviews"
                        >
                          <option value="recent">Most recent</option>
                          <option value="liked">Most liked</option>
                        </select>
                      </div>
                    }
                  />

                  {visibleReviews.length === 0 ? (
                    <Empty
                      title={showLikedOnly ? "No liked posts yet" : "No reviews yet"}
                      text={
                        showLikedOnly
                          ? "Tap the heart on a review and it will show up here."
                          : `${places.length} places are uploaded on the website. Be the first to share a field report or an insider tip for one of them.`
                      }
                      actionLabel="Write the first review"
                      onAction={() => openModal("review")}
                    />
                  ) : (
                    <div className="cm-list">
                      {visibleReviews.map((rev, idx) => {
                        const isLiked = !!likedItems[rev.id];
                        return (
                          <article key={rev.id} className="cm-post cm-up" style={{ ["--i" as string]: Math.min(idx, 8) }}>
                            <div className="cm-post-top">
                              <span className="cm-avatar">{rev.author_name ? rev.author_name.charAt(0) : "E"}</span>
                              <div className="cm-who">
                                <b>{rev.author_name || "Explorer"}</b>
                                <small>
                                  {rev.author_handle ? `${rev.author_handle} · ` : ""}
                                  {new Date(rev.created_at).toLocaleDateString()}
                                </small>
                              </div>
                            </div>

                            <div className="cm-tagrow">
                              <span className="cm-tag">Field note</span>
                              <StarRow rating={rev.rating} />
                            </div>

                            <h3 className="cm-title">{rev.title}</h3>
                            <div className="cm-where">
                              <MapPin size={13} aria-hidden /> {rev.place_name} · {rev.place_district}
                            </div>

                            {rev.place_image && (
                              <div className="cm-photo">
                                <Image src={rev.place_image} alt={rev.place_name} fill unoptimized className="object-cover" />
                              </div>
                            )}

                            <p className="cm-body">{rev.body}</p>

                            {rev.key_tip && (
                              <p className="cm-note">
                                <b>Insider tip: </b>
                                {rev.key_tip}
                              </p>
                            )}

                            <div className="cm-acts">
                              <button type="button" aria-pressed={isLiked} onClick={() => handleToggleLike(rev.id)} className="cm-act">
                                <Heart size={15} aria-hidden /> {rev.likes} {rev.likes === 1 ? "like" : "likes"}
                              </button>
                              <span className="cm-act" style={{ cursor: "default" }}>
                                <MessageCircle size={15} aria-hidden /> {rev.comments?.length || 0}{" "}
                                {(rev.comments?.length || 0) === 1 ? "comment" : "comments"}
                              </span>
                              <Link href={`/places?search=${encodeURIComponent(rev.place_name)}`} className="cm-link" style={{ marginLeft: "auto" }}>
                                View place <ExternalLink size={12} aria-hidden />
                              </Link>
                              <button type="button" onClick={() => handleRemoveReview(rev.id)} className="cm-act rm">
                                <Trash2 size={14} aria-hidden /> Remove
                              </button>
                            </div>

                            <div className="cm-replies">
                              {rev.comments &&
                                rev.comments.map((comm) => (
                                  <div key={comm.id} className="cm-reply">
                                    <div>
                                      <span className="nm">{comm.author_name}</span>
                                      <small>{comm.author_handle}</small>
                                      <p>{comm.text}</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveComment(rev.id, comm.id)}
                                      title="Remove comment"
                                      aria-label="Remove comment"
                                      className="cm-act rm"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                ))}

                              <form onSubmit={(e) => handleAddComment(rev.id, e)} className="cm-inline">
                                <input
                                  type="text"
                                  required
                                  value={commentInputText[rev.id] || ""}
                                  onChange={(e) =>
                                    setCommentInputText((prev) => ({
                                      ...prev,
                                      [rev.id]: e.target.value,
                                    }))
                                  }
                                  placeholder="Add a comment or question..."
                                  aria-label="Add a comment"
                                />
                                <button type="submit" className="cm-btn line sm">
                                  Post
                                </button>
                              </form>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: DISCUSSIONS */}
              {activeTab === "discussions" && (
                <div key="discussions" className="cm-panel">
                  <PanelHead
                    title="Questions & answers"
                    text="Road conditions, guides, permits. Ask people who know the place."
                    right={
                      <div className="cm-tools">
                        {searchBox}
                        <button type="button" onClick={() => openModal("discussion")} className="cm-btn dark sm">
                          Ask a question
                        </button>
                      </div>
                    }
                  />

                  {filteredDiscussions.length === 0 ? (
                    <Empty
                      title="No questions yet"
                      text="Wondering about road conditions, local guides or permits for an uploaded place? Ask here."
                      actionLabel="Ask the first question"
                      onAction={() => openModal("discussion")}
                    />
                  ) : (
                    <div className="cm-list">
                      {filteredDiscussions.map((disc, idx) => {
                        const isExpanded = expandedDiscussionId === disc.id;
                        return (
                          <div key={disc.id} className="cm-post cm-up" style={{ ["--i" as string]: Math.min(idx, 8) }}>
                            <div className="cm-qhead">
                              <div>
                                <span className="cm-tag q">Question</span>
                                <span className="cm-meta" style={{ marginLeft: 8 }}>
                                  {disc.place_name ? `${disc.place_name} · ` : ""}
                                  {disc.district}
                                </span>
                                <h3>{disc.title}</h3>
                                <div className="cm-meta" style={{ marginTop: 4 }}>
                                  by {disc.author_name}, {new Date(disc.created_at).toLocaleDateString()}
                                </div>
                              </div>

                              <button
                                type="button"
                                aria-expanded={isExpanded}
                                onClick={() => setExpandedDiscussionId(isExpanded ? null : disc.id)}
                                className="cm-toggle"
                              >
                                {disc.replies?.length || 0} {(disc.replies?.length || 0) === 1 ? "answer" : "answers"}
                                <ChevronDown size={15} aria-hidden />
                              </button>
                            </div>

                            {isExpanded && (
                              <div className="cm-replies">
                                {disc.replies && disc.replies.length > 0 ? (
                                  disc.replies.map((reply) => (
                                    <div key={reply.id} className="cm-reply">
                                      <div>
                                        <span className="nm">{reply.author_name}</span>
                                        <small>{new Date(reply.created_at).toLocaleDateString()}</small>
                                        <p>{reply.text}</p>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <p className="cm-meta" style={{ margin: "0 0 12px" }}>
                                    No answers yet.
                                  </p>
                                )}

                                <form onSubmit={(e) => handleAddReply(disc.id, e)} className="cm-inline">
                                  <input
                                    type="text"
                                    required
                                    value={replyInputText[disc.id] || ""}
                                    onChange={(e) =>
                                      setReplyInputText((prev) => ({
                                        ...prev,
                                        [disc.id]: e.target.value,
                                      }))
                                    }
                                    placeholder="Write your answer..."
                                    aria-label="Write your answer"
                                  />
                                  <button type="submit" className="cm-btn line sm">
                                    Answer
                                  </button>
                                </form>

                                <button type="button" onClick={() => handleRemoveDiscussion(disc.id)} className="cm-act rm" style={{ marginTop: 14 }}>
                                  <Trash2 size={14} aria-hidden /> Remove this question
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: TIPS */}
              {activeTab === "tips" && (
                <div key="tips" className="cm-panel">
                  <PanelHead
                    title="Trail tips & safety alerts"
                    text="Short, practical notes from people on the ground."
                    right={
                      <div className="cm-tools">
                        {searchBox}
                        <button type="button" onClick={() => openModal("tip")} className="cm-btn dark sm">
                          Share a tip
                        </button>
                      </div>
                    }
                  />

                  {filteredTips.length === 0 ? (
                    <Empty
                      title="No tips or alerts yet"
                      text="Know a shortcut, a leech remedy or road advice for an uploaded spot? Share it with the community."
                      actionLabel="Share the first tip"
                      onAction={() => openModal("tip")}
                    />
                  ) : (
                    <div className="cm-list">
                      {filteredTips.map((tip, idx) => {
                        const meta = SEVERITY_META[tip.severity];
                        return (
                          <article
                            key={tip.id}
                            className="cm-tip cm-up"
                            style={{ ["--i" as string]: Math.min(idx, 8), ["--c" as string]: meta.color }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                              <span className="cm-sev">{meta.label}</span>
                              <button type="button" onClick={() => handleRemoveTip(tip.id)} className="cm-act rm">
                                <Trash2 size={14} aria-hidden /> Remove
                              </button>
                            </div>
                            <h3>{tip.title}</h3>
                            {tip.place_name && (
                              <div className="cm-meta" style={{ marginTop: 2 }}>
                                {tip.place_name} · {tip.district}
                              </div>
                            )}
                            <p>{tip.text}</p>
                            <div className="cm-meta" style={{ marginTop: 10 }}>
                              By {tip.author_name}, {new Date(tip.created_at).toLocaleDateString()}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: PROFILES */}
              {activeTab === "contributors" && (
                <div key="contributors" className="cm-panel">
                  <PanelHead title="Community profiles" text="The people who have signed up and shared places." />

                  {profiles.length === 0 && !currentUser ? (
                    <div className="cm-empty">
                      <h3>No profiles yet</h3>
                      <p>Sign up or log in to create your explorer profile on Hidden Lanka Explorer.</p>
                      <Link href="/auth/sign-in" className="cm-btn dark">
                        Sign in / register
                      </Link>
                    </div>
                  ) : (
                    <div className="cm-grid">
                      {currentUser && (
                        <div className="cm-profile me cm-up" style={{ ["--i" as string]: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span className="cm-avatar lg">{currentUser.name?.charAt(0) || "U"}</span>
                            <div>
                              <div className="nm">{currentUser.name}</div>
                              <div className="cm-meta">{currentUser.handle} · you</div>
                            </div>
                          </div>
                          <Link href="/profile" className="cm-link" style={{ marginTop: "auto" }}>
                            View or edit your profile
                          </Link>
                        </div>
                      )}

                      {profiles
                        .filter((p) => p.id !== currentUser?.id)
                        .map((prof, idx) => (
                          <div key={prof.id} className="cm-profile cm-up" style={{ ["--i" as string]: Math.min(idx + 1, 8) }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <span className="cm-avatar lg">
                                {prof.avatar_url ? (
                                  <Image src={prof.avatar_url} alt="" fill unoptimized className="object-cover" />
                                ) : (
                                  prof.display_name?.charAt(0) || prof.username?.charAt(0) || "E"
                                )}
                              </span>
                              <div>
                                <div className="nm">{prof.display_name || prof.username || "Registered Explorer"}</div>
                                <div className="cm-meta">
                                  {prof.username ? `@${prof.username}` : "@explorer"}
                                  {prof.district ? ` · ${prof.district}` : ""}
                                </div>
                              </div>
                            </div>
                            {prof.bio && <p className="line-clamp-2">{prof.bio}</p>}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: PRIVATE CHATS */}
              {activeTab === "chats" && (
                <div key="chats" className="cm-panel">
                  <PanelHead
                    title="Private chats"
                    text="Invite a registered explorer to start a one-to-one conversation."
                  />

                  {!currentUser ? (
                    <div className="cm-empty">
                      <h3>Sign in to chat</h3>
                      <p>Private chats are available to explorers with a community profile.</p>
                      <Link href="/auth/sign-in" className="cm-btn dark">
                        Sign in / register
                      </Link>
                    </div>
                  ) : !currentUserProfile ? (
                    <div className="cm-empty">
                      <h3>Create your community profile</h3>
                      <p>Set up a profile before inviting other explorers to chat.</p>
                      <Link href="/profile" className="cm-btn dark">
                        Set up profile
                      </Link>
                    </div>
                  ) : (
                    <>
                      {chatError && (
                        <div className="cm-chat-error" role="alert">
                          {chatError}
                        </div>
                      )}
                      <div className="cm-chat-layout">
                        <aside className="cm-chat-sidebar" aria-label="Chats and explorers">
                          <section>
                            <h3>Your chats</h3>
                            {chatInboxLoading ? (
                              <p className="cm-meta">Loading chats...</p>
                            ) : chatConversations.length === 0 ? (
                              <p className="cm-meta">No chats yet. Invite an explorer below.</p>
                            ) : (
                              <div className="cm-chat-list">
                                {chatConversations.map((conversation) => {
                                  const friendId =
                                    conversation.participant_one === currentUser.id
                                      ? conversation.participant_two
                                      : conversation.participant_one;
                                  const friend = profiles.find((profile) => profile.id === friendId);

                                  return (
                                    <button
                                      key={conversation.id}
                                      type="button"
                                      className="cm-chat-person"
                                      aria-pressed={selectedChatId === conversation.id}
                                      onClick={() => {
                                        setSelectedChatId(conversation.id);
                                        setChatError(null);
                                      }}
                                    >
                                      <span className="cm-avatar">
                                        {friend?.avatar_url ? (
                                          <Image src={friend.avatar_url} alt="" fill unoptimized className="object-cover" />
                                        ) : (
                                          friend?.display_name?.charAt(0) || friend?.username?.charAt(0) || "E"
                                        )}
                                      </span>
                                      <span className="cm-chat-person-info">
                                        <b>{friend?.display_name || friend?.username || "Explorer"}</b>
                                        <small>{friend?.username ? `@${friend.username}` : "Community member"}</small>
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </section>

                          <section>
                            <h3>Invite an explorer</h3>
                            {profiles.filter((profile) => profile.id !== currentUser.id).length === 0 ? (
                              <p className="cm-meta">No other community profiles are available yet.</p>
                            ) : (
                              <div className="cm-chat-list">
                                {profiles
                                  .filter((profile) => profile.id !== currentUser.id)
                                  .map((profile) => (
                                    <div key={profile.id} className="cm-chat-person">
                                      <span className="cm-avatar">
                                        {profile.avatar_url ? (
                                          <Image src={profile.avatar_url} alt="" fill unoptimized className="object-cover" />
                                        ) : (
                                          profile.display_name?.charAt(0) || profile.username?.charAt(0) || "E"
                                        )}
                                      </span>
                                      <span className="cm-chat-person-info">
                                        <b>{profile.display_name || profile.username || "Explorer"}</b>
                                        <small>{profile.username ? `@${profile.username}` : "Community member"}</small>
                                      </span>
                                      <button
                                        type="button"
                                        className="cm-chat-invite"
                                        onClick={() => void startChatWith(profile)}
                                      >
                                        Invite
                                      </button>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </section>
                        </aside>

                        <section className="cm-chat-window" aria-label="Private conversation">
                          {selectedChat && chatPartner ? (
                            <>
                              <div className="cm-chat-window-head">
                                <span className="cm-avatar">
                                  {chatPartner.avatar_url ? (
                                    <Image src={chatPartner.avatar_url} alt="" fill unoptimized className="object-cover" />
                                  ) : (
                                    chatPartner.display_name?.charAt(0) || chatPartner.username?.charAt(0) || "E"
                                  )}
                                </span>
                                <div>
                                  <b>{chatPartner.display_name || chatPartner.username || "Explorer"}</b>
                                  <div className="cm-meta">
                                    {chatPartner.username ? `@${chatPartner.username}` : "Community member"}
                                  </div>
                                </div>
                              </div>

                              <div className="cm-chat-messages" role="log" aria-live="polite">
                                {visibleChatMessages.length === 0 ? (
                                  <p className="cm-meta">This is the start of your private conversation.</p>
                                ) : (
                                  visibleChatMessages.map((message) => (
                                    <article
                                      key={message.id}
                                      className={`cm-chat-bubble ${message.sender_id === currentUser.id ? "me" : ""}`}
                                    >
                                      <p>{message.body}</p>
                                      <time dateTime={message.created_at}>
                                        {new Date(message.created_at).toLocaleTimeString([], {
                                          hour: "numeric",
                                          minute: "2-digit",
                                        })}
                                      </time>
                                    </article>
                                  ))
                                )}
                              </div>

                              <form className="cm-chat-compose" onSubmit={sendChatMessage}>
                                <textarea
                                  required
                                  maxLength={2000}
                                  value={chatDraft}
                                  onChange={(event) => setChatDraft(event.target.value)}
                                  placeholder="Write a private message..."
                                  aria-label="Write a private message"
                                />
                                <button
                                  type="submit"
                                  className="cm-btn dark"
                                  disabled={chatSending || !chatDraft.trim()}
                                >
                                  {chatSending ? "Sending..." : "Send"}
                                </button>
                              </form>
                            </>
                          ) : (
                            <div className="cm-empty">
                              <h3>Choose a chat</h3>
                              <p>Pick an existing conversation or invite an explorer to begin.</p>
                            </div>
                          )}
                        </section>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB 6: ETHICS */}
              {activeTab === "ethics" && (
                <div key="ethics" className="cm-panel">
                  <PanelHead
                    title="Explore with reverence and leave no trace"
                    text="Uploaded places stay clean and safe when explorers respect nature and local customs."
                  />
                  <div className="cm-list">
                    {ETHICS.map((item, i) => (
                      <div key={item.title} className="cm-ethic cm-up" style={{ ["--i" as string]: i }}>
                        <span className="ic"><Check size={16} aria-hidden /></span>
                        <div>
                          <h3>{item.title}</h3>
                          <p>{item.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </main>

            {/* RIGHT: side cards */}
            <aside className="cm-rail2">
              <div className="cm-card cm-rc cm-wisdom">
                <h4>A little local wisdom</h4>
                <p>
                  {latestTip
                    ? `${latestTip.title}. ${latestTip.text}`
                    : "Waterfalls are best after rain. Check local conditions, go with a buddy, and know when to turn back."}
                </p>
                <button type="button" onClick={() => goTab("tips")} className="cm-link">
                  Explore trail tips & alerts <ArrowRight size={12} aria-hidden />
                </button>
              </div>

              {featuredPlace && (
                <div className="cm-card cm-rc">
                  <p className="k">Off the beaten path</p>
                  <div className="ph">
                    <Image src={featuredPlace.hero_image_url as string} alt={featuredPlace.name} fill unoptimized className="object-cover" />
                  </div>
                  <h4>{featuredPlace.name}</h4>
                  <p className="cm-meta" style={{ marginTop: 2 }}>
                    {[featuredPlace.district, featuredPlace.category_name].filter(Boolean).join(" · ")}
                  </p>
                  {featuredPlace.short_description && <p>{featuredPlace.short_description}</p>}
                  <Link href={`/places?search=${encodeURIComponent(featuredPlace.name)}`} className="cm-link">
                    Discover this place <ArrowRight size={12} aria-hidden />
                  </Link>
                </div>
              )}

              <div className="cm-card cm-rc cm-green">
                <h4>Keep the hidden, beautiful.</h4>
                <ul>
                  <li><Check size={14} aria-hidden /> Leave no footprints</li>
                  <li><Check size={14} aria-hidden /> Respect local communities</li>
                  <li><Check size={14} aria-hidden /> Share thoughtfully, not precisely</li>
                </ul>
                <button type="button" onClick={() => goTab("ethics")} className="cm-link">
                  Our traveler’s code <ArrowRight size={12} aria-hidden />
                </button>
              </div>

              <div className="cm-card cm-rc">
                <h4>Know a place we’re missing?</h4>
                <p>Help us build a map of the best lesser-known places in Sri Lanka.</p>
                <Link href="/places/new" className="cm-link">
                  Suggest a hidden place <ArrowRight size={12} aria-hidden />
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* MODAL (unchanged markup) */}
      {isModalOpen && (
        <div className="cm-overlay" role="dialog" aria-modal="true" aria-label="Add to the community" onClick={() => setIsModalOpen(false)}>
          <div className="cm-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="cm-close" aria-label="Close">
              <X size={18} />
            </button>

            <h3>
              {modalType === "review"
                ? "Write a review"
                : modalType === "discussion"
                ? "Ask a question"
                : "Share a trail tip or safety alert"}
            </h3>

            <div className="cm-mtabs">
              <button type="button" aria-pressed={modalType === "review"} onClick={() => setModalType("review")}>
                Review
              </button>
              <button type="button" aria-pressed={modalType === "discussion"} onClick={() => setModalType("discussion")}>
                Question
              </button>
              <button type="button" aria-pressed={modalType === "tip"} onClick={() => setModalType("tip")}>
                Trail tip
              </button>
            </div>

            <form
              onSubmit={
                modalType === "review"
                  ? handleAddReview
                  : modalType === "discussion"
                  ? handleAddDiscussion
                  : handleAddTip
              }
              className="cm-form"
            >
              <div>
                <label className="cm-label" htmlFor="cm-place">
                  Place ({places.length} available)
                </label>
                <select id="cm-place" required value={formPlaceId} onChange={(e) => setFormPlaceId(e.target.value)} className="cm-field">
                  <option value="" disabled>
                    -- Choose an uploaded place --
                  </option>
                  {places.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.district || "Sri Lanka"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="cm-label" htmlFor="cm-title">
                  Title
                </label>
                <input
                  id="cm-title"
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={
                    modalType === "review"
                      ? "e.g., Incredible sunrise view and peaceful trails"
                      : modalType === "discussion"
                      ? "e.g., What is the road condition to the waterfall?"
                      : "e.g., Carry salt or neem oil for leeches"
                  }
                  className="cm-field"
                />
              </div>

              {modalType === "review" && (
                <div>
                  <span className="cm-label">Rating</span>
                  <div className="cm-rate">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormRating(star)}
                        aria-label={`${star} star${star > 1 ? "s" : ""}`}
                        aria-pressed={formRating >= star}
                        className={formRating >= star ? "on" : ""}
                      >
                        <Star size={22} strokeWidth={1.6} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {modalType === "tip" && (
                <div>
                  <span className="cm-label">How important is it?</span>
                  <div className="cm-sevpick">
                    {(["info", "warning", "essential"] as const).map((sev) => (
                      <button key={sev} type="button" aria-pressed={formSeverity === sev} onClick={() => setFormSeverity(sev)}>
                        {SEVERITY_META[sev].label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="cm-label" htmlFor="cm-body">
                  {modalType === "review" ? "Your review" : modalType === "discussion" ? "Question details" : "Tip details"}
                </label>
                <textarea
                  id="cm-body"
                  required
                  rows={4}
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  placeholder="Share details about trail access, parking, best time or safety..."
                  className="cm-field"
                />
              </div>

              {modalType === "review" && (
                <div>
                  <label className="cm-label" htmlFor="cm-keytip">
                    One insider tip (optional)
                  </label>
                  <input
                    id="cm-keytip"
                    type="text"
                    value={formKeyTip}
                    onChange={(e) => setFormKeyTip(e.target.value)}
                    placeholder="e.g., Arrive before 7 AM for the best mist photography"
                    className="cm-field"
                  />
                </div>
              )}

              <div className="cm-two">
                <div>
                  <label className="cm-label" htmlFor="cm-name">
                    Your name
                  </label>
                  <input id="cm-name" type="text" value={formAuthorName} onChange={(e) => setFormAuthorName(e.target.value)} placeholder="Explorer name" className="cm-field" />
                </div>
                <div>
                  <label className="cm-label" htmlFor="cm-handle">
                    Social handle
                  </label>
                  <input id="cm-handle" type="text" value={formAuthorHandle} onChange={(e) => setFormAuthorHandle(e.target.value)} placeholder="@handle" className="cm-field" />
                </div>
              </div>

              <div className="cm-modal-foot">
                <button type="button" onClick={() => setIsModalOpen(false)} className="cm-btn line sm">
                  Cancel
                </button>
                <button type="submit" className="cm-btn dark">
                  Post to community
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
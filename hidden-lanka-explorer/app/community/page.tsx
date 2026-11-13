"use client";

import { useState, useEffect, useMemo, useRef, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Search, X, Trash2, Star, ChevronDown, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/* ==========================================================================
   TYPES & DATA MODELS  (unchanged)
   ========================================================================== */

type TabType = "reviews" | "discussions" | "tips" | "contributors" | "ethics";

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

/* ==========================================================================
   STORAGE KEYS FOR ZERO-DATA PERSISTENCE  (unchanged)
   ========================================================================== */
const STORAGE_REVIEWS_KEY = "lanka_real_community_reviews";
const STORAGE_DISCUSSIONS_KEY = "lanka_real_community_discussions";
const STORAGE_TIPS_KEY = "lanka_real_community_tips";
const STORAGE_LIKES_KEY = "lanka_real_community_likes";

/* ==========================================================================
   LOOK & FEEL  (presentation only)
   Editorial, quiet and practical: Arial, flat colour, hairline dividers instead of
   boxed cards, plain-language copy, and only one entrance animation (the heading).
   The hero uses /footer.jpg; if that file is missing it falls back to deep teal.
   ========================================================================== */
const STYLES = `
.cm-root{
  --ink:#10252d; --text:#1d2f36; --muted:#5f7078; --line:#dfe5e8; --teal:#0f6b78; --amber:#b4620f; --band:#f5f7f8;
  --ease:cubic-bezier(.22,1,.36,1);
  font-family:Arial,Helvetica,sans-serif; background:#fff; color:var(--text); overflow-x:clip; font-size:15px; line-height:1.6;
}
.cm-root *{ font-family:inherit; }
.cm-root :focus-visible{ outline:2px solid var(--teal); outline-offset:2px; border-radius:4px; }
.cm-hide-scroll{ scrollbar-width:none; } .cm-hide-scroll::-webkit-scrollbar{ display:none; }

/* ----- toast ----- */
.cm-toast{ position:fixed; left:20px; bottom:20px; z-index:70; max-width:calc(100vw - 40px); padding:12px 16px; border-radius:6px;
  background:var(--ink); color:#fff; font-size:14px; box-shadow:0 8px 24px rgba(16,37,45,.3); animation:cm-toast .35s var(--ease) both; }
@keyframes cm-toast{ from{ opacity:0; transform:translateY(12px) } to{ opacity:1; transform:none } }

/* ----- hero ----- */
.cm-hero{ position:relative; isolation:isolate; overflow:hidden; color:#fff; padding:72px 0 30px;
  background:linear-gradient(135deg,#0a2d36 0%,#0f6b78 58%,#1c7d68 100%); }
.cm-hero-bg{ position:absolute; inset:0; z-index:-4; background:
  url('/footer.jpg') center 40% / cover no-repeat,
  radial-gradient(ellipse 55% 85% at 84% 12%, rgba(232,168,76,.55) 0%, rgba(232,168,76,0) 62%),
  linear-gradient(135deg,#0a2d36 0%,#0f6b78 58%,#1c7d68 100%); }
.cm-hero-shade{ position:absolute; inset:0; z-index:-3;
  background:linear-gradient(100deg, rgba(7,28,36,.9) 0%, rgba(9,46,55,.72) 52%, rgba(15,107,120,.38) 100%); }
.cm-hero-glow{ position:absolute; inset:0; z-index:-2; pointer-events:none;
  background:radial-gradient(ellipse 45% 70% at 88% 8%, rgba(240,178,84,.38) 0%, rgba(240,178,84,0) 65%); }
.cm-hero-topo{ position:absolute; inset:0; z-index:-2; pointer-events:none; opacity:.9;
  background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 400' preserveAspectRatio='xMaxYMid slice'%3E%3Cg fill='none' stroke='white' stroke-opacity='.13' stroke-width='1.2'%3E%3Cellipse cx='620' cy='170' rx='40' ry='24' transform='rotate(-14 620 170)'/%3E%3Cellipse cx='620' cy='170' rx='80' ry='50' transform='rotate(-14 620 170)'/%3E%3Cellipse cx='620' cy='170' rx='125' ry='80' transform='rotate(-14 620 170)'/%3E%3Cellipse cx='620' cy='170' rx='175' ry='112' transform='rotate(-14 620 170)'/%3E%3Cellipse cx='620' cy='170' rx='230' ry='148' transform='rotate(-14 620 170)'/%3E%3Cellipse cx='620' cy='170' rx='290' ry='186' transform='rotate(-14 620 170)'/%3E%3Cellipse cx='620' cy='170' rx='355' ry='226' transform='rotate(-14 620 170)'/%3E%3Cellipse cx='260' cy='330' rx='60' ry='34' transform='rotate(10 260 330)'/%3E%3Cellipse cx='260' cy='330' rx='115' ry='68' transform='rotate(10 260 330)'/%3E%3Cellipse cx='260' cy='330' rx='180' ry='104' transform='rotate(10 260 330)'/%3E%3C/g%3E%3C/svg%3E") right center / cover no-repeat; }
.cm-hero-ridge{ position:absolute; left:0; right:0; bottom:0; height:110px; z-index:-1; pointer-events:none;
  background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Cpath fill='white' fill-opacity='.07' d='M0 120V70L90 40l70 28 100-52 90 58 110-44 120 60 100-38 130 52 110-48 120 40 100-30 80 24v60z'/%3E%3Cpath fill='white' fill-opacity='.1' d='M0 120V92l110-30 90 26 120-40 100 36 140-30 110 34 130-26 120 30 100-22 80 20v50z'/%3E%3C/svg%3E") bottom / 100% 100% no-repeat; }
.cm-mask{ display:block; padding:.06em .2em .12em 0; margin:-.06em 0 -.12em; }
.cm-line{ display:block; opacity:0; transform:translateX(calc(-1 * min(90vw,900px)));
  transition:transform 1.1s cubic-bezier(.16,1,.3,1), opacity .5s ease-out; transition-delay:calc(var(--i) * 120ms); }
.cm-in .cm-line{ opacity:1; transform:none; }
.cm-h1{ margin:0; max-width:46rem; font-size:clamp(1.9rem,4.4vw,3rem); font-weight:700; line-height:1.12; letter-spacing:-.01em; }
.cm-lead{ margin:14px 0 0; max-width:45rem; font-size:18px; line-height:2; color:rgba(255,255,255,.82); }
.cm-cta{ display:flex; flex-wrap:wrap; align-items:center; gap:10px 22px; margin-top:22px; }
.cm-facts{ margin:22px 0 0; padding-top:14px; border-top:1px solid rgba(255,255,255,.22); font-size:18px; color:rgba(255,255,255,.72); }
.cm-facts b{ color:#fff; font-size:16px; }
.cm-fade{ opacity:0; } .cm-in .cm-fade{ animation:cm-fadein .8s ease-out both; animation-delay:calc(.7s + var(--d,0) * .12s); }
@keyframes cm-fadein{ from{ opacity:0 } to{ opacity:1 } }

/* ----- buttons (flat, no lift) ----- */
.cm-btn{ display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:11px 18px; border-radius:6px; font-size:14px; font-weight:700; cursor:pointer;
  border:1px solid transparent; text-decoration:none; transition:background .2s, color .2s, border-color .2s; }
.cm-btn.dark{ background:var(--ink); color:#fff; } .cm-btn.dark:hover{ background:var(--teal); }
.cm-btn.white{ background:#fff; color:var(--ink); } .cm-btn.white:hover{ background:#e8eef0; }
.cm-btn.line{ background:#fff; color:var(--ink); border-color:#c5d0d5; } .cm-btn.line:hover{ border-color:var(--ink); }
.cm-btn.sm{ padding:8px 14px; font-size:13px; }
.cm-textbtn{ padding:4px 0; font-size:14px; font-weight:700; color:#fff; cursor:pointer; background:linear-gradient(currentColor,currentColor) 0 100%/100% 1px no-repeat; transition:background-size .2s; }
.cm-textbtn:hover{ background-size:0 1px; }
.cm-link{ display:inline-flex; align-items:center; gap:5px; font-size:14px; font-weight:700; color:var(--teal); text-decoration:none; }
.cm-link:hover{ text-decoration:underline; text-underline-offset:3px; }

/* ----- place filter ----- */
.cm-filter{ background:var(--band); border-bottom:1px solid var(--line); padding:16px 0; }
.cm-filter-top{ display:flex; flex-wrap:wrap; align-items:baseline; justify-content:space-between; gap:8px 16px; }
.cm-filter-top span{ font-size:20px; font-weight:500; color:var(--muted); }
.cm-chips{ display:flex; gap:8px; margin-top:10px; padding-bottom:2px; overflow-x:auto; }
.cm-chip{ white-space:nowrap; padding:7px 12px; border-radius:6px; font-size:18px; font-weight:500; color:var(--text); background:#fff; border:1px solid #cfd8dc; cursor:pointer;
  transition:background .2s, color .2s, border-color .2s; }
.cm-chip small{ margin-left:4px; font-size:15px; font-weight:400; color:var(--muted); }
.cm-chip:hover{ border-color:var(--ink); }
.cm-chip[aria-pressed="true"]{ background:var(--ink); border-color:var(--ink); color:#fff; } .cm-chip[aria-pressed="true"] small{ color:rgba(255,255,255,.7); }

/* ----- tabs ----- */
.cm-tabs{ background:#fff; border-bottom:1px solid var(--line); }
.cm-tabs-in{ display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:8px 16px; }
.cm-tablist{ display:flex; gap:22px; overflow-x:auto; }
.cm-tab{ position:relative; white-space:nowrap; padding:15px 0; font-size:18px; font-weight:500; color:var(--muted); background:transparent; border:0; cursor:pointer; transition:color .2s; }
.cm-tab small{ margin-left:5px; font-size:12px; font-weight:400; }
.cm-tab::after{ content:""; position:absolute; left:0; right:0; bottom:-1px; height:2px; background:var(--ink); transform:scaleX(0); transition:transform .25s var(--ease); }
.cm-tab:hover{ color:var(--ink); } .cm-tab[aria-selected="true"]{ color:var(--ink); } .cm-tab[aria-selected="true"]::after{ transform:scaleX(1); }
.cm-search{ position:relative; width:min(100%,260px); margin:8px 0; }
.cm-search svg.s{ position:absolute; left:11px; top:50%; transform:translateY(-50%); color:#7b8d95; pointer-events:none; }
.cm-search input{ width:100%; padding:9px 32px 9px 34px; font-size:14px; color:var(--ink); background:#fff; border:1px solid #cfd8dc; border-radius:6px; }
.cm-search input:focus{ outline:none; border-color:var(--teal); box-shadow:0 0 0 3px rgba(15,107,120,.12); }
.cm-search button{ position:absolute; right:6px; top:50%; transform:translateY(-50%); display:grid; place-items:center; width:24px; height:24px; color:#7b8d95; cursor:pointer; }

/* ----- panels ----- */
.cm-panel{ padding:40px 0 72px; }
.cm-wrap{ max-width:56rem; margin:0 auto; }
.cm-phead{ display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:12px 20px; padding-bottom:18px; border-bottom:2px solid var(--ink); }
.cm-phead h2{ margin:0; font-size:26px; font-weight:700; line-height:1.2; letter-spacing:-.005em; color:var(--ink); }
.cm-phead p{ margin:6px 0 0; font-size:15px; color:var(--muted); max-width:36rem; }
.cm-up{ opacity:0; animation:cm-up .5s ease-out both; animation-delay:calc(var(--i) * 50ms); }
@keyframes cm-up{ from{ opacity:0; transform:translateY(10px) } to{ opacity:1; transform:none } }
.cm-empty{ padding:44px 0 8px; max-width:34rem; }
.cm-empty h3{ margin:0; font-size:20px; font-weight:700; color:var(--ink); } .cm-empty p{ margin:8px 0 0; color:var(--muted); }
.cm-empty .cm-btn{ margin-top:18px; }

/* ----- review entries ----- */
.cm-entry{ display:grid; grid-template-columns:190px 1fr; gap:8px 36px; padding:28px 0; border-bottom:1px solid var(--line); }
.cm-rail{ font-size:15px; color:var(--muted); line-height:1.5; }
.cm-rail .who{ display:flex; align-items:center; gap:10px; }
.cm-avatar{ position:relative; display:grid; place-items:center; width:34px; height:34px; flex-shrink:0; border-radius:50%; overflow:hidden; background:#dde6ea; color:var(--ink); font-size:14px; font-weight:700; }
.cm-avatar.lg{ width:46px; height:46px; font-size:17px; }
.cm-rail .nm{ display:block; font-size:14px; font-weight:700; color:var(--ink); }
.cm-stars{ display:flex; gap:1px; margin-top:12px; color:var(--amber); }
.cm-where{ display:flex; align-items:center; gap:10px; font-size:13px; color:var(--muted); }
.cm-where b{ color:var(--ink); font-size:15px; }
.cm-thumb{ position:relative; width:32px; height:32px; flex-shrink:0; border-radius:4px; overflow:hidden; background:var(--band); }
.cm-title{ margin:8px 0 0; font-size:20px; font-weight:700; line-height:1.3; color:var(--ink); }
.cm-body{ margin:8px 0 0; line-height:1.75; color:#34484f; font-size:18px;}
.cm-note{ margin:14px 0 0; padding:2px 0 2px 14px; border-left:3px solid var(--amber); font-size:16px; color:#34484f; } .cm-note b{ color:var(--ink); }
.cm-acts{ display:flex; flex-wrap:wrap; align-items:center; gap:6px 20px; margin-top:16px; font-size:13px; }
.cm-act{ display:inline-flex; align-items:center; gap:6px; font-size:15px; font-weight:700; color:var(--muted); cursor:pointer; transition:color .2s; }
.cm-act:hover{ color:var(--ink); } .cm-act.rm:hover{ color:#b3261e; }
.cm-act[aria-pressed="true"]{ color:#b3261e; } .cm-act[aria-pressed="true"] svg{ fill:#b3261e; }
.cm-replies{ margin-top:16px; padding-left:16px; border-left:2px solid var(--line); }
.cm-reply{ display:flex; justify-content:space-between; gap:10px; margin-bottom:12px; font-size:14px; }
.cm-reply p{ margin:2px 0 0; color:#34484f; } .cm-reply .nm{ font-weight:700; color:var(--ink); } .cm-reply small{ margin-left:8px; font-size:12px; color:var(--muted); }
.cm-inline{ display:flex; gap:8px; }
.cm-inline input{ flex:1; min-width:0; padding:9px 12px; font-size:14px; color:var(--ink); background:#fff; border:1px solid #cfd8dc; border-radius:6px; }
.cm-inline input:focus{ outline:none; border-color:var(--teal); box-shadow:0 0 0 3px rgba(15,107,120,.12); }

/* ----- discussions ----- */
.cm-row{ padding:22px 0; border-bottom:1px solid var(--line); }
.cm-row-head{ display:flex; align-items:flex-start; justify-content:space-between; gap:16px; }
.cm-row h3{ margin:4px 0 0; font-size:19px; font-weight:700; line-height:1.3; color:var(--ink); }
.cm-meta{ font-size:13px; color:var(--muted); }
.cm-toggle{ display:inline-flex; align-items:center; gap:6px; flex-shrink:0; font-size:13px; font-weight:700; color:var(--teal); cursor:pointer; }
.cm-toggle:hover{ text-decoration:underline; text-underline-offset:3px; } .cm-toggle svg{ transition:transform .3s var(--ease); } .cm-toggle[aria-expanded="true"] svg{ transform:rotate(180deg); }

/* ----- tips ----- */
.cm-tip{ padding:22px 0 22px 18px; border-bottom:1px solid var(--line); border-left:4px solid var(--c); }
.cm-sev{ font-size:13px; font-weight:700; color:var(--c); }
.cm-tip h3{ margin:4px 0 0; font-size:19px; font-weight:700; line-height:1.3; color:var(--ink); }
.cm-tip p{ margin:8px 0 0; line-height:1.7; color:#34484f; }

/* ----- profiles ----- */
.cm-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-top:28px; }
.cm-profile{ display:flex; flex-direction:column; gap:10px; height:100%; padding:18px; border:1px solid var(--line); border-radius:8px; background:#fff; transition:border-color .2s; }
.cm-profile:hover{ border-color:#9db0b8; } .cm-profile.me{ border-color:var(--ink); }
.cm-profile .nm{ font-size:16px; font-weight:700; color:var(--ink); } .cm-profile p{ margin:0; font-size:14px; color:#34484f; }

/* ----- ethics ----- */
.cm-ethic{ display:grid; grid-template-columns:64px 1fr; gap:8px 20px; padding:26px 0; border-bottom:1px solid var(--line); }
.cm-ethic .n{ font-size:40px; font-weight:700; line-height:1; color:#c3d0d6; }
.cm-ethic h3{ margin:0; font-size:19px; font-weight:700; color:var(--ink); } .cm-ethic p{ margin:6px 0 0; max-width:38rem; line-height:1.7; color:#34484f; }

/* ----- modal ----- */
.cm-overlay{ position:fixed; inset:0; z-index:80; display:flex; align-items:flex-start; justify-content:center; padding:16px; overflow-y:auto; background:rgba(10,32,40,.62); animation:cm-fadein .2s ease-out both; }
.cm-modal{ position:relative; width:100%; max-width:34rem; margin:40px 0; padding:28px; background:#fff; border-radius:10px; box-shadow:0 24px 60px rgba(0,0,0,.35); animation:cm-pop .3s var(--ease) both; }
@keyframes cm-pop{ from{ opacity:0; transform:translateY(14px) } to{ opacity:1; transform:none } }
.cm-close{ position:absolute; top:16px; right:16px; display:grid; place-items:center; width:34px; height:34px; border-radius:6px; color:var(--muted); cursor:pointer; transition:background .2s, color .2s; }
.cm-close:hover{ background:var(--band); color:var(--ink); }
.cm-modal h3{ margin:0; padding-right:40px; font-size:21px; font-weight:700; line-height:1.25; color:var(--ink); }
.cm-mtabs{ display:flex; gap:20px; margin-top:18px; border-bottom:1px solid var(--line); }
.cm-mtabs button{ position:relative; padding:10px 0; font-size:14px; font-weight:700; color:var(--muted); cursor:pointer; }
.cm-mtabs button[aria-pressed="true"]{ color:var(--ink); } .cm-mtabs button[aria-pressed="true"]::after{ content:""; position:absolute; left:0; right:0; bottom:-1px; height:2px; background:var(--ink); }
.cm-form{ display:flex; flex-direction:column; gap:16px; margin-top:20px; }
.cm-label{ display:block; font-size:14px; font-weight:700; color:var(--ink); }
.cm-field{ display:block; width:100%; margin-top:6px; padding:10px 12px; font-size:15px; line-height:1.5; color:var(--ink); background:#fff; border:1px solid #c5d0d5; border-radius:6px; transition:border-color .2s, box-shadow .2s; }
.cm-field:focus{ outline:none; border-color:var(--teal); box-shadow:0 0 0 3px rgba(15,107,120,.14); }
.cm-two{ display:grid; gap:14px; grid-template-columns:1fr 1fr; }
.cm-rate{ display:flex; gap:4px; margin-top:6px; }
.cm-rate button{ display:grid; place-items:center; width:36px; height:36px; color:#aab9c0; cursor:pointer; border-radius:6px; transition:color .15s, background .15s; }
.cm-rate button:hover{ background:var(--band); } .cm-rate button.on{ color:var(--amber); } .cm-rate button.on svg{ fill:var(--amber); }
.cm-sevpick{ display:flex; gap:8px; margin-top:6px; }
.cm-sevpick button{ flex:1; padding:9px 0; border-radius:6px; font-size:14px; font-weight:700; color:var(--muted); background:#fff; border:1px solid #c5d0d5; cursor:pointer; transition:background .2s, color .2s, border-color .2s; }
.cm-sevpick button:hover{ border-color:var(--ink); } .cm-sevpick button[aria-pressed="true"]{ background:var(--ink); border-color:var(--ink); color:#fff; }
.cm-modal-foot{ display:flex; justify-content:flex-end; gap:10px; padding-top:16px; border-top:1px solid var(--line); }

@media (max-width:900px){ .cm-grid{ grid-template-columns:repeat(2,1fr); } }
@media (max-width:720px){
  .cm-entry{ grid-template-columns:1fr; gap:10px; padding:22px 0; }
  .cm-rail{ display:flex; flex-wrap:wrap; align-items:center; gap:4px 14px; } .cm-stars{ margin-top:0; }
  .cm-hero{ padding:64px 0 24px; }
}
@media (max-width:560px){
  .cm-grid,.cm-two{ grid-template-columns:1fr; } .cm-modal{ padding:22px 18px; margin:16px 0; }
  .cm-ethic{ grid-template-columns:44px 1fr; } .cm-ethic .n{ font-size:30px; } .cm-search{ width:100%; }
}
@media (prefers-reduced-motion:reduce){
  .cm-line,.cm-fade,.cm-up{ opacity:1 !important; transform:none !important; transition:none !important; animation:none !important; }
}

/* ----- place filter: search + scroll arrows (added) ----- */
.cm-pbar{ display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:8px 12px; margin-top:10px; }
.cm-pbar .cm-search{ margin:0; }
.cm-arrows{ display:flex; gap:6px; }
.cm-arrow{ display:grid; place-items:center; width:32px; height:32px; border-radius:6px; background:#fff; border:1px solid #cfd8dc; color:var(--ink); cursor:pointer; transition:border-color .2s; }
.cm-arrow:hover{ border-color:var(--ink); }
.cm-nomatch{ font-size:14px; color:var(--muted); padding:7px 4px; white-space:nowrap; }
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

function StarRow({ rating, size = 15 }: { rating: number; size?: number }) {
  return (
    <div className="cm-stars" role="img" aria-label={`Rated ${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} strokeWidth={1.8} fill={i < rating ? "currentColor" : "none"} aria-hidden />
      ))}
    </div>
  );
}

function PanelHead({
  title,
  text,
  actionLabel,
  onAction,
}: {
  title: string;
  text?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="cm-phead">
      <div>
        <h2>{title}</h2>
        {text && <p>{text}</p>}
      </div>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="cm-btn dark sm">
          {actionLabel}
        </button>
      )}
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

  // Current session user
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email?: string;
    name?: string;
    handle?: string;
  } | null>(null);

  // Tab & filters
  const [activeTab, setActiveTab] = useState<TabType>("reviews");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlaceFilter, setSelectedPlaceFilter] = useState("all");

  // Place chips: search text + scroll container ref (added)
  const [placeSearch, setPlaceSearch] = useState("");
  const chipsRef = useRef<HTMLDivElement>(null);

  // Real Database Records (from Supabase)
  const [places, setPlaces] = useState<RealPlace[]>([]);
  const [profiles, setProfiles] = useState<RealProfile[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Zero-demo-data initial states: completely empty until real data is added
  const [reviews, setReviews] = useState<CommunityReview[]>([]);
  const [discussions, setDiscussions] = useState<CommunityDiscussion[]>([]);
  const [tips, setTips] = useState<CommunityTip[]>([]);

  // User interactions state (persisted)
  const [likedItems, setLikedItems] = useState<Record<string, boolean>>({});

  // Modals & UI states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"review" | "discussion" | "tip">("review");
  const [expandedDiscussionId, setExpandedDiscussionId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [heroIn, setHeroIn] = useState(false); // UI only: triggers the hero entrance

  // Form states for creating contributions
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

  // Inline comment & reply states
  const [replyInputText, setReplyInputText] = useState<Record<string, string>>({});
  const [commentInputText, setCommentInputText] = useState<Record<string, string>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // UI only: start the hero entrance after first paint
  useEffect(() => {
    const id = requestAnimationFrame(() => setHeroIn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // UI only: while the modal is open, lock page scroll and let Escape close it
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
            // A review saved to Supabase is also kept in the browser, so skip a local copy
            // when the same text for the same place is already loaded (matched by id or content)
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

        // 6. Load user-added discussions (purging any legacy mock items)
        const savedDiscussions = localStorage.getItem(STORAGE_DISCUSSIONS_KEY);
        if (savedDiscussions && isMounted) {
          try {
            const parsed: CommunityDiscussion[] = JSON.parse(savedDiscussions);
            const nonDemoOnly = parsed.filter(
              (d) =>
                !/^disc-\d{1,3}$/.test(d.id) && // only old demo ids (disc-1, disc-2); new ones are disc-<timestamp>
                !d.title.includes("Illukkumbura") &&
                !d.title.includes("Pitawala") &&
                !d.title.includes("Dikwella")
            );
            setDiscussions(nonDemoOnly);
          } catch (e) {
            console.error(e);
          }
        }

        // 7. Load user-added tips (purging any legacy mock items)
        const savedTips = localStorage.getItem(STORAGE_TIPS_KEY);
        if (savedTips && isMounted) {
          try {
            const parsed: CommunityTip[] = JSON.parse(savedTips);
            const nonDemoOnly = parsed.filter(
              (t) =>
                !/^tip-\d{1,3}$/.test(t.id) && // only old demo ids (tip-1, tip-2); new ones are tip-<timestamp>
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

  // Derive districts from real places
  const availableDistricts = useMemo(() => {
    const set = new Set<string>();
    places.forEach((p) => {
      if (p.district) set.add(p.district);
    });
    return Array.from(set).sort();
  }, [places]);

  // Chips filtered by the place search (the selected place always stays visible) (added)
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

  // Scroll the chips row left or right (added)
  const scrollChips = (dir: 1 | -1) =>
    chipsRef.current?.scrollBy({ left: dir * 300, behavior: "smooth" });

  /* ========================================================================
     FUNCTION: CREATE REVIEW / FIELD NOTE FOR REAL PLACE  (unchanged)
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

    // Try saving to Supabase reviews table if user is logged in
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

    // Reset fields
    setFormTitle("");
    setFormBody("");
    setFormKeyTip("");
    setIsModalOpen(false);
    showToast(`Review for ${placeName} published!`);
  };

  /* ========================================================================
     FUNCTION: REMOVE REVIEW  (unchanged)
     ======================================================================== */
  const handleRemoveReview = (reviewId: string) => {
    if (!confirm("Are you sure you want to remove this review?")) return;
    const updated = reviews.filter((r) => r.id !== reviewId);
    setReviews(updated);
    localStorage.setItem(STORAGE_REVIEWS_KEY, JSON.stringify(updated));
    showToast("Review removed.");
  };

  /* ========================================================================
     FUNCTION: ADD COMMENT TO A REVIEW  (unchanged)
     ======================================================================== */
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

  /* ========================================================================
     FUNCTION: REMOVE COMMENT  (unchanged)
     ======================================================================== */
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

  /* ========================================================================
     FUNCTION: TOGGLE / REMOVE LIKE ON REVIEW  (unchanged)
     ======================================================================== */
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

  /* ========================================================================
     FUNCTION: CREATE DISCUSSION / TRAIL QUERY FOR REAL PLACE  (unchanged)
     ======================================================================== */
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

  /* ========================================================================
     FUNCTION: REMOVE DISCUSSION  (unchanged)
     ======================================================================== */
  const handleRemoveDiscussion = (discId: string) => {
    if (!confirm("Are you sure you want to remove this discussion?")) return;
    const updated = discussions.filter((d) => d.id !== discId);
    setDiscussions(updated);
    localStorage.setItem(STORAGE_DISCUSSIONS_KEY, JSON.stringify(updated));
    showToast("Discussion removed.");
  };

  /* ========================================================================
     FUNCTION: ADD REPLY TO DISCUSSION  (unchanged)
     ======================================================================== */
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

  /* ========================================================================
     FUNCTION: CREATE TRAIL TIP  (unchanged)
     ======================================================================== */
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

  /* ========================================================================
     FUNCTION: REMOVE TRAIL TIP  (unchanged)
     ======================================================================== */
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

  /* ========================================================================
     UI HELPERS (presentation only)
     ======================================================================== */
  const openModal = (type: "review" | "discussion" | "tip") => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const profileCount = profiles.length > 0 ? profiles.length : currentUser ? 1 : 0;

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: "reviews", label: "Reviews & field notes", count: filteredReviews.length },
    { id: "discussions", label: "Questions & answers", count: filteredDiscussions.length },
    { id: "tips", label: "Trail tips & alerts", count: filteredTips.length },
    { id: "contributors", label: "Community profiles", count: profiles.length },
    { id: "ethics", label: "Traveler ethics" },
  ];

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

  return (
    <div className={`cm-root min-h-screen ${heroIn ? "cm-in" : ""}`}>
      <style>{STYLES}</style>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="cm-toast" role="status">
          {toastMessage}
        </div>
      )}

      {/* ====================================================================
          HERO
          ==================================================================== */}
      <section className="cm-hero">
        <div className="cm-hero-bg" aria-hidden />
        <div className="cm-hero-shade" aria-hidden />
        <div className="cm-hero-glow" aria-hidden />
        <div className="cm-hero-topo" aria-hidden />
        <div className="cm-hero-ridge" aria-hidden />

        <div className="container-main">
          <h1 className="cm-h1">
            <Line i={0}>Community for Sri Lanka’s</Line>
            <Line i={1}>real discoveries.</Line>
          </h1>

          <p className="cm-lead">
            <Line i={2}>Field reviews, trail questions and safety alerts for hidden places,</Line>
            <Line i={3}>shared by people who have been there.</Line>
          </p>

          <div className="cm-cta cm-fade" style={{ ["--d" as string]: 0 }}>
            <button type="button" onClick={() => openModal("review")} className="cm-btn white">
              Write a review
            </button>
            <button type="button" onClick={() => openModal("discussion")} className="cm-textbtn">
              Ask a question
            </button>
            <button type="button" onClick={() => openModal("tip")} className="cm-textbtn">
              Share a trail tip
            </button>
          </div>

          {/* Real figures from your data, written as a plain line */}
          <p className="cm-facts cm-fade" style={{ ["--d" as string]: 1 }}>
            {loadingData ? (
              "Loading community data..."
            ) : (
              <>
                <b>{places.length}</b> places · <b>{reviews.length}</b> reviews · <b>{availableDistricts.length}</b>{" "}
                districts · <b>{profileCount}</b> members
              </>
            )}
          </p>
        </div>
      </section>

      {/* ====================================================================
          PLACE FILTER (from website database)
          ==================================================================== */}
      <section className="cm-filter">
        <div className="container-main">
          <div className="cm-filter-top">
            <span>Show posts about</span>
            <Link href="/places/new" className="cm-link">
              Upload another place
            </Link>
          </div>

          {/* NEW: search + scroll arrows */}
          <div className="cm-pbar">
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
            <div className="cm-arrows">
              <button type="button" className="cm-arrow" onClick={() => scrollChips(-1)} aria-label="Scroll places left">
                <ChevronLeft size={16} />
              </button>
              <button type="button" className="cm-arrow" onClick={() => scrollChips(1)} aria-label="Scroll places right">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="cm-chips cm-hide-scroll" ref={chipsRef}>
            <button
              type="button"
              aria-pressed={selectedPlaceFilter === "all"}
              onClick={() => setSelectedPlaceFilter("all")}
              className="cm-chip"
            >
              All places {places.length}
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
        </div>
      </section>

      {/* ====================================================================
          TABS & SEARCH
          ==================================================================== */}
      <section className="cm-tabs sticky top-15 z-30">
        <div className="container-main">
          <div className="cm-tabs-in">
            <div className="cm-tablist cm-hide-scroll" role="tablist" aria-label="Community sections">
              {tabs.map(({ id, label, count }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === id}
                  onClick={() => setActiveTab(id)}
                  className="cm-tab"
                >
                  {label}
                  {count !== undefined && <small>{count}</small>}
                </button>
              ))}
            </div>

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
          </div>
        </div>
      </section>

      {/* ====================================================================
          TAB 1: REVIEWS & FIELD NOTES
          ==================================================================== */}
      {activeTab === "reviews" && (
        <section key="reviews" className="cm-panel">
          <div className="container-main">
            <div className="cm-wrap">
              <PanelHead
                title="Reviews & field notes"
                text="What people found when they actually went."
                actionLabel="Write a review"
                onAction={() => openModal("review")}
              />

              {filteredReviews.length === 0 ? (
                <Empty
                  title="No reviews yet"
                  text={`${places.length} places are uploaded on the website. Be the first to share a field report or an insider tip for one of them.`}
                  actionLabel="Write the first review"
                  onAction={() => openModal("review")}
                />
              ) : (
                <div>
                  {filteredReviews.map((rev, idx) => {
                    const isLiked = !!likedItems[rev.id];
                    return (
                      <article key={rev.id} className="cm-entry cm-up" style={{ ["--i" as string]: Math.min(idx, 8) }}>
                        {/* Author rail */}
                        <div className="cm-rail">
                          {rev.author_name && (
                            <div className="who">
                              <span className="cm-avatar">{rev.author_name.charAt(0)}</span>
                              <div>
                                <span className="nm">{rev.author_name}</span>
                                {rev.author_handle}
                              </div>
                            </div>
                          )}
                          <div style={{ marginTop: rev.author_name ? 10 : 0 }}>{new Date(rev.created_at).toLocaleDateString()}</div>
                          <StarRow rating={rev.rating} />
                        </div>

                        {/* Review */}
                        <div>
                          <div className="cm-where">
                            {rev.place_image && (
                              <span className="cm-thumb">
                                <Image src={rev.place_image} alt="" fill unoptimized className="object-cover" />
                              </span>
                            )}
                            <span>
                              <b>{rev.place_name}</b> · {rev.place_district}
                            </span>
                          </div>

                          <h3 className="cm-title">{rev.title}</h3>
                          <p className="cm-body">{rev.body}</p>

                          {rev.key_tip && (
                            <p className="cm-note">
                              <b>Insider tip: </b>
                              {rev.key_tip}
                            </p>
                          )}

                          <div className="cm-acts">
                            <button
                              type="button"
                              aria-pressed={isLiked}
                              onClick={() => handleToggleLike(rev.id)}
                              className="cm-act"
                            >
                              <Heart size={15} aria-hidden /> {rev.likes} {rev.likes === 1 ? "like" : "likes"}
                            </button>
                            <span className="cm-meta">
                              {rev.comments?.length || 0} {(rev.comments?.length || 0) === 1 ? "comment" : "comments"}
                            </span>
                            <Link href={`/places?search=${encodeURIComponent(rev.place_name)}`} className="cm-link" style={{ fontSize: 13 }}>
                              View place <ExternalLink size={12} aria-hidden />
                            </Link>
                            <button type="button" onClick={() => handleRemoveReview(rev.id)} className="cm-act rm" style={{ marginLeft: "auto" }}>
                              <Trash2 size={14} aria-hidden /> Remove
                            </button>
                          </div>

                          {/* Comments */}
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
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ====================================================================
          TAB 2: DISCUSSIONS & Q&A
          ==================================================================== */}
      {activeTab === "discussions" && (
        <section key="discussions" className="cm-panel">
          <div className="container-main">
            <div className="cm-wrap">
              <PanelHead
                title="Questions & answers"
                text="Road conditions, guides, permits. Ask people who know the place."
                actionLabel="Ask a question"
                onAction={() => openModal("discussion")}
              />

              {filteredDiscussions.length === 0 ? (
                <Empty
                  title="No questions yet"
                  text="Wondering about road conditions, local guides or permits for an uploaded place? Ask here."
                  actionLabel="Ask the first question"
                  onAction={() => openModal("discussion")}
                />
              ) : (
                <div>
                  {filteredDiscussions.map((disc, idx) => {
                    const isExpanded = expandedDiscussionId === disc.id;
                    return (
                      <div key={disc.id} className="cm-row cm-up" style={{ ["--i" as string]: Math.min(idx, 8) }}>
                        <div className="cm-row-head">
                          <div>
                            <div className="cm-meta">
                              {disc.place_name ? `${disc.place_name} · ` : ""}
                              {disc.district} · by {disc.author_name}, {new Date(disc.created_at).toLocaleDateString()}
                            </div>
                            <h3>{disc.title}</h3>
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
                          <div className="cm-replies" style={{ marginTop: 16 }}>
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
          </div>
        </section>
      )}

      {/* ====================================================================
          TAB 3: TRAIL TIPS & ALERTS
          ==================================================================== */}
      {activeTab === "tips" && (
        <section key="tips" className="cm-panel">
          <div className="container-main">
            <div className="cm-wrap">
              <PanelHead
                title="Trail tips & safety alerts"
                text="Short, practical notes from people on the ground."
                actionLabel="Share a tip"
                onAction={() => openModal("tip")}
              />

              {filteredTips.length === 0 ? (
                <Empty
                  title="No tips or alerts yet"
                  text="Know a shortcut, a leech remedy or road advice for an uploaded spot? Share it with the community."
                  actionLabel="Share the first tip"
                  onAction={() => openModal("tip")}
                />
              ) : (
                <div style={{ marginTop: 8 }}>
                  {filteredTips.map((tip, idx) => {
                    const meta = SEVERITY_META[tip.severity];
                    return (
                      <article
                        key={tip.id}
                        className="cm-tip cm-up"
                        style={{ ["--i" as string]: Math.min(idx, 8), ["--c" as string]: meta.color, marginTop: 18 }}
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
          </div>
        </section>
      )}

      {/* ====================================================================
          TAB 4: REAL COMMUNITY PROFILES (FROM SUPABASE PROFILES)
          ==================================================================== */}
      {activeTab === "contributors" && (
        <section key="contributors" className="cm-panel">
          <div className="container-main">
            <div className="cm-wrap">
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
          </div>
        </section>
      )}

      {/* ====================================================================
          TAB 5: TRAVELER ETHICS
          ==================================================================== */}
      {activeTab === "ethics" && (
        <section key="ethics" className="cm-panel">
          <div className="container-main">
            <div className="cm-wrap">
              <PanelHead
                title="Explore with reverence and leave no trace"
                text="Uploaded places stay clean and safe when explorers respect nature and local customs."
              />
              <div>
                {ETHICS.map((item, i) => (
                  <div key={item.title} className="cm-ethic cm-up" style={{ ["--i" as string]: i }}>
                    <span className="n">{i + 1}</span>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ====================================================================
          MODAL: ADD CONTENT USING REAL UPLOADED PLACES
          ==================================================================== */}
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
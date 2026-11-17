"use client";

import { useCallback, useEffect, useRef, useState, PointerEvent, KeyboardEvent, ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, MapPin, MessageSquare, Plus, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/* ==========================================================================
   Top contributors
   Same system as the other sections: Arial, gold accent, carousel with drag / swipe /
   arrows / keyboard, cards that arrive from the side set by CARDS_FROM.
   Heading direction: change HEADING_FROM to "right" to make the heading come from the right.
   ========================================================================== */

const HEADING_FROM: "left" | "right" = "left";
const CARDS_FROM: "left" | "right" = "left";

type Contributor = {
  id: string;
  name: string;
  username: string;
  places: number;
  reviews: number;
  total: number;
};

type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
};

const AVATAR_COLORS = ["#0b2417", "#0f4c5c", "#41592c", "#7a5a26"];
const GAP = 20;

const STYLES = `
.ct-root{
  --ink:#0b2417; --gold:#a77a2f; --muted:#5f6d66; --line:#dfe5e1; --green:#1f6b4f; --soft:#f4f6f4;
  --ease:cubic-bezier(.22,1,.36,1);
  font-family:Arial,Helvetica,sans-serif; background:#fff; color:var(--ink); overflow:hidden;
}
.ct-root *{ font-family:inherit; }
.ct-root :focus-visible{ outline:3px solid var(--green); outline-offset:3px; border-radius:14px; }

/* ----- heading: each line flies in from the chosen corner ----- */
.ct-head{ max-width:44rem; 
margin-left: auto;
  text-align: right;
  }
.ct-mask{ display:block; padding:.06em .2em .12em 0; margin:-.06em 0 -.12em; }
.ct-line{ display:block; opacity:0; transform:translateX(calc(var(--dir) * min(90vw,900px)));
  transition:transform 1.2s cubic-bezier(.16,1,.3,1), opacity .6s ease-out; transition-delay:calc(var(--i) * 140ms); }
.ct-in .ct-line{ opacity:1; transform:none; }
.ct-eyebrow{ font-size:15px; font-weight:700; color:var(--gold); }
.ct-title{ margin:12px 0 0; font-weight:700; font-size:clamp(2.4rem,6vw,4.25rem); line-height:1.04; letter-spacing:-.035em; }
.ct-bar{ display:block; width:64px; height:4px; margin-top:22px; background:var(--gold); border-radius:4px;
  transform:scaleX(0); transform-origin:left; transition:transform .8s var(--ease) 1s; }
.ct-in .ct-bar{ transform:scaleX(1); }
.ct-desc{ margin:22px 0 0; font-size:clamp(16px,2vw,18px); line-height:1.65; color:var(--muted); }

.ct-top{ display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:24px; }
.ct-nav{ display:flex; gap:10px; }
.ct-navbtn{ display:grid; place-items:center; width:48px; height:48px; border-radius:50%; background:#fff; color:var(--ink);
  border:1px solid var(--line); cursor:pointer; transition:background .25s, color .25s, border-color .25s, transform .2s var(--ease), opacity .2s; }
.ct-navbtn:hover:not(:disabled){ background:var(--ink); color:#fff; border-color:var(--ink); }
.ct-navbtn:active:not(:disabled){ transform:scale(.93); }
.ct-navbtn:disabled{ opacity:.4; cursor:default; }

/* ----- carousel: cards arrive from the right ----- */
.ct-track{ display:flex; gap:${GAP}px; margin-top:44px; padding:8px 4px 32px; overflow-x:auto; overscroll-behavior-x:contain;
  scroll-snap-type:x mandatory; scroll-padding-left:4px; scrollbar-width:none; cursor:grab; -webkit-overflow-scrolling:touch; }
.ct-track::-webkit-scrollbar{ display:none; }
.ct-track.is-drag{ scroll-snap-type:none; cursor:grabbing; user-select:none; }
.ct-card{ flex:0 0 clamp(250px,78vw,290px); scroll-snap-align:start; opacity:0; }
.ct-in .ct-card{ animation:ct-card-in 1.15s cubic-bezier(.16,1,.3,1) both; animation-delay:calc(.35s + var(--i) * .12s); }
@keyframes ct-card-in{
  0%{ opacity:0; transform:translateX(calc(var(--cdir) * min(75vw,720px))) }
  30%{ opacity:1 }
  100%{ opacity:1; transform:none }
}

.ct-body{ display:flex; flex-direction:column; height:100%; padding:26px; background:var(--soft); border:1px solid var(--line); border-radius:20px;
  transition:transform .45s var(--ease), box-shadow .45s var(--ease), background .3s, border-color .3s; }
.ct-card:hover .ct-body{ transform:translateY(-6px); background:#fff; border-color:rgba(167,122,47,.55); box-shadow:0 22px 40px -22px rgba(11,36,23,.35); }
.ct-row{ display:flex; align-items:flex-start; justify-content:space-between; }
.ct-avatar{ display:grid; place-items:center; width:68px; height:68px; border-radius:50%; background:var(--c); color:#f1cf88;
  font-size:26px; font-weight:700; transition:transform .5s var(--ease); }
.ct-card:hover .ct-avatar{ transform:scale(1.07) rotate(-4deg); }
.ct-rank{ padding:6px 12px; border-radius:999px; background:#fff; border:1px solid var(--line); font-size:13px; font-weight:700; color:var(--gold);
  font-variant-numeric:tabular-nums; }
.ct-name{ margin:20px 0 0; font-size:21px; font-weight:700; letter-spacing:-.015em; line-height:1.2; }
.ct-user{ margin:4px 0 0; font-size:14px; color:var(--muted); }

.ct-stats{ display:grid; grid-template-columns:repeat(3,1fr); margin-top:24px; padding:16px 0; background:#fff; border:1px solid var(--line); border-radius:14px;
  text-align:center; transition:border-color .3s; }
.ct-card:hover .ct-stats{ border-color:rgba(167,122,47,.4); }
.ct-stats > div + div{ border-left:1px solid var(--line); }
.ct-stats svg{ display:block; margin:0 auto 6px; color:var(--green); }
.ct-num{ font-size:20px; font-weight:700; font-variant-numeric:tabular-nums; line-height:1; }
.ct-lbl{ margin-top:4px; font-size:12px; color:var(--muted); }

.ct-follow{ display:flex; align-items:center; justify-content:center; gap:8px; width:100%; margin-top:auto; padding:12px 0; font-size:14px; font-weight:700;
  color:var(--ink); background:#fff; border:1px solid var(--line); border-radius:999px; cursor:pointer;
  transition:background .25s, color .25s, border-color .25s, transform .2s var(--ease); }
.ct-body .ct-follow{ margin-top:22px; }
.ct-follow:hover{ background:var(--ink); color:#fff; border-color:var(--ink); }
.ct-follow:active{ transform:scale(.97); }
.ct-follow[aria-pressed="true"]{ background:var(--ink); color:#fff; border-color:var(--ink); }
.ct-follow[aria-pressed="true"]:hover{ background:#fff; color:var(--ink); }

/* ----- progress ----- */
.ct-foot{ display:flex; align-items:center; gap:20px; }
.ct-progress{ position:relative; flex:1; height:3px; background:var(--line); border-radius:3px; overflow:hidden; }
.ct-progress i{ position:absolute; inset:0 auto 0 0; background:var(--ink); border-radius:3px; transition:width .5s var(--ease); }
.ct-count{ min-width:56px; text-align:right; font-size:14px; font-weight:700; font-variant-numeric:tabular-nums; }
.ct-count span{ color:var(--muted); font-weight:400; }

@media (max-width:640px){
  .ct-nav{ display:none; }
  .ct-track{ margin-top:32px; }
  .ct-body{ padding:22px; }
}
@media (prefers-reduced-motion:reduce){
  .ct-line,.ct-card,.ct-bar{ opacity:1 !important; transform:none !important; transition:none !important; animation:none !important; }
}
`;

function Line({ i, children, className = "" }: { i: number; children: ReactNode; className?: string }) {
  return (
    <span className="ct-mask">
      <span className={`ct-line ${className}`} style={{ ["--i" as string]: i }}>
        {children}
      </span>
    </span>
  );
}

// Counts up once the card has arrived
function CountUp({ value, run, delay }: { value: number; run: boolean; delay: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      return;
    }
    let raf = 0;
    const timer = window.setTimeout(() => {
      const start = performance.now();
      const tick = (t: number) => {
        const p = Math.min((t - start) / 1100, 1);
        setShown(Math.round(value * (1 - Math.pow(1 - p, 4))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [run, value, delay]);
  return <>{shown}</>;
}

export default function Contributors() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ down: false, active: false, x: 0, left: 0, blockClick: false });

  const [inView, setInView] = useState(false);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const [active, setActive] = useState(0);
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [contributorsLoading, setContributorsLoading] = useState(true);
  const [contributorsError, setContributorsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadContributors() {
      try {
        const supabase = createClient();
        const [profilesResult, placesResult, reviewsResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, username, display_name"),
          supabase
            .from("places")
            .select("created_by")
            .in("status", ["approved", "published"]),
          supabase.from("reviews").select("user_id"),
        ]);

        if (profilesResult.error) throw profilesResult.error;
        if (placesResult.error) throw placesResult.error;
        if (reviewsResult.error) throw reviewsResult.error;

        const placeCounts = new Map<string, number>();
        (placesResult.data ?? []).forEach((place) => {
          if (place.created_by) {
            placeCounts.set(
              place.created_by,
              (placeCounts.get(place.created_by) ?? 0) + 1
            );
          }
        });

        const reviewCounts = new Map<string, number>();
        (reviewsResult.data ?? []).forEach((review) => {
          if (review.user_id) {
            reviewCounts.set(
              review.user_id,
              (reviewCounts.get(review.user_id) ?? 0) + 1
            );
          }
        });

        const rankedContributors = ((profilesResult.data ?? []) as ProfileRow[])
          .map((profile) => {
            const places = placeCounts.get(profile.id) ?? 0;
            const reviews = reviewCounts.get(profile.id) ?? 0;
            return {
              id: profile.id,
              name: profile.display_name || profile.username || "Explorer",
              username: profile.username ? `@${profile.username}` : "Community member",
              places,
              reviews,
              total: places + reviews,
            };
          })
          .filter((contributor) => contributor.total > 0)
          .sort(
            (a, b) =>
              b.total - a.total ||
              b.reviews - a.reviews ||
              b.places - a.places
          )
          .slice(0, 12);

        if (!cancelled) setContributors(rankedContributors);
      } catch (error) {
        console.error("Failed to load contributor data:", error);
        if (!cancelled) {
          setContributorsError("Contributor data could not be loaded.");
        }
      } finally {
        if (!cancelled) setContributorsLoading(false);
      }
    }

    void loadContributors();
    return () => {
      cancelled = true;
    };
  }, []);

  // Start the animations the first time the section is on screen
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const step = useCallback(() => {
    const card = trackRef.current?.querySelector<HTMLElement>("[data-card]");
    return (card?.offsetWidth ?? 280) + GAP;
  }, []);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    if (contributors.length === 0) {
      setCanPrev(false);
      setCanNext(false);
      setActive(0);
      return;
    }
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < max - 4);
    const atEnd = max > 0 && el.scrollLeft >= max - 4;
    setActive(atEnd ? contributors.length - 1 : Math.min(contributors.length - 1, Math.round(el.scrollLeft / step())));
  }, [contributors.length, step]);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  const by = (dir: 1 | -1) => trackRef.current?.scrollBy({ left: dir * step(), behavior: "smooth" });

  // Mouse drag (touch uses native swipe). A tiny movement still counts as a click on Follow.
  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const el = trackRef.current;
    if (!el) return;
    drag.current = { down: true, active: false, x: e.clientX, left: el.scrollLeft, blockClick: false };
  }
  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const el = trackRef.current;
    const d = drag.current;
    if (!d.down || !el) return;
    const dx = e.clientX - d.x;
    if (!d.active && Math.abs(dx) > 6) {
      d.active = true;
      d.blockClick = true;
      el.classList.add("is-drag");
      el.setPointerCapture(e.pointerId);
    }
    if (d.active) el.scrollLeft = d.left - dx;
  }
  function endDrag(e: PointerEvent<HTMLDivElement>) {
    const el = trackRef.current;
    const d = drag.current;
    if (!d.down || !el) return;
    d.down = false;
    if (d.active) {
      d.active = false;
      el.classList.remove("is-drag");
      el.releasePointerCapture?.(e.pointerId);
      el.scrollTo({ left: Math.round(el.scrollLeft / step()) * step(), behavior: "smooth" });
    }
  }
  function onClickCapture(e: React.MouseEvent<HTMLDivElement>) {
    if (drag.current.blockClick) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.blockClick = false;
    }
  }
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      by(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      by(-1);
    }
  }

  return (
    <section
      ref={sectionRef}
      className={`ct-root section-padding ${inView ? "ct-in" : ""}`}
      style={{
        ["--dir" as string]: HEADING_FROM === "right" ? 1 : -1,
        ["--cdir" as string]: CARDS_FROM === "right" ? 1 : -1,
      }}
    >
      <style>{STYLES}</style>

      <div className="container-main">
        <div className="ct-top">
          <div className="ct-head">
            <Line i={0} className="ct-eyebrow">
              People behind the map
            </Line>

            <h2 className="ct-title">
              <Line i={1}>Top contributors.</Line>
            </h2>
            <span className="ct-bar" aria-hidden />

            <p className="ct-desc">
              <Line i={2}>The explorers who help keep Hidden Lanka growing.</Line>
            </p>
          </div>

          <div className="ct-nav">
            <button type="button" className="ct-navbtn" onClick={() => by(-1)} disabled={!canPrev} aria-label="Previous contributors">
              <ArrowLeft size={20} />
            </button>
            <button type="button" className="ct-navbtn" onClick={() => by(1)} disabled={!canNext} aria-label="Next contributors">
              <ArrowRight size={20} />
            </button>
          </div>
        </div>

        <div
          ref={trackRef}
          className="ct-track"
          role="region"
          aria-roledescription="carousel"
          aria-label="Top contributors"
          tabIndex={0}
          onScroll={update}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClickCapture={onClickCapture}
        >
          {contributorsLoading ? (
            <p className="text-sm text-[#5f6d66]" role="status">
              Loading contributors…
            </p>
          ) : contributorsError ? (
            <p className="text-sm text-red-700" role="alert">
              {contributorsError}
            </p>
          ) : contributors.length === 0 ? (
            <p className="text-sm text-[#5f6d66]">
              No community contributions yet.
            </p>
          ) : (
            contributors.map((person, i) => {
              const isFollowing = !!following[person.id];
              const countDelay = 350 + i * 120 + 700;
              return (
                <article
                  key={person.id}
                  data-card
                  className="ct-card"
                  style={{
                    ["--i" as string]: i,
                    ["--c" as string]:
                      AVATAR_COLORS[i % AVATAR_COLORS.length],
                  }}
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${contributors.length}`}
                >
                  <div className="ct-body">
                    <div className="ct-row">
                      <span className="ct-avatar" aria-hidden>
                        {person.name.charAt(0)}
                      </span>
                      <span className="ct-rank">#{i + 1}</span>
                    </div>

                    <h3 className="ct-name">{person.name}</h3>
                    <p className="ct-user">{person.username}</p>

                    <div className="ct-stats">
                      <div>
                        <MapPin size={16} aria-hidden />
                        <div className="ct-num">
                          <CountUp
                            value={person.places}
                            run={inView}
                            delay={countDelay}
                          />
                        </div>
                        <div className="ct-lbl">Places</div>
                      </div>
                      <div>
                        <MessageSquare size={16} aria-hidden />
                        <div className="ct-num">
                          <CountUp
                            value={person.reviews}
                            run={inView}
                            delay={countDelay}
                          />
                        </div>
                        <div className="ct-lbl">Reviews</div>
                      </div>
                      <div>
                        <Sparkles size={16} aria-hidden />
                        <div className="ct-num">
                          <CountUp
                            value={person.total}
                            run={inView}
                            delay={countDelay}
                          />
                        </div>
                        <div className="ct-lbl">Contributions</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="ct-follow"
                      aria-pressed={isFollowing}
                      onClick={() =>
                        setFollowing((prev) => ({
                          ...prev,
                          [person.id]: !prev[person.id],
                        }))
                      }
                    >
                      {isFollowing ? (
                        <Check size={16} aria-hidden />
                      ) : (
                        <Plus size={16} aria-hidden />
                      )}
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <div className="ct-foot">
          <div className="ct-progress" aria-hidden>
            <i style={{ width: `${contributors.length ? ((active + 1) / contributors.length) * 100 : 0}%` }} />
          </div>
          <div className="ct-count">
            {String(contributors.length ? active + 1 : 0).padStart(2, "0")} <span>/ {String(contributors.length).padStart(2, "0")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
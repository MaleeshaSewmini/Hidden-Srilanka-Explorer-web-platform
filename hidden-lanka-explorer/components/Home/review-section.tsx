"use client";

import { useCallback, useEffect, useRef, useState, PointerEvent, KeyboardEvent, ReactNode } from "react";
import { ArrowLeft, ArrowRight, MapPin, Quote, Star } from "lucide-react";

/* ==========================================================================
   Reviews
   Same system as the other sections: Arial, gold accent, carousel with drag / swipe /
   arrows / keyboard. Heading lines fly in from the LEFT corner, review cards arrive
   from the right.
   ========================================================================== */

const reviews = [
  {
    name: "Community Explorer",
    place: "Hiriketiya Bay",
    rating: 5,
    text: "A beautiful place away from the busy tourist areas. The community recommendations made the trip much easier.",
  },
  {
    name: "Island Wanderer",
    place: "Knuckles Mountain Range",
    rating: 5,
    text: "The hiking information was incredibly useful. The scenery was even better than expected.",
  },
  {
    name: "Travel Photographer",
    place: "Bambarakanda Falls",
    rating: 4,
    text: "A spectacular waterfall surrounded by incredible mountain scenery.",
  },
  {
    name: "Weekend Explorer",
    place: "Pottuvil Lagoon",
    rating: 5,
    text: "Peaceful, beautiful and completely different from the usual beach experience.",
  },
];

const AVATAR_COLORS = ["#0f4c5c", "#41592c", "#0b2417", "#7a5a26"];

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

const GAP = 20;

const STYLES = `
.rv-root{
  --ink:#0b2417; --gold:#a77a2f; --muted:#5f6d66; --line:#dfe5e1; --green:#1f6b4f;
  --ease:cubic-bezier(.22,1,.36,1);
  font-family:Arial,Helvetica,sans-serif; background:#f4f6f4; color:var(--ink); overflow:hidden;
}
.rv-root *{ font-family:inherit; }
.rv-root :focus-visible{ outline:3px solid var(--green); outline-offset:3px; border-radius:14px; }

/* ----- heading: each line flies in from the left corner ----- */
.rv-head{ max-width:44rem; }
.rv-mask{ display:block; padding:.06em .2em .12em 0; margin:-.06em 0 -.12em; }
.rv-line{ display:block; opacity:0; transform:translateX(calc(-1 * min(90vw,900px)));
  transition:transform 1.2s cubic-bezier(.16,1,.3,1), opacity .6s ease-out; transition-delay:calc(var(--i) * 140ms); }
.rv-in .rv-line{ opacity:1; transform:none; }
.rv-eyebrow{ font-size:18px; font-weight:700; color:var(--gold); }
.rv-title{ margin:12px 0 0; font-weight:700; font-size:clamp(2.2rem,5.6vw,3.9rem); line-height:1.06; letter-spacing:-.035em; }
.rv-bar{ display:block; width:64px; height:4px; margin-top:22px; background:var(--gold); border-radius:4px;
  transform:scaleX(0); transform-origin:left; transition:transform .8s var(--ease) 1s; }
.rv-in .rv-bar{ transform:scaleX(1); }
.rv-desc{ margin:22px 0 0; font-size:clamp(16px,2vw,18px); line-height:1.65; color:var(black); }

.rv-top{ display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:24px; }
.rv-nav{ display:flex; gap:10px; }
.rv-navbtn{ display:grid; place-items:center; width:48px; height:48px; border-radius:50%; background:#fff; color:var(--ink);
  border:1px solid var(--line); cursor:pointer; transition:background .25s, color .25s, border-color .25s, transform .2s var(--ease), opacity .2s; }
.rv-navbtn:hover:not(:disabled){ background:var(--ink); color:#fff; border-color:var(--ink); }
.rv-navbtn:active:not(:disabled){ transform:scale(.93); }
.rv-navbtn:disabled{ opacity:.4; cursor:default; }

/* ----- carousel: cards arrive from the right ----- */
.rv-track{ display:flex; gap:${GAP}px; margin-top:44px; padding:8px 4px 32px; overflow-x:auto; overscroll-behavior-x:contain;
  scroll-snap-type:x mandatory; scroll-padding-left:4px; scrollbar-width:none; cursor:grab; -webkit-overflow-scrolling:touch; }
.rv-track::-webkit-scrollbar{ display:none; }
.rv-track.is-drag{ scroll-snap-type:none; cursor:grabbing; user-select:none; }
.rv-card{ flex:0 0 clamp(280px,84vw,360px); scroll-snap-align:start; opacity:0; }
.rv-in .rv-card{ animation:rv-card-in 1.15s cubic-bezier(.16,1,.3,1) both; animation-delay:calc(.35s + var(--i) * .12s); }
@keyframes rv-card-in{
  0%{ opacity:0; transform:translateX(min(75vw,720px)) }
  30%{ opacity:1 }
  100%{ opacity:1; transform:none }
}

.rv-body{ position:relative; display:flex; flex-direction:column; height:100%; padding:26px; overflow:hidden; background:#fff;
  border:1px solid var(--line); border-radius:20px; box-shadow:0 1px 2px rgba(11,36,23,.05);
  transition:transform .45s var(--ease), box-shadow .45s var(--ease); }
.rv-card:hover .rv-body{ transform:translateY(-6px); box-shadow:0 22px 40px -22px rgba(11,36,23,.35); }
.rv-quote{ position:absolute; right:18px; top:16px; width:64px; height:64px; color:var(--gold); opacity:.12; transition:transform .6s var(--ease), opacity .3s; }
.rv-card:hover .rv-quote{ transform:scale(1.12) rotate(-6deg); opacity:.2; }
.rv-stars{ position:relative; display:flex; align-items:center; gap:3px; color:var(--gold); }
.rv-stars em{ margin-left:8px; font-style:normal; font-size:13px; font-weight:700; color:var(--ink); }
.rv-text{ position:relative; margin:18px 0 24px; font-size:16px; line-height:1.7; color:#33433a; }
.rv-foot-card{ display:flex; align-items:center; gap:14px; padding-top:20px; }
.rv-avatar{ display:grid; place-items:center; width:46px; height:46px; flex-shrink:0; border-radius:50%; background:var(--c); color:#fff;
  font-size:14px; font-weight:700; letter-spacing:.02em; }
.rv-who{ font-size:15px; font-weight:700; line-height:1.2; }
.rv-where{ display:flex; align-items:center; gap:5px; margin-top:4px; font-size:13px; color:var(--muted); }
.rv-divider{ height:1px; margin-top:auto; background:var(--line); }

/* ----- progress ----- */
.rv-foot{ display:flex; align-items:center; gap:20px; }
.rv-progress{ position:relative; flex:1; height:3px; background:var(--line); border-radius:3px; overflow:hidden; }
.rv-progress i{ position:absolute; inset:0 auto 0 0; background:var(--ink); border-radius:3px; transition:width .5s var(--ease); }
.rv-count{ min-width:56px; text-align:right; font-size:14px; font-weight:700; font-variant-numeric:tabular-nums; }
.rv-count span{ color:var(--muted); font-weight:400; }

@media (max-width:640px){
  .rv-nav{ display:none; }
  .rv-track{ margin-top:32px; }
  .rv-body{ padding:22px; }
}
@media (prefers-reduced-motion:reduce){
  .rv-line,.rv-card,.rv-bar{ opacity:1 !important; transform:none !important; transition:none !important; animation:none !important; }
}
`;

function Line({ i, children, className = "" }: { i: number; children: ReactNode; className?: string }) {
  return (
    <span className="rv-mask">
      <span className={`rv-line ${className}`} style={{ ["--i" as string]: i }}>
        {children}
      </span>
    </span>
  );
}

export default function ReviewsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ down: false, x: 0, left: 0 });

  const [inView, setInView] = useState(false);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const [active, setActive] = useState(0);

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
    return (card?.offsetWidth ?? 320) + GAP;
  }, []);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < max - 4);
    const atEnd = max > 0 && el.scrollLeft >= max - 4;
    setActive(atEnd ? reviews.length - 1 : Math.min(reviews.length - 1, Math.round(el.scrollLeft / step())));
  }, [step]);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  const by = (dir: 1 | -1) => trackRef.current?.scrollBy({ left: dir * step(), behavior: "smooth" });

  // Mouse drag (touch uses native swipe)
  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const el = trackRef.current;
    if (!el) return;
    drag.current = { down: true, x: e.clientX, left: el.scrollLeft };
    el.classList.add("is-drag");
    el.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const el = trackRef.current;
    if (!drag.current.down || !el) return;
    el.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
  }
  function endDrag(e: PointerEvent<HTMLDivElement>) {
    const el = trackRef.current;
    if (!drag.current.down || !el) return;
    drag.current.down = false;
    el.classList.remove("is-drag");
    el.releasePointerCapture?.(e.pointerId);
    el.scrollTo({ left: Math.round(el.scrollLeft / step()) * step(), behavior: "smooth" });
  }
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      by(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      by(-1);
    }
  }

  return (
    <section ref={sectionRef} className={`rv-root section-padding ${inView ? "rv-in" : ""}`}>
      <style>{STYLES}</style>

      <div className="container-main">
        <div className="rv-top">
          <div className="rv-head">
            <Line i={0} className="rv-eyebrow">
              From the community
            </Line>

            <h2 className="rv-title">
              <Line i={1}>Stories from people</Line>
              <Line i={2}>who went there.</Line>
            </h2>
            <span className="rv-bar" aria-hidden />

            <p className="rv-desc">
              <Line i={3}>Real experiences help fellow explorers</Line>
              <Line i={4}>understand what a place is actually like.</Line>
            </p>
          </div>

          <div className="rv-nav">
            <button type="button" className="rv-navbtn" onClick={() => by(-1)} disabled={!canPrev} aria-label="Previous review">
              <ArrowLeft size={20} />
            </button>
            <button type="button" className="rv-navbtn" onClick={() => by(1)} disabled={!canNext} aria-label="Next review">
              <ArrowRight size={20} />
            </button>
          </div>
        </div>

        <div
          ref={trackRef}
          className="rv-track"
          role="region"
          aria-roledescription="carousel"
          aria-label="Reviews from the community"
          tabIndex={0}
          onScroll={update}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {reviews.map((review, i) => (
            <article
              key={`${review.name}-${review.place}`}
              data-card
              className="rv-card"
              style={{ ["--i" as string]: i, ["--c" as string]: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${reviews.length}`}
            >
              <div className="rv-body">
                <Quote className="rv-quote" aria-hidden />

                <div className="rv-stars" role="img" aria-label={`Rated ${review.rating} out of 5`}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      size={18}
                      strokeWidth={1.8}
                      fill={index < review.rating ? "currentColor" : "none"}
                      aria-hidden
                    />
                  ))}
                  <em>{review.rating}.0</em>
                </div>

                <p className="rv-text">&ldquo;{review.text}&rdquo;</p>

                <div className="rv-divider" />
                <div className="rv-foot-card">
                  <span className="rv-avatar" aria-hidden>
                    {initials(review.name)}
                  </span>
                  <div>
                    <div className="rv-who">{review.name}</div>
                    <div className="rv-where">
                      <MapPin size={13} aria-hidden /> Visited {review.place}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="rv-foot">
          <div className="rv-progress" aria-hidden>
            <i style={{ width: `${((active + 1) / reviews.length) * 100}%` }} />
          </div>
          <div className="rv-count">
            {String(active + 1).padStart(2, "0")} <span>/ {String(reviews.length).padStart(2, "0")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
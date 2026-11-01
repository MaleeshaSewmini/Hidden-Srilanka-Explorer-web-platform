"use client";

import { useCallback, useEffect, useRef, useState, PointerEvent, KeyboardEvent, ReactNode } from "react";
import { ArrowLeft, ArrowRight, Waves, PawPrint, Mountain, Landmark } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ==========================================================================
   Seasonal guide
   Clean travel-editorial layout, Arial throughout.
   - Heading sits top-left and slides in line by line when the section scrolls into view
   - Season cards are a swipe / drag / arrow-key carousel
   - Professional line icons (lucide) and a 12-month availability bar on each card
   ========================================================================== */

const MONTH_LETTERS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

type Season = {
  title: string;
  months: string;
  best: number[]; // 1 = January … 12 = December
  description: string;
  color: string; // card header colour
  Icon: LucideIcon;
  image: string;
};

const SEASONS: Season[] = [
  {
    title: "Southwest Coast",
    months: "Dec – Mar",
    best: [12, 1, 2, 3],
    description: "Sunny beaches, calm seas and perfect coastal escapes along the south and west.",
    color: "#0f4c5c",
    Icon: Waves,
    image: "images/places/southcoast.jpg"
  },
  {
    title: "East & Wildlife",
    months: "Apr – Sep",
    best: [4, 5, 6, 7, 8, 9],
    description: "Explore the eastern coast and combine it with Sri Lanka's wild national parks.",
    color: "#41592c",
    Icon: PawPrint,
    image:"images/places/wildlife.jpg"
  },
  {
    title: "Hill Country",
    months: "Jan – Mar",
    best: [1, 2, 3],
    description: "Cool mountain weather, tea country, waterfalls and scenic hiking routes.",
    color: "#0b2417",
    Icon: Mountain,
    image:"images/places/hillcountry.jpg"
  },
  {
    title: "Cultural Triangle",
    months: "Year-round",
    best: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    description: "Ancient cities, temples, ruins and remarkable cultural landscapes.",
    color: "#7a5a26",
    Icon: Landmark,
    image:"images/places/culture.jpg"
  },
];

const GAP = 24;

const STYLES = `
.sg-root{
  --ink:#0b2417; --gold:#a77a2f; --muted:#5f6d66; --line:#dfe5e1; --green:#1f6b4f; --bg:white;
  --ease:cubic-bezier(.22,1,.36,1);
  font-family:Arial,Helvetica,sans-serif; background:var(--bg); color:var(--ink); overflow:hidden;
}
.sg-root *{ font-family:inherit; }
.sg-root :focus-visible{ outline:3px solid var(--green); outline-offset:3px; border-radius:12px; }

/* ----- heading: each line slides in from the left ----- */
.sg-head{ max-width:42rem; }
.sg-mask{ display:block; overflow:hidden; padding:.06em .2em .12em 0; margin:-.06em 0 -.12em; }
.sg-line{ display:block; opacity:0; transform:translateX(-64px);
  transition:transform .9s var(--ease), opacity .9s var(--ease); transition-delay:calc(var(--i) * 130ms); }
.sg-in .sg-line{ opacity:1; transform:none; }
.sg-eyebrow{ font-size:20px; font-weight:700; color:var(--gold); }
.sg-title{ margin:12px 0 0; font-weight:700; font-size:clamp(2.4rem,6vw,4.25rem); line-height:1.04; letter-spacing:-.035em; }
.sg-bar{ display:block; width:64px; height:4px; margin-top:22px; background:var(--gold); border-radius:4px;
  transform:scaleX(0); transform-origin:left; transition:transform .8s var(--ease) 1s; }
.sg-in .sg-bar{ transform:scaleX(1); }
.sg-desc{ margin:22px 0 0; font-size:clamp(16px,2vw,18px); line-height:1.65; color:var(black); }

.sg-top{ display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:24px; }
.sg-nav{ display:flex; gap:10px; }
.sg-navbtn{ display:grid; place-items:center; width:48px; height:48px; border-radius:50%; background:#fff; color:var(--ink);
  border:1px solid var(--line); cursor:pointer; transition:background .25s, color .25s, border-color .25s, transform .2s var(--ease), opacity .2s; }
.sg-navbtn:hover:not(:disabled){ background:var(--ink); color:#fff; border-color:var(--ink); }
.sg-navbtn:active:not(:disabled){ transform:scale(.93); }
.sg-navbtn:disabled{ opacity:.4; cursor:default; }

/* ----- carousel ----- */
.sg-track{ display:flex; gap:${GAP}px; margin-top:44px; padding:8px 4px 32px; overflow-x:auto; overscroll-behavior-x:contain;
  scroll-snap-type:x mandatory; scroll-padding-left:4px; scrollbar-width:none; cursor:grab; -webkit-overflow-scrolling:touch; }
.sg-track::-webkit-scrollbar{ display:none; }
.sg-track.is-drag{ scroll-snap-type:none; cursor:grabbing; user-select:none; }
.sg-card{ flex:0 0 clamp(264px,82vw,340px); scroll-snap-align:start; opacity:0; }
.sg-in .sg-card{ animation:sg-card-in .85s var(--ease) both; animation-delay:calc(.5s + var(--i) * .13s); }
@keyframes sg-card-in{ from{ opacity:0; transform:translateX(80px) } to{ opacity:1; transform:none } }

.sg-body{ height:100%; display:flex; flex-direction:column; overflow:hidden; background:#fff; border:1px solid var(--line); border-radius:20px;
  box-shadow:0 1px 2px rgba(11,36,23,.05); transition:transform .45s var(--ease), box-shadow .45s var(--ease); }
.sg-card:hover .sg-body{ transform:translateY(-6px); box-shadow:0 22px 40px -22px rgba(11,36,23,.35); }

.sg-head-panel{ position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  height: 180px;
  padding: 20px;
  background-size: cover;
  background-position: center;
  color: #fff;
  overflow: hidden;
   }
.sg-watermark{ position:absolute; right:-18px; bottom:-26px; width:150px; height:150px; opacity:.12; stroke-width:1.2;
  transition:transform .8s var(--ease); }
.sg-card:hover .sg-watermark{ transform:scale(1.12) rotate(-4deg); }
.sg-icon{ position:relative; display:grid; place-items:center; width:52px; height:52px; border-radius:14px; background:rgba(255,255,255,.16); }
.sg-pill{ position:relative; padding:7px 13px; border-radius:999px; background:#fff; color:var(--c); font-size:13px; font-weight:700; }

.sg-content{ display:flex; flex:1; flex-direction:column; padding:22px 22px 24px; }
.sg-name{ margin:0; font-size:22px; font-weight:700; letter-spacing:-.015em; line-height:1.2; }
.sg-text{ margin:10px 0 0; font-size:15px; line-height:1.65; color:var(black); }
.sg-label{ margin-top:auto; padding-top:20px; font-size:12px; font-weight:700; color:var(--muted); }
.sg-strip{ display:grid; grid-template-columns:repeat(12,1fr); gap:3px; margin-top:8px; }
.sg-strip span{ display:grid; place-items:center; height:24px; font-size:10px; font-weight:700; color:#8a968f; background:#eef2ef; border-radius:5px;
  transition:background .3s, color .3s; }
.sg-strip span.on{ background:var(--c); color:#fff; }

/* ----- progress ----- */
.sg-foot{ display:flex; align-items:center; gap:20px; }
.sg-progress{ position:relative; flex:1; height:3px; background:var(--line); border-radius:3px; overflow:hidden; }
.sg-progress i{ position:absolute; inset:0 auto 0 0; background:var(--ink); border-radius:3px; transition:width .5s var(--ease); }
.sg-count{ min-width:56px; text-align:right; font-size:14px; font-weight:700; font-variant-numeric:tabular-nums; }
.sg-count span{ color:var(--muted); font-weight:400; }

@media (max-width:640px){
  .sg-nav{ display:none; }
  .sg-track{ margin-top:32px; }
  .sg-head-panel{ height:132px; }
}
@media (prefers-reduced-motion:reduce){
  .sg-line,.sg-card,.sg-bar{ opacity:1 !important; transform:none !important; transition:none !important; animation:none !important; }
}
`;

function Line({ i, children, className = "" }: { i: number; children: ReactNode; className?: string }) {
  return (
    <span className="sg-mask">
      <span className={`sg-line ${className}`} style={{ ["--i" as string]: i }}>
        {children}
      </span>
    </span>
  );
}

export default function SeasonalGuide() {
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
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const step = useCallback(() => {
    const card = trackRef.current?.querySelector<HTMLElement>("[data-card]");
    return (card?.offsetWidth ?? 300) + GAP;
  }, []);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < max - 4);
    const atEnd = max > 0 && el.scrollLeft >= max - 4;
    setActive(atEnd ? SEASONS.length - 1 : Math.min(SEASONS.length - 1, Math.round(el.scrollLeft / step())));
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
    <section ref={sectionRef} className={`sg-root section-padding ${inView ? "sg-in" : ""}`}>
      <style>{STYLES}</style>

      <div className="container-main">
        <div className="sg-top">
          <div className="sg-head">
            <Line i={0} className="sg-eyebrow">
              Plan around the island
            </Line>

            <h2 className="sg-title">
              <Line i={1}>Where to go,</Line>
              <Line i={2}>and when.</Line>
            </h2>
            <span className="sg-bar" aria-hidden />

            <p className="sg-desc">
              <Line i={3}>Sri Lanka changes dramatically with the seasons.</Line>
              <Line i={4}>Use the guide to plan your next escape.</Line>
            </p>
          </div>

          <div className="sg-nav">
            <button type="button" className="sg-navbtn" onClick={() => by(-1)} disabled={!canPrev} aria-label="Previous season">
              <ArrowLeft size={20} />
            </button>
            <button type="button" className="sg-navbtn" onClick={() => by(1)} disabled={!canNext} aria-label="Next season">
              <ArrowRight size={20} />
            </button>
          </div>
        </div>

        <div
          ref={trackRef}
          className="sg-track"
          role="region"
          aria-roledescription="carousel"
          aria-label="Best seasons to visit each part of Sri Lanka"
          tabIndex={0}
          onScroll={update}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {SEASONS.map((s, i) => (
            <article
              key={s.title}
              data-card
              className="sg-card"
              style={{ ["--i" as string]: i, ["--c" as string]: s.color }}
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${SEASONS.length}`}
            >
              <div className="sg-body">
                <div
  className="sg-head-panel"
  style={{
    backgroundImage: `linear-gradient(rgba(218, 211, 211, 0.35), rgba(0,0,0,0.45)), url("${s.image}")`,
  }}
>
  

  <span className="sg-pill">{s.months}</span>
</div>

                <div className="sg-content">
                  <h3 className="sg-name">{s.title}</h3>
                  <p className="sg-text">{s.description}</p>

                  <div className="sg-label">Best months</div>
                  <div className="sg-strip" role="img" aria-label={`Best months: ${s.months}`}>
                    {MONTH_LETTERS.map((m, mi) => (
                      <span key={mi} className={s.best.includes(mi + 1) ? "on" : ""}>
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="sg-foot">
          <div className="sg-progress" aria-hidden>
            <i style={{ width: `${((active + 1) / SEASONS.length) * 100}%` }} />
          </div>
          <div className="sg-count">
            {String(active + 1).padStart(2, "0")} <span>/ {String(SEASONS.length).padStart(2, "0")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
"use client";

import { useCallback, useEffect, useRef, useState, PointerEvent, KeyboardEvent, ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  Droplets,
  Umbrella,
  Mountain,
  PawPrint,
  Palette,
  UtensilsCrossed,
  Moon,
  Flower2,
  Castle,
  Home,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { categories } from "@/lib/demo-data";

/* ==========================================================================
   Category explorer
   Same system as the seasonal guide: Arial, clean cards, heading that flies in from the right
   line by line, carousel with drag / swipe / arrows / keyboard.
   The emoji from demo-data are replaced by line icons chosen from the category name.
   Edit ICONS below to change an icon. Unknown categories fall back to a compass.
   ========================================================================== */

const ICONS: Record<string, LucideIcon> = {
  waterfalls: Droplets,
  beaches: Umbrella,
  mountains: Mountain,
  wildlife: PawPrint,
  culture: Palette,
  food: UtensilsCrossed,
  caves: Moon,
  temples: Flower2,
  ruins: Castle,
  villages: Home,
};

function iconFor(name: string): LucideIcon {
  const k = name.toLowerCase();
  const hit = Object.keys(ICONS).find((key) => k.includes(key) || key.includes(k));
  return hit ? ICONS[hit] : Compass;
}

const CATEGORY_IMAGES: Record<string, string> = {
  nature: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSH-xLVsQ9kbcMzuSUGMY-kclOOCSAJW5sXXE6ukvO9Mw&s=10",
  temples: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQusAe6SGZZdRIjLlXtVJpyk8yhqsdFhmOTqlE6UXfr6w&s=10",
  beaches: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS759cjJ4H2zNcumXQM_5VyeYsikMKJWsLvrpimq0V5dw&s=10",
  wildlife:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhptl8RCXQfHZD41meTPiab8jGshu75A_YmkfCxSx1_Q&s=10",
  waterfalls:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRiFx7qO6bxtGi6nvi2A0bxt8DpQOzDFrdzLqFCc8EThQ&s=10",
  ruins:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLSoNt6klMMJQ3HpBOxeoTTcCQkad2mXDOI331cX6j9g&s=10",
  villages:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkyGg8dKndhmqdTIBRCFVR1tfYODdEp4nDnLHKktv83A&s=10",
  caves:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQD3IM7eXRW8zi9I1xn37e-iwUnkRFLEhXNO2ogKYQfIg&s=10"
};

const GAP = 16;

const STYLES = `
.ce-root{
  --ink:#0b2417; --gold:#a77a2f; --muted:#5f6d66; --line:#dfe5e1; --green:#1f6b4f; --soft:#f4f6f4;
  --ease:cubic-bezier(.22,1,.36,1);
  font-family:Arial,Helvetica,sans-serif; background:#fff; color:var(--ink); overflow:hidden;
}
.ce-root *{ font-family:inherit; }
.ce-root :focus-visible{ outline:3px solid var(--green); outline-offset:3px; border-radius:14px; }

/* ----- heading: each line flies in from the right corner ----- */
.ce-head{ max-width:44rem; }
.ce-mask{ display:block; padding:.06em .2em .12em 0; margin:-.06em 0 -.12em; }
.ce-line{ display:block; opacity:0; transform:translateX(min(90vw,900px));
  transition:transform 1.2s cubic-bezier(.16,1,.3,1), opacity .6s ease-out; transition-delay:calc(var(--i) * 140ms); }
.ce-in .ce-line{ opacity:1; transform:translateX(0); }
.ce-eyebrow{ font-size:18px; font-weight:700; color:var(--gold); }
.ce-title{ margin:12px 0 0; font-weight:700; font-size:clamp(2.2rem,5.6vw,3.9rem); line-height:1.06; letter-spacing:-.035em; }
.ce-bar{ display:block; width:64px; height:4px; margin-top:22px; background:var(--gold); border-radius:4px;
  transform:scaleX(0); transform-origin:left; transition:transform .8s var(--ease) 1s; }
.ce-in .ce-bar{ transform:scaleX(1); }
.ce-desc{ margin:22px 0 0; font-size:clamp(16px,2vw,18px); line-height:1.65; color:var(black); }

.ce-top{ display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:24px; }
.ce-nav{ display:flex; gap:10px; }
.ce-navbtn{ display:grid; place-items:center; width:48px; height:48px; border-radius:50%; background:#fff; color:var(--ink);
  border:1px solid var(--line); cursor:pointer; transition:background .25s, color .25s, border-color .25s, transform .2s var(--ease), opacity .2s; }
.ce-navbtn:hover:not(:disabled){ background:var(--ink); color:#fff; border-color:var(--ink); }
.ce-navbtn:active:not(:disabled){ transform:scale(.93); }
.ce-navbtn:disabled{ opacity:.4; cursor:default; }

/* ----- carousel ----- */
.ce-track{ display:flex; gap:${GAP}px; margin-top:44px; padding:8px 4px 32px; overflow-x:auto; overscroll-behavior-x:contain;
  scroll-snap-type:x mandatory; scroll-padding-left:4px; scrollbar-width:none; cursor:grab; -webkit-overflow-scrolling:touch; }
.ce-track::-webkit-scrollbar{ display:none; }
.ce-track.is-drag{ scroll-snap-type:none; cursor:grabbing; user-select:none; }
.ce-card{ flex:0 0 clamp(200px,58vw,244px); scroll-snap-align:start; opacity:0; }
.ce-in .ce-card{ animation:ce-card-in 1.15s cubic-bezier(.16,1,.3,1) both; animation-delay:calc(.35s + var(--i) * .12s); }
/* cards fly in from the right edge of the screen, one after another */
@keyframes ce-card-in{
  0%{ opacity:0; transform:translateX(min(75vw,720px)) }
  30%{ opacity:1 }
  100%{ opacity:1; transform:none }
}

.ce-link{ display:flex; flex-direction:column; height:100%; min-height:244px; padding:22px; text-decoration:none; color:inherit;
  background:var(--soft); border:1px solid var(--line); border-radius:20px;
  transition:transform .45s var(--ease), box-shadow .45s var(--ease), background .3s, border-color .3s; -webkit-user-drag:none; }
.ce-link:hover{ transform:translateY(-6px); background:#fff; border-color:rgba(167,122,47,.55); box-shadow:0 22px 40px -22px rgba(11,36,23,.35); }
.ce-icon{ display:grid; place-items:center; width:54px; height:54px; border-radius:15px; background:#fff; color:var(--ink);
  border:1px solid var(--line); transition:background .3s, color .3s, border-color .3s, transform .45s var(--ease); }
.ce-link:hover .ce-icon{ background:var(--ink); color:#fff; border-color:var(--ink); transform:rotate(-6deg) scale(1.05); }
.ce-name{ margin:22px 0 0; font-size:20px; font-weight:700; letter-spacing:-.015em; line-height:1.2; }
.ce-text{ margin:8px 0 0; font-size:14px; line-height:1.65; color:var(--muted); }
.ce-go{ display:flex; align-items:center; gap:6px; margin-top:auto; padding-top:20px; font-size:13px; font-weight:700; color:var(--green); }
.ce-go svg{ transition:transform .35s var(--ease); }
.ce-link:hover .ce-go svg{ transform:translateX(5px); }
.ce-link.ce-image-card {
  background-size: cover;
  background-position: center;
  color: white;
  border-color: transparent;
}

.ce-link.ce-image-card:hover {
  background-color: transparent;
  border-color: rgba(167,122,47,.55);
}

.ce-image-card .ce-name {
  color: white;
}

.ce-image-card .ce-text {
  color: rgba(255,255,255,.9);
}

.ce-image-card .ce-go {
  color: #f0c36a;
}

.ce-image-card .ce-icon {
  background: rgba(255,255,255,.9);
  color: #102b20;
}

/* ----- progress ----- */
.ce-foot{ display:flex; align-items:center; gap:20px; }
.ce-progress{ position:relative; flex:1; height:3px; background:var(--line); border-radius:3px; overflow:hidden; }
.ce-progress i{ position:absolute; inset:0 auto 0 0; background:var(--ink); border-radius:3px; transition:width .5s var(--ease); }
.ce-count{ min-width:56px; text-align:right; font-size:14px; font-weight:700; font-variant-numeric:tabular-nums; }
.ce-count span{ color:var(--muted); font-weight:400; }

@media (max-width:640px){
  .ce-nav{ display:none; }
  .ce-track{ margin-top:32px; }
}
@media (prefers-reduced-motion:reduce){
  .ce-line,.ce-card,.ce-bar{ opacity:1 !important; transform:none !important; transition:none !important; animation:none !important; }
}
`;

function Line({ i, children, className = "" }: { i: number; children: ReactNode; className?: string }) {
  return (
    <span className="ce-mask">
      <span className={`ce-line ${className}`} style={{ ["--i" as string]: i }}>
        {children}
      </span>
    </span>
  );
}

export default function CategoryExplorer() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ down: false, active: false, x: 0, left: 0, blockClick: false });

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
    return (card?.offsetWidth ?? 220) + GAP;
  }, []);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < max - 4);
    const atEnd = max > 0 && el.scrollLeft >= max - 4;
    setActive(atEnd ? categories.length - 1 : Math.min(categories.length - 1, Math.round(el.scrollLeft / step())));
  }, [step]);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  // Arrows move by roughly one screenful of cards
  const by = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const perPage = Math.max(1, Math.floor(el.clientWidth / step()));
    el.scrollBy({ left: dir * perPage * step(), behavior: "smooth" });
  };

  // Mouse drag (touch uses native swipe). A tiny movement still counts as a click.
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
    <section ref={sectionRef} className={`ce-root section-padding ${inView ? "ce-in" : ""}`}>
      <style>{STYLES}</style>

      <div className="container-main">
        <div className="ce-top">
          <div className="ce-head">
            <Line i={0} className="ce-eyebrow">
              Explore by experience
            </Line>

            <h2 className="ce-title">
              <Line i={1}>Find your kind of</Line>
              <Line i={2}>hidden Sri Lanka.</Line>
            </h2>
            <span className="ce-bar" aria-hidden />

            <p className="ce-desc">
              <Line i={3}>From quiet beaches to mountain trails,</Line>
              <Line i={4}>discover places based on the experience you want.</Line>
            </p>
          </div>

          <div className="ce-nav">
            <button type="button" className="ce-navbtn" onClick={() => by(-1)} disabled={!canPrev} aria-label="Previous categories">
              <ArrowLeft size={20} />
            </button>
            <button type="button" className="ce-navbtn" onClick={() => by(1)} disabled={!canNext} aria-label="Next categories">
              <ArrowRight size={20} />
            </button>
          </div>
        </div>

        <div
          ref={trackRef}
          className="ce-track"
          role="region"
          aria-roledescription="carousel"
          aria-label="Place categories"
          tabIndex={0}
          onScroll={update}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClickCapture={onClickCapture}
        >
          {categories.map((category, i) => {
            const Icon = iconFor(category.name);
            return (
              <div key={category.id} data-card className="ce-card" style={{ ["--i" as string]: i }}>
                <Link
                 href={`/places?category=${encodeURIComponent(category.name)}`}
  className={`ce-link ${CATEGORY_IMAGES[category.name.toLowerCase()] ? "ce-image-card" : ""}`}
  draggable={false}
  style={
    CATEGORY_IMAGES[category.name.toLowerCase()]
      ? {
          backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.1)), url("${CATEGORY_IMAGES[category.name.toLowerCase()]}")`,
        }
      : undefined
  }
                >
                  

                  <h3 className="ce-name">{category.name}</h3>
                  <p className="ce-text">{category.description}</p>

                  <span className="ce-go">
                    Explore places <ArrowRight size={15} aria-hidden />
                  </span>
                </Link>
              </div>
            );
          })}
        </div>

        <div className="ce-foot">
          <div className="ce-progress" aria-hidden>
            <i style={{ width: `${((active + 1) / categories.length) * 100}%` }} />
          </div>
          <div className="ce-count">
            {String(active + 1).padStart(2, "0")} <span>/ {String(categories.length).padStart(2, "0")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
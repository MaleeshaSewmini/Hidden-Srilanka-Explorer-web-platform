"use client";

import { useEffect, useMemo, useRef, useState, ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import PlaceCard from "@/components/places/place-card";
import { places } from "@/lib/demo-data";

/* ==========================================================================
   Places explorer
   Same system as the seasonal guide and category explorer: Arial, gold accent,
   heading lines that fly in from the right, cards that arrive from the right.
   PlaceCard itself is untouched. Sorting logic is unchanged.
   ========================================================================== */

type Tab = "Trending" | "Newest" | "Nearby";
const TABS: Tab[] = ["Trending", "Newest", "Nearby"];

const STYLES = `
.pe-root{
  --ink:#0b2417; --gold:#a77a2f; --muted:#5f6d66; --line:#dfe5e1; --green:#1f6b4f;
  --ease:cubic-bezier(.22,1,.36,1);
  font-family:Arial,Helvetica,sans-serif; background:	#d0d1d192; color:var(--ink); overflow:hidden;
}
.pe-root *{ font-family:inherit; }
.pe-root :focus-visible{ outline:3px solid var(--green); outline-offset:3px; border-radius:12px; }

/* ----- heading: each line flies in from the right corner ----- */
.pe-head{   max-width: 44rem;
  margin-left:auto;
  text-align:right;
}
.pe-mask{ display:block; padding:.06em .2em .12em 0; margin:-.06em 0 -.12em; }
.pe-line{  display:block;
  opacity:0;
  transform:translateX(-100vw);
  transition:
    transform 1.2s cubic-bezier(.16,1,.3,1),
    opacity .6s ease-out;
  transition-delay:calc(var(--i) * 140ms);
  transition:transform 1.2s cubic-bezier(.16,1,.3,1), opacity .6s ease-out; transition-delay:calc(var(--i) * 140ms); }
.pe-in .pe-line{ opacity:1; transform:translateX(0); }
.pe-eyebrow{ font-size:18px; font-weight:700; color:var(--gold); }
.pe-title{ margin:12px 0 0; font-weight:700; font-size:clamp(2.2rem,5.6vw,3.9rem); line-height:1.06; letter-spacing:-.035em; }
.pe-bar{ display:block; width:64px; height:4px; margin-top:22px; background:var(--gold); border-radius:4px;
  transform:scaleX(0); transform-origin:left; transition:transform .8s var(--ease) 1s; }
.pe-in .pe-bar{ transform:scaleX(1); }
.pe-desc{ margin:22px 0 0;
  font-size:clamp(16px,2vw,18px);
  line-height:1.65;
  color:var(black);
  text-align:right; }

.pe-top{ display:flex;
  flex-wrap:wrap;
  align-items:flex-end;
  justify-content:space-between;
  gap:24px; }
.pe-all{ display:inline-flex; align-items:center; gap:10px; padding:13px 22px; border-radius:999px; font-size:14px; font-weight:700;
  color:var(--ink); background:#fff; border:1px solid var(--line); text-decoration:none;
  transition:background .25s, color .25s, border-color .25s; }
.pe-all svg{ transition:transform .35s var(--ease); }
.pe-all:hover{ background:var(--ink); color:#fff; border-color:var(--ink); }
.pe-all:hover svg{ transform:translateX(5px); }

/* ----- filter: segmented control with a sliding pill ----- */
.pe-bartop{ display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:16px; margin-top:44px; }
.pe-seg{ padding:4px; background:#fff; border:1px solid var(--line); border-radius:999px; width:min(100%,360px); }
.pe-seg-in{ position:relative; display:grid; grid-template-columns:repeat(3,1fr); }
.pe-pill{ position:absolute; top:0; bottom:0; left:0; width:33.3333%; border-radius:999px; background:var(--ink);
  transform:translateX(calc(var(--i) * 100%)); transition:transform .5s var(--ease); }
.pe-tab{ position:relative; z-index:1; padding:11px 8px; font-size:14px; font-weight:700; color:var(--muted); background:transparent; border:0;
  border-radius:999px; cursor:pointer; transition:color .3s; }
.pe-tab:hover{ color:var(--ink); }
.pe-tab[aria-pressed="true"]{ color:#fff; }
.pe-count{ font-size:18px; font-weight:700; font-variant-numeric:tabular-nums; }
.pe-count span{ font-weight:500; color:var(black); }

/* ----- cards arrive from the right ----- */
.pe-grid{ margin-top:28px; display:grid; gap:20px; }
.pe-item{ opacity:0; }
.pe-in .pe-item{ animation:pe-card-in 1.1s cubic-bezier(.16,1,.3,1) both; animation-delay:calc(var(--base) + var(--i) * 80ms); }
@keyframes pe-card-in{
  0%{ opacity:0; transform:translateX(var(--dist)) }
  30%{ opacity:1 }
  100%{ opacity:1; transform:none }
}

@media (max-width:640px){
  .pe-all{ 
  padding:11px 20px; 
  margin-top: 60px;

  }
  .pe-bartop{ margin-top:32px; 
  }
}
@media (prefers-reduced-motion:reduce){
  .pe-line,.pe-item,.pe-bar{ opacity:1 !important; transform:none !important; transition:none !important; animation:none !important; }
  .pe-pill{ transition:none; }
}
`;

function Line({ i, children, className = "" }: { i: number; children: ReactNode; className?: string }) {
  return (
    <span className="pe-mask">
      <span className={`pe-line ${className}`} style={{ ["--i" as string]: i }}>
        {children}
      </span>
    </span>
  );
}

export default function PlacesExplorer() {
  const [tab, setTab] = useState<Tab>("Trending");
  const [switched, setSwitched] = useState(false); // first load flies in from far away, tab changes are quicker
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const sortedPlaces = useMemo(() => {
    const data = [...places];

    if (tab === "Trending") {
      return data.sort((a, b) => b.likes - a.likes);
    }

    if (tab === "Newest") {
      return data.reverse();
    }

    return data;
  }, [tab]);

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
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const tabIndex = TABS.indexOf(tab);

  return (
    <section ref={sectionRef} className={`pe-root section-padding ${inView ? "pe-in" : ""}`}>
      <style>{STYLES}</style>

      <div className="container-main">
        <div className="pe-top">
          <div className="pe-head">
            <Line i={0} className="pe-eyebrow">
              Places worth finding
            </Line>

            <h2 className="pe-title">
              <Line i={1}>Hidden gems from</Line>
              <Line i={2}>across the island.</Line>
            </h2>
            <span className="pe-bar" aria-hidden />

            <p className="pe-desc">
              <Line i={3}>Explore places shared by our growing</Line>
              <Line i={4}>community of Sri Lankan explorers.</Line>
            </p>
          </div>

          <Link href="/places" className="pe-all">
            View all places <ArrowRight size={17} aria-hidden />
          </Link>
        </div>

        <div className="pe-bartop">
          <div className="pe-seg" role="group" aria-label="Sort places">
            <div className="pe-seg-in" style={{ ["--i" as string]: tabIndex }}>
              <span className="pe-pill" aria-hidden />
              {TABS.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={tab === item}
                  onClick={() => {
                    setSwitched(true);
                    setTab(item);
                  }}
                  className="pe-tab"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="pe-count" aria-live="polite">
            {sortedPlaces.length} <span>places</span>
          </div>
        </div>

        <div className="pe-grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedPlaces.map((place, i) => (
            <div
              key={`${tab}-${place.id}`}
              className="pe-item"
              style={{
                ["--i" as string]: Math.min(i, 8),
                ["--base" as string]: switched ? "0s" : ".35s",
                ["--dist" as string]: switched ? "90px" : "min(75vw,720px)",
              }}
            >
              <PlaceCard place={place} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
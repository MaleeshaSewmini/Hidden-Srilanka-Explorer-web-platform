"use client";

import { useCallback, useEffect, useRef, useState, ReactNode } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Maximize2, X } from "lucide-react";

/* ==========================================================================
   Community gallery
   Same system as the other sections: Arial, gold accent, heading lines that slide in
   from the left, photos that arrive from the right. Same bento layout as before.
   New: click any photo to open a viewer (arrows, swipe-free keyboard, Esc to close).
   ========================================================================== */

const gallery = [
  {
    image:"/images/places/rangala.jpg",
    title: "Rangala",
  },
  {
    image:
      "/images/places/heeloya.jpg",
    title: "Heeloya Waterfall",
  },
  {
    image:
      "/images/places/keeri.jpg",
    title: "Keeri Beach",
  },
  {
    image:
      "/images/places/golumale.jpg",
    title: "Golumale pond",
  },
];

const STYLES = `
.gl-root{
  --ink:#0b2417; --gold:#a77a2f; --muted:#5f6d66; --line:#dfe5e1; --green:#1f6b4f;
  --ease:cubic-bezier(.22,1,.36,1);
  font-family:Arial,Helvetica,sans-serif; background:#d0d1d192; color:var(--ink); overflow:hidden;
}
.gl-root *{ font-family:inherit; }
.gl-root :focus-visible{ outline:3px solid var(--green); outline-offset:3px; border-radius:14px; }

/* ----- heading: each line slides in from the left corner, moving right ----- */
.gl-head{ max-width:44rem; }
.gl-mask{ display:block; padding:.06em .2em .12em 0; margin:-.06em 0 -.12em; }
.gl-line{ display:block; opacity:0; transform:translateX(calc(-1 * min(90vw,900px)));
  transition:transform 1.2s cubic-bezier(.16,1,.3,1), opacity .6s ease-out; transition-delay:calc(var(--i) * 140ms); }
.gl-in .gl-line{ opacity:1; transform:none; }
.gl-eyebrow{ font-size:18px; font-weight:700; color:var(--gold); }
.gl-title{ margin:12px 0 0; font-weight:700; font-size:clamp(2.2rem,5.6vw,3.9rem); line-height:1.06; letter-spacing:-.035em; }
.gl-bar{ display:block; width:64px; height:4px; margin-top:22px; background:var(--gold); border-radius:4px;
  transform:scaleX(0); transform-origin:left; transition:transform .8s var(--ease) 1s; }
.gl-in .gl-bar{ transform:scaleX(1); }
.gl-desc{ margin:22px 0 0; font-size:clamp(16px,2vw,18px); line-height:1.65; color:var(black); }

/* ----- photos arrive from the right ----- */
.gl-item{ opacity:0; }
.gl-in .gl-item{ animation:gl-in 1.15s cubic-bezier(.16,1,.3,1) both; animation-delay:calc(.35s + var(--i) * .13s); }
@keyframes gl-in{
  0%{ opacity:0; transform:translateX(min(75vw,720px)) }
  30%{ opacity:1 }
  100%{ opacity:1; transform:none }
}
.gl-tile{ position:relative; display:block; width:100%; height:100%; padding:0; overflow:hidden; border:0; border-radius:20px;
  background:#dfe5e1; cursor:zoom-in; text-align:left; }
.gl-tile img{ transition:transform 1s var(--ease); }
.gl-tile:hover img{ transform:scale(1.07); }
.gl-cap{ position:absolute; left:14px; bottom:14px; display:inline-flex; align-items:center; gap:10px; max-width:calc(100% - 28px);
  padding:9px 14px; border-radius:999px; background:#fff; color:var(--ink); font-size:13px; font-weight:700;
  box-shadow:0 8px 20px -10px rgba(0,0,0,.45); transition:transform .45s var(--ease), background .3s, color .3s; }
.gl-cap svg{ flex-shrink:0; opacity:.55; transition:opacity .3s, transform .45s var(--ease); }
.gl-tile:hover .gl-cap{ transform:translateY(-4px); background:var(--ink); color:#fff; }
.gl-tile:hover .gl-cap svg{ opacity:1; transform:scale(1.15); }

/* ----- viewer ----- */
.gl-lb{ position:fixed; inset:0; z-index:100; display:flex; flex-direction:column; background:rgba(8,24,16,.94); animation:gl-fade .3s ease-out both; }
@keyframes gl-fade{ from{ opacity:0 } to{ opacity:1 } }
.gl-lb-top{ display:flex; align-items:center; justify-content:space-between; padding:16px 20px; color:#fff; }
.gl-lb-count{ font-size:14px; font-weight:700; font-variant-numeric:tabular-nums; }
.gl-lb-count span{ color:rgba(255,255,255,.6); font-weight:400; }
.gl-lb-stage{ position:relative; flex:1; margin:0 72px; min-height:0; }
.gl-lb-img{ position:absolute; inset:0; animation:gl-zoom .45s var(--ease) both; }
@keyframes gl-zoom{ from{ opacity:0; transform:scale(.97) } to{ opacity:1; transform:none } }
.gl-lb-title{ padding:16px 20px 22px; text-align:center; color:#fff; font-size:16px; font-weight:700; }
.gl-lb-btn{ display:grid; place-items:center; width:48px; height:48px; border-radius:50%; color:#fff; background:rgba(255,255,255,.12);
  border:1px solid rgba(255,255,255,.22); cursor:pointer; transition:background .25s, color .25s, transform .2s var(--ease); }
.gl-lb-btn:hover{ background:#fff; color:var(--ink); }
.gl-lb-btn:active{ transform:scale(.93); }
.gl-lb-prev,.gl-lb-next{ position:absolute; top:50%; transform:translateY(-50%); z-index:2; }
.gl-lb-prev{ left:12px; } .gl-lb-next{ right:12px; }
.gl-lb-prev:active,.gl-lb-next:active{ transform:translateY(-50%) scale(.93); }

@media (max-width:640px){
  .gl-lb-stage{ margin:0 12px; }
  .gl-lb-prev,.gl-lb-next{ width:42px; height:42px; background:rgba(8,24,16,.55); }
  .gl-lb-prev{ left:6px; } .gl-lb-next{ right:6px; }
  .gl-cap{ font-size:12px; padding:8px 12px; left:10px; bottom:10px; }
}
@media (prefers-reduced-motion:reduce){
  .gl-line,.gl-item,.gl-bar{ opacity:1 !important; transform:none !important; transition:none !important; animation:none !important; }
  .gl-lb,.gl-lb-img{ animation:none !important; }
}
`;

function Line({ i, children, className = "" }: { i: number; children: ReactNode; className?: string }) {
  return (
    <span className="gl-mask">
      <span className={`gl-line ${className}`} style={{ ["--i" as string]: i }}>
        {children}
      </span>
    </span>
  );
}

export default function Gallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const [inView, setInView] = useState(false);
  const [open, setOpen] = useState<number | null>(null);

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

  const move = useCallback((dir: 1 | -1) => {
    setOpen((cur) => (cur === null ? cur : (cur + dir + gallery.length) % gallery.length));
  }, []);

  // Viewer: keyboard, scroll lock, focus handling
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      else if (e.key === "ArrowRight") move(1);
      else if (e.key === "ArrowLeft") move(-1);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      lastFocus.current?.focus();
    };
  }, [open, move]);

  return (
    <section ref={sectionRef} className={`gl-root section-padding ${inView ? "gl-in" : ""}`}>
      <style>{STYLES}</style>

      <div className="container-main">
        <div className="gl-head">
          <Line i={0} className="gl-eyebrow">
            Community gallery
          </Line>

          <h2 className="gl-title">
            <Line i={1}>See Sri Lanka</Line>
            <Line i={2}>through local eyes.</Line>
          </h2>
          <span className="gl-bar" aria-hidden />

          <p className="gl-desc">
            <Line i={3}>Photos shared by people exploring</Line>
            <Line i={4}>beyond the usual routes.</Line>
          </p>
        </div>

        <div className="mt-12 grid auto-rows-[220px] grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {gallery.map((item, index) => (
            <div
              key={item.title}
              className={`gl-item ${
                index === 0 ? "col-span-2 row-span-2" : index === 1 ? "row-span-2" : ""
              }`}
              style={{ ["--i" as string]: index }}
            >
              <button
                type="button"
                className="gl-tile"
                aria-label={`Open photo: ${item.title}`}
                onClick={(e) => {
                  lastFocus.current = e.currentTarget;
                  setOpen(index);
                }}
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover"
                />
                <span className="gl-cap">
                  {item.title}
                  <Maximize2 size={14} aria-hidden />
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {open !== null && (
        <div className="gl-lb" role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={() => setOpen(null)}>
          <div className="gl-lb-top" onClick={(e) => e.stopPropagation()}>
            <div className="gl-lb-count">
              {String(open + 1).padStart(2, "0")} <span>/ {String(gallery.length).padStart(2, "0")}</span>
            </div>
            <button ref={closeRef} type="button" className="gl-lb-btn" onClick={() => setOpen(null)} aria-label="Close viewer">
              <X size={20} />
            </button>
          </div>

          <div className="gl-lb-stage" onClick={(e) => e.stopPropagation()}>
            <div key={open} className="gl-lb-img">
              <Image
                src={gallery[open].image}
                alt={gallery[open].title}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            </div>
            <div style={{ display: "contents" }}>
              <button type="button" className="gl-lb-btn gl-lb-prev" onClick={() => move(-1)} aria-label="Previous photo">
                <ArrowLeft size={20} />
              </button>
              <button type="button" className="gl-lb-btn gl-lb-next" onClick={() => move(1)} aria-label="Next photo">
                <ArrowRight size={20} />
              </button>
            </div>
          </div>

          <div className="gl-lb-title" onClick={(e) => e.stopPropagation()}>
            {gallery[open].title}
          </div>
        </div>
      )}
    </section>
  );
}
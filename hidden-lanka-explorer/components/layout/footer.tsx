"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, Mail, MapPin } from "lucide-react";
import { FaFacebookF, FaInstagram, FaTwitter } from "react-icons/fa";

/* ==========================================================================
   Footer
   Background photo: save footer.jpg into your /public folder (it is referenced as "/footer.jpg").
   Same system as the other sections: Arial, gold accent, columns that rise in
   when the footer scrolls into view, and a photo that slowly settles from a slight zoom.
   ========================================================================== */

const PHOTO = "images/places/footer.jpg";

const STYLES = `
.ft-root{
  --ink:#0b2417; --gold:#e2bd75; --ease:cubic-bezier(.22,1,.36,1);
  position:relative; isolation:isolate; overflow:hidden; color:#fff; background:var();
  font-family:Arial,Helvetica,sans-serif;
}
.ft-root *{ font-family:inherit; }
.ft-root :focus-visible{ outline:3px solid var(--gold); outline-offset:3px; border-radius:10px; }

/* photo + readability tint */
.ft-bg{ position:absolute; inset:0; z-index:-2; background:var(--ink) url('${PHOTO}') center 42% / cover no-repeat;
  transform:scale(1.14); transition:transform 3s cubic-bezier(.16,1,.3,1); }
.ft-in .ft-bg{ transform:scale(1); }
.ft-shade{ position:absolute; inset:0; z-index:-1;
  background:linear-gradient(180deg, rgba(8,24,16,.5) 0%, rgba(8,24,16,.68) 40%, rgba(8,24,16,.92) 100%); }

.ft-inner{ padding-top:88px; padding-bottom:28px; }
.ft-grid{ display:grid; gap:48px; grid-template-columns:1.5fr 1fr 1fr 1.3fr; }

/* columns rise in, one after another */
.ft-col{ opacity:0; }
.ft-in .ft-col{ animation:ft-up .9s var(--ease) both; animation-delay:calc(.15s + var(--i) * .13s); }
@keyframes ft-up{ from{ opacity:0; transform:translateY(28px) } to{ opacity:1; transform:none } }

.ft-brand{ margin:0; font-size:clamp(30px,4vw,38px); font-weight:700; letter-spacing:-.03em; line-height:1.05; }
.ft-bar{ display:block; width:56px; height:4px; margin-top:18px; border-radius:4px; background:var(--gold);
  transform:scaleX(0); transform-origin:left; transition:transform .8s var(--ease) .9s; }
.ft-in .ft-bar{ transform:scaleX(1); }
.ft-about{ margin:20px 0 0; max-width:24rem; font-size:15px; line-height:1.75; color:rgba(255,255,255,.78); }

.ft-social{ display:flex; gap:12px; margin-top:26px; }
.ft-social a{ display:grid; place-items:center; width:44px; height:44px; border-radius:50%; color:#fff; text-decoration:none;
  background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.28); backdrop-filter:blur(6px);
  transition:background .25s, color .25s, transform .3s var(--ease), border-color .25s; }
.ft-social a:hover{ background:#fff; color:var(--ink); border-color:#fff; transform:translateY(-4px); }

.ft-h{ margin:0; font-size:15px; font-weight:700; color:var(--gold); }
.ft-list{ display:flex; flex-direction:column; gap:14px; margin-top:20px; font-size:15px; }
.ft-link{ width:fit-content; padding-bottom:3px; color:rgba(255,255,255,.8); text-decoration:none;
  background:linear-gradient(var(--gold),var(--gold)) 0 100% / 0 1.5px no-repeat;
  transition:background-size .35s var(--ease), color .25s, transform .3s var(--ease); }
.ft-link:hover{ color:#fff; background-size:100% 1.5px; transform:translateX(4px); }
.ft-contact{ display:flex; align-items:center; gap:12px; color:rgba(255,255,255,.8); }
.ft-contact svg{ flex-shrink:0; color:var(--gold); }

.ft-bottom{ display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:16px; margin-top:64px; padding-top:24px;
  border-top:1px solid rgba(255,255,255,.2); font-size:14px; color:rgba(255,255,255,.7); }
.ft-top{ display:inline-flex; align-items:center; gap:8px; padding:10px 18px; border-radius:999px; font-size:13px; font-weight:700; color:#fff; cursor:pointer;
  background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.28); backdrop-filter:blur(6px);
  transition:background .25s, color .25s, border-color .25s, transform .2s var(--ease); }
.ft-top svg{ transition:transform .35s var(--ease); }
.ft-top:hover{ background:#fff; color:var(--ink); border-color:#fff; }
.ft-top:hover svg{ transform:translateY(-3px); }
.ft-top:active{ transform:scale(.96); }

@media (max-width:1023px){
  .ft-grid{ grid-template-columns:1fr 1fr; gap:40px; }
  .ft-inner{ padding-top:72px; }
}
@media (max-width:639px){
  .ft-grid{ grid-template-columns:1fr; gap:36px; }
  .ft-inner{ padding-top:60px; }
  .ft-bottom{ margin-top:48px; }
}
@media (prefers-reduced-motion:reduce){
  .ft-col{ opacity:1 !important; animation:none !important; }
  .ft-bg{ transform:none !important; transition:none !important; }
  .ft-bar{ transform:none !important; transition:none !important; }
}
`;

export default function Footer() {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  // Start the entrance the first time the footer is on screen
  useEffect(() => {
    const el = ref.current;
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
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <footer ref={ref} className={`ft-root ${inView ? "ft-in" : ""}`}>
      <style>{STYLES}</style>
      <div className="ft-bg" aria-hidden />
      <div className="ft-shade" aria-hidden />

      <div className="container-main ft-inner">
        <div className="ft-grid">
          {/* Brand */}
          <div className="ft-col" style={{ ["--i" as string]: 0 }}>
            <h2 className="ft-brand">Hidden Lanka</h2>
            <span className="ft-bar" aria-hidden />

            <p className="ft-about">
              Discover the places, people and stories that make Sri Lanka unforgettable.
            </p>

            {/* Social Media */}
            <div className="ft-social">
              <a href="#" aria-label="Instagram">
                <FaInstagram size={18} />
              </a>
              <a href="#" aria-label="Facebook">
                <FaFacebookF size={18} />
              </a>
              <a href="#" aria-label="Twitter">
                <FaTwitter size={18} />
              </a>
            </div>
          </div>

          {/* Explore */}
          <div className="ft-col" style={{ ["--i" as string]: 1 }}>
            <h3 className="ft-h">Explore</h3>
            <div className="ft-list">
              <Link href="/places" className="ft-link">
                All Places
              </Link>
              <Link href="/map" className="ft-link">
                Explore Map
              </Link>
              <Link href="/community" className="ft-link">
                Community
              </Link>
              <Link href="/places/new" className="ft-link">
                Add a Place
              </Link>
            </div>
          </div>

          {/* Categories */}
          <div className="ft-col" style={{ ["--i" as string]: 2 }}>
            <h3 className="ft-h">Categories</h3>
            <div className="ft-list">
              <Link href="/places?category=beaches" className="ft-link">
                Beaches
              </Link>
              <Link href="/places?category=waterfalls" className="ft-link">
                Waterfalls
              </Link>
              <Link href="/places?category=temples" className="ft-link">
                Temples
              </Link>
              <Link href="/places?category=wildlife" className="ft-link">
                Wildlife
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div className="ft-col" style={{ ["--i" as string]: 3 }}>
            <h3 className="ft-h">Contact</h3>
            <div className="ft-list">
              <div className="ft-contact">
                <MapPin size={18} />
                <span>Sri Lanka</span>
              </div>

              <a href="mailto:hello@hiddenlanka.com" className="ft-contact ft-link" style={{ display: "flex" }}>
                <Mail size={18} />
                <span>hello@hiddenlanka.com</span>
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="ft-bottom">
          <span>© {new Date().getFullYear()} Hidden Lanka Explorer. All rights reserved.</span>

          <button
            type="button"
            className="ft-top"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Back to top <ArrowUp size={15} aria-hidden />
          </button>
        </div>
      </div>
    </footer>
  );
}
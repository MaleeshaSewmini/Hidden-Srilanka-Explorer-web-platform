"use client";

import Link from "next/link";
import { Compass, Menu, Search, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const isHomePage = pathname === "/";

  useEffect(() => {
    const supabase = createClient();

    async function syncAuthState() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsSignedIn(Boolean(user));
    }

    void syncAuthState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(Boolean(session?.user));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b border-[#173b2c]/10 text-black shadow-md shadow-[#0b2417]/10 backdrop-blur-md transition-[background-color,border-radius] ${
        isHomePage
          ? "-mb-16 bg-white/75"
          : "bg-white/95"
      } ${open ? "rounded-b-3xl" : "rounded-b-xl"}`}
    >
      <div className="container-main">
        <div className="flex h-15 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#173b2c] text-[#f1cf88]">
              <img src ="images/logo/Logo.png"/>
            </span>

            <span className="font-display text-xl sm:text-3xl">
              Hidden Lanka Explorer
            </span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            <Link href="/places" className="text-base hover:text-[black]">
              Explore
            </Link>

            <Link href="/map" className="text-base hover:text-[black]">
              Map
            </Link>

            <Link href="/community" className="text-base hover:text-[black]">
              Community
            </Link>

            <Link
              href="/places/new"
              className="rounded-full border border-[#c99a43]/60 px-4 py-2 text-base text-[black] transition hover:bg-[#c99a43] hover:text-[#0b2417]"
            >
              + Add Place
            </Link>
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <Link
    href="/places"
    className="group relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10"
  >
    <Search size={18} />

       <span className="pointer-events-none absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#0b2417] px-3 py-1.5 text-sm font-medium text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
      Search
      </span>
        </Link>
            {isSignedIn ? (
             <Link
       href="/profile"
      aria-label="Open profile"
          className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
>
      <User size={18} />

     <span className="pointer-events-none absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#0b2417] px-3 py-1.5 text-sm font-medium text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
        Profile
      </span>
     </Link>
            ) : (
              <Link
                href="/auth/sign-in"
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#0b2417] hover:bg-[#f1cf88]"
              >
                Sign In
              </Link>
            )}
          </div>

          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setOpen((value) => !value)}
            className="rounded-lg p-2 hover:bg-white/10 lg:hidden"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>

        {open && (
          <div className="border-t border-white/10 py-4 lg:hidden">
            <nav className="flex flex-col gap-2">
              <Link
                href="/places"
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 hover:bg-white/10"
              >
                Explore
              </Link>

              <Link
                href="/map"
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 hover:bg-white/10"
              >
                Map
              </Link>

              <Link
                href="/community"
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 hover:bg-white/10"
              >
                Community
              </Link>

              <Link
                href="/places/new"
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-[#f1cf88] hover:bg-white/10"
              >
                + Add Place
              </Link>

              {isSignedIn ? (
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-[#f5ead7]"
                >
                  <User size={18} />
                  Profile
                </Link>
              ) : (
                <Link
                  href="/auth/sign-in"
                  onClick={() => setOpen(false)}
                  className="mt-2 rounded-xl bg-white px-4 py-3 text-center font-medium text-[#0b2417]"
                >
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
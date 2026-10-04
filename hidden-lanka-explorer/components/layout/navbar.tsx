"use client";

import Link from "next/link";
import { Compass, Menu, Search, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#304b61] bg-[#172b3d] text-[#f5ead7] shadow-lg">
      <div className="container-main">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#173b2c] text-[#f1cf88]">
              <Compass size={20} />
            </span>

            <span className="font-display text-xl sm:text-2xl">
              Hidden Lanka
            </span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            <Link href="/places" className="text-sm hover:text-[#c99a43]">
              Explore
            </Link>

            <Link href="/map" className="text-sm hover:text-[#c99a43]">
              Map
            </Link>

            <Link href="/community" className="text-sm hover:text-[#c99a43]">
              Community
            </Link>

            <Link
              href="/places/new"
              className="rounded-full border border-[#c99a43]/60 px-4 py-2 text-sm text-[#f1cf88] transition hover:bg-[#c99a43] hover:text-[#0b2417]"
            >
              + Add Place
            </Link>
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <Link
              href="/places"
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10"
            >
              <Search size={18} />
            </Link>

            <Link
              href="/auth/sign-in"
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#0b2417] hover:bg-[#f1cf88]"
            >
              Sign In
            </Link>
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

              <Link
                href="/auth/sign-in"
                onClick={() => setOpen(false)}
                className="mt-2 rounded-xl bg-white px-4 py-3 text-center font-medium text-[#0b2417]"
              >
                Sign In
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
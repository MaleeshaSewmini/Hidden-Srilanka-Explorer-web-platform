
"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function SriLankaMark({
  className = "h-7 w-7",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="currentColor"
      role="img"
      aria-label="Sri Lanka"
    >
      <path d="M35 2 C31 4 30 8 28 11 L23 16 C21 19 20 23 17 27 C15 30 14 34 16 38 C18 41 21 44 23 48 C26 53 29 58 33 62 C36 60 38 56 40 52 C43 47 45 42 47 38 C50 34 52 30 53 26 C54 22 51 18 49 14 L44 7 C42 4 39 2 35 2Z" />
    </svg>
  );
}

export default function SignInPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setBusy(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.replace("/");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not sign in."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleSignIn() {
    setMessage("");
    setGoogleBusy(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/`,
        },
      });

      if (error) throw error;
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not sign in with Google."
      );

      setGoogleBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f7f2] px-4 py-8 sm:px-6 lg:py-10">

      {/* Soft light background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(
              ellipse at 10% 10%,
              rgba(167, 243, 208, 0.25),
              transparent 35%
            ),
            radial-gradient(
              ellipse at 90% 90%,
              rgba(253, 230, 138, 0.18),
              transparent 30%
            ),
            linear-gradient(
              135deg,
              #f5f7f2 0%,
              #f9faf6 55%,
              #edf5ee 100%
            )
          `,
        }}
      />

      {/* Main Layout */}
      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-2 lg:gap-12">

        {/* LEFT SIDE: Destination Image */}
        <section className="relative min-h-[280px] overflow-hidden rounded-[28px] border border-white shadow-xl shadow-emerald-950/10 sm:min-h-[340px] lg:min-h-[650px]">

          {/* Your local image */}
          <Image
            src="/images/places/Sri Lanka.jpg"
            alt="A beautiful hidden destination in Sri Lanka"
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover object-center"
          />

          {/* Light gradient overlay for text readability */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/10 to-white/95"
          />

          {/* Subtle decorative circles */}
          <div
            aria-hidden="true"
            className="absolute -right-20 top-20 h-64 w-64 rounded-full border border-white/50"
          />

          <div
            aria-hidden="true"
            className="absolute -right-12 top-28 h-48 w-48 rounded-full border border-white/40"
          />

          {/* Brand */}
          <Link
            href="/"
            className="absolute left-5 right-5 top-5 z-10 flex items-center gap-3 sm:left-7 sm:top-7"
          >
            

            <div>
              <p className="text-lg font-bold tracking-tight text-[#163b2a]">
                Hidden Sri Lanka
              </p>

              <p className="text-xs font-semibold tracking-[0.22em] text-emerald-800">
                EXPLORER
              </p>
            </div>
          </Link>

          {/* Introduction at the bottom */}
          <div className="absolute inset-x-0 bottom-0 z-10 p-6 sm:p-9 lg:p-10">

            

            <h1 className="max-w-xl text-3xl font-bold leading-tight tracking-tight text- black sm:text-4xl xl:text-5xl">
              Find the places
              <span className="mt-1 block text-black">
                others never find.
              </span>
            </h1>

           

            {/* Feature tags */}
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full border border-emerald-900/10 bg-white/100 px-3 py-2 text-base font-medium text-[#234735] backdrop-blur-md">
                Discover places
              </span>

              <span className="rounded-full border border-emerald-900/10 bg-white/100 px-3 py-2 text-base font-medium text-[#234735] backdrop-blur-md">
                Save your trips
              </span>

              <span className="rounded-full border border-emerald-900/10 bg-white/100 px-3 py-2 text-base font-medium text-[#234735] backdrop-blur-md">
                Explore locally
              </span>
            </div>
          </div>
        </section>

        {/* RIGHT SIDE: Sign-In Form */}
        <section className="mx-auto w-full max-w-md">

          {/* Mobile Brand */}
          <Link
            href="/"
            className="mb-6 flex items-center justify-center gap-3 lg:hidden"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-800/10 bg-white text-emerald-800 shadow-sm">
              <SriLankaMark />
            </div>

            <div>
              <p className="font-bold text-[#173b2a]">
                Hidden Sri Lanka
              </p>

              <p className="text-xs font-semibold tracking-[0.2em] text-emerald-700">
                EXPLORER
              </p>
            </div>
          </Link>

          {/* White Sign-In Card */}
          <div className="rounded-[28px] border border-gray-200/80 bg-white p-7 shadow-xl shadow-emerald-950/[0.06] sm:p-9">

            {/* Heading */}
            <div className="mb-8">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-7 w-7 text-emerald-800"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z"
                  />
                  <circle cx="12" cy="10" r="2.2" />
                </svg>
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-[#173b2a]">
                Welcome back
              </h2>

              <p className="mt-3 text-sm leading-6 text-gray-600">
                Sign in to continue your journey and access your
                saved trips and favourite places.
              </p>
            </div>

            {/* Sign-In Form */}
            <form className="space-y-5" onSubmit={handleSubmit}>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-gray-200 bg-[#f9faf8] px-4 py-3.5 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 hover:border-emerald-300 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                />
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Password
                  </label>

                  <Link
                    href="/auth/forgot-password"
                    className="text-xs font-semibold text-emerald-700 transition hover:text-emerald-900 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-gray-200 bg-[#f9faf8] px-4 py-3.5 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 hover:border-emerald-300 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                />
              </div>

              {/* Authentication Error */}
              {message && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {message}
                </p>
              )}

              {/* Sign-In Button */}
              <button
                type="submit"
                disabled={busy || googleBusy}
                className="w-full rounded-xl bg-[#176b45] px-4 py-3.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#125738] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? "Signing in..." : "Sign In"}
              </button>

              {/* Separator */}
              <div className="flex items-center gap-4 py-1">
                <div className="h-px flex-1 bg-gray-200" />

                <span className="text-xs font-medium tracking-wider text-gray-400">
                  OR CONTINUE WITH
                </span>

                <div className="h-px flex-1 bg-gray-200" />
              </div>

              {/* Google Sign-In */}
              <button
                type="button"
                onClick={() => void handleGoogleSignIn()}
                disabled={busy || googleBusy}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {!googleBusy && (
                  <svg
                    viewBox="0 0 48 48"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
                      transform="translate(0 4)"
                    />

                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.15 46.98 31.95 46.98 24.55Z"
                    />

                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59A14.4 14.4 0 0 1 9.77 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.86.93 7.49 2.56 10.78l7.97-6.19Z"
                      transform="translate(1 0)"
                    />

                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
                    />
                  </svg>
                )}

                {googleBusy
                  ? "Connecting to Google..."
                  : "Continue with Google"}
              </button>
            </form>

            {/* Sign-Up Link */}
            <p className="mt-8 text-center text-sm text-gray-600">
              Don&apos;t have an account?{" "}

              <Link
                href="/auth/sign-up"
                className="font-bold text-emerald-700 transition hover:text-emerald-900 hover:underline"
              >
                Create an account
              </Link>
            </p>

            {/* Bottom Accent */}
            <div className="mx-auto mt-7 h-1 w-12 rounded-full bg-gradient-to-r from-emerald-600 to-amber-400" />
          </div>

          <p className="mt-5 text-center text-base tracking-wide text-black-500">
            -DISCOVER THE BEAUTY OF SRI LANKA-
          </p>
        </section>
      </div>
    </main>
  );
}
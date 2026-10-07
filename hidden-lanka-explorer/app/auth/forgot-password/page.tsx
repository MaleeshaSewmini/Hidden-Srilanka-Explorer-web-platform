"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setBusy(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
        },
      );

      if (resetError) throw resetError;
      setMessage("If an account exists for this email, a password reset link has been sent.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not send the password reset email.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Reset your password</h1>
        <p className="mt-2 text-sm text-gray-600">
          Enter the email address on your account and we’ll send you a reset link.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
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
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          {message ? <p role="status" className="text-sm text-emerald-800">{message}</p> : null}
          {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-emerald-700 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
          >
            {busy ? "Sending link..." : "Send reset link"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Remembered your password?{" "}
          <Link href="/auth/sign-in" className="font-medium text-emerald-700 hover:underline">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}

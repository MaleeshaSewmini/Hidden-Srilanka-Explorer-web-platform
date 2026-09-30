"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

export default function JoinCommunity() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) return;

    setSubmitted(true);
  }

  return (
    <section className="section-padding bg-[#0b2417] text-white">
      <div className="container-main">
        <div className="mx-auto max-w-3xl text-center">
          {!submitted ? (
            <>
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-[#f1cf88]">
                Join the community
              </div>

              <h2 className="mt-4 font-display text-5xl sm:text-6xl">
                There&apos;s more to Sri Lanka than the places you already know.
              </h2>

              <p className="mx-auto mt-5 max-w-2xl leading-7 text-white/60">
                Get new hidden places, community stories and seasonal ideas
                delivered to your inbox.
              </p>

              <form
                onSubmit={handleSubmit}
                className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Your email address"
                  className="min-w-0 flex-1 rounded-2xl bg-white px-5 py-4 text-[#17231c] outline-none"
                />

                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 rounded-2xl bg-[#c99a43] px-6 py-4 font-semibold text-[#0b2417]"
                >
                  Join
                  <ArrowRight size={18} />
                </button>
              </form>
            </>
          ) : (
            <div className="py-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#c99a43] text-[#0b2417]">
                <Check />
              </div>

              <h2 className="mt-6 font-display text-5xl">
                You&apos;re on the list.
              </h2>

              <p className="mt-4 text-white/60">
                We&apos;ll send the next hidden destination your way.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
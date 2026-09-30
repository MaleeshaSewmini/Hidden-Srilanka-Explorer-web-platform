"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Upload, MapPin, Sparkles, Check, Info } from "lucide-react";

const CATEGORIES = [
  "Nature",
  "Temples",
  "Beaches",
  "Wildlife",
  "Waterfalls",
  "Ruins",
  "Villages",
  "Caves",
];

const DISTRICTS = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo",
  "Galle", "Gampaha", "Hambantota", "Jaffna", "Kalutara",
  "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar",
  "Matale", "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya",
  "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"
];

export default function PlaceSubmitForm() {
  const [formData, setFormData] = useState({
    name: "Gal Vihara Secluded Hermitage",
    category: "Temples",
    district: "Polonnaruwa",
    description: "An untouched rock hermitage hidden beneath dense jungle canopy, accessible via a footpath.",
    hiddenTips: "Best visited at 6:00 AM before mist clears. Remove footwear at stone boundary.",
    difficulty: "Moderate",
    season: "Year-Round",
    imageUrl: "https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1200&q=80",
    latitude: "7.9403",
    longitude: "81.0188",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-10 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#c99a43]/15 px-3.5 py-1 text-xs font-semibold text-[#a06a1d]">
          <Sparkles size={14} /> Contributor Hub
        </span>
        <h1 className="mt-3 font-serif text-3xl font-bold text-[#0b2417] sm:text-4xl">
          Contribute a Hidden Gem
        </h1>
        <p className="mt-2 text-sm text-[#61746a]">
          Your contributions help travellers discover authentic, respectful Sri Lankan experiences.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* Form Column */}
        <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-7 rounded-3xl border border-[#0b2417]/10 bg-white p-7 shadow-sm">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#0b2417]">
              Place Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#0b2417] focus:outline-none"
              placeholder="e.g. Hidden Waterfall of Bambarakanda Valley"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#0b2417]">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-[#0b2417] focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#0b2417]">
                District
              </label>
              <select
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-[#0b2417] focus:outline-none"
              >
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#0b2417]">
                Latitude
              </label>
              <input
                type="text"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-[#0b2417] focus:outline-none"
                placeholder="6.9271"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#0b2417]">
                Longitude
              </label>
              <input
                type="text"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-[#0b2417] focus:outline-none"
                placeholder="79.8612"
              />
            </div>
          </div>

          {/* Image URL / Photo Link */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#0b2417]">
              Image URL / Photo Link
            </label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#0b2417] focus:outline-none"
              placeholder="https://images.unsplash.com/..."
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#0b2417]">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-[#0b2417] focus:outline-none"
            />
          </div>

          {/* Hidden Gem Advice */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#0b2417]">
              Insider / Hidden Gem Tips
            </label>
            <textarea
              rows={2}
              value={formData.hiddenTips}
              onChange={(e) => setFormData({ ...formData, hiddenTips: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-[#0b2417] focus:outline-none"
              placeholder="E.g. Take the right fork near the banyan tree; ask villager Sunil for trail guidance."
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-[#0b2417] py-3.5 text-sm font-semibold text-white transition hover:bg-[#163c28]"
          >
            Publish Hidden Place Card
          </button>
        </form>

        {/* Live Card Preview Column */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#718078]">
              <Info size={14} /> Live Card Insertion Preview
            </div>

            <article className="overflow-hidden rounded-3xl border border-[#0b2417]/10 bg-white shadow-xl">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                {formData.imageUrl ? (
                  <Image
                    src={formData.imageUrl}
                    alt={formData.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">
                    <Upload size={32} />
                  </div>
                )}
                <div className="absolute left-4 top-4 rounded-full bg-[#0b2417]/85 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                  {formData.category}
                </div>
                <div className="absolute right-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-[#0b2417] shadow-sm">
                  ★ 5.0 (New)
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-1 text-xs text-[#718078]">
                  <MapPin size={14} className="text-[#a06a1d]" />
                  <span>{formData.district} District</span>
                  <span>•</span>
                  <span>{formData.season}</span>
                </div>

                <h3 className="mt-2 font-serif text-2xl text-[#0b2417]">
                  {formData.name || "Untitled Hidden Place"}
                </h3>

                <p className="mt-2 line-clamp-2 text-xs text-[#61746a] leading-relaxed">
                  {formData.description || "Describe what makes this place special..."}
                </p>

                {formData.hiddenTips && (
                  <div className="mt-4 rounded-xl bg-[#f7f4ee] p-3 text-xs text-[#4b5d53] border-l-2 border-[#c99a43]">
                    <span className="font-semibold text-[#0b2417]">Insider Tip: </span>
                    {formData.hiddenTips}
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between border-t border-[#0b2417]/10 pt-4 text-xs text-[#718078]">
                  <span>Difficulty: <strong className="text-[#0b2417]">{formData.difficulty}</strong></span>
                  <span className="rounded-full bg-[#0b2417]/5 px-2.5 py-1 font-mono text-[11px]">
                    {formData.latitude}, {formData.longitude}
                  </span>
                </div>
              </div>
            </article>

            {submitted && (
              <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-xs font-medium text-emerald-800 border border-emerald-200">
                <Check size={16} /> Place successfully prepared! Contributor score +10.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

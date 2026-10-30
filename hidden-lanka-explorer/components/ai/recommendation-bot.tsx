"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  Compass,
  MapPin,
  Star,
  Bookmark,
  Check,
  ArrowRight,
  ExternalLink,
  Bot,
} from "lucide-react";
import { useTrip } from "@/lib/trip-context";
import type { PlaceRecommendation } from "@/lib/ai/knowledge-base";

type Message = {
  id: string;
  sender: "user" | "ai";
  text: string;
  places?: PlaceRecommendation[];
  timestamp: string;
};

const SUGGESTED_PROMPTS = [
  "🌊 Quiet hidden beaches with gentle waves",
  "💧 Secret waterfalls with natural swimming pools",
  "🥾 Best offbeat day hikes in the Central Highlands",
  "🛕 Ancient sacred ruins deep in the forest",
  "🐘 Best place to spot wildlife without crowded jeeps",
];

export default function RecommendationBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hook into trip context for saving places
  const tripContext = useTrip();

  // Initial welcome message
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        sender: "ai",
        text: "Ayubowan! 🙏 I'm your **Lanka AI Guide**, specialized in discovering Sri Lanka's untold places, secluded waterfalls, secret beaches, and mountain trails.\n\nTell me your travel style, region, or who you're traveling with — or click a suggestion below!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-ai-bot", handleOpen);
    return () => window.removeEventListener("open-ai-bot", handleOpen);
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isLoading]);

  const handleSend = async (userPrompt?: string) => {
    const textToSend = userPrompt || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend }),
      });

      const data = await res.json();

      if (res.ok && data.reply) {
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: data.reply,
          places: data.places || [],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        throw new Error(data.error || "Failed to get response");
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: "ai",
          text: "I couldn't reach the travel engine right now, but feel free to explore our curated places on the Explore page or try again in a moment!",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: "welcome-reset",
        sender: "ai",
        text: "Ayubowan! 🙏 Chat reset. Where in Sri Lanka would you like to explore next?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <>
      {/* ========================================================
          FLOATING AI BUTTON (Bottom Left to complement A11y on Right)
      ======================================================== */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Travel Guide"
          title="Ask Lanka AI Guide"
          className="fixed bottom-6 left-6 z-[9990] flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#173b2c] via-[#22573f] to-[#123b26] px-4 py-3.5 text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-emerald-900/40 active:scale-95 cursor-pointer border border-[#c99a43]/40 group"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f1cf88]/20 text-[#f1cf88] transition group-hover:rotate-12">
            <Sparkles size={16} />
          </span>
          <span className="font-semibold text-sm tracking-tight text-[#f5ead7]">
            Ask AI Guide
          </span>
          <span className="flex h-2 w-2 rounded-full bg-[#f1cf88] animate-pulse" />
        </button>
      )}

      {/* ========================================================
          AI CHAT DRAWER / POPUP
      ======================================================== */}
      {isOpen && (
        <div className="fixed inset-x-3 bottom-3 sm:inset-auto sm:bottom-6 sm:left-6 z-[9995] flex flex-col w-auto sm:w-[430px] h-[610px] max-h-[88vh] rounded-[28px] border border-slate-200/90 bg-white text-slate-900 shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-[#123b26] via-[#1a4a33] to-[#172b3d] px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 border border-white/20 text-[#f1cf88]">
                <Bot size={22} />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#123b26] bg-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-base tracking-tight flex items-center gap-1.5 text-white">
                  Lanka AI Guide
                  <Sparkles size={14} className="text-[#f1cf88]" />
                </h3>
                <p className="text-[11px] font-medium text-emerald-200/90">
                  Hidden Sri Lanka Explorer Specialist
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={resetChat}
                title="Restart chat"
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white transition cursor-pointer"
              >
                <RotateCcw size={15} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close AI Guide"
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/60 text-sm">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                {/* Bubble */}
                <div
                  className={`max-w-[88%] rounded-2xl p-3.5 leading-relaxed shadow-xs ${
                    msg.sender === "user"
                      ? "bg-[#173b2c] text-white rounded-br-xs"
                      : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs"
                  }`}
                >
                  <div className="whitespace-pre-line text-sm">{msg.text}</div>

                  {/* Recommendation Cards if attached */}
                  {msg.places && msg.places.length > 0 && (
                    <div className="mt-3.5 space-y-2.5 pt-2 border-t border-slate-100">
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-[#a77a2f]">
                        ✨ Recommended Places
                      </span>

                      {msg.places.map((place) => {
                        const inTrip = tripContext?.isPlaceInTrip(place.id) || false;

                        return (
                          <div
                            key={place.id}
                            className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-[#faf8f5] transition hover:shadow-md"
                          >
                            <div className="relative h-28 w-full overflow-hidden bg-slate-200">
                              <Image
                                src={place.image}
                                alt={place.name}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                              <div className="absolute top-2 left-2 flex gap-1.5">
                                <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-[#f1cf88] backdrop-blur-xs">
                                  {place.category}
                                </span>
                              </div>

                              <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-amber-300 backdrop-blur-xs">
                                <Star size={11} className="fill-amber-400 text-amber-400" />
                                {place.rating}
                              </div>

                              <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-white">
                                <span className="flex items-center gap-1 text-[11px] font-medium text-white/90">
                                  <MapPin size={11} className="text-[#f1cf88]" />
                                  {place.district}
                                </span>
                              </div>
                            </div>

                            <div className="p-3">
                              <h4 className="font-bold text-sm text-slate-900 group-hover:text-[#173b2c] transition-colors">
                                {place.name}
                              </h4>

                              <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-normal">
                                {place.description}
                              </p>

                              {place.matchReason && (
                                <p className="mt-1.5 text-[11px] text-[#a77a2f] font-medium flex items-center gap-1">
                                  <span>💡</span>
                                  <span>{place.matchReason}</span>
                                </p>
                              )}

                              <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                                <Link
                                  href={`/places?search=${encodeURIComponent(place.name)}`}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#173b2c] hover:underline"
                                >
                                  View on Places
                                  <ExternalLink size={12} />
                                </Link>

                                {tripContext && (
                                  <button
                                    type="button"
                                    onClick={() => tripContext.toggleTrip(place.id)}
                                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                                      inTrip
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                                    }`}
                                  >
                                    {inTrip ? (
                                      <>
                                        <Check size={12} className="text-emerald-600" />
                                        In Trip
                                      </>
                                    ) : (
                                      <>
                                        <Bookmark size={12} />
                                        Save
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <span className="mt-1 text-[10px] text-slate-400 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 text-slate-500 bg-white border border-slate-200 p-3 rounded-2xl w-fit shadow-xs">
                <Compass size={16} className="animate-spin text-[#173b2c]" />
                <span className="text-xs font-medium text-slate-600">
                  Lanka AI is scouting hidden spots...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions if few messages */}
          {messages.length <= 2 && (
            <div className="border-t border-slate-100 bg-white px-3 py-2">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Suggested questions
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSend(prompt)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-[#173b2c] hover:bg-[#173b2c]/5 transition cursor-pointer text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 border-t border-slate-200 bg-white p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask: '3 days in Ella', 'Secret waterfalls'..."
              className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#173b2c] focus:bg-white transition"
              disabled={isLoading}
            />

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#173b2c] text-white shadow-xs transition hover:bg-[#123b26] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

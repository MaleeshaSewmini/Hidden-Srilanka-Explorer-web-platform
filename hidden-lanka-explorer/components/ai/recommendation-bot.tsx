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
  ExternalLink,
  Bot,
} from "lucide-react";
import { useTrip } from "@/lib/trip-context";
import type {
  ConversationTurn,
  PlaceRecommendation,
  RecommendationResponse,
} from "@/lib/ai/knowledge-base";

type Message = {
  id: string;
  sender: "user" | "ai";
  text: string;
  places?: PlaceRecommendation[];
  timestamp: string;
};

/* Modern classic type: Arial everywhere, pure black text */
const FONT_STACK = 'Arial, "Helvetica Neue", Helvetica, sans-serif';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPlaceRecommendation(value: unknown): value is PlaceRecommendation {
  if (!isRecord(value)) return false;

  const nullableString = (item: unknown) => item === null || typeof item === "string";
  const nullableNumber = (item: unknown) =>
    item === null || (typeof item === "number" && Number.isFinite(item));

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.slug === "string" &&
    nullableString(value.category) &&
    nullableString(value.district) &&
    nullableString(value.description) &&
    nullableString(value.image) &&
    nullableNumber(value.rating) &&
    nullableNumber(value.reviews) &&
    nullableString(value.difficulty) &&
    nullableString(value.season) &&
    nullableString(value.safetyTips) &&
    Array.isArray(value.activities) &&
    value.activities.every((activity) => typeof activity === "string") &&
    nullableString(value.insiderTip)
  );
}

function isRecommendationResponse(value: unknown): value is RecommendationResponse {
  return (
    isRecord(value) &&
    typeof value.reply === "string" &&
    Array.isArray(value.recommendedDestinationIds) &&
    value.recommendedDestinationIds.every((id) => typeof id === "string") &&
    Array.isArray(value.places) &&
    value.places.every(isPlaceRecommendation)
  );
}

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
        text: "Ayubowan! 🙏 I'm your Lanka AI Guide, specialized in discovering Sri Lanka's untold places, secluded waterfalls, secret beaches, and mountain trails.\n\nTell me your travel style, region, or who you're traveling with — or click a suggestion below!",
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
    const textToSend = (userPrompt || input).trim();
    if (!textToSend || isLoading) return;

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
      const history: ConversationTurn[] = messages
        .filter(
          (message) =>
            !message.id.startsWith("welcome") &&
            !message.id.startsWith("ai-err-")
        )
        .slice(-8)
        .map((message): ConversationTurn => ({
          role: message.sender === "ai" ? "assistant" : "user",
          content: message.text,
        }));

      const res = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend, history }),
      });

      let data: unknown;
      try {
        data = await res.json();
      } catch {
        throw new Error("The recommendation service returned an invalid response.");
      }

      if (res.ok && isRecommendationResponse(data)) {
        const recommendedIds = new Set(data.recommendedDestinationIds);
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: data.reply,
          places: data.places.filter((place) => recommendedIds.has(place.id)),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        const errorMessage =
          isRecord(data) && typeof data.error === "string"
            ? data.error
            : "The recommendation service returned an invalid response.";
        throw new Error(errorMessage);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: "ai",
          text:
            error instanceof Error
              ? error.message
              : "The recommendation service is temporarily unavailable. Please try again.",
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
          FLOATING AI BUTTON
      ======================================================== */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Travel Guide"
          title="Ask Lanka AI Guide"
          style={{ fontFamily: FONT_STACK }}
          className="fixed bottom-6 left-6 z-[9990] flex cursor-pointer items-center gap-3 rounded-full border-2 border-black bg-white px-5 py-3.5 text-black shadow-[0_6px_20px_rgba(0,0,0,0.18)] transition duration-200 hover:bg-black hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black active:scale-95"
        >
          <Sparkles size={20} aria-hidden />
          <span className="text-base font-bold">Ask AI Guide</span>
        </button>
      )}

      {/* ========================================================
          AI CHAT DRAWER / POPUP
      ======================================================== */}
      {isOpen && (
        <div
          style={{ fontFamily: FONT_STACK }}
          className="fixed inset-x-3 bottom-3 z-[9995] flex h-[680px] max-h-[90vh] w-auto flex-col overflow-hidden rounded-2xl border-2 border-black bg-white text-black shadow-[0_16px_48px_rgba(0,0,0,0.28)] sm:inset-auto sm:bottom-6 sm:left-6 sm:w-[460px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-black bg-white px-5 py-4 text-black">
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-full border-2 border-black bg-white text-black">
                <Bot size={24} />
                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-black" />
              </div>
              <div>
                <h3 className="flex items-center gap-1.5 text-xl font-bold text-black">
                  Lanka AI Guide
                  <Sparkles size={16} className="text-black" />
                </h3>
                <p className="text-sm text-black">Hidden Sri Lanka explorer</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={resetChat}
                title="Restart chat"
                aria-label="Restart chat"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-black transition hover:bg-black hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-black"
              >
                <RotateCcw size={18} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close AI Guide"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-black transition hover:bg-black hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-black"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 space-y-5 overflow-y-auto bg-[#f5f5f5] p-4 text-base text-black">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                {/* Bubble */}
                <div
                  className={`max-w-[92%] rounded-2xl border p-4 text-base leading-relaxed text-black ${
                    msg.sender === "user"
                      ? "rounded-br-sm border-black bg-[#e4e4e4]"
                      : "rounded-bl-sm border-[#c8c8c8] bg-white"
                  }`}
                >
                  <div className="whitespace-pre-line text-base text-black">{msg.text}</div>

                  {/* Recommendation Cards if attached */}
                  {msg.places && msg.places.length > 0 && (
                    <div className="mt-4 space-y-3 border-t border-black pt-3">
                      <span className="block text-base font-bold text-black">
                        Recommended places
                      </span>

                      {msg.places.map((place) => {
                        const inTrip = tripContext?.isPlaceInTrip(place.id) || false;

                        return (
                          <div
                            key={place.id}
                            className="group flex flex-col overflow-hidden rounded-xl border border-black bg-white transition hover:shadow-md"
                          >
                            <div className="relative h-36 w-full overflow-hidden bg-[#e4e4e4]">
                              {place.image ? (
                                <Image
                                  src={place.image}
                                  alt={place.name}
                                  fill
                                  unoptimized
                                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center bg-[#e4e4e4] text-black">
                                  <MapPin size={28} aria-hidden />
                                </div>
                              )}

                              {place.category && (
                                <div className="absolute left-2 top-2 flex gap-1.5">
                                  <span className="rounded-full border border-black bg-white px-2.5 py-1 text-sm font-bold text-black">
                                    {place.category}
                                  </span>
                                </div>
                              )}

                              {place.rating !== null && (
                                <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full border border-black bg-white px-2.5 py-1 text-sm font-bold text-black">
                                  <Star size={13} className="fill-black text-black" />
                                  {place.rating.toFixed(1)}
                                  {place.reviews !== null && place.reviews > 0 && (
                                    <span className="font-normal">({place.reviews})</span>
                                  )}
                                </div>
                              )}

                              {place.district && (
                                <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full border border-black bg-white px-2.5 py-1 text-sm font-medium text-black">
                                  <MapPin size={13} className="text-black" />
                                  {place.district}
                                </div>
                              )}
                            </div>

                            <div className="p-4">
                              <h4 className="text-lg font-bold text-black">{place.name}</h4>

                              {place.description && (
                                <p className="mt-1.5 text-base leading-normal text-black line-clamp-3">
                                  {place.description}
                                </p>
                              )}

                              {(place.difficulty || place.season) && (
                                <p className="mt-2 text-sm text-black">
                                  {[
                                    place.difficulty && `Difficulty: ${place.difficulty}`,
                                    place.season && `Best season: ${place.season}`,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </p>
                              )}

                              {place.safetyTips && (
                                <p className="mt-2 text-sm text-black line-clamp-3">
                                  <span className="font-bold">Safety information:</span>{" "}
                                  {place.safetyTips}
                                </p>
                              )}

                              {place.insiderTip && (
                                <p className="mt-2 text-sm text-black line-clamp-3">
                                  <span className="font-bold">Local tip:</span> {place.insiderTip}
                                </p>
                              )}

                              {place.matchReason && (
                                <p className="mt-2 flex items-start gap-1.5 text-sm font-medium text-black">
                                  <span aria-hidden>💡</span>
                                  <span>{place.matchReason}</span>
                                </p>
                              )}

                              <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#c8c8c8] pt-3">
                                <Link
                                  href={`/places/${encodeURIComponent(place.slug)}`}
                                  className="inline-flex items-center gap-1.5 text-base font-bold text-black underline underline-offset-4 hover:no-underline"
                                >
                                  View on Places
                                  <ExternalLink size={15} />
                                </Link>

                                {tripContext && (
                                  <button
                                    type="button"
                                    onClick={() => tripContext.toggleTrip(place.id)}
                                    className={`flex cursor-pointer items-center gap-1.5 rounded-lg border border-black px-3.5 py-2 text-base font-bold transition ${
                                      inTrip
                                        ? "bg-black text-white"
                                        : "bg-white text-black hover:bg-[#e4e4e4]"
                                    }`}
                                  >
                                    {inTrip ? (
                                      <>
                                        <Check size={15} />
                                        In Trip
                                      </>
                                    ) : (
                                      <>
                                        <Bookmark size={15} />
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

                <span className="mt-1 px-1 text-sm text-black">{msg.timestamp}</span>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex w-fit items-center gap-2.5 rounded-2xl border border-[#c8c8c8] bg-white p-3.5 text-black">
                <Compass size={20} className="animate-spin text-black" />
                <span className="text-base text-black">Lanka AI is scouting hidden spots...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions if few messages */}
          {messages.length <= 2 && (
            <div className="border-t border-black bg-white px-3 py-3">
              <span className="mb-2 block text-base font-bold text-black">Suggested questions</span>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSend(prompt)}
                    className="cursor-pointer rounded-full border border-black bg-white px-3.5 py-2 text-left text-sm font-medium text-black transition hover:bg-black hover:text-white"
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
            className="flex items-center gap-2 border-t-2 border-black bg-white p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={1000}
              placeholder="Ask: '3 days in Ella', 'Secret waterfalls'..."
              style={{ fontFamily: FONT_STACK }}
              className="flex-1 rounded-full border border-black bg-white px-5 py-3 text-base text-black outline-none placeholder:text-[#555] focus:ring-2 focus:ring-black"
              disabled={isLoading}
            />

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
              className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-black text-white transition hover:bg-[#333] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
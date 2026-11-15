
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

function getText(row: Record<string, any>, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return "";
}

function getImage(row: Record<string, any>): string {
  const directImage = getText(row, [
    "image_url",
    "hero_image_url",
    "hero_image",
    "cover_image",
    "image",
  ]);

  if (directImage) return directImage;

  if (Array.isArray(row.images) && typeof row.images[0] === "string") {
    return row.images[0];
  }

  return "";
}

function normalizePlace(row: Record<string, any>) {
  const rating =
    typeof row.rating === "number" ? row.rating : null;

  return {
    id: String(row.id),
    name: getText(row, ["name", "place_name", "title"]),
    description: getText(row, ["description", "short_description"]),
    category: getText(row, ["category_name", "category"]) || "Destination",
    district: getText(row, ["district_name", "district"]),
    image: getImage(row),
    rating,
    bestTime: getText(row, ["best_time_to_visit", "best_season"]),
    activities: row.activities ?? [],
    safetyTips: getText(row, ["safety_tips", "safety_warnings"]),
    travelInfo: getText(row, ["travel_info", "road_condition"]),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const message =
      typeof body.message === "string" ? body.message.trim() : "";

    const history: ChatTurn[] = Array.isArray(body.history)
      ? body.history
          .filter(
            (item: any) =>
              (item.role === "user" || item.role === "assistant") &&
              typeof item.content === "string"
          )
          .slice(-8)
      : [];

    if (!message) {
      return NextResponse.json(
        { error: "Please enter a message." },
        { status: 400 }
      );
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { error: "Your message is too long." },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is missing.");
    }

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ) {
      throw new Error("Supabase environment variables are missing.");
    }

    // Connect to Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    );

    // Retrieve real, approved destinations
    const { data: rows, error } = await supabase
      .from("places")
      .select("*")
      .in("status", ["approved", "published"])
      .limit(150);

    if (error) {
      console.error("Supabase error:", error.message);
      throw new Error("Could not retrieve destinations.");
    }

    const places = (rows || [])
      .map((row) => normalizePlace(row as Record<string, any>))
      .filter((place) => place.id && place.name);

    // Send only useful destination information to OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.5",
      store: false,
      instructions: `
You are Lanka AI Guide, the travel assistant for Hidden Sri Lanka Explorer.

Your responsibilities:
- Understand natural-language travel questions.
- Help users discover lesser-known destinations in Sri Lanka.
- Give friendly, concise and useful travel answers.
- Understand preferences such as budget, travel duration, interests,
  location, group size and travel style.
- Ask a follow-up question if essential information is missing.

DESTINATION RULES:
- Recommend destinations ONLY from the supplied database list.
- Never invent destination names or destination IDs.
- Select destinations based on the user's actual preferences.
- Return only IDs that exist in the supplied list.
- Give a short, specific reason for each recommendation.
- If no supplied destination matches, return an empty recommendations array.
- Do not invent ratings, entrance fees, distances, travel times,
  opening hours or weather information.
- Use supplied safety information when discussing destination safety.
- If information is unavailable, say so honestly.

GENERAL QUESTIONS:
- You may answer general questions about travelling in Sri Lanka.
- Distinguish general travel advice from verified information about
  destinations stored in the database.
- Keep answers simple and conversational.

Return a natural-language reply and structured recommendations.
      `,
      input: JSON.stringify({
        conversation: history,
        currentQuestion: message,
        availableDestinations: places.map((place) => ({
          id: place.id,
          name: place.name,
          description: place.description,
          category: place.category,
          district: place.district,
          bestTime: place.bestTime,
          activities: place.activities,
          safetyTips: place.safetyTips,
          travelInfo: place.travelInfo,
        })),
      }),
      max_output_tokens: 800,
      text: {
        format: {
          type: "json_schema",
          name: "travel_recommendation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              reply: {
                type: "string",
              },
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    placeId: {
                      type: "string",
                    },
                    reason: {
                      type: "string",
                    },
                  },
                  required: ["placeId", "reason"],
                  additionalProperties: false,
                },
              },
            },
            required: ["reply", "recommendations"],
            additionalProperties: false,
          },
        },
      },
    });

    if (!response.output_text) {
      throw new Error("The AI returned an empty response.");
    }

    const aiResult = JSON.parse(response.output_text);

    // Match AI recommendations to actual Supabase records.
    // Never trust IDs that are not in the retrieved database list.
    const placeMap = new Map(places.map((place) => [place.id, place]));

    const recommendedPlaces = aiResult.recommendations
      .filter((item: { placeId: string }) => placeMap.has(item.placeId))
      .slice(0, 5)
      .map((item: { placeId: string; reason: string }) => ({
        ...placeMap.get(item.placeId)!,
        matchReason: item.reason,
      }));

    return NextResponse.json({
      reply: aiResult.reply,
      places: recommendedPlaces,
    });
  } catch (error) {
    console.error("AI recommendation error:", error);

    return NextResponse.json(
      { error: "Unable to process your request. Please try again." },
      { status: 500 }
    );
  }
}

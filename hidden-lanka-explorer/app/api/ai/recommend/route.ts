import { NextResponse } from "next/server";
import {
  SRI_LANKA_PLACES,
  getLocalRecommendations,
  type PlaceRecommendation,
} from "@/lib/ai/knowledge-base";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const message: string = (body.message || "").trim();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    // 1. If Gemini API key is available, call Google Gemini 2.5 Flash
    if (apiKey) {
      try {
        const placesSummary = SRI_LANKA_PLACES.map(
          (p) =>
            `- [${p.slug}] "${p.name}" (${p.category}, ${p.district}): ${p.description} (Best season: ${p.season}, Difficulty: ${p.difficulty}). Tip: ${p.insiderTip}`
        ).join("\n");

        const prompt = `You are "Lanka AI", an expert personal travel guide for the "Hidden Lanka Explorer" platform in Sri Lanka.
Your mission is to recommend genuine, hidden, and authentic destinations across Sri Lanka based on what the traveler is asking.

Here is the verified catalog of destinations on our platform:
${placesSummary}

User request: "${message}"

Instructions:
1. Provide a warm, knowledgeable, and concise response (around 2-3 short paragraphs).
2. Recommend 2 to 3 matching places from the catalog above whenever relevant. Explain specifically WHY each matches the user's preferences, season, or travel style.
3. Include practical Sri Lankan local travel tips (e.g., best time of day, transport tuk-tuk/train, leeches/footwear, local etiquette).
4. At the very end of your response, on a new line, write:
MATCHED_SLUGS: [comma-separated slugs of the 1 to 3 places you recommended, e.g. "sigiriya-rock-fortress, knuckles-mountain-range"]
`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [{ text: prompt }],
                },
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 800,
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const rawText: string =
            data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

          if (rawText) {
            // Extract MATCHED_SLUGS if present
            let replyText = rawText;
            const matchedPlaces: PlaceRecommendation[] = [];

            const slugMatch = rawText.match(/MATCHED_SLUGS:\s*\[?(.*?)\]?$/m);
            if (slugMatch && slugMatch[1]) {
              replyText = rawText.replace(/MATCHED_SLUGS:.*$/m, "").trim();
              const slugs = slugMatch[1]
                .split(",")
                .map((s) => s.trim().toLowerCase().replace(/['"]/g, ""));

              for (const slug of slugs) {
                const found = SRI_LANKA_PLACES.find(
                  (p) =>
                    p.slug.toLowerCase() === slug ||
                    p.id.toLowerCase() === slug ||
                    p.name.toLowerCase().includes(slug)
                );
                if (found && !matchedPlaces.some((m) => m.id === found.id)) {
                  matchedPlaces.push(found);
                }
              }
            }

            // Fallback: if no slugs were extracted, match by keyword
            if (matchedPlaces.length === 0) {
              for (const place of SRI_LANKA_PLACES) {
                if (
                  replyText.toLowerCase().includes(place.name.toLowerCase()) ||
                  replyText.toLowerCase().includes(place.district.toLowerCase())
                ) {
                  matchedPlaces.push(place);
                  if (matchedPlaces.length >= 3) break;
                }
              }
            }

            return NextResponse.json({
              ok: true,
              reply: replyText,
              places:
                matchedPlaces.length > 0
                  ? matchedPlaces
                  : SRI_LANKA_PLACES.slice(0, 2),
              source: "gemini",
            });
          }
        }
      } catch (geminiError) {
        console.error("Gemini API call failed, falling back to local engine:", geminiError);
      }
    }

    // 2. Intelligent local fallback engine
    const localResult = getLocalRecommendations(message);
    return NextResponse.json({
      ok: true,
      reply: localResult.reply,
      places: localResult.places,
      source: "local-engine",
    });
  } catch (error) {
    console.error("AI recommendation route error:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendation" },
      { status: 500 }
    );
  }
}

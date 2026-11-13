import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("RESEND_API_KEY is missing from environment variables.");
      return NextResponse.json(
        { error: "RESEND_API_KEY is missing in .env.local. Please restart your dev server." },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);
    const { email, displayName } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const name = displayName || "Explorer";

    // Send the email
    const { data, error } = await resend.emails.send({
      from: "Hidden Lanka Explorer <onboarding@resend.dev>",
      to: email,
      subject: "Welcome to Hidden Lanka Explorer! 🌴🇱🇰",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #244d37; margin-bottom: 8px;">Hidden Sri Lanka Explorer</h1>
            <p style="color: #4a5568; font-size: 16px;">Uncover the unseen wonders of the teardrop island</p>
          </div>

          <p style="font-size: 16px; color: #2d3748;">Ayubowan, <strong>${name}</strong>!</p>
          
          <p style="font-size: 16px; color: #4a5568; line-height: 1.6;">
            Thank you for joining <strong>Hidden Lanka Explorer</strong>! We are thrilled to have you as part of our community of adventurers, local explorers, and nature lovers.
          </p>

          <div style="background-color: #f5f7f2; border-left: 4px solid #244d37; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 15px; color: #244d37; font-weight: 600;">Here is what you can do next:</p>
            <ul style="margin: 8px 0 0 16px; padding: 0; color: #4a5568; font-size: 14px;">
              <li>Discover hidden waterfalls, secret beaches, and mountain trails.</li>
              <li>Save your favorite places to your personalized trip planner.</li>
              <li>Share your own hidden spots with fellow explorers.</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://hiddenlankaexplorer.com" style="background-color: #244d37; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Start Exploring Now
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0 20px;" />
          <p style="font-size: 12px; color: #a0aec0; text-align: center;">
            You received this email because you created an account on Hidden Lanka Explorer.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err: any) {
    console.error("API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
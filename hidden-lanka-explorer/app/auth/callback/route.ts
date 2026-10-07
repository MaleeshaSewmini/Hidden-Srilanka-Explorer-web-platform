import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getSafeNextPath(path: string | null) {
  return path?.startsWith("/") && !path.startsWith("//") ? path : "/";
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const nextPath = getSafeNextPath(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/auth/sign-in?error=auth_callback", origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("AUTH_CALLBACK_ERROR", error);
    return NextResponse.redirect(new URL("/auth/sign-in?error=auth_callback", origin));
  }

  return NextResponse.redirect(new URL(nextPath, origin));
}

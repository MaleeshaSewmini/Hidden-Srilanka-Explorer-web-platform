"use client";

export default function PlacesPage() {
  return (
    <main className="min-h-screen p-6">
      <h1 className="text-3xl font-bold">Explore Places</h1>
      <p>Discover amazing places in Sri Lanka.</p>
    </main>
  );
}
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);
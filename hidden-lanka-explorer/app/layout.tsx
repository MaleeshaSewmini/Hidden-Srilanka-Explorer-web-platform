import type { Metadata } from "next";
import {  Syne, Plus_Jakarta_Sans } from "next/font/google";

import "./globals.css";

import { TripProvider } from "@/lib/trip-context";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";

const display = Syne({
  subsets: ["latin"],
  variable: "--font-display",
});
const outfit = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Hidden Lanka Explorer",
  description:
    "Discover Sri Lanka's untold places, hidden beaches, waterfalls, temples, villages and wild landscapes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${outfit.variable}`}>
      <body>
        <TripProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </TripProvider>
      </body>
    </html>
  );
}
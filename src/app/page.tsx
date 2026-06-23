import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "Blazly Local SEO — Dominate Local Search with AI",
  description:
    "Manage your Google Business Profile, monitor competitors, track rankings, analyze reviews, and grow local visibility with AI-powered local SEO.",
  keywords: [
    "local SEO",
    "Google Business Profile",
    "rank tracking",
    "competitor analysis",
    "review management",
    "AI local SEO",
  ],
  openGraph: {
    title: "Blazly Local SEO — Dominate Local Search with AI",
    description:
      "AI-powered platform for GBP management, competitor intelligence, rank tracking, and review growth.",
    type: "website",
  },
};

export default function HomePage() {
  return <LandingPage />;
}

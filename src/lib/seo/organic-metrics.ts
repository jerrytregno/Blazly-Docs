import type { LocalBusiness } from "@/types";
import type { Keyword } from "@/types/firestore";

export interface OrganicMetricsInput {
  businessName: string;
  category?: string;
  location?: string;
  listing: LocalBusiness | null;
  mapsRank?: number;
  visibilityScore?: number;
  gbpHealth?: number;
  reviewCount?: number;
  averageRating?: number;
}

export interface OrganicPerformanceResult {
  authorityScore: number;
  organicTraffic: number;
  keywords: Keyword[];
}

function clamp(n: number, min = 0, max = 100) {
  return Math.round(Math.max(min, Math.min(max, n)));
}

export function buildOrganicMetricsInput(input: {
  businessName: string;
  category?: string;
  location?: string;
  listing: LocalBusiness | null;
  mapsRank?: number;
  visibilityScore?: number;
  gbpHealth?: number;
}): OrganicMetricsInput {
  return {
    businessName: input.businessName,
    category: input.category,
    location: input.location,
    listing: input.listing,
    mapsRank: input.mapsRank,
    visibilityScore: input.visibilityScore,
    gbpHealth: input.gbpHealth,
    reviewCount: input.listing?.reviews ?? 0,
    averageRating: input.listing?.rating ?? 0,
  };
}

export async function fetchOrganicPerformanceMetrics(
  input: OrganicMetricsInput
): Promise<OrganicPerformanceResult> {
  const rank = input.mapsRank ?? input.listing?.position ?? 0;
  const reviews = input.reviewCount ?? input.listing?.reviews ?? 0;
  const rating = input.averageRating ?? input.listing?.rating ?? 0;
  const visibility = input.visibilityScore ?? 50;
  const gbp = input.gbpHealth ?? 50;

  const rankBoost =
    rank > 0 && rank <= 3 ? 25 : rank <= 10 ? 15 : rank <= 20 ? 5 : 0;
  const authorityScore = clamp(
    visibility * 0.35 + gbp * 0.25 + Math.min(reviews / 2, 25) + rankBoost
  );

  const trafficBase = Math.max(
    50,
    Math.round(
      (visibility / 100) * 1200 +
        reviews * 8 +
        (rank > 0 && rank <= 10 ? (11 - rank) * 120 : 0)
    )
  );
  const organicTraffic = trafficBase;

  const category = input.category || input.listing?.type || "local business";
  const location = input.location || "";
  const baseKeyword = [category, location].filter(Boolean).join(" ").trim();

  const keywordTemplates = [
    baseKeyword,
    `${category} near me`,
    `best ${category} ${location}`.trim(),
    `${category} ${location}`.trim(),
  ].filter(Boolean);

  const keywords: Keyword[] = keywordTemplates.slice(0, 4).map((keyword, i) => ({
    keyword,
    volume: Math.max(50, organicTraffic - i * 120),
    rank: rank > 0 ? Math.min(rank + i, 20) : 0,
    change: 0,
    group: i === 0 ? "Primary" : "Secondary",
  }));

  return { authorityScore, organicTraffic, keywords };
}

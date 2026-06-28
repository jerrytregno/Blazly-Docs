import type { LocalBusiness } from "@/types";

export const VISIBILITY_SCORE_WEIGHTS = {
  ranking: 0.4,
  gbp: 0.25,
  reviews: 0.2,
  citations: 0.1,
  website: 0.05,
} as const;

function clamp(n: number, min = 0, max = 100) {
  return Math.round(Math.max(min, Math.min(max, n)));
}

export function calculateRankingScore(rank?: number): number {
  if (!rank || rank <= 0) return 20;
  if (rank === 1) return 100;
  if (rank <= 3) return 90;
  if (rank <= 5) return 75;
  if (rank <= 10) return 55;
  if (rank <= 15) return 35;
  return 20;
}

function gbpCompletenessScore(listing: LocalBusiness | null): number {
  if (!listing) return 0;
  let score = 0;
  if (listing.title) score += 15;
  if (listing.phone) score += 15;
  if (listing.address) score += 15;
  if (listing.website) score += 15;
  if (listing.description && listing.description.length >= 80) score += 20;
  if (listing.open_hours || listing.hours || listing.open_state) score += 10;
  if ((listing.images?.length ?? 0) >= 3 || listing.thumbnail) score += 10;
  return clamp(score);
}

function reviewScore(listing: LocalBusiness | null): number {
  if (!listing) return 0;
  const ratingPart = Math.min(((listing.rating ?? 0) / 5) * 100, 100);
  const volumePart = Math.min(((listing.reviews ?? 0) / 50) * 100, 100);
  return clamp(ratingPart * 0.6 + volumePart * 0.4);
}

function citationScoreFromHealth(citationHealth?: number): number {
  return clamp(citationHealth ?? 50);
}

function websiteScore(website?: string): number {
  return website?.trim() ? 100 : 30;
}

export function computeVisibilityScoreFromListing(input: {
  listing: LocalBusiness | null;
  business?: {
    name?: string;
    website?: string;
    phone?: string;
    address?: string;
  };
  mapsRank?: number;
  citationHealth?: number;
}): { visibilityScore: number; breakdown: Record<string, number> } {
  const ranking = calculateRankingScore(
    input.mapsRank ?? input.listing?.position ?? undefined
  );
  const gbp = gbpCompletenessScore(input.listing);
  const reviews = reviewScore(input.listing);
  const citations = citationScoreFromHealth(input.citationHealth);
  const website = websiteScore(input.business?.website ?? input.listing?.website);

  const visibilityScore = clamp(
    ranking * VISIBILITY_SCORE_WEIGHTS.ranking +
      gbp * VISIBILITY_SCORE_WEIGHTS.gbp +
      reviews * VISIBILITY_SCORE_WEIGHTS.reviews +
      citations * VISIBILITY_SCORE_WEIGHTS.citations +
      website * VISIBILITY_SCORE_WEIGHTS.website
  );

  return {
    visibilityScore,
    breakdown: { ranking, gbp, reviews, citations, website },
  };
}

export function computeCompetitorVisibilityScore(input: {
  listing: LocalBusiness | null;
  mapsRank?: number;
  citationHealth?: number;
}): number {
  return computeVisibilityScoreFromListing(input).visibilityScore;
}

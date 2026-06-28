import type { LocalBusiness } from "@/types";
import {
  calculateGbpHealth,
  calculateReviewScore,
} from "./scoring-engine";

export const VISIBILITY_SCORE_WEIGHTS = {
  ranking: 0.4,
  gbp: 0.25,
  reviews: 0.2,
  citations: 0.1,
  website: 0.05,
} as const;

export const VISIBILITY_SCORE_FORMULA =
  "Visibility Score = (Ranking × 40%) + (GBP Optimization × 25%) + (Reviews × 20%) + (Citations × 10%) + (Website × 5%)";

export interface VisibilityScoreBreakdown {
  ranking: number;
  gbp: number;
  reviews: number;
  citations: number;
  website: number;
}

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

export function calculateWebsiteScore(website?: string): number {
  return website?.trim() ? 100 : 30;
}

export function computeVisibilityScoreFromComponents(input: {
  rankingScore: number;
  gbpOptimization: number;
  reviewScore: number;
  citationScore: number;
  websiteScore: number;
}): { visibilityScore: number; breakdown: VisibilityScoreBreakdown } {
  const breakdown: VisibilityScoreBreakdown = {
    ranking: clamp(input.rankingScore),
    gbp: clamp(input.gbpOptimization),
    reviews: clamp(input.reviewScore),
    citations: clamp(input.citationScore),
    website: clamp(input.websiteScore),
  };

  const visibilityScore = clamp(
    breakdown.ranking * VISIBILITY_SCORE_WEIGHTS.ranking +
      breakdown.gbp * VISIBILITY_SCORE_WEIGHTS.gbp +
      breakdown.reviews * VISIBILITY_SCORE_WEIGHTS.reviews +
      breakdown.citations * VISIBILITY_SCORE_WEIGHTS.citations +
      breakdown.website * VISIBILITY_SCORE_WEIGHTS.website
  );

  return { visibilityScore, breakdown };
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
  rankingScore?: number;
  citationHealth?: number;
  gbpOptimization?: number;
  reviewScore?: number;
  websiteScore?: number;
}): { visibilityScore: number; breakdown: VisibilityScoreBreakdown } {
  const ranking =
    input.rankingScore ??
    calculateRankingScore(input.mapsRank ?? input.listing?.position ?? undefined);
  const gbp = input.gbpOptimization ?? calculateGbpHealth(input.listing);
  const reviews = input.reviewScore ?? calculateReviewScore(input.listing);
  const citations = clamp(input.citationHealth ?? 50);
  const website =
    input.websiteScore ??
    calculateWebsiteScore(input.business?.website ?? input.listing?.website);

  return computeVisibilityScoreFromComponents({
    rankingScore: ranking,
    gbpOptimization: gbp,
    reviewScore: reviews,
    citationScore: citations,
    websiteScore: website,
  });
}

export function computeCompetitorVisibilityScore(input: {
  listing: LocalBusiness | null;
  mapsRank?: number;
  citationHealth?: number;
}): number {
  return computeVisibilityScoreFromListing(input).visibilityScore;
}

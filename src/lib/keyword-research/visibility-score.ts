import type { LocalBusiness } from "@/types";
import {
  calculateGbpHealth,
  calculateReviewScore,
} from "@/lib/seo/scoring-engine";
import {
  calculateRankingScore,
  calculateWebsiteScore,
  computeVisibilityScoreFromComponents,
} from "@/lib/seo/visibility-score";

/**
 * Visibility for keyword research using the standard weighted formula.
 */
export function computeKeywordResearchVisibility(
  listing: LocalBusiness | null,
  mapsPosition?: number,
  context?: {
    citationHealth?: number;
    website?: string;
    profileCompleteness?: number;
  }
): number {
  if (!listing && (!mapsPosition || mapsPosition <= 0)) {
    return 10;
  }

  const rankingScore = calculateRankingScore(
    mapsPosition && mapsPosition > 0 ? mapsPosition : listing?.position
  );
  const gbpOptimization =
    context?.profileCompleteness ?? calculateGbpHealth(listing);
  const reviewScore = calculateReviewScore(listing);
  const citationScore = context?.citationHealth ?? 50;
  const websiteScore = calculateWebsiteScore(
    context?.website ?? listing?.website
  );

  return computeVisibilityScoreFromComponents({
    rankingScore,
    gbpOptimization,
    reviewScore,
    citationScore,
    websiteScore,
  }).visibilityScore;
}

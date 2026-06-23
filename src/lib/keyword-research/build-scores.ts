import type {
  KeywordResearchListing,
  KeywordResearchScores,
} from "@/types/firestore";
import type { LocalBusiness } from "@/types";
import {
  calculateGbpHealth,
  calculateReviewScore,
} from "@/lib/seo/scoring-engine";
import { imageCountFromListing } from "@/lib/seo/real-data";
import { computeKeywordResearchVisibility } from "./visibility-score";

function clamp(n: number, min = 0, max = 100) {
  return Math.round(Math.max(min, Math.min(max, n)));
}

function rankToScore(rank?: number): number {
  if (!rank || rank <= 0) return 15;
  if (rank === 1) return 100;
  if (rank <= 3) return 88;
  if (rank <= 5) return 72;
  if (rank <= 7) return 55;
  if (rank <= 10) return 38;
  return 20;
}

export { rankToScore };

export function buildVisibilityScores(input: {
  yourPosition?: number;
  yourListing?: LocalBusiness | null;
  listings: KeywordResearchListing[];
  profileCompleteness?: number;
}): KeywordResearchScores {
  const you = input.listings.find((l) => l.isYou);
  const topCompetitor = input.listings.find((l) => !l.isYou && l.position === 1);
  const yourListing = input.yourListing ?? null;

  const localRanking = computeKeywordResearchVisibility(
    yourListing,
    input.yourPosition ?? you?.position
  );

  const userVisibility = localRanking;
  const topVisibility = topCompetitor
    ? computeKeywordResearchVisibility(null, topCompetitor.position)
    : 0;

  const competitor = topCompetitor
    ? clamp((userVisibility / Math.max(topVisibility, 1)) * 100)
    : 50;

  const review = calculateReviewScore(yourListing);
  const photos = imageCountFromListing(yourListing);
  const profileOptimization = clamp(
    input.profileCompleteness ??
      (calculateGbpHealth(yourListing) ||
        (photos >= 10 ? 85 : photos >= 5 ? 65 : photos >= 1 ? 45 : 25))
  );

  const overall = clamp(
    localRanking * 0.4 +
      review * 0.25 +
      profileOptimization * 0.2 +
      competitor * 0.15
  );

  return {
    localRanking,
    competitor,
    review,
    profileOptimization,
    overall,
  };
}

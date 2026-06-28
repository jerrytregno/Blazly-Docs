import type { LocalBusiness } from "@/types";
import type { IssueItem, LocalSeoFactorScore, ScoreItem } from "@/types/firestore";
import { calculateLocalSeoScore } from "./local-seo-score";
import { computeVisibilityScoreFromListing } from "./visibility-score";

export interface ScoreBreakdown {
  gbpHealth: number;
  reviewScore: number;
  localVisibility: number;
  citationHealth: number;
  overallScore: number;
  localSeoFactors: LocalSeoFactorScore[];
  gbpHealthBreakdown: ScoreItem[];
  issues: IssueItem[];
  aiRecommendations: string[];
}

export interface ComputeScoresContext {
  napScore?: number;
  responseRate?: number;
  recentReviewCount?: number;
  business?: {
    name?: string;
    website?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
}

function imageCount(listing: LocalBusiness | null): number {
  if (!listing?.images?.length) return listing?.thumbnail ? 1 : 0;
  return listing.images.length;
}

function clamp(n: number, min = 0, max = 100) {
  return Math.round(Math.max(min, Math.min(max, n)));
}

function scoreCategories(listing: LocalBusiness | null): number {
  if (!listing) return 0;
  const types = listing.types?.length
    ? listing.types
    : listing.type
      ? [listing.type]
      : [];
  if (types.length === 0) return 20;
  if (types.length === 1) return 55;
  if (types.length === 2) return 75;
  return 100;
}

function scoreServices(listing: LocalBusiness | null): number {
  if (!listing) return 0;
  const extensions = listing.extensions ?? [];
  const hasServices = extensions.some(
    (e) =>
      e.title?.toLowerCase().includes("service") ||
      e.items?.some((i) => i.title?.toLowerCase().includes("service"))
  );
  if (hasServices) return 90;
  if ((listing.types?.length ?? 0) >= 2) return 50;
  return listing.type ? 35 : 0;
}

function photoCount(listing: LocalBusiness | null): number {
  if (!listing?.images?.length) return listing?.thumbnail ? 1 : 0;
  return listing.images.length;
}

function scorePhotos(listing: LocalBusiness | null): number {
  if (!listing) return 0;
  const count = photoCount(listing);
  if (count >= 8) return 100;
  if (count >= 5) return 80;
  if (count >= 3) return 60;
  if (count >= 1) return 35;
  return 0;
}

function scoreDescription(listing: LocalBusiness | null): number {
  if (!listing?.description) return 0;
  const len = listing.description.trim().length;
  if (len >= 200) return 100;
  if (len >= 100) return 75;
  if (len >= 40) return 50;
  return 25;
}

function scoreHours(listing: LocalBusiness | null): number {
  if (!listing) return 0;
  if (listing.open_hours && Object.keys(listing.open_hours).length >= 5) return 100;
  if (listing.hours || listing.open_state) return 70;
  return 0;
}

export function calculateGbpHealthBreakdown(
  listing: LocalBusiness | null
): ScoreItem[] {
  return [
    { label: "Categories", score: scoreCategories(listing) },
    { label: "Services", score: scoreServices(listing) },
    { label: "Photos", score: scorePhotos(listing) },
    { label: "Description", score: scoreDescription(listing) },
    { label: "Hours", score: scoreHours(listing) },
  ];
}

export function calculateGbpHealth(listing: LocalBusiness | null): number {
  const breakdown = calculateGbpHealthBreakdown(listing);
  const avg =
    breakdown.reduce((sum, item) => sum + item.score, 0) / breakdown.length;
  return clamp(avg);
}

export function calculateReviewScore(listing: LocalBusiness | null): number {
  if (!listing) return 0;
  const rating = listing.rating ?? 0;
  const reviews = listing.reviews ?? 0;
  const ratingPart = (rating / 5) * 55;
  const volumePart = Math.min(reviews / 80, 1) * 45;
  return clamp(ratingPart + volumePart);
}

export function calculateLocalVisibility(
  listing: LocalBusiness | null,
  context?: {
    mapsRank?: number;
    citationHealth?: number;
    business?: { website?: string };
    gbpOptimization?: number;
    reviewScore?: number;
    rankingScore?: number;
  }
): number {
  return computeVisibilityScoreFromListing({
    listing,
    mapsRank: context?.mapsRank ?? listing?.position ?? undefined,
    citationHealth: context?.citationHealth,
    business: context?.business,
    gbpOptimization: context?.gbpOptimization,
    reviewScore: context?.reviewScore,
    rankingScore: context?.rankingScore,
  }).visibilityScore;
}

export function calculateCitationHealth(
  listing: LocalBusiness | null,
  input: { website?: string; phone?: string; name?: string }
): number {
  if (!listing) return 15;
  let score = 40;
  if (listing.place_id) score += 15;
  if (listing.address) score += 15;
  if (listing.phone) score += 10;
  if (listing.website) score += 10;
  if (input.website && listing.website) {
    const normalize = (u: string) =>
      u.replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();
    if (normalize(input.website).includes(normalize(listing.website).split("/")[0])) {
      score += 10;
    }
  }
  return clamp(score);
}

export function calculateOverallScore(scores: {
  gbpHealth: number;
  reviewScore: number;
  localVisibility: number;
  citationHealth: number;
}): number {
  return clamp(
    scores.gbpHealth * 0.25 +
      scores.reviewScore * 0.2 +
      scores.citationHealth * 0.1 +
      scores.localVisibility * 0.05
  );
}

export function generateIssuesAndRecommendations(
  listing: LocalBusiness | null,
  breakdown: ScoreItem[]
): { issues: IssueItem[]; aiRecommendations: string[] } {
  const issues: IssueItem[] = [];
  const aiRecommendations: string[] = [];

  for (const item of breakdown) {
    if (item.score < 50) {
      issues.push({
        label: `Improve ${item.label.toLowerCase()} (currently ${item.score}/100)`,
        severity: item.score < 30 ? "high" : "medium",
      });
      aiRecommendations.push(
        `Boost your ${item.label.toLowerCase()} score — currently at ${item.score}/100 on your Google Business Profile.`
      );
    }
  }

  if (!listing) {
    issues.push({
      label: "Business not found on Google Maps — verify name and location",
      severity: "high",
    });
    aiRecommendations.push(
      "We couldn't find your listing on Google Maps. Confirm your business name and primary location match your GBP exactly."
    );
    return { issues, aiRecommendations };
  }

  const types = listing.types?.length ?? (listing.type ? 1 : 0);
  if (types < 2) {
    aiRecommendations.push(
      "Add 1–2 additional relevant categories to improve GBP optimization and local pack eligibility."
    );
  }

  const reviews = listing.reviews ?? 0;
  if (reviews < 30) {
    issues.push({
      label: `Low review volume (${reviews} reviews) — competitors may outrank you`,
      severity: "medium",
    });
    aiRecommendations.push(
      `Request more Google reviews — you have ${reviews}. Most local leaders in your area have 50+ reviews.`
    );
  }

  if ((listing.rating ?? 0) < 4.2) {
    issues.push({
      label: `Average rating ${listing.rating?.toFixed(1) ?? "—"} — below local benchmark`,
      severity: "medium",
    });
  }

  if (listing.position && listing.position > 5) {
    aiRecommendations.push(
      `You rank #${listing.position} in Maps for your category — focus on GBP completeness and review growth to break into the top 3.`
    );
  }

  if (aiRecommendations.length === 0) {
    aiRecommendations.push(
      "Strong foundation — keep monitoring competitors and refresh photos and posts monthly."
    );
  }

  return { issues, aiRecommendations };
}

export function computeScores(
  listing: LocalBusiness | null,
  input: { website?: string; phone?: string; name?: string },
  context?: ComputeScoresContext
): ScoreBreakdown {
  const gbpHealthBreakdown = calculateGbpHealthBreakdown(listing);
  const gbpHealth = calculateGbpHealth(listing);
  const reviewScore = calculateReviewScore(listing);
  const citationHealth = calculateCitationHealth(listing, input);
  const localVisibility = calculateLocalVisibility(listing, {
    mapsRank: listing?.position ?? undefined,
    citationHealth,
    business: {
      website: context?.business?.website ?? input.website,
    },
    gbpOptimization: gbpHealth,
    reviewScore,
  });
  const { score: overallScore, factors: localSeoFactors } = calculateLocalSeoScore({
    listing,
    business: context?.business ?? {
      name: input.name,
      website: input.website,
      phone: input.phone ?? listing?.phone,
    },
    napScore: context?.napScore,
    citationScore: citationHealth,
    responseRate: context?.responseRate,
    recentReviewCount: context?.recentReviewCount,
  });
  const { issues, aiRecommendations } = generateIssuesAndRecommendations(
    listing,
    gbpHealthBreakdown
  );

  return {
    gbpHealth,
    reviewScore,
    localVisibility,
    citationHealth,
    overallScore,
    localSeoFactors,
    gbpHealthBreakdown,
    issues,
    aiRecommendations,
  };
}

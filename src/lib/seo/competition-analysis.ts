import type { LocalBusiness } from "@/types";
import type { Competitor, CompetitionAnalysis, CompetitionLevel, RankingsDoc } from "@/types/firestore";
import type { BusinessDoc } from "@/types/firestore";

function norm(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function clamp(n: number, min = 0, max = 100) {
  return Math.round(Math.max(min, Math.min(max, n)));
}

function levelFromScore(score: number): CompetitionLevel {
  if (score < 35) return "low";
  if (score < 65) return "medium";
  return "high";
}

function levelLabel(level: CompetitionLevel): string {
  return level === "low" ? "Low" : level === "medium" ? "Medium" : "High";
}

function buildSummary(
  level: CompetitionLevel,
  category: string,
  location: string,
  competitorCount: number,
  establishedCount: number
): string {
  const place = location || "this area";
  const cat = category || "this category";
  if (level === "low") {
    return `Competition is low for ${cat} in ${place}. Fewer established businesses (${establishedCount} with strong ratings/reviews) gives room to rank with solid GBP optimization.`;
  }
  if (level === "medium") {
    return `Competition is moderate for ${cat} in ${place}. ${competitorCount} nearby listings are active — consistent reviews and profile completeness are needed to stay visible.`;
  }
  return `Competition is high for ${cat} in ${place}. ${establishedCount} established players dominate — you'll need strong reviews, citations, and differentiated GBP content to break in.`;
}

function resolveYourRank(
  listing: LocalBusiness | null,
  results: LocalBusiness[]
): number | undefined {
  if (!listing) return undefined;
  const placeId = listing.place_id;
  if (placeId) {
    const match = results.find((r) => r.place_id === placeId);
    if (match?.position != null && match.position > 0) return match.position;
  }
  if (listing.position != null && listing.position > 0) return listing.position;
  return undefined;
}

export function analyzeCompetition(input: {
  results: LocalBusiness[];
  listing: LocalBusiness | null;
  category: string;
  location: string;
  businessName: string;
  mapsRank?: number;
  mapsRankQuery?: string;
}): CompetitionAnalysis {
  const { results, listing, category, location, businessName } = input;
  const competitors = results.filter((r) => r.place_id !== listing?.place_id);
  const competitorCount = competitors.length;

  const ratings = competitors.map((c) => c.rating ?? 0).filter((r) => r > 0);
  const reviewCounts = competitors.map((c) => c.reviews ?? 0);
  const avgCompetitorRating =
    ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : 0;
  const avgCompetitorReviews =
    reviewCounts.length > 0
      ? Math.round(reviewCounts.reduce((a, b) => a + b, 0) / reviewCounts.length)
      : 0;

  const establishedCompetitors = competitors.filter(
    (c) => (c.rating ?? 0) >= 4.3 && (c.reviews ?? 0) >= 30
  ).length;
  const dominantCompetitors = competitors.filter(
    (c) => (c.rating ?? 0) >= 4.5 && (c.reviews ?? 0) >= 100
  ).length;

  const densityScore = Math.min(competitorCount / 12, 1) * 100;
  const reviewPressure = Math.min(avgCompetitorReviews / 120, 1) * 100;
  const ratingPressure = Math.min(avgCompetitorRating / 4.8, 1) * 100;
  const establishedScore = Math.min(establishedCompetitors / 6, 1) * 100;
  const dominantScore = Math.min(dominantCompetitors / 4, 1) * 100;

  const score = clamp(
    densityScore * 0.28 +
      reviewPressure * 0.28 +
      ratingPressure * 0.14 +
      establishedScore * 0.2 +
      dominantScore * 0.1
  );

  const level = levelFromScore(score);

  const sorted = [...competitors].sort(
    (a, b) => (a.position ?? 99) - (b.position ?? 99)
  );
  const top = sorted[0];
  const yourRank =
    input.mapsRank && input.mapsRank > 0
      ? input.mapsRank
      : resolveYourRank(listing, results);

  const factors = [
    {
      label: "Businesses in area",
      value: String(competitorCount),
      impact: (competitorCount >= 10 ? "high" : competitorCount >= 5 ? "medium" : "low") as CompetitionLevel,
    },
    {
      label: "Avg. competitor reviews",
      value: String(avgCompetitorReviews),
      impact: (avgCompetitorReviews >= 80 ? "high" : avgCompetitorReviews >= 35 ? "medium" : "low") as CompetitionLevel,
    },
    {
      label: "Avg. competitor rating",
      value: avgCompetitorRating ? `${avgCompetitorRating}★` : "—",
      impact: (avgCompetitorRating >= 4.5 ? "high" : avgCompetitorRating >= 4.0 ? "medium" : "low") as CompetitionLevel,
    },
    {
      label: "Established players",
      value: String(establishedCompetitors),
      impact: (establishedCompetitors >= 5 ? "high" : establishedCompetitors >= 2 ? "medium" : "low") as CompetitionLevel,
    },
  ];

  return {
    category: category || "Local business",
    location: location || "Your market",
    level,
    levelLabel: levelLabel(level),
    score,
    competitorCount,
    avgCompetitorRating,
    avgCompetitorReviews,
    establishedCompetitors,
    dominantCompetitors,
    yourRank,
    mapsRankQuery: input.mapsRankQuery,
    yourRating: listing?.rating ?? undefined,
    yourReviews: listing?.reviews ?? undefined,
    topCompetitor: top
      ? {
          name: top.title ?? "Top competitor",
          rating: top.rating ?? 0,
          reviews: top.reviews ?? 0,
          rank: top.position ?? 1,
        }
      : undefined,
    summary: buildSummary(level, category, location, competitorCount, establishedCompetitors),
    factors,
    searchedAt: new Date().toISOString(),
    businessName,
  };
}

export function competitionFromCompetitors(
  competitors: Competitor[],
  category: string,
  location: string,
  businessName: string
): CompetitionAnalysis | null {
  const others = competitors.filter((c) => !c.isYou);
  if (!others.length) return null;

  const pseudoResults: LocalBusiness[] = others.map((c) => ({
    title: c.name,
    rating: c.rating,
    reviews: c.reviews,
    position: c.rank,
  }));

  const you = competitors.find((c) => c.isYou);
  const listing: LocalBusiness | null = you
    ? {
        title: you.name,
        rating: you.rating,
        reviews: you.reviews,
        position: you.rank > 0 ? you.rank : undefined,
      }
    : null;

  const analysis = analyzeCompetition({
    results: listing ? [...pseudoResults, listing] : pseudoResults,
    listing,
    category,
    location,
    businessName,
  });

  if (analysis && you && you.rank > 0 && !analysis.yourRank) {
    return { ...analysis, yourRank: you.rank };
  }

  return analysis;
}

/** True when stored competition analysis matches the active business context. */
export function matchesCompetitionContext(
  analysis: CompetitionAnalysis | undefined,
  businessName: string,
  category: string,
  location: string
): boolean {
  if (!analysis) return false;
  if (norm(analysis.businessName) !== norm(businessName)) return false;
  if (norm(analysis.category) !== norm(category)) return false;
  if (norm(analysis.location) !== norm(location)) return false;
  return true;
}

/** True when the competitor list includes a "you" row for the current business. */
export function matchesCompetitorsBusiness(
  competitors: Competitor[],
  businessName: string
): boolean {
  const you = competitors.find((c) => c.isYou);
  if (!you) return false;
  return norm(you.name) === norm(businessName);
}

export function isCompetitionDataCurrent(
  rankings: RankingsDoc | null | undefined,
  businessName: string,
  category: string,
  location: string
): boolean {
  if (
    matchesCompetitionContext(rankings?.competitionAnalysis, businessName, category, location)
  ) {
    return true;
  }
  const competitors = rankings?.competitors ?? [];
  return competitors.length > 0 && matchesCompetitorsBusiness(competitors, businessName);
}

export function resolveCompetitionAnalysis(
  rankings: RankingsDoc | null | undefined,
  business: BusinessDoc | null | undefined,
  category: string,
  location: string
): CompetitionAnalysis | null {
  const businessName = business?.name ?? "Your business";

  if (!isCompetitionDataCurrent(rankings, businessName, category, location)) {
    return null;
  }

  const stored = rankings?.competitionAnalysis;
  if (stored && matchesCompetitionContext(stored, businessName, category, location)) {
    return stored;
  }

  const competitors = rankings?.competitors ?? [];
  if (competitors.length) {
    return competitionFromCompetitors(competitors, category, location, businessName);
  }

  return null;
}

export const COMPETITION_LEVEL_STYLES: Record<
  CompetitionLevel,
  { bg: string; text: string; border: string; bar: string }
> = {
  low: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    bar: "bg-emerald-500",
  },
  medium: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    bar: "bg-amber-500",
  },
  high: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    bar: "bg-red-500",
  },
};

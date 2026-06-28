import type { LocalBusiness } from "@/types";
import { buildGbpAuditChecklist } from "./citation-catalog";
import { buildNapAudit } from "./nap-audit";

function clamp(n: number, min = 0, max = 100) {
  return Math.round(Math.max(min, Math.min(max, n)));
}

/** Authority / Local SEO score weights (must sum to 1.0) */
export const LOCAL_SEO_WEIGHTS = {
  gbpCompleteness: 0.278,
  napConsistency: 0.167,
  reviews: 0.222,
  onPageLocalSeo: 0.167,
  citationsBacklinks: 0.111,
  proximityCategoryMatch: 0.056,
} as const;

export interface LocalSeoFactorScore {
  key: keyof typeof LOCAL_SEO_WEIGHTS;
  label: string;
  weight: string;
  score: number;
  why: string;
  contribution: number;
}

const FACTOR_META: Record<
  keyof typeof LOCAL_SEO_WEIGHTS,
  { label: string; weight: string; why: string }
> = {
  gbpCompleteness: {
    label: "Google Business Profile (GBP) Completeness",
    weight: "28%",
    why: "Single biggest controllable factor",
  },
  napConsistency: {
    label: "NAP Consistency (Name, Address, Phone)",
    weight: "17%",
    why: "Trust signal across the web",
  },
  reviews: {
    label: "Reviews (volume, rating, recency, responses)",
    weight: "22%",
    why: "Heavily correlated with rankings",
  },
  onPageLocalSeo: {
    label: "On-Page Local SEO",
    weight: "17%",
    why: "Site-level relevance signals",
  },
  citationsBacklinks: {
    label: "Citations & Backlinks (local directories)",
    weight: "11%",
    why: "Directory presence and local link equity",
  },
  proximityCategoryMatch: {
    label: "Proximity / Categories Match",
    weight: "6%",
    why: "Hard to control, but trackable",
  },
};

const FACTOR_ORDER: Array<keyof typeof LOCAL_SEO_WEIGHTS> = [
  "gbpCompleteness",
  "napConsistency",
  "reviews",
  "onPageLocalSeo",
  "citationsBacklinks",
  "proximityCategoryMatch",
];

function scoreGbpCompleteness(listing: LocalBusiness | null): number {
  if (!listing) return 0;
  const checklist = buildGbpAuditChecklist(listing);
  const passed = checklist.filter((c) => c.passed).length;
  return clamp((passed / checklist.length) * 100);
}

function scoreReviews(
  listing: LocalBusiness | null,
  options?: { responseRate?: number; recentReviewCount?: number }
): number {
  if (!listing) return 0;
  const reviews = listing.reviews ?? 0;
  const rating = listing.rating ?? 0;

  const volume = Math.min(reviews / 50, 1) * 100;
  const ratingScore = (rating / 5) * 100;
  const recency =
    options?.recentReviewCount !== undefined
      ? Math.min((options.recentReviewCount / 5) * 100, 100)
      : reviews > 0
        ? 65
        : 0;
  const responses =
    options?.responseRate !== undefined ? options.responseRate : reviews > 0 ? 50 : 0;

  return clamp(volume * 0.35 + ratingScore * 0.35 + recency * 0.15 + responses * 0.15);
}

function scoreNapConsistency(
  listing: LocalBusiness | null,
  business?: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
  },
  napScore?: number
): number {
  if (napScore !== undefined) return clamp(napScore);
  if (!listing) return 0;
  if (business) {
    return buildNapAudit(listing, business).score;
  }
  let score = 0;
  if (listing.title) score += 35;
  if (listing.address) score += 35;
  if (listing.phone) score += 30;
  return clamp(score);
}

function scoreOnPageLocalSeo(
  listing: LocalBusiness | null,
  website?: string
): number {
  if (!listing) return 0;
  const hasWebsite = Boolean(listing.website || website);
  const descLen = listing.description?.trim().length ?? 0;
  const descScore =
    descLen >= 500 ? 100 : descLen >= 250 ? 85 : descLen >= 150 ? 70 : descLen > 0 ? 45 : 0;
  const types = listing.types?.length ?? (listing.type ? 1 : 0);
  const categoryScore =
    types >= 3 ? 100 : types === 2 ? 80 : types === 1 ? 55 : 20;
  const servicesHint =
    listing.extensions?.some((e) => e.title?.toLowerCase().includes("service")) ? 100 : 40;

  return clamp(hasWebsite ? 100 : 0) * 0.3 + descScore * 0.35 + categoryScore * 0.2 + servicesHint * 0.15;
}

function scoreCitationsBacklinks(
  listing: LocalBusiness | null,
  input?: { website?: string; name?: string },
  citationScore?: number
): number {
  if (citationScore !== undefined) return clamp(citationScore);
  if (!listing) return 0;

  let score = 35;
  if (listing.place_id) score += 15;
  if (listing.address) score += 15;
  if (listing.phone) score += 10;
  if (listing.website) score += 10;
  if (input?.website && listing.website) {
    const normalize = (u: string) =>
      u.replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();
    const inputHost = normalize(input.website).split("/")[0];
    const listingHost = normalize(listing.website).split("/")[0];
    if (inputHost && listingHost && (inputHost.includes(listingHost) || listingHost.includes(inputHost))) {
      score += 15;
    }
  }
  return clamp(score);
}

function scoreProximityCategoryMatch(listing: LocalBusiness | null): number {
  if (!listing) return 0;
  const gpsScore = listing.gps_coordinates ? 100 : 40;
  const categoryScore = listing.type || listing.types?.length ? 100 : 0;
  let rankScore = 50;
  if (listing.position != null) {
    if (listing.position <= 3) rankScore = 100;
    else if (listing.position <= 10) rankScore = 75;
    else if (listing.position <= 20) rankScore = 55;
    else rankScore = 35;
  }
  return clamp(gpsScore * 0.4 + categoryScore * 0.35 + rankScore * 0.25);
}

export function calculateLocalSeoScore(input: {
  listing: LocalBusiness | null;
  business?: {
    name?: string;
    website?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  napScore?: number;
  citationScore?: number;
  responseRate?: number;
  recentReviewCount?: number;
}): { score: number; factors: LocalSeoFactorScore[] } {
  const components = {
    gbpCompleteness: scoreGbpCompleteness(input.listing),
    reviews: scoreReviews(input.listing, {
      responseRate: input.responseRate,
      recentReviewCount: input.recentReviewCount,
    }),
    napConsistency: scoreNapConsistency(input.listing, input.business, input.napScore),
    onPageLocalSeo: scoreOnPageLocalSeo(input.listing, input.business?.website),
    citationsBacklinks: scoreCitationsBacklinks(
      input.listing,
      { website: input.business?.website, name: input.business?.name },
      input.citationScore
    ),
    proximityCategoryMatch: scoreProximityCategoryMatch(input.listing),
  };

  const factors: LocalSeoFactorScore[] = FACTOR_ORDER.map((key) => {
    const score = components[key];
    const meta = FACTOR_META[key];
    const weight = LOCAL_SEO_WEIGHTS[key];
    return {
      key,
      label: meta.label,
      weight: meta.weight,
      score,
      why: meta.why,
      contribution: Math.round(score * weight),
    };
  });

  const score = clamp(
    factors.reduce((sum, f) => sum + f.score * LOCAL_SEO_WEIGHTS[f.key], 0)
  );

  return { score, factors };
}

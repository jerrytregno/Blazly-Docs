import type { LocalBusiness } from "@/types";
import type {
  KeywordOpportunity,
  KeywordResearchListing,
  KeywordResearchReport,
  RankTrackerSeed,
} from "@/types/firestore";
import { imageCountFromListing } from "@/lib/seo/real-data";
import { buildSearchQuery } from "./fetch-rankings";
import { buildVisibilityScores } from "./build-scores";

function listingsFromMapsResults(
  results: LocalBusiness[],
  input: {
    category: string;
    businessPlaceId?: string;
    businessName: string;
  }
): {
  listings: KeywordResearchListing[];
  yourPosition?: number;
  yourPlaceId?: string;
} {
  const placeId = input.businessPlaceId;
  let yourPosition: number | undefined;

  const listings: KeywordResearchListing[] = results.slice(0, 10).map((r, i) => {
    const position = r.position ?? i + 1;
    const isYou = Boolean(placeId && r.place_id === placeId);
    if (isYou) yourPosition = position;
    return {
      position,
      placeId: r.place_id,
      name: r.title ?? "Unknown",
      rating: r.rating ?? 0,
      reviews: r.reviews ?? 0,
      category: r.type ?? r.types?.[0] ?? input.category,
      address: r.address ?? "—",
      isYou,
      photoCount: imageCountFromListing(r),
    };
  });

  if (!yourPosition && placeId) {
    const idx = results.findIndex((r) => r.place_id === placeId);
    if (idx >= 0) {
      yourPosition = results[idx].position ?? idx + 1;
      listings[idx] = { ...listings[idx], isYou: true };
    }
  }

  return { listings, yourPosition, yourPlaceId: placeId };
}

export function buildRankTrackerSeed(input: {
  category: string;
  location: string;
  businessName: string;
  placeId?: string;
  mapsResults: LocalBusiness[];
  analyzedAt?: string;
}): RankTrackerSeed {
  const query = buildSearchQuery(input.category, input.location);
  const { listings, yourPosition, yourPlaceId } = listingsFromMapsResults(
    input.mapsResults,
    {
      category: input.category,
      businessPlaceId: input.placeId,
      businessName: input.businessName,
    }
  );

  return {
    category: input.category,
    location: input.location,
    query,
    listings,
    yourPosition,
    yourPlaceId,
    analyzedAt: input.analyzedAt ?? new Date().toISOString(),
  };
}

export function rankTrackerSeedMatchesSearch(
  seed: RankTrackerSeed | null | undefined,
  category: string,
  location: string
): boolean {
  if (!seed) return false;
  const cat = category.trim().toLowerCase();
  const loc = location.trim().toLowerCase();
  return (
    seed.category.trim().toLowerCase() === cat &&
    seed.location.trim().toLowerCase() === loc &&
    seed.listings.length > 0
  );
}

export function buildRankTrackerReportFromAnalysis(input: {
  seed: RankTrackerSeed;
  profileCompleteness?: number;
  userListing?: LocalBusiness | null;
}): KeywordResearchReport {
  const scores = buildVisibilityScores({
    yourPosition: input.seed.yourPosition,
    yourListing: input.userListing ?? null,
    listings: input.seed.listings,
    profileCompleteness: input.profileCompleteness,
  });

  const keywords: KeywordOpportunity[] = [
    {
      keyword: input.seed.query,
      tier: "primary",
      searchVolume: 500,
      competitionScore: 50,
      difficulty: 45,
    },
    ...input.seed.listings
      .filter((l) => !l.isYou)
      .slice(0, 4)
      .map((l, i) => ({
        keyword: `${l.category || input.seed.category} ${input.seed.location}`.trim(),
        tier: (i === 0 ? "secondary" : "long-tail") as KeywordOpportunity["tier"],
        searchVolume: Math.max(50, 120 - i * 15),
        competitionScore: 40 + i * 5,
        difficulty: 35 + i * 8,
      })),
  ];

  return {
    category: input.seed.category,
    location: input.seed.location,
    query: input.seed.query,
    listings: input.seed.listings,
    yourPosition: input.seed.yourPosition,
    scores,
    keywords,
    searchedAt: input.seed.analyzedAt,
  };
}

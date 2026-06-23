import type { CompetitorDeepDive, KeywordResearchListing } from "@/types/firestore";
import type { LocalBusiness } from "@/types";
import { fetchGoogleMapsPlace, mergePlaceDetails } from "@/lib/searchapi";
import { openHoursToWeekly, imageCountFromListing } from "@/lib/seo/real-data";
import { computeKeywordResearchVisibility } from "./visibility-score";

function listingToLocal(listing: KeywordResearchListing): LocalBusiness {
  return {
    place_id: listing.placeId,
    title: listing.name,
    rating: listing.rating,
    reviews: listing.reviews,
    type: listing.category,
    address: listing.address,
    position: listing.position,
  };
}

async function resolvePlaceProfile(
  placeId: string | undefined,
  searchListing?: KeywordResearchListing | null
): Promise<LocalBusiness | null> {
  const stub = searchListing ? listingToLocal(searchListing) : null;

  if (!placeId) return stub;

  try {
    const place = await fetchGoogleMapsPlace(placeId);
    const detail = place.place_result ?? place.local_results?.[0] ?? null;
    if (!detail) return stub;
    if (stub) return mergePlaceDetails(stub, place);
    return detail;
  } catch {
    return stub;
  }
}

function profileMetrics(listing: LocalBusiness | null) {
  return {
    rating: listing?.rating ?? 0,
    reviews: listing?.reviews ?? 0,
    photoCount: imageCountFromListing(listing),
  };
}

export function buildWhyTheyRankHigher(
  competitorMetrics: { rating: number; reviews: number; photoCount: number },
  userMetrics: { rating: number; reviews: number; photoCount: number },
  competitorPosition: number,
  userPosition?: number,
  competitorListing?: LocalBusiness | null
): string[] {
  const reasons: string[] = [];

  if (competitorMetrics.reviews > userMetrics.reviews) {
    reasons.push(
      `${competitorMetrics.reviews.toLocaleString()} reviews vs your ${userMetrics.reviews.toLocaleString()}`
    );
  }
  if (competitorMetrics.rating > userMetrics.rating) {
    reasons.push(`${competitorMetrics.rating}★ rating vs your ${userMetrics.rating}★`);
  }
  if (userPosition && competitorPosition < userPosition) {
    reasons.push(`Ranks #${competitorPosition} in local Maps results for this search`);
  } else if (!userPosition) {
    reasons.push(`Appears in top 10 at #${competitorPosition} while you are outside the top 10`);
  }
  if (competitorMetrics.photoCount > userMetrics.photoCount) {
    reasons.push(
      `More GBP photos (${competitorMetrics.photoCount} vs ${userMetrics.photoCount})`
    );
  }
  if (competitorListing?.description?.trim()) {
    reasons.push("Has a detailed business description on Google");
  }
  if (
    competitorListing?.open_hours &&
    Object.keys(competitorListing.open_hours).length >= 5
  ) {
    reasons.push("Complete business hours on Google Business Profile");
  }
  if (competitorListing?.website) {
    reasons.push("Website linked on Google Business Profile");
  }
  if (!reasons.length) {
    reasons.push("Stronger overall Google Business Profile signals in this market");
  }
  return reasons.slice(0, 6);
}

export async function fetchCompetitorDeepDive(input: {
  competitor: KeywordResearchListing;
  user?: KeywordResearchListing | null;
  userListing?: LocalBusiness | null;
  userPlaceId?: string;
  yourPosition?: number;
}): Promise<CompetitorDeepDive> {
  const [competitorProfile, userProfile] = await Promise.all([
    resolvePlaceProfile(input.competitor.placeId, input.competitor),
    (async () => {
      const resolved = await resolvePlaceProfile(
        input.userPlaceId ?? input.user?.placeId,
        input.user ?? null
      );
      return resolved ?? input.userListing ?? null;
    })(),
  ]);

  const competitorMetrics = profileMetrics(competitorProfile);
  const userMetrics = profileMetrics(userProfile);

  const hours = competitorProfile ? openHoursToWeekly(competitorProfile) : null;
  const hoursSummary = hours
    ? hours
        .filter((h) => !/closed/i.test(h.hours))
        .slice(0, 3)
        .map((h) => `${h.day}: ${h.hours}`)
        .join(" · ") || "Hours not listed"
    : "Hours not listed";

  const userMapsPosition = input.yourPosition ?? input.user?.position;

  return {
    placeId: input.competitor.placeId ?? "",
    name: competitorProfile?.title ?? input.competitor.name,
    position: input.competitor.position,
    rating: competitorMetrics.rating,
    reviews: competitorMetrics.reviews,
    category:
      competitorProfile?.type ??
      competitorProfile?.types?.[0] ??
      input.competitor.category,
    address: competitorProfile?.address ?? input.competitor.address,
    hoursSummary,
    photoCount: competitorMetrics.photoCount,
    visibilityScore: computeKeywordResearchVisibility(
      competitorProfile,
      input.competitor.position
    ),
    description: competitorProfile?.description,
    whyTheyRankHigher: buildWhyTheyRankHigher(
      competitorMetrics,
      userMetrics,
      input.competitor.position,
      userMapsPosition,
      competitorProfile
    ),
    userComparison: {
      rating: userMetrics.rating,
      reviews: userMetrics.reviews,
      photoCount: userMetrics.photoCount,
      visibilityScore: computeKeywordResearchVisibility(
        userProfile,
        userMapsPosition
      ),
    },
  };
}

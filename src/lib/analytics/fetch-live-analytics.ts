import type { LocalBusiness } from "@/types";
import type { GoogleMapsReview } from "@/lib/searchapi";
import {
  fetchGoogleMapsPlace,
  fetchGoogleMapsReviews,
  searchGoogleMaps,
} from "@/lib/searchapi";
import { parseGoogleMapsPlaceId } from "@/lib/seo/maps-place";
import { findBestBusinessMatch } from "@/lib/seo/match-business";
import { openHoursToWeekly } from "@/lib/seo/real-data";
import {
  computeVisibilityMetrics,
  type VisibilityMetrics,
} from "@/lib/seo/visibility-metrics";
import { regionGl } from "@/lib/seo/search-regions";
import type {
  AnalyticsRatingBucket,
  Competitor,
  RankingsDoc,
} from "@/types/firestore";
import type { BuildAnalyticsInput } from "./build-analytics";

export interface LiveCompetitorRef {
  name: string;
  rating: number;
  reviews: number;
  rank: number;
  placeId?: string;
}

export interface LiveAnalyticsSnapshot {
  fetchedAt: string;
  fromAnalysisCache?: boolean;
  userPlace: LocalBusiness | null;
  competitorPlace: LocalBusiness | null;
  competitor: LiveCompetitorRef;
  visibility: VisibilityMetrics | null;
  userReviewsHistogram: Record<string, number> | null;
  competitorReviewsHistogram: Record<string, number> | null;
  userNewReviews30d: number | null;
  competitorNewReviews30d: number | null;
  userRecentReviews: GoogleMapsReview[];
  competitorRecentReviews: GoogleMapsReview[];
  userWeeklyHours: { day: string; hours: string }[] | null;
  competitorWeeklyHours: { day: string; hours: string }[] | null;
  liveFields: {
    userPlace: boolean;
    competitorPlace: boolean;
    visibility: boolean;
    reviewsHistogram: boolean;
    recentReviews: boolean;
  };
}

function businessLocation(input: BuildAnalyticsInput): string {
  const { business, rankings } = input;
  return (
    rankings.competitionAnalysis?.location ||
    [business.city, business.state, business.country].filter(Boolean).join(", ") ||
    business.address
  );
}

function pickCompetitor(
  competitors: Competitor[],
  analysis?: RankingsDoc["competitionAnalysis"]
): LiveCompetitorRef {
  if (analysis?.topCompetitor) {
    return {
      name: analysis.topCompetitor.name,
      rating: analysis.topCompetitor.rating,
      reviews: analysis.topCompetitor.reviews,
      rank: analysis.topCompetitor.rank,
    };
  }
  const rival = competitors
    .filter((c) => !c.isYou)
    .sort((a, b) => b.reviews - a.reviews)[0];
  if (!rival) {
    return { name: "Local competitor", rating: 4.2, reviews: 45, rank: 2 };
  }
  return {
    name: rival.name,
    rating: rival.rating,
    reviews: rival.reviews,
    rank: rival.rank,
  };
}

function isWithinDays(isoDate: string | undefined, days: number): boolean {
  if (!isoDate) return false;
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return false;
  const diff = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= days;
}

export function histogramToDistribution(
  histogram: Record<string, number>
): AnalyticsRatingBucket[] {
  return [1, 2, 3, 4, 5].map((stars) => {
    const keys = [`${stars}`, `${stars} stars`, `${stars} star`];
    const count = keys.reduce((sum, k) => sum + (histogram[k] ?? 0), 0);
    return { stars, count };
  });
}

export function computeRatingTrend(
  recentReviews: GoogleMapsReview[],
  overallRating: number,
  days = 30
): number {
  const rated = recentReviews.filter(
    (r) => r.rating && r.rating > 0 && isWithinDays(r.iso_date, days)
  );
  if (!rated.length || !overallRating) return 0;
  const recentAvg =
    rated.reduce((sum, r) => sum + (r.rating ?? 0), 0) / rated.length;
  return Math.round((recentAvg - overallRating) * 10) / 10;
}

async function fetchRecentReviews(
  placeId: string,
  gl: string | undefined,
  periodDays: number,
  maxPages = 5
): Promise<{
  reviews: GoogleMapsReview[];
  histogram: Record<string, number> | null;
  newInPeriod: number;
}> {
  const collected: GoogleMapsReview[] = [];
  let histogram: Record<string, number> | null = null;
  let nextToken: string | undefined;
  let newInPeriod = 0;
  let pages = 0;

  while (pages < maxPages) {
    const data = await fetchGoogleMapsReviews(placeId, {
      sort_by: "newest",
      num: 20,
      next_page_token: nextToken,
      gl,
    });

    if (data.error) break;

    if (!histogram && data.place_result?.reviews_histogram) {
      histogram = data.place_result.reviews_histogram;
    }

    const batch = data.reviews ?? [];
    if (!batch.length) break;

    let reachedOlder = false;
    for (const review of batch) {
      collected.push(review);
      if (isWithinDays(review.iso_date, periodDays)) {
        newInPeriod++;
      } else if (review.iso_date) {
        reachedOlder = true;
      }
    }

    pages++;
    nextToken = data.pagination?.next_page_token;
    if (!nextToken || reachedOlder) break;
  }

  return { reviews: collected, histogram, newInPeriod };
}

async function resolveCompetitorPlace(
  rival: LiveCompetitorRef,
  location: string,
  gl: string | undefined
): Promise<LocalBusiness | null> {
  try {
    const search = await searchGoogleMaps({
      q: `${rival.name} ${location}`.trim(),
      gl,
    });
    const match = findBestBusinessMatch(
      search.local_results ?? [],
      rival.name,
      { location }
    );
    if (!match?.place_id) return match;

    const place = await fetchGoogleMapsPlace(match.place_id);
    const detail = place.place_result ?? place.local_results?.[0] ?? match;
    return { ...match, ...detail, place_id: match.place_id };
  } catch {
    return null;
  }
}

function placeDetail(place: LocalBusiness | null) {
  return place;
}

function listingFromAnalysis(input: BuildAnalyticsInput): LocalBusiness | null {
  const placeId = parseGoogleMapsPlaceId(input.business.mapsPlaceId ?? "");
  const you = input.rankings.competitors?.find((c) => c.isYou);
  const m = input.dashboard.metrics;
  if (!placeId && !you) return null;

  return {
    place_id: placeId ?? undefined,
    title: input.business.name,
    rating: m.averageRating || you?.rating,
    reviews: m.totalReviews || you?.reviews,
    position: you?.rank || input.rankings.competitionAnalysis?.yourRank,
    address: input.business.address,
    website: input.business.website,
    phone: input.business.phone,
    type: input.business.primaryCategory,
  };
}

export function shouldUseCachedAnalytics(input: BuildAnalyticsInput): boolean {
  return input.dashboard.analysisStatus === "complete";
}

/** Reuse onboarding analysis data — zero SearchAPI calls. */
export function buildCachedAnalyticsSnapshot(
  input: BuildAnalyticsInput
): LiveAnalyticsSnapshot {
  const rival = pickCompetitor(
    input.rankings.competitors ?? [],
    input.rankings.competitionAnalysis
  );
  const userPlace = listingFromAnalysis(input);
  const visibilityQueries = input.rankings.visibilityQueries ?? [];
  const localVisibility =
    input.dashboard.metrics.localVisibility ?? input.dashboard.visibilityScore ?? 0;
  const organicTraffic = input.dashboard.metrics.organicTraffic ?? 0;

  const visibility: VisibilityMetrics | null =
    visibilityQueries.length > 0 || localVisibility > 0
      ? {
          aiVisibility: localVisibility,
          organicTraffic,
          localVisibility,
          platformSignals: input.rankings.aiSearchSignals ?? {
            chatgpt: { mentions: 0, cited: 0 },
            aiOverview: { mentions: 0, cited: 0 },
            aiMode: { mentions: 0, cited: 0 },
            gemini: { mentions: 0, cited: 0 },
          },
          searchQueries: visibilityQueries,
        }
      : null;

  return {
    fetchedAt: new Date().toISOString(),
    fromAnalysisCache: true,
    userPlace,
    competitorPlace: null,
    competitor: rival,
    visibility,
    userReviewsHistogram: null,
    competitorReviewsHistogram: null,
    userNewReviews30d:
      input.dashboard.metrics.reviewsThisMonth ?? input.reviews.inbox?.length ?? null,
    competitorNewReviews30d: null,
    userRecentReviews: [],
    competitorRecentReviews: [],
    userWeeklyHours:
      input.business.weeklyHours?.length
        ? input.business.weeklyHours
        : userPlace
          ? openHoursToWeekly(userPlace)
          : null,
    competitorWeeklyHours: null,
    liveFields: {
      userPlace: Boolean(userPlace),
      competitorPlace: false,
      visibility: Boolean(visibility),
      reviewsHistogram: false,
      recentReviews: false,
    },
  };
}

export async function fetchLiveAnalyticsData(
  input: BuildAnalyticsInput
): Promise<LiveAnalyticsSnapshot> {
  const gl = regionGl(input.dashboard.searchRegion);
  const location = businessLocation(input);
  const rival = pickCompetitor(
    input.rankings.competitors ?? [],
    input.rankings.competitionAnalysis
  );
  const periodDays = input.periodDays ?? 30;

  const liveFields = {
    userPlace: false,
    competitorPlace: false,
    visibility: false,
    reviewsHistogram: false,
    recentReviews: false,
  };

  let userPlace: LocalBusiness | null = null;
  let visibility: VisibilityMetrics | null = null;
  let userReviewsHistogram: Record<string, number> | null = null;
  let userNewReviews30d: number | null = null;
  let userRecentReviews: GoogleMapsReview[] = [];
  let userWeeklyHours: { day: string; hours: string }[] | null = null;

  const placeId = parseGoogleMapsPlaceId(input.business.mapsPlaceId ?? "");
  if (placeId) {
    try {
      const [placeRes, recentRes] = await Promise.all([
        fetchGoogleMapsPlace(placeId),
        fetchRecentReviews(placeId, gl, periodDays),
      ]);

      userPlace = placeDetail(
        placeRes.place_result ?? placeRes.local_results?.[0] ?? null
      );
      if (userPlace) liveFields.userPlace = true;

      userRecentReviews = recentRes.reviews;
      userNewReviews30d = recentRes.newInPeriod;
      if (recentRes.reviews.length > 0) liveFields.recentReviews = true;

      userReviewsHistogram =
        userPlace?.reviews_histogram ??
        recentRes.histogram ??
        null;
      if (userReviewsHistogram) liveFields.reviewsHistogram = true;

      userWeeklyHours = userPlace ? openHoursToWeekly(userPlace) : null;

      try {
        visibility = await computeVisibilityMetrics({
          listing: userPlace,
          businessName: input.business.name,
          category: input.business.primaryCategory,
          location,
          placeId,
          ll: userPlace?.gps_coordinates
            ? `@${userPlace.gps_coordinates.latitude},${userPlace.gps_coordinates.longitude},14z`
            : undefined,
          gl,
          keywords: input.rankings.keywords ?? [],
          geoGrid: input.rankings.geoGrid ?? null,
        });
        liveFields.visibility = true;
      } catch {
        visibility = null;
      }
    } catch {
      // fall through with null live user data
    }
  }

  let competitorPlace: LocalBusiness | null = null;
  let competitorReviewsHistogram: Record<string, number> | null = null;
  let competitorNewReviews30d: number | null = null;
  let competitorRecentReviews: GoogleMapsReview[] = [];
  let competitorWeeklyHours: { day: string; hours: string }[] | null = null;

  try {
    competitorPlace = await resolveCompetitorPlace(rival, location, gl);
    if (competitorPlace) {
      liveFields.competitorPlace = true;
      rival.placeId = competitorPlace.place_id;
      rival.rating = competitorPlace.rating ?? rival.rating;
      rival.reviews = competitorPlace.reviews ?? rival.reviews;

      competitorWeeklyHours = openHoursToWeekly(competitorPlace);
      competitorReviewsHistogram = competitorPlace.reviews_histogram ?? null;

      if (competitorPlace.place_id) {
        const recent = await fetchRecentReviews(
          competitorPlace.place_id,
          gl,
          periodDays,
          3
        );
        competitorRecentReviews = recent.reviews;
        competitorNewReviews30d = recent.newInPeriod;
        if (!competitorReviewsHistogram && recent.histogram) {
          competitorReviewsHistogram = recent.histogram;
        }
      }
    }
  } catch {
    // keep stored rival metrics
  }

  return {
    fetchedAt: new Date().toISOString(),
    userPlace,
    competitorPlace,
    competitor: rival,
    visibility,
    userReviewsHistogram,
    competitorReviewsHistogram,
    userNewReviews30d,
    competitorNewReviews30d,
    userRecentReviews,
    competitorRecentReviews,
    userWeeklyHours,
    competitorWeeklyHours,
    liveFields,
  };
}

import type {
  BusinessDoc,
  KeywordResearchReport,
  RankTrackerSeed,
} from "@/types/firestore";
import { fetchGoogleMapsPlace } from "@/lib/searchapi";
import { parseGoogleMapsPlaceId } from "@/lib/seo/maps-place";
import { resolveSearchLocation } from "@/lib/seo/analysis-location";
import { fetchTopLocalRankings } from "./fetch-rankings";
import { buildVisibilityScores } from "./build-scores";
import { fetchCompetitorDeepDive } from "./competitor-detail";
import {
  buildRankTrackerReportFromAnalysis,
  rankTrackerSeedMatchesSearch,
} from "./build-from-analysis";
import {
  generateKeywordOpportunities,
  generateRankingStrategy,
} from "./gemini-keyword-research";

export async function buildKeywordResearchReport(input: {
  business: BusinessDoc;
  category: string;
  location: string;
  gl?: string;
  competitorPlaceId?: string;
  includeStrategy?: boolean;
  profileCompleteness?: number;
  rankTrackerSeed?: RankTrackerSeed | null;
  preferAnalysisCache?: boolean;
}): Promise<KeywordResearchReport> {
  if (
    input.preferAnalysisCache &&
    rankTrackerSeedMatchesSearch(input.rankTrackerSeed, input.category, input.location)
  ) {
    const cachedReport = buildRankTrackerReportFromAnalysis({
      seed: input.rankTrackerSeed!,
      profileCompleteness: input.profileCompleteness,
    });

    if (input.includeStrategy) {
      cachedReport.strategy = await generateRankingStrategy({
        businessName: input.business.name,
        category: input.category,
        location: input.location,
        yourPosition: cachedReport.yourPosition,
        listings: cachedReport.listings,
        competitorDetail: undefined,
        scores: cachedReport.scores,
      });
    }

    return cachedReport;
  }
  const placeId = parseGoogleMapsPlaceId(input.business.mapsPlaceId ?? "");
  let userListing = null;
  let lat: number | undefined;
  let lng: number | undefined;

  if (placeId) {
    try {
      const place = await fetchGoogleMapsPlace(placeId);
      userListing = place.place_result ?? place.local_results?.[0] ?? null;
      lat = userListing?.gps_coordinates?.latitude;
      lng = userListing?.gps_coordinates?.longitude;
    } catch {
      userListing = null;
    }
  }

  const fallbackLocation = resolveSearchLocation(input.business);
  const { query, listings, yourPosition, yourPlaceId, rawUserListing } =
    await fetchTopLocalRankings({
      category: input.category,
      location: input.location,
      businessPlaceId: placeId ?? undefined,
      businessName: input.business.name,
      lat,
      lng,
      gl: input.gl,
      fallbackLocation,
    });

  const you = listings.find((l) => l.isYou);
  const scores = buildVisibilityScores({
    yourPosition,
    yourListing: userListing ?? rawUserListing,
    listings,
    profileCompleteness: input.profileCompleteness,
  });

  const keywords = await generateKeywordOpportunities({
    category: input.category,
    location: input.location,
    businessName: input.business.name,
  });

  let competitorDetail;
  const competitorTarget =
    listings.find((l) => l.placeId === input.competitorPlaceId) ??
    listings.find((l) => !l.isYou && l.position === 1);

  if (competitorTarget && !competitorTarget.isYou) {
    competitorDetail = await fetchCompetitorDeepDive({
      competitor: competitorTarget,
      user: you,
      userListing: userListing ?? rawUserListing,
      userPlaceId: yourPlaceId ?? placeId ?? undefined,
      yourPosition,
    });
  }

  let strategy;
  if (input.includeStrategy) {
    strategy = await generateRankingStrategy({
      businessName: input.business.name,
      category: input.category,
      location: input.location,
      yourPosition,
      listings,
      competitorDetail,
      scores,
    });
  }

  return {
    category: input.category,
    location: input.location,
    query,
    listings,
    yourPosition,
    yourPlaceId,
    keywords,
    scores,
    competitorDetail,
    strategy,
    searchedAt: new Date().toISOString(),
  };
}

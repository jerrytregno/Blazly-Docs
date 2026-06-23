import type { LocalBusiness } from "@/types";
import type { GeoGridScan, Keyword } from "@/types/firestore";
import {
  searchGoogleMaps,
  searchAtCoordinates,
  geocodeLocation,
} from "@/lib/searchapi";
import { findBestBusinessMatch } from "./match-business";

export interface AiPlatformSignal {
  mentions: number;
  cited: number;
}

export interface VisibilityMetrics {
  aiVisibility: number;
  organicTraffic: number;
  localVisibility: number;
  platformSignals: {
    chatgpt: AiPlatformSignal;
    aiOverview: AiPlatformSignal;
    aiMode: AiPlatformSignal;
    gemini: AiPlatformSignal;
  };
  searchQueries: Array<{
    label: string;
    query: string;
    rank: number;
  }>;
}

function clamp(n: number, min = 0, max = 100) {
  return Math.round(Math.max(min, Math.min(max, n)));
}

function rankToScore(rank: number): number {
  if (rank <= 0) return 0;
  if (rank === 1) return 100;
  if (rank <= 3) return 92;
  if (rank <= 5) return 78;
  if (rank <= 10) return 58;
  if (rank <= 15) return 38;
  if (rank <= 20) return 22;
  return 10;
}

export function keywordRankingProgress(
  keywords: Keyword[],
  listing: LocalBusiness | null,
  geoGrid: GeoGridScan | null | undefined,
  visibilityLocal: number | undefined,
  fallbackVisibility: number
): number {
  const ranked = keywords.filter((k) => k.rank > 0);
  if (ranked.length > 0) {
    const scores = ranked.map((k) => rankToScore(k.rank));
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const top10Rate = ranked.filter((k) => k.rank <= 10).length / keywords.length;
    return clamp(avg * 0.65 + top10Rate * 100 * 0.35);
  }

  if (listing?.position && listing.position > 0) {
    return rankToScore(listing.position);
  }
  if (geoGrid?.visibilityScore && geoGrid.visibilityScore > 0) {
    return geoGrid.visibilityScore;
  }
  if (visibilityLocal && visibilityLocal > 0) {
    return visibilityLocal;
  }
  return fallbackVisibility > 0 ? fallbackVisibility : 0;
}

function firstPositive(...values: (number | undefined | null)[]): number {
  for (const value of values) {
    if (value != null && value > 0) return value;
  }
  return 0;
}

function findRank(
  results: LocalBusiness[] | undefined,
  placeId: string | undefined,
  businessName: string,
  location: string
): number {
  if (!results?.length) return 0;
  const match = placeId
    ? results.find((r) => r.place_id === placeId)
    : findBestBusinessMatch(results, businessName, location);
  return match?.position ?? 0;
}

async function searchRank(
  query: string,
  placeId: string | undefined,
  businessName: string,
  location: string,
  ll?: string,
  lat?: number,
  lng?: number,
  gl?: string
): Promise<number> {
  try {
    const response =
      lat != null && lng != null
        ? await searchAtCoordinates(query, lat, lng, 14, gl)
        : await searchGoogleMaps({
            q: query,
            ll: ll ?? (location ? (await geocodeLocation(location, gl)) ?? undefined : undefined),
            gl,
          });

    return findRank(response.local_results, placeId, businessName, location);
  } catch {
    return 0;
  }
}

function signalsFromRank(rank: number): AiPlatformSignal {
  if (rank <= 0) return { mentions: 0, cited: 0 };
  return {
    mentions: rank <= 10 ? 1 : 0,
    cited: rank <= 3 ? 1 : rank <= 10 ? 1 : 0,
  };
}

function keywordOrganicScore(keywords: Keyword[]): number {
  const ranked = keywords.filter((k) => k.rank > 0);
  if (!ranked.length) return 0;
  const scores = ranked.map((k) => rankToScore(k.rank));
  return clamp(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function geoOrganicScore(geoGrid: GeoGridScan | null | undefined): number {
  if (!geoGrid) return 0;
  const ranked = geoGrid.points.filter((p) => p.rank > 0 && p.rank <= 20);
  if (!ranked.length) return geoGrid.visibilityScore;

  const pointScores = geoGrid.points.map((p) => rankToScore(p.rank));
  const avgPoint = pointScores.reduce((a, b) => a + b, 0) / pointScores.length;
  return clamp(avgPoint * 0.6 + geoGrid.visibilityScore * 0.4);
}

function estimateTrafficVolume(
  organicScore: number,
  keywords: Keyword[],
  listing: LocalBusiness | null
): number {
  const keywordVolume = keywords.reduce((s, k) => s + k.volume, 0);
  const reviewFactor = listing?.reviews ?? 0;
  const base = Math.max(keywordVolume / 15, reviewFactor * 2, 10);
  return Math.max(1, Math.round((organicScore / 100) * base));
}

export async function computeVisibilityMetrics(input: {
  listing: LocalBusiness | null;
  businessName: string;
  category: string;
  location: string;
  placeId?: string;
  ll?: string;
  gl?: string;
  keywords: Keyword[];
  geoGrid: GeoGridScan | null;
}): Promise<VisibilityMetrics> {
  const { listing, businessName, category, location, keywords, geoGrid } = input;
  const placeId = input.placeId ?? listing?.place_id;
  const lat = listing?.gps_coordinates?.latitude;
  const lng = listing?.gps_coordinates?.longitude;
  const city = location || listing?.address?.split(",").slice(-2)[0]?.trim() || "";

  const brandQuery = businessName;
  const categoryQuery = [category || businessName, city].filter(Boolean).join(" ");
  const nearMeQuery = `${category || "business"} near me`;
  const mapsQuery = category || businessName;

  const [brandRank, categoryRank, nearMeRank, mapsRank] = await Promise.all([
    searchRank(brandQuery, placeId, businessName, location, input.ll, lat, lng, input.gl),
    searchRank(categoryQuery, placeId, businessName, location, input.ll, lat, lng, input.gl),
    lat != null && lng != null
      ? searchRank(nearMeQuery, placeId, businessName, location, undefined, lat, lng, input.gl)
      : searchRank(nearMeQuery, placeId, businessName, location, input.ll, undefined, undefined, input.gl),
    lat != null && lng != null
      ? searchRank(mapsQuery, placeId, businessName, location, undefined, lat, lng, input.gl)
      : searchRank(mapsQuery, placeId, businessName, location, input.ll, undefined, undefined, input.gl),
  ]);

  const searchQueries = [
    { label: "Brand", query: brandQuery, rank: brandRank },
    { label: "Category", query: categoryQuery, rank: categoryRank },
    { label: "Near me", query: nearMeQuery, rank: nearMeRank },
    { label: "Maps", query: mapsQuery, rank: mapsRank },
  ];

  const aiQueryScores = [brandRank, categoryRank, nearMeRank, mapsRank].map(rankToScore);
  const aiVisibility =
    aiQueryScores.some((s) => s > 0)
      ? clamp(aiQueryScores.reduce((a, b) => a + b, 0) / aiQueryScores.length)
      : listing?.position
        ? rankToScore(listing.position)
        : 0;

  const keywordScore = keywordOrganicScore(keywords);
  const geoScore = geoOrganicScore(geoGrid);
  const primaryRank = listing?.position ?? mapsRank ?? categoryRank;
  const primaryScore = rankToScore(primaryRank);

  const organicTrafficScore = clamp(
    keywordScore * 0.45 + geoScore * 0.35 + primaryScore * 0.2
  );

  const organicTraffic = estimateTrafficVolume(organicTrafficScore, keywords, listing);

  const localVisibility = firstPositive(
    geoGrid?.visibilityScore,
    primaryScore,
    keywordOrganicScore(keywords)
  );

  return {
    aiVisibility,
    organicTraffic,
    localVisibility,
    platformSignals: {
      chatgpt: signalsFromRank(brandRank),
      aiOverview: signalsFromRank(categoryRank),
      aiMode: signalsFromRank(mapsRank),
      gemini: signalsFromRank(nearMeRank),
    },
    searchQueries,
  };
}

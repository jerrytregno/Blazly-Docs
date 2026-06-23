import type { LocalBusiness } from "@/types";
import type { KeywordResearchListing } from "@/types/firestore";
import {
  geocodeLocation,
  searchAtCoordinates,
  searchGoogleMaps,
} from "@/lib/searchapi";
import { imageCountFromListing } from "@/lib/seo/real-data";
import { parseGoogleMapsPlaceId } from "@/lib/seo/maps-place";

export function buildSearchQuery(category: string, location: string): string {
  const cat = category.trim() || "business";
  const loc = location.trim();
  if (!loc) return `${cat} near me`;
  return `${cat} near ${loc}`;
}

export async function fetchTopLocalRankings(input: {
  category: string;
  location: string;
  businessPlaceId?: string;
  businessName: string;
  lat?: number;
  lng?: number;
  gl?: string;
  fallbackLocation?: string;
}): Promise<{
  query: string;
  listings: KeywordResearchListing[];
  yourPosition?: number;
  yourPlaceId?: string;
  rawUserListing?: LocalBusiness | null;
}> {
  const query = buildSearchQuery(input.category, input.location);
  const placeId = parseGoogleMapsPlaceId(input.businessPlaceId ?? "") ?? undefined;

  let response;
  const lat = input.lat;
  const lng = input.lng;
  const useCoords = lat != null && lng != null;

  if (useCoords) {
    response = await searchAtCoordinates(query, lat, lng, 14, input.gl);
  } else {
    const loc = input.location.trim() || input.fallbackLocation?.trim() || "";
    const ll = loc ? await geocodeLocation(loc, input.gl) : null;
    response = await searchGoogleMaps({
      q: query,
      ll: ll ?? undefined,
      gl: input.gl,
    });
  }

  if (response.error) {
    throw new Error(response.error);
  }

  const results = (response.local_results ?? []).slice(0, 10);
  let yourPosition: number | undefined;
  let rawUserListing: LocalBusiness | null = null;

  const listings: KeywordResearchListing[] = results.map((r, i) => {
    const position = r.position ?? i + 1;
    const isYou = Boolean(placeId && r.place_id === placeId);
    if (isYou) {
      yourPosition = position;
      rawUserListing = r;
    }
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
      rawUserListing = results[idx];
      listings[idx] = { ...listings[idx], isYou: true };
    }
  }

  return {
    query,
    listings,
    yourPosition,
    yourPlaceId: placeId,
    rawUserListing,
  };
}

export function rankColorClass(position: number): string {
  if (position <= 3) return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (position <= 7) return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-red-100 text-red-800 border-red-200";
}

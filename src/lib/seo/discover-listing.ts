import type { LocalBusiness } from "@/types";
import {
  searchGoogleMaps,
  geocodeLocation,
  fetchGoogleMapsPlace,
  mergePlaceDetails,
  buildCoordinates,
} from "@/lib/searchapi";
import {
  findBestBusinessMatch,
  getMatchConfidence,
  type BusinessMatchOptions,
} from "./match-business";

const WEAK_MATCH_THRESHOLD = 0.65;

export interface DiscoverListingInput {
  businessName: string;
  website?: string;
  category?: string;
  location?: string;
  phone?: string;
  placeId?: string;
  gl?: string;
}

export interface DiscoverListingResult {
  listing: LocalBusiness | null;
  results: LocalBusiness[];
  ll?: string;
  searchQueryUsed: string;
  matchConfidence: number;
}

async function enrichListing(
  listing: LocalBusiness | null
): Promise<LocalBusiness | null> {
  if (!listing?.place_id) return listing;
  try {
    const place = await fetchGoogleMapsPlace(listing.place_id);
    return mergePlaceDetails(listing, place);
  } catch {
    return listing;
  }
}

function mergeUniqueResults(
  primary: LocalBusiness[],
  secondary: LocalBusiness[]
): LocalBusiness[] {
  const merged = [...primary];
  const indexByPlaceId = new Map<string, number>();
  merged.forEach((row, i) => {
    if (row.place_id) indexByPlaceId.set(row.place_id, i);
  });

  for (const row of secondary) {
    if (!row.place_id) continue;
    const existingIdx = indexByPlaceId.get(row.place_id);
    if (existingIdx !== undefined) {
      const existing = merged[existingIdx];
      merged[existingIdx] = {
        ...existing,
        ...row,
        position: row.position ?? existing.position,
        title: row.title ?? existing.title,
        rating: row.rating ?? existing.rating,
        reviews: row.reviews ?? existing.reviews,
      };
      continue;
    }
    merged.push(row);
    indexByPlaceId.set(row.place_id, merged.length - 1);
  }
  return merged;
}

/** Copy local-pack position from search results onto the target listing */
export function attachListingPosition(
  listing: LocalBusiness | null,
  results: LocalBusiness[]
): LocalBusiness | null {
  if (!listing) return null;
  const placeId = listing.place_id;
  if (!placeId) return listing;

  const match = results.find((r) => r.place_id === placeId);
  if (match?.position != null && match.position > 0) {
    return { ...listing, position: match.position };
  }

  return listing;
}

function coordinatesFromListing(listing: LocalBusiness): string | undefined {
  const gps = listing.gps_coordinates;
  if (!gps) return undefined;
  return buildCoordinates(gps.latitude, gps.longitude);
}

async function fetchCompetitorPack(
  listing: LocalBusiness,
  input: DiscoverListingInput,
  ll: string | undefined,
  gl?: string
): Promise<LocalBusiness[]> {
  const location = input.location?.trim() || "";
  const searchLl = ll ?? coordinatesFromListing(listing);

  const queries = [
    [listing.type ?? listing.types?.[0], location].filter(Boolean).join(" "),
    [input.category, location].filter(Boolean).join(" "),
    [input.category, listing.address].filter(Boolean).join(" "),
    [input.businessName, location].filter(Boolean).join(" "),
  ].filter((q, index, arr) => q.trim().length > 2 && arr.indexOf(q) === index);

  let merged: LocalBusiness[] = [];
  for (const q of queries) {
    try {
      const response = await searchGoogleMaps({ q: q.trim(), ll: searchLl, gl });
      merged = mergeUniqueResults(merged, response.local_results ?? []);
    } catch {
      // optional enrichment
    }
  }
  return merged;
}

export async function discoverListing(
  input: DiscoverListingInput
): Promise<DiscoverListingResult> {
  const location = input.location?.trim() || "";
  const gl = input.gl;
  const matchOpts: BusinessMatchOptions = {
    location,
    website: input.website,
    phone: input.phone,
  };

  let ll: string | undefined;
  if (location) {
    ll = (await geocodeLocation(location, gl)) ?? undefined;
  }

  if (input.placeId?.trim()) {
    try {
      const place = await fetchGoogleMapsPlace(input.placeId.trim());
      const raw =
        place.place_result ??
        place.local_results?.find((r) => r.place_id === input.placeId) ??
        place.local_results?.[0];

      if (raw) {
        let listing = await enrichListing({
          ...raw,
          place_id: raw.place_id ?? input.placeId.trim(),
        });
        const searchLl = ll ?? (listing ? coordinatesFromListing(listing) : undefined);
        let results = listing
          ? mergeUniqueResults([listing], place.local_results ?? [])
          : [];

        if (listing) {
          const competitors = await fetchCompetitorPack(
            listing,
            input,
            searchLl,
            gl
          );
          results = mergeUniqueResults(results, competitors);
          listing = attachListingPosition(listing, results);
        }

        return {
          listing,
          results,
          ll: searchLl,
          searchQueryUsed: `place_id:${input.placeId.trim()}`,
          matchConfidence: listing ? 1 : 0,
        };
      }
    } catch {
      // fall through to name/category search
    }
  }

  const nameQuery = [input.businessName, location].filter(Boolean).join(" ").trim();
  const categoryQuery = [input.category, location].filter(Boolean).join(" ").trim();

  const primaryResponse = await searchGoogleMaps({
    q: nameQuery || input.businessName,
    ll,
    gl,
  });
  const primaryResults = primaryResponse.local_results ?? [];

  if (primaryResponse.error) {
    throw new Error(primaryResponse.error);
  }

  let listing = findBestBusinessMatch(primaryResults, input.businessName, matchOpts);
  let matchConfidence = getMatchConfidence(listing, input.businessName, matchOpts);
  let results = primaryResults;
  let searchQueryUsed = nameQuery || input.businessName;

  const shouldTryCategory =
    input.category?.trim() &&
    categoryQuery !== nameQuery &&
    (!listing || matchConfidence < WEAK_MATCH_THRESHOLD);

  if (shouldTryCategory) {
    const fallbackResponse = await searchGoogleMaps({
      q: categoryQuery,
      ll,
      gl,
    });
    const fallbackResults = fallbackResponse.local_results ?? [];
    const fallbackListing = findBestBusinessMatch(
      fallbackResults,
      input.businessName,
      matchOpts
    );
    const fallbackConfidence = getMatchConfidence(
      fallbackListing,
      input.businessName,
      matchOpts
    );

    if (fallbackConfidence > matchConfidence) {
      listing = fallbackListing;
      matchConfidence = fallbackConfidence;
      results = fallbackResults;
      searchQueryUsed = categoryQuery;
    } else if (!results.length && fallbackResults.length) {
      results = fallbackResults;
    }
  }

  if (
    searchQueryUsed === (nameQuery || input.businessName) &&
    categoryQuery &&
    categoryQuery !== nameQuery
  ) {
    try {
      const competitorResponse = await searchGoogleMaps({ q: categoryQuery, ll, gl });
      results = mergeUniqueResults(results, competitorResponse.local_results ?? []);
    } catch {
      // competitor enrichment is optional
    }
  }

  if (listing?.place_id) {
    listing = await enrichListing(listing);
    listing = attachListingPosition(listing, results);
  }

  return {
    listing,
    results,
    ll,
    searchQueryUsed,
    matchConfidence,
  };
}

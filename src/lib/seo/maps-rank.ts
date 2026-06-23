import type { LocalBusiness } from "@/types";
import {
  geocodeLocation,
  searchAtCoordinates,
  searchGoogleMaps,
} from "@/lib/searchapi";
import { findBestBusinessMatch } from "./match-business";

/** Rank in a single Google Maps local_results page (1 = first listing). */
export function rankInLocalResults(
  results: LocalBusiness[] | undefined,
  placeId: string | undefined,
  businessName: string,
  location: string
): number {
  if (!results?.length) return 0;

  if (placeId) {
    const index = results.findIndex((r) => r.place_id === placeId);
    if (index >= 0) {
      const row = results[index];
      if (row.position != null && row.position > 0) return row.position;
      return index + 1;
    }
  }

  const match = findBestBusinessMatch(results, businessName, { location });
  if (!match) return 0;
  if (match.position != null && match.position > 0) return match.position;

  const index = results.findIndex(
    (r) => r.place_id === match.place_id || r.title === match.title
  );
  return index >= 0 ? index + 1 : 0;
}

export async function fetchMapsCategoryRank(input: {
  category: string;
  location: string;
  placeId?: string;
  businessName: string;
  ll?: string;
  lat?: number;
  lng?: number;
  gl?: string;
}): Promise<{ rank: number; query: string; resultCount: number }> {
  const query = [input.category, input.location].filter(Boolean).join(" ").trim();
  if (!query) return { rank: 0, query: "", resultCount: 0 };

  try {
    const response =
      input.lat != null && input.lng != null
        ? await searchAtCoordinates(query, input.lat, input.lng, 14, input.gl)
        : await searchGoogleMaps({
            q: query,
            ll:
              input.ll ??
              (input.location
                ? ((await geocodeLocation(input.location, input.gl)) ?? undefined)
                : undefined),
            gl: input.gl,
          });

    const results = response.local_results ?? [];
    const rank = rankInLocalResults(
      results,
      input.placeId,
      input.businessName,
      input.location
    );

    return { rank, query, resultCount: results.length };
  } catch {
    return { rank: 0, query, resultCount: 0 };
  }
}

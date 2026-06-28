import type { LocalBusiness } from "@/types";
import { fetchGoogleSearch } from "@/lib/searchapi";
import { findBestBusinessMatch } from "./match-business";

export const MAPS_NOT_RANKED_RANK = 21;
export const MAPS_NOT_RANKED_DISPLAY = "Not in top 10";

export function matchBusinessInLocalResults(
  results: LocalBusiness[] | undefined,
  businessName: string,
  placeId?: string
): { rank: number; listing: LocalBusiness | null } {
  if (!results?.length) {
    return { rank: MAPS_NOT_RANKED_RANK, listing: null };
  }

  if (placeId) {
    const index = results.findIndex((r) => r.place_id === placeId);
    if (index >= 0) {
      const row = results[index];
      const rank = row.position && row.position > 0 ? row.position : index + 1;
      return { rank, listing: row };
    }
  }

  const match = findBestBusinessMatch(results, businessName);
  if (!match) {
    return { rank: MAPS_NOT_RANKED_RANK, listing: null };
  }

  const index = results.findIndex(
    (r) => r.place_id === match.place_id || r.title === match.title
  );
  const rank =
    match.position && match.position > 0
      ? match.position
      : index >= 0
        ? index + 1
        : MAPS_NOT_RANKED_RANK;

  return { rank, listing: match };
}

export function formatMapsRankDisplay(rank: number): string {
  if (rank <= 0 || rank >= MAPS_NOT_RANKED_RANK) return MAPS_NOT_RANKED_DISPLAY;
  return `#${rank}`;
}

export async function lookupGoogleMapsRank(input: {
  keyword: string;
  location: string;
  businessName: string;
  placeId?: string;
  gl?: string;
}) {
  const response = await fetchGoogleSearch({
    q: input.keyword,
    location: input.location,
    gl: input.gl,
  });

  const results = (response.local_results ?? []).slice(0, 10);
  const { rank, listing } = matchBusinessInLocalResults(
    results,
    input.businessName,
    input.placeId
  );

  return {
    rank,
    displayRank: formatMapsRankDisplay(rank),
    query: input.keyword,
    resultCount: results.length,
    results,
    matchedListing: listing,
  };
}

export function averageMapsRanks(ranks: number[]): number {
  const valid = ranks.filter((r) => r > 0 && r < MAPS_NOT_RANKED_RANK);
  if (!valid.length) return 0;
  return Math.round(valid.reduce((s, r) => s + r, 0) / valid.length);
}

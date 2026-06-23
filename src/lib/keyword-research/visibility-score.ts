import type { LocalBusiness } from "@/types";
import { calculateLocalVisibility } from "@/lib/seo/scoring-engine";

/**
 * Maps search visibility for a keyword research query.
 * Uses live Maps rank for the current search plus GBP signals from the place profile.
 */
export function computeKeywordResearchVisibility(
  listing: LocalBusiness | null,
  mapsPosition?: number
): number {
  if (!listing && (!mapsPosition || mapsPosition <= 0)) {
    return 10;
  }

  const enriched: LocalBusiness = {
    ...(listing ?? {}),
    position:
      mapsPosition && mapsPosition > 0 ? mapsPosition : listing?.position,
  };

  return calculateLocalVisibility(enriched);
}

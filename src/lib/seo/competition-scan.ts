import type { LocalBusiness } from "@/types";
import type { Competitor, CompetitionAnalysis } from "@/types/firestore";
import { discoverListing, attachListingPosition } from "@/lib/seo/discover-listing";
import { analyzeCompetition } from "@/lib/seo/competition-analysis";
import { fetchMapsCategoryRank } from "@/lib/seo/maps-rank";
import { imageCountFromListing } from "@/lib/seo/real-data";
import { parseGoogleMapsPlaceId } from "@/lib/seo/maps-place";
import { regionGl } from "@/lib/seo/search-regions";

export interface CompetitionScanInput {
  businessName: string;
  website?: string;
  category?: string;
  location?: string;
  phone?: string;
  mapsPlaceId?: string;
  searchRegion?: string;
}

function buildCompetitors(
  results: LocalBusiness[],
  listing: LocalBusiness | null,
  businessName: string
): Competitor[] {
  return results
    .filter((r) => r.place_id !== listing?.place_id)
    .slice(0, 8)
    .map((r, i) => ({
      name: r.title ?? `Competitor ${i + 1}`,
      distance: "—",
      rating: r.rating ?? 0,
      reviews: r.reviews ?? 0,
      rank: r.position ?? i + 2,
      isYou: false,
      categories: r.types?.length ?? (r.type ? 1 : 0),
      photos: imageCountFromListing(r),
      posts: 0,
      services: 0,
      citations: 0,
    }))
    .concat([
      {
        name: listing?.title ?? businessName,
        distance: "—",
        rating: listing?.rating ?? 0,
        reviews: listing?.reviews ?? 0,
        rank: listing?.position ?? 0,
        isYou: true,
        categories: listing?.types?.length ?? (listing?.type ? 1 : 0),
        photos: imageCountFromListing(listing),
        posts: 0,
        services: 0,
        citations: 0,
      },
    ]);
}

/** Live Google Maps scan for category competition at the business location. */
export async function runCompetitionScan(input: CompetitionScanInput): Promise<{
  competitors: Competitor[];
  competitionAnalysis: CompetitionAnalysis;
}> {
  const category = input.category?.trim() || "";
  const location = input.location?.trim() || "";
  const gl = regionGl(input.searchRegion);

  const discovery = await discoverListing({
    businessName: input.businessName,
    website: input.website,
    category: category || undefined,
    location: location || undefined,
    phone: input.phone,
    placeId: parseGoogleMapsPlaceId(input.mapsPlaceId),
    gl,
  });

  let listing = attachListingPosition(discovery.listing, discovery.results);
  const results = discovery.results;
  const ll = discovery.ll;

  const competitionCategory = category || input.businessName;
  const competitionLocation = location || "";

  let mapsRank = 0;
  let mapsRankQuery = "";
  if (listing?.place_id && competitionLocation) {
    const rankResult = await fetchMapsCategoryRank({
      category: competitionCategory,
      location: competitionLocation,
      placeId: listing.place_id,
      businessName: input.businessName,
      ll,
      lat: listing.gps_coordinates?.latitude,
      lng: listing.gps_coordinates?.longitude,
      gl,
    });
    mapsRank = rankResult.rank;
    mapsRankQuery = rankResult.query;
    if (mapsRank > 0) {
      listing = { ...listing, position: mapsRank };
    }
  }

  const competitors = buildCompetitors(results, listing, input.businessName);
  const competitionAnalysis = analyzeCompetition({
    results,
    listing,
    category: competitionCategory,
    location: competitionLocation,
    businessName: input.businessName,
    mapsRank: mapsRank > 0 ? mapsRank : undefined,
    mapsRankQuery: mapsRankQuery || undefined,
  });

  return { competitors, competitionAnalysis };
}

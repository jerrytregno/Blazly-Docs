import type {
  BusinessDoc,
  CitationListing,
  DashboardDoc,
  RankingsDoc,
} from "@/types/firestore";
import {
  enrichCitationListingUrls,
  summarizeFranchiseListings,
} from "./citation-catalog";

export function hasAnalysisSeededFranchiseListings(
  rankings: RankingsDoc | null | undefined,
  dashboard?: DashboardDoc | null
): boolean {
  return Boolean(
    rankings?.citationHealth?.listings?.length ||
      dashboard?.analysisStatus === "complete" ||
      (dashboard?.metrics.citationHealth ?? 0) > 0
  );
}

export function resolveFranchiseListings(input: {
  business: BusinessDoc | null;
  rankings: RankingsDoc | null;
  dashboard?: DashboardDoc | null;
}) {
  const raw = input.rankings?.citationHealth?.listings ?? [];
  const listings = enrichCitationListingUrls(raw, {
    businessName: input.business?.name,
    mapsPlaceId: input.business?.mapsPlaceId ?? input.business?.businessId,
    address: input.business?.address,
    city: input.business?.city,
    state: input.business?.state,
    zip: input.business?.zip,
    phone: input.business?.phone,
    website: input.business?.website ?? input.business?.userWebsite,
  });

  const summary = summarizeFranchiseListings(listings);
  const liveCount = listings.filter((l) => l.status === "live").length;

  return {
    listings,
    liveCount,
    summary,
    hasData: hasAnalysisSeededFranchiseListings(input.rankings, input.dashboard),
  };
}

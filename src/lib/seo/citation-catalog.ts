import type {
  CitationListing,
  GbpAuditItem,
  GeoGridScan,
  ShareOfVoice,
  Keyword,
} from "@/types/firestore";
import type { LocalBusiness } from "@/types";

export { buildNapAudit, napListingSyncStatus } from "./nap-audit";

export const TOP_DIRECTORIES = [
  { name: "Google Business Profile", authority: 100, value: 100, submitable: true },
  { name: "Apple Maps", authority: 92, value: 88, submitable: true },
  { name: "Bing Places", authority: 85, value: 82, submitable: true },
  { name: "Facebook", authority: 78, value: 90, submitable: true },
  { name: "Yelp", authority: 88, value: 95, submitable: true },
  { name: "Yellow Pages", authority: 72, value: 70, submitable: true },
  { name: "Foursquare", authority: 65, value: 68, submitable: true },
  { name: "MapQuest", authority: 58, value: 55, submitable: true },
  { name: "TripAdvisor", authority: 80, value: 75, submitable: true },
  { name: "BBB", authority: 76, value: 72, submitable: true },
  { name: "Angi", authority: 74, value: 78, submitable: true },
  { name: "Nextdoor", authority: 70, value: 80, submitable: true },
] as const;

export function buildCitationListings(
  listing: LocalBusiness | null,
  citationScore: number
): CitationListing[] {
  const googleLive = Boolean(listing?.place_id);
  const estimatedListed = Math.round((citationScore / 100) * TOP_DIRECTORIES.length);

  return TOP_DIRECTORIES.map((dir, i) => {
    const isGoogle = dir.name === "Google Business Profile";
    let status: CitationListing["status"] = "missing";

    if (isGoogle) {
      status = googleLive ? "live" : "missing";
    } else if (i < estimatedListed) {
      status = "live";
    } else if (i === estimatedListed && citationScore < 50) {
      status = "dead";
    } else {
      status = "missing";
    }

    return {
      directory: dir.name,
      status,
      napMatch: status === "live",
      authority: dir.authority,
      value: dir.value,
      submitable: dir.submitable,
      profileName: isGoogle && googleLive ? listing?.title : undefined,
      url:
        isGoogle && googleLive && listing?.place_id
          ? `https://www.google.com/maps/place/?q=place_id:${listing.place_id}`
          : undefined,
    };
  });
}

export function buildGbpAuditChecklist(listing: LocalBusiness | null): GbpAuditItem[] {
  const types = listing?.types?.length ?? (listing?.type ? 1 : 0);
  const photos = listing?.images?.length ?? (listing?.thumbnail ? 1 : 0);
  const desc = listing?.description?.trim().length ?? 0;

  return [
    { label: "Business name verified on Google", passed: Boolean(listing?.title), priority: "high", tip: "Ensure your GBP name matches your real-world signage." },
    { label: "Primary category set", passed: types >= 1, priority: "high", tip: "Choose the most specific primary category for your business." },
    { label: "Secondary categories added", passed: types >= 2, priority: "medium", tip: "Add 2–3 relevant secondary categories." },
    { label: "Phone number listed", passed: Boolean(listing?.phone), priority: "high" },
    { label: "Website URL added", passed: Boolean(listing?.website), priority: "medium" },
    { label: "Business description (150+ chars)", passed: desc >= 150, priority: "medium", tip: "Include services, location, and differentiators." },
    { label: "Cover photo uploaded", passed: photos >= 1, priority: "medium" },
    { label: "5+ gallery photos", passed: photos >= 5, priority: "low", tip: "Businesses with 5+ photos get more engagement." },
    { label: "Hours of operation set", passed: Boolean(listing?.open_hours || listing?.hours || listing?.open_state), priority: "high" },
    { label: "No duplicate listings detected", passed: Boolean(listing?.place_id), priority: "high", tip: "Duplicate GBP listings can split reviews and hurt rankings." },
  ];
}

export function buildGeoGrid(
  listing: LocalBusiness | null,
  keyword: string
): GeoGridScan | null {
  if (!listing?.position) return null;

  const centerRank = listing.position;
  const size = 5;
  const points: GeoGridScan["points"] = [];

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const distFromCenter = Math.abs(row - 2) + Math.abs(col - 2);
      const variance = ((row * 3 + col) % 3) - 1;
      const rank = Math.max(1, Math.min(20, centerRank + distFromCenter + variance));
      points.push({ row, col, rank });
    }
  }

  const avgRank = Math.round(points.reduce((s, p) => s + p.rank, 0) / points.length);
  const top3 = points.filter((p) => p.rank <= 3).length;
  const visibilityScore = Math.round((top3 / points.length) * 100);

  return {
    keyword,
    centerRank,
    averageRank: avgRank,
    visibilityScore,
    points,
    scannedAt: new Date().toISOString(),
  };
}

export function buildShareOfVoice(
  listing: LocalBusiness | null,
  competitors: { name: string; reviews: number; isYou?: boolean }[],
  keywords: Keyword[] | string[]
): ShareOfVoice[] {
  const you = competitors.find((c) => c.isYou);
  const top = competitors.filter((c) => !c.isYou).sort((a, b) => b.reviews - a.reviews)[0];
  const yourReviews = you?.reviews ?? listing?.reviews ?? 0;
  const topReviews = top?.reviews ?? 1;
  const total = yourReviews + topReviews || 1;

  const baseShare = Math.round((yourReviews / total) * 100);
  const kws = keywords.length
    ? keywords.slice(0, 3).map((k) => (typeof k === "string" ? k : k.keyword))
    : ["local search"];

  return kws.map((kw) => ({
    keyword: kw,
    yourShare: baseShare,
    topCompetitor: top?.name ?? "Top competitor",
    competitorShare: 100 - baseShare,
  }));
}

export function competitorCitationGaps(
  citationListings: CitationListing[],
  competitorNames: string[]
): string[] {
  const missing = citationListings
    .filter((c) => c.status === "missing" && c.value >= 75)
    .map((c) => c.directory);

  if (!missing.length) return [];
  const leader = competitorNames[0] ?? "Top competitors";
  return missing.slice(0, 5).map((dir) => `${leader} is likely listed on ${dir} — you're not yet.`);
}

function encodeQuery(value: string): string {
  return encodeURIComponent(value.trim());
}

export function buildDirectoryProfileUrl(
  directory: string,
  input: {
    businessName: string;
    mapsPlaceId?: string;
    address?: string;
    city?: string;
    phone?: string;
    website?: string;
  }
): string | undefined {
  const name = input.businessName.trim();
  const location = [input.city, input.address].filter(Boolean).join(" ").trim();

  switch (directory) {
    case "Google Business Profile":
      return input.mapsPlaceId
        ? `https://www.google.com/maps/place/?q=place_id:${input.mapsPlaceId}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeQuery(name + " " + location)}`;
    case "Yelp":
      return `https://www.yelp.com/search?find_desc=${encodeQuery(name)}&find_loc=${encodeQuery(location || input.city || "")}`;
    case "Facebook":
      return `https://www.facebook.com/search/pages?q=${encodeQuery(name)}`;
    case "Apple Maps":
      return `https://maps.apple.com/?q=${encodeQuery(name + " " + location)}`;
    case "Bing Places":
      return `https://www.bing.com/maps?q=${encodeQuery(name + " " + location)}`;
    case "TripAdvisor":
      return `https://www.tripadvisor.com/Search?q=${encodeQuery(name + " " + location)}`;
    case "Yellow Pages":
      return `https://www.yellowpages.com/search?search_terms=${encodeQuery(name)}&geo_location_terms=${encodeQuery(location)}`;
    case "BBB":
      return `https://www.bbb.org/search?find_text=${encodeQuery(name)}&find_loc=${encodeQuery(location)}`;
    case "Angi":
      return `https://www.angi.com/companylist/${encodeQuery(location)}/${encodeQuery(name)}.htm`;
    case "Nextdoor":
      return `https://nextdoor.com/search/?query=${encodeQuery(name)}`;
    case "Foursquare":
      return `https://foursquare.com/explore?q=${encodeQuery(name)}&near=${encodeQuery(location)}`;
    case "MapQuest":
      return `https://www.mapquest.com/search/results?query=${encodeQuery(name + " " + location)}`;
    default:
      return input.website || undefined;
  }
}

export function buildDirectorySubmitUrl(directory: string): string | undefined {
  switch (directory) {
    case "Google Business Profile":
      return "https://www.google.com/business/";
    case "Apple Maps":
      return "https://register.apple.com/placesonmaps/";
    case "Bing Places":
      return "https://www.bingplaces.com/";
    case "Facebook":
      return "https://www.facebook.com/pages/create/";
    case "Yelp":
      return "https://biz.yelp.com/signup_business/new";
    case "Yellow Pages":
      return "https://www.yellowpages.com/add-business";
    case "Foursquare":
      return "https://foursquare.com/claim";
    case "TripAdvisor":
      return "https://www.tripadvisorsupport.com/hc/en-us/articles/200613837";
    case "BBB":
      return "https://www.bbb.org/get-listed";
    case "Angi":
      return "https://www.angi.com/companylist/claim";
    case "Nextdoor":
      return "https://business.nextdoor.com/";
  }
  return undefined;
}

export function enrichCitationListingUrls(
  listings: CitationListing[],
  input: {
    businessName?: string;
    mapsPlaceId?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    phone?: string;
    website?: string;
  }
): CitationListing[] {
  const businessName = input.businessName?.trim() || "Business";

  return listings.map((listing) => {
    const url =
      listing.url ??
      buildDirectoryProfileUrl(listing.directory, {
        businessName,
        mapsPlaceId: input.mapsPlaceId,
        address: input.address,
        city: input.city,
        phone: input.phone,
        website: input.website,
      });

    const submitUrl =
      listing.submitUrl ??
      (listing.status === "missing" || listing.status === "dead"
        ? buildDirectorySubmitUrl(listing.directory)
        : undefined);

    return {
      ...listing,
      profileName: listing.profileName ?? businessName,
      url,
      submitUrl,
    };
  });
}

export function summarizeFranchiseListings(listings: CitationListing[]) {
  const live = listings.filter((l) => l.status === "live").length;
  const missing = listings.filter((l) => l.status === "missing").length;
  const inactive = listings.filter((l) => l.status === "dead" || l.status === "duplicate").length;
  const total = listings.length || 1;
  const score = Math.round((live / total) * 100);

  return { live, missing, inactive, score, total };
}

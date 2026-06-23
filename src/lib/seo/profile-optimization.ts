import type { LocalBusiness } from "@/types";
import type {
  ProfileFieldAudit,
  ProfileOptimizationScores,
  ProfileSnapshot,
} from "@/types/firestore";
import {
  fetchGoogleMapsPlace,
  mergePlaceDetails,
  searchGoogleMaps,
} from "@/lib/searchapi";
import { buildGbpAuditChecklist } from "@/lib/seo/citation-catalog";
import { calculateLocalSeoScore } from "@/lib/seo/local-seo-score";
import { openHoursToWeekly } from "@/lib/seo/real-data";
import { normalizeWebsiteDomain, parseGoogleMapsPlaceId, extractPlaceNameFromMapsUrl } from "@/lib/seo/maps-place";

function clamp(n: number, min = 0, max = 100) {
  return Math.round(Math.max(min, Math.min(max, n)));
}

function imageCount(listing: LocalBusiness | null): number {
  if (!listing) return 0;
  if (listing.images?.length) return listing.images.length;
  return listing.thumbnail ? 1 : 0;
}

function extractServices(listing: LocalBusiness): string[] {
  const services: string[] = [];
  for (const ext of listing.extensions ?? []) {
    const title = ext.title?.toLowerCase() ?? "";
    if (
      title.includes("service") ||
      title.includes("offer") ||
      title.includes("amenities")
    ) {
      for (const item of ext.items ?? []) {
        const label = item.title ?? item.value;
        if (label) services.push(label);
      }
    }
  }
  return services;
}

function extractAttributes(listing: LocalBusiness): string[] {
  const attrs: string[] = [];
  for (const ext of listing.extensions ?? []) {
    const title = ext.title?.toLowerCase() ?? "";
    if (
      title.includes("attribute") ||
      title.includes("accessibility") ||
      title.includes("from the business") ||
      title.includes("crowd") ||
      title.includes("planning")
    ) {
      for (const item of ext.items ?? []) {
        const label = item.title ?? item.value;
        if (label) attrs.push(label);
      }
    }
  }
  if (!attrs.length && listing.extensions?.length) {
    for (const ext of listing.extensions) {
      for (const item of ext.items ?? []) {
        const label = item.title ?? item.value;
        if (label && attrs.length < 12) attrs.push(label);
      }
    }
  }
  return attrs;
}

function formatHoursSummary(listing: LocalBusiness): string {
  if (listing.hours) return listing.hours;
  if (listing.open_state) return listing.open_state;
  const weekly = openHoursToWeekly(listing);
  if (!weekly) return "";
  return weekly.map((d) => `${d.day}: ${d.hours}`).join(" · ");
}

export async function resolveListingForProfile(input: {
  websiteUrl?: string;
  mapsLink?: string;
  gl?: string;
}): Promise<LocalBusiness | null> {
  const mapsLink = input.mapsLink?.trim() ?? "";
  const placeId = parseGoogleMapsPlaceId(mapsLink);
  if (placeId) {
    const place = await fetchGoogleMapsPlace(placeId);
    const raw = place.place_result ?? place.local_results?.[0] ?? null;
    if (raw) return mergePlaceDetails(raw, place);
  }

  if (mapsLink) {
    const placeName = extractPlaceNameFromMapsUrl(mapsLink);
    const queries = [...new Set([placeName, mapsLink].filter(Boolean))] as string[];
    for (const q of queries) {
      const search = await searchGoogleMaps({ q, gl: input.gl });
      const results = search.local_results ?? [];
      const top = results[0];
      if (top?.place_id) {
        const place = await fetchGoogleMapsPlace(top.place_id);
        return mergePlaceDetails(top, place);
      }
      if (top) return top;
    }
  }

  const domain = normalizeWebsiteDomain(input.websiteUrl);
  if (domain) {
    const search = await searchGoogleMaps({ q: domain, gl: input.gl });
    const results = search.local_results ?? [];
    const match =
      results.find((r) => normalizeWebsiteDomain(r.website) === domain) ??
      results[0];
    if (match?.place_id) {
      const place = await fetchGoogleMapsPlace(match.place_id);
      return mergePlaceDetails(match, place);
    }
    return match ?? null;
  }

  return null;
}

export function buildProfileSnapshot(listing: LocalBusiness): ProfileSnapshot {
  const types = listing.types ?? (listing.type ? [listing.type] : []);
  const weeklyHours = openHoursToWeekly(listing) ?? [];

  return {
    name: listing.title ?? "",
    address: listing.address ?? "",
    phone: listing.phone ?? "",
    website: listing.website ?? "",
    primaryCategory: types[0] ?? listing.type ?? "",
    additionalCategories: types.slice(1),
    hoursSummary: formatHoursSummary(listing),
    weeklyHours,
    reviewsCount: listing.reviews ?? 0,
    averageRating: listing.rating ?? 0,
    description: listing.description ?? "",
    photosCount: imageCount(listing),
    services: extractServices(listing),
    attributes: extractAttributes(listing),
    placeId: listing.place_id ?? "",
  };
}

export function buildFieldAudit(
  listing: LocalBusiness | null,
  snapshot: ProfileSnapshot | null
): ProfileFieldAudit[] {
  if (!listing || !snapshot) {
    return [
      {
        field: "listing",
        label: "Google Business Profile",
        status: "missing",
        tip: "Provide a valid Google Maps link to fetch your profile.",
      },
    ];
  }

  const descLen = snapshot.description.trim().length;
  const hoursComplete =
    snapshot.weeklyHours.length >= 5 ||
    Boolean(snapshot.hoursSummary && snapshot.hoursSummary.length > 10);

  return [
    {
      field: "name",
      label: "Business name",
      status: snapshot.name ? "complete" : "missing",
      value: snapshot.name || undefined,
    },
    {
      field: "address",
      label: "Address",
      status: snapshot.address ? "complete" : "missing",
      value: snapshot.address || undefined,
    },
    {
      field: "phone",
      label: "Phone number",
      status: snapshot.phone ? "complete" : "missing",
      value: snapshot.phone || undefined,
      tip: "A visible phone number improves trust and local pack CTR.",
    },
    {
      field: "website",
      label: "Website",
      status: snapshot.website ? "complete" : "missing",
      value: snapshot.website || undefined,
      tip: "Link your website to drive traffic from Google Maps.",
    },
    {
      field: "category",
      label: "Primary category",
      status: snapshot.primaryCategory ? "complete" : "missing",
      value: snapshot.primaryCategory || undefined,
    },
    {
      field: "categories",
      label: "Additional categories",
      status:
        snapshot.additionalCategories.length >= 2
          ? "complete"
          : snapshot.additionalCategories.length === 1
            ? "incomplete"
            : "missing",
      value:
        snapshot.additionalCategories.length > 0
          ? snapshot.additionalCategories.join(", ")
          : undefined,
      tip: "Add 2–3 relevant secondary categories.",
    },
    {
      field: "hours",
      label: "Business hours",
      status: hoursComplete ? "complete" : snapshot.hoursSummary ? "incomplete" : "missing",
      value: snapshot.hoursSummary || undefined,
      tip: "Complete weekly hours help customers visit at the right time.",
    },
    {
      field: "description",
      label: "Business description",
      status:
        descLen >= 150 ? "complete" : descLen > 0 ? "incomplete" : "missing",
      value: descLen > 0 ? `${descLen} characters` : undefined,
      tip: "Aim for 150+ characters with local keywords and services.",
    },
    {
      field: "photos",
      label: "Photos",
      status:
        snapshot.photosCount >= 10
          ? "complete"
          : snapshot.photosCount >= 1
            ? "incomplete"
            : "missing",
      value: snapshot.photosCount ? `${snapshot.photosCount} photos` : undefined,
      tip: "Businesses with 10+ photos tend to get more engagement.",
    },
    {
      field: "reviews",
      label: "Reviews",
      status:
        snapshot.reviewsCount >= 30
          ? "complete"
          : snapshot.reviewsCount > 0
            ? "incomplete"
            : "missing",
      value: snapshot.reviewsCount
        ? `${snapshot.reviewsCount} reviews · ${snapshot.averageRating}★`
        : undefined,
    },
    {
      field: "services",
      label: "Services",
      status:
        snapshot.services.length >= 3
          ? "complete"
          : snapshot.services.length > 0
            ? "incomplete"
            : "missing",
      value:
        snapshot.services.length > 0
          ? snapshot.services.slice(0, 5).join(", ")
          : undefined,
    },
    {
      field: "attributes",
      label: "Attributes",
      status:
        snapshot.attributes.length >= 3
          ? "complete"
          : snapshot.attributes.length > 0
            ? "incomplete"
            : "missing",
      value:
        snapshot.attributes.length > 0
          ? snapshot.attributes.slice(0, 4).join(", ")
          : undefined,
    },
  ];
}

export function computeProfileScores(
  listing: LocalBusiness | null,
  snapshot: ProfileSnapshot | null,
  fieldAudit: ProfileFieldAudit[]
): ProfileOptimizationScores {
  if (!listing || !snapshot) {
    return {
      profileCompleteness: 0,
      localSeo: 0,
      reputation: 0,
      visibility: 0,
    };
  }

  const checklist = buildGbpAuditChecklist(listing);
  const passed = checklist.filter((c) => c.passed).length;
  const profileCompleteness = clamp((passed / checklist.length) * 100);

  const { score: localSeo, factors: localSeoFactors } = calculateLocalSeoScore({
    listing,
    business: {
      name: snapshot.name,
      website: snapshot.website,
      phone: snapshot.phone,
      address: snapshot.address,
    },
  });

  const ratingPart = Math.min((snapshot.averageRating / 5) * 100, 100);
  const reviewVolume = Math.min((snapshot.reviewsCount / 50) * 100, 100);
  const reputation = clamp(ratingPart * 0.55 + reviewVolume * 0.45);

  const photoScore = Math.min((snapshot.photosCount / 10) * 100, 100);
  const hoursScore = snapshot.weeklyHours.length >= 5 ? 100 : snapshot.hoursSummary ? 50 : 0;
  const serviceScore = Math.min((snapshot.services.length / 5) * 100, 100);
  const categoryScore =
    snapshot.primaryCategory && snapshot.additionalCategories.length >= 1
      ? 100
      : snapshot.primaryCategory
        ? 70
        : 0;
  const descScore = Math.min((snapshot.description.length / 150) * 100, 100);
  const visibility = clamp(
    photoScore * 0.35 +
      descScore * 0.25 +
      hoursScore * 0.2 +
      serviceScore * 0.1 +
      categoryScore * 0.1
  );

  return {
    profileCompleteness,
    localSeo,
    reputation,
    visibility,
    localSeoFactors,
  };
}

export async function runProfileAnalysis(input: {
  websiteUrl?: string;
  mapsLink?: string;
  gl?: string;
}) {
  const mapsLink = input.mapsLink?.trim() ?? "";

  if (!mapsLink) {
    throw new Error("Enter a Google Maps link or Place ID.");
  }

  const listing = await resolveListingForProfile({
    mapsLink,
    gl: input.gl,
  });

  if (!listing) {
    throw new Error(
      "Could not find a Google Business Profile. Check your Google Maps link."
    );
  }

  const snapshot = buildProfileSnapshot(listing);
  const fieldAudit = buildFieldAudit(listing, snapshot);
  const scores = computeProfileScores(listing, snapshot, fieldAudit);

  return {
    websiteUrl: "",
    mapsLink,
    snapshot,
    fieldAudit,
    scores,
    analyzedAt: new Date().toISOString(),
    error: null,
  };
}

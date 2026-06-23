import type { GoogleMapsSearchResponse, LocalBusiness } from "@/types";

const SEARCHAPI_BASE = "https://www.searchapi.io/api/v1/search";

export interface MapsSearchParams {
  q: string;
  ll?: string;
  hl?: string;
  gl?: string;
  page?: number;
}

export interface GoogleMapsReview {
  review_id?: string;
  rating?: number;
  snippet?: string;
  text?: string;
  description?: string;
  date?: string;
  iso_date?: string;
  source?: string;
  user?: {
    name?: string;
    thumbnail?: string;
  };
  response?: {
    date?: string;
    iso_date?: string;
    snippet?: string;
    text?: string;
    extracted_snippet?: {
      original?: string;
      translated?: string;
    };
  };
  owner_response_text?: string;
}

export interface GoogleMapsReviewsResponse {
  place_result?: {
    title?: string;
    rating?: number;
    reviews?: number;
    reviews_histogram?: Record<string, number>;
  };
  reviews?: GoogleMapsReview[];
  pagination?: {
    next_page_token?: string;
  };
  error?: string;
}

export interface GoogleMapsPlaceResponse {
  place_result?: LocalBusiness & {
    review_results?: {
      reviews?: Array<{
        review_id?: string;
        rating?: number;
        description?: string;
        date?: string;
        user?: { name?: string };
      }>;
    };
    reviews_histogram?: Record<string, number>;
  };
  local_results?: LocalBusiness[];
  error?: string;
}

function getApiKey() {
  const apiKey = process.env.SEARCHAPI_API_KEY;
  if (!apiKey) throw new Error("SEARCHAPI_API_KEY is not configured");
  return apiKey;
}

async function searchApiRequest<T>(params: Record<string, string>): Promise<T> {
  const searchParams = new URLSearchParams({
    api_key: getApiKey(),
    ...params,
  });

  const response = await fetch(`${SEARCHAPI_BASE}?${searchParams}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SearchAPI error: ${response.status} — ${text}`);
  }

  return response.json() as Promise<T>;
}

export async function searchGoogleMaps(
  params: MapsSearchParams
): Promise<GoogleMapsSearchResponse> {
  const query: Record<string, string> = {
    engine: "google_maps",
    q: params.q,
  };

  if (params.ll) query.ll = params.ll;
  if (params.hl) query.hl = params.hl;
  if (params.gl) query.gl = params.gl;
  if (params.page) query.page = String(params.page);

  return searchApiRequest<GoogleMapsSearchResponse>(query);
}

export function buildCoordinates(lat: number, lng: number, zoom = 12): string {
  return `@${lat},${lng},${zoom}z`;
}

export async function geocodeLocation(
  location: string,
  gl?: string
): Promise<string | null> {
  try {
    const data = await searchGoogleMaps({ q: location, gl });
    const first = data.local_results?.[0];
    if (first?.gps_coordinates) {
      return buildCoordinates(
        first.gps_coordinates.latitude,
        first.gps_coordinates.longitude
      );
    }
  } catch {
    return null;
  }
  return null;
}

export async function fetchGoogleMapsPlace(
  placeId: string
): Promise<GoogleMapsPlaceResponse> {
  return searchApiRequest<GoogleMapsPlaceResponse>({
    engine: "google_maps_place",
    place_id: placeId,
  });
}

export async function fetchGoogleMapsReviews(
  placeId: string,
  options: {
    num?: number;
    sort_by?: "newest" | "most_relevant" | "highest_rating" | "lowest_rating";
    next_page_token?: string;
    gl?: string;
    hl?: string;
  } = {}
): Promise<GoogleMapsReviewsResponse> {
  const num = Math.min(options.num ?? 20, 20);
  const query: Record<string, string> = {
    engine: "google_maps_reviews",
    place_id: placeId,
    num: String(num),
    sort_by: options.sort_by ?? "newest",
  };
  if (options.next_page_token) query.next_page_token = options.next_page_token;
  if (options.gl) query.gl = options.gl;
  if (options.hl) query.hl = options.hl;
  return searchApiRequest<GoogleMapsReviewsResponse>(query);
}

export async function searchAtCoordinates(
  q: string,
  lat: number,
  lng: number,
  zoom = 14,
  gl?: string
): Promise<GoogleMapsSearchResponse> {
  return searchGoogleMaps({
    q,
    ll: buildCoordinates(lat, lng, zoom),
    gl,
  });
}

export function mergePlaceDetails(
  listing: LocalBusiness,
  place: GoogleMapsPlaceResponse
): LocalBusiness {
  const detail =
    place.place_result ??
    place.local_results?.[0] ??
    listing;

  return {
    ...listing,
    ...detail,
    place_id: listing.place_id ?? detail.place_id,
    title: detail.title ?? listing.title,
    description: detail.description ?? listing.description,
    open_hours: detail.open_hours ?? listing.open_hours,
    hours: detail.hours ?? listing.hours,
    images: detail.images ?? listing.images,
    extensions: detail.extensions ?? listing.extensions,
    reviews_histogram:
      (detail as LocalBusiness & { reviews_histogram?: Record<string, number> })
        .reviews_histogram ?? listing.reviews_histogram,
  };
}

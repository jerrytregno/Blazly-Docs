/**
 * Parse a Google Maps Place ID from a raw ID string or Maps URL.
 */
export function parseGoogleMapsPlaceId(input?: string | null): string | undefined {
  if (!input?.trim()) return undefined;
  const trimmed = input.trim();

  if (/^ChI[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = trimmed.includes("://") ? new URL(trimmed) : new URL(`https://${trimmed}`);
    const placeIdParam = url.searchParams.get("place_id");
    if (placeIdParam) return decodeURIComponent(placeIdParam);

    const qParam = url.searchParams.get("q");
    if (qParam?.startsWith("place_id:")) {
      return qParam.slice("place_id:".length);
    }
  } catch {
    // not a URL — continue with pattern matching
  }

  const chijInData = trimmed.match(/!1s(ChI[a-zA-Z0-9_-]+)/);
  if (chijInData) return chijInData[1];

  const placeIdInQuery = trimmed.match(/[?&]place_id=([^&]+)/);
  if (placeIdInQuery) return decodeURIComponent(placeIdInQuery[1]);

  return undefined;
}

/** Stable key for comparing maps links / place IDs */
export function normalizeMapsKey(input?: string | null): string {
  if (!input?.trim()) return "";
  const parsed = parseGoogleMapsPlaceId(input);
  if (parsed) return parsed;
  return input.trim().toLowerCase();
}

export function isLikelyMapsLink(input?: string | null): boolean {
  if (!input?.trim()) return false;
  const t = input.trim();
  if (/^ChI[a-zA-Z0-9_-]{20,}$/.test(t)) return true;
  return /google\.com\/maps|maps\.app\.goo\.gl|goo\.gl\/maps/i.test(t);
}

export function extractPlaceNameFromMapsUrl(link: string): string | undefined {
  try {
    const decoded = decodeURIComponent(link);
    const match = decoded.match(/\/maps\/place\/([^/@?]+)/i);
    if (match?.[1]) {
      return match[1].replace(/\+/g, " ").trim();
    }
  } catch {
    // ignore
  }
  return undefined;
}

export function normalizeWebsiteDomain(url?: string | null): string {
  if (!url?.trim()) return "";
  try {
    const withProto = url.includes("://") ? url : `https://${url}`;
    return new URL(withProto).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return url
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split("/")[0]
      .toLowerCase();
  }
}

export function hasBusinessWebsite(...urls: Array<string | null | undefined>): boolean {
  return urls.some((url) => Boolean(normalizeWebsiteDomain(url)));
}

/** Normalize a user-entered website URL for storage and display */
export function normalizeUserWebsite(url?: string | null): string {
  const raw = url?.trim();
  if (!raw) return "";
  return raw.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

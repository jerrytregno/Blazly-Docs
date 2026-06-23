export interface SearchRegion {
  id: string;
  label: string;
  flag: string;
  gl?: string;
}

export const SEARCH_REGIONS: SearchRegion[] = [
  { id: "us", label: "United States", flag: "🇺🇸", gl: "us" },
  { id: "uk", label: "United Kingdom", flag: "🇬🇧", gl: "uk" },
  { id: "ca", label: "Canada", flag: "🇨🇦", gl: "ca" },
  { id: "au", label: "Australia", flag: "🇦🇺", gl: "au" },
  { id: "in", label: "India", flag: "🇮🇳", gl: "in" },
  { id: "de", label: "Germany", flag: "🇩🇪", gl: "de" },
  { id: "fr", label: "France", flag: "🇫🇷", gl: "fr" },
  { id: "ae", label: "United Arab Emirates", flag: "🇦🇪", gl: "ae" },
  { id: "sg", label: "Singapore", flag: "🇸🇬", gl: "sg" },
  { id: "nl", label: "Netherlands", flag: "🇳🇱", gl: "nl" },
  { id: "es", label: "Spain", flag: "🇪🇸", gl: "es" },
  { id: "it", label: "Italy", flag: "🇮🇹", gl: "it" },
  { id: "br", label: "Brazil", flag: "🇧🇷", gl: "br" },
  { id: "mx", label: "Mexico", flag: "🇲🇽", gl: "mx" },
];

export const DEFAULT_SEARCH_REGION = "us";

const COUNTRY_TO_REGION: Record<string, string> = {
  "united states": "us",
  usa: "us",
  us: "us",
  "united kingdom": "uk",
  uk: "uk",
  canada: "ca",
  australia: "au",
  india: "in",
  germany: "de",
  france: "fr",
  "united arab emirates": "ae",
  uae: "ae",
  singapore: "sg",
  netherlands: "nl",
  spain: "es",
  italy: "it",
  brazil: "br",
  mexico: "mx",
};

export function getSearchRegion(id?: string | null): SearchRegion {
  const found = SEARCH_REGIONS.find((r) => r.id === id);
  return found ?? SEARCH_REGIONS.find((r) => r.id === DEFAULT_SEARCH_REGION)!;
}

export function regionIdFromCountry(country?: string | null): string | undefined {
  if (!country?.trim()) return undefined;
  const key = country.trim().toLowerCase();
  return COUNTRY_TO_REGION[key];
}

export function resolveSearchRegionId(
  dashboardRegion?: string | null,
  businessCountry?: string | null
): string {
  if (dashboardRegion && getSearchRegion(dashboardRegion).id === dashboardRegion) {
    return dashboardRegion;
  }
  return regionIdFromCountry(businessCountry) ?? DEFAULT_SEARCH_REGION;
}

export function regionGl(id?: string | null): string | undefined {
  const region = getSearchRegion(id ?? DEFAULT_SEARCH_REGION);
  return region.gl;
}

export function regionDisplayLabel(id?: string | null): string {
  return getSearchRegion(id ?? DEFAULT_SEARCH_REGION).label;
}

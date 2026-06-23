import type { BusinessDoc } from "@/types/firestore";

function isValidPostalCode(zip?: string): boolean {
  const value = zip?.trim() ?? "";
  if (!value || value === "0") return false;
  return /\d{4,}/.test(value);
}

export function resolveSearchLocation(business: Partial<BusinessDoc>): string {
  const parts = [
    business.city,
    business.state,
    isValidPostalCode(business.zip) ? business.zip : "",
  ]
    .map((v) => v?.trim())
    .filter(Boolean);
  if (parts.length) return parts.join(", ");
  return business.city?.trim() || business.address?.trim() || "";
}

export function resolveAnalysisLocation(
  business: Partial<BusinessDoc>,
  profileLocation?: string
): string {
  const fromBusiness = resolveSearchLocation(business);
  if (fromBusiness) return fromBusiness;
  return profileLocation?.trim() || "";
}

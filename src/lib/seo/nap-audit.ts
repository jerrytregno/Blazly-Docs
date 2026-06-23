import type { NapAudit, NapField } from "@/types/firestore";
import type { LocalBusiness } from "@/types";

function normalizePhone(value: string): string {
  return value.replace(/\D/g, "").slice(-10);
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseListingAddress(address?: string) {
  if (!address) return { street: "", city: "", state: "", zip: "" };
  const parts = address.split(",").map((p) => p.trim());
  const zipMatch = parts[parts.length - 1]?.match(/\d{5}(-\d{4})?/);
  const zip = zipMatch?.[0] ?? "";
  const statePart = parts.length >= 2 ? parts[parts.length - 2] : "";
  const state = statePart.replace(/\d{5}(-\d{4})?/, "").trim();
  const city = parts.length >= 3 ? parts[parts.length - 3] : parts.length >= 2 ? parts[0] : "";
  const street = parts.length >= 3 ? parts.slice(0, -2).join(", ") : parts[0] ?? "";
  return { street, city, state, zip };
}

function fieldMatch(a: string, b: string, mode: "text" | "phone" = "text"): boolean {
  if (!a.trim() || !b.trim()) return false;
  if (mode === "phone") {
    const na = normalizePhone(a);
    const nb = normalizePhone(b);
    return na.length >= 10 && nb.length >= 10 && na === nb;
  }
  const na = normalizeText(a);
  const nb = normalizeText(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}

function buildField(
  field: string,
  gbpValue: string,
  profileValue: string,
  mode: "text" | "phone" = "text"
): NapField {
  const hasGbp = Boolean(gbpValue.trim());
  const hasProfile = Boolean(profileValue.trim());
  const consistent =
    hasGbp && hasProfile
      ? fieldMatch(gbpValue, profileValue, mode)
      : hasGbp && !hasProfile
        ? true
        : !hasGbp && hasProfile
          ? false
          : false;

  return {
    field,
    gbpValue: gbpValue || "—",
    webValue: profileValue || "—",
    consistent,
  };
}

export function buildNapAudit(
  listing: LocalBusiness | null,
  business: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
  }
): NapAudit {
  const parsed = parseListingAddress(listing?.address);
  const gbpName = listing?.title ?? "";
  const gbpPhone = listing?.phone ?? "";
  const gbpStreet = parsed.street || listing?.address?.split(",")[0]?.trim() || "";
  const gbpCity = parsed.city;
  const gbpState = parsed.state;
  const gbpZip = parsed.zip;

  const profileName = business.name ?? "";
  const profilePhone = business.phone ?? "";
  const profileStreet = business.address ?? "";
  const profileCity = business.city ?? "";
  const profileState = business.state ?? "";
  const profileZip = business.zip ?? "";

  const fields: NapField[] = [
    buildField("Business Name", gbpName, profileName),
    buildField("Phone Number", gbpPhone, profilePhone, "phone"),
    buildField("Street Address", gbpStreet, profileStreet),
    buildField("City", gbpCity, profileCity),
    buildField("State", gbpState, profileState),
    buildField("ZIP Code", gbpZip, profileZip),
  ];

  if (!listing?.place_id) {
    const profileComplete = [profileName, profilePhone, profileStreet, profileCity].filter(
      (v) => v.trim().length > 0
    ).length;
    const score = listing
      ? Math.round((fields.filter((f) => f.consistent).length / fields.length) * 100)
      : Math.round((profileComplete / 4) * 40);

    return {
      score,
      fields,
      duplicateListings: listing ? 0 : 1,
    };
  }

  const passed = fields.filter((f) => f.consistent).length;
  const score = Math.round((passed / fields.length) * 100);

  return {
    score,
    fields,
    duplicateListings: 0,
  };
}

export function napListingSyncStatus(
  listing: LocalBusiness | null,
  napAudit: NapAudit
): "synced" | "pending" | "issues" {
  if (!listing?.place_id) return "pending";
  if (napAudit.score >= 80 && napAudit.duplicateListings === 0) return "synced";
  return "issues";
}

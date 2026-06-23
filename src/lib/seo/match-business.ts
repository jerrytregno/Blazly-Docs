import type { LocalBusiness } from "@/types";
import { normalizeWebsiteDomain } from "./maps-place";

function normalize(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePhone(phone?: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  return digits.slice(-10);
}

function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  const aWords = new Set(na.split(" "));
  const bWords = nb.split(" ");
  const overlap = bWords.filter((w) => aWords.has(w)).length;
  return overlap / Math.max(aWords.size, bWords.length);
}

export interface BusinessMatchOptions {
  location?: string;
  website?: string;
  phone?: string;
}

function resolveOptions(options?: string | BusinessMatchOptions): BusinessMatchOptions {
  if (typeof options === "string") return { location: options };
  return options ?? {};
}

export function scoreBusinessMatch(
  result: LocalBusiness,
  businessName: string,
  options?: string | BusinessMatchOptions
): number {
  const opts = resolveOptions(options);
  const title = result.title ?? "";
  let score = similarity(businessName, title);

  const locationNorm = opts.location ? normalize(opts.location) : "";
  if (locationNorm && result.address) {
    const addrNorm = normalize(result.address);
    if (
      addrNorm.includes(locationNorm) ||
      locationNorm.split(" ").some((p) => p.length > 3 && addrNorm.includes(p))
    ) {
      score += 0.15;
    }
  }

  const inputDomain = normalizeWebsiteDomain(opts.website);
  if (inputDomain && result.website) {
    const resultDomain = normalizeWebsiteDomain(result.website);
    if (
      resultDomain &&
      (resultDomain === inputDomain ||
        resultDomain.endsWith(`.${inputDomain}`) ||
        inputDomain.endsWith(`.${resultDomain}`))
    ) {
      score += 0.25;
    }
  }

  const inputPhone = normalizePhone(opts.phone);
  const resultPhone = normalizePhone(result.phone);
  if (inputPhone && resultPhone && inputPhone === resultPhone) {
    score += 0.2;
  }

  if (result.position === 1) score += 0.02;

  return Math.min(score, 1);
}

export function findBestBusinessMatch(
  results: LocalBusiness[],
  businessName: string,
  options?: string | BusinessMatchOptions
): LocalBusiness | null {
  if (!results.length) return null;

  let best: LocalBusiness | null = null;
  let bestScore = 0;

  for (const result of results) {
    const score = scoreBusinessMatch(result, businessName, options);
    if (score > bestScore) {
      bestScore = score;
      best = result;
    }
  }

  return bestScore >= 0.4 ? best : results[0] ?? null;
}

export function getMatchConfidence(
  listing: LocalBusiness | null,
  businessName: string,
  options?: string | BusinessMatchOptions
): number {
  if (!listing) return 0;
  return scoreBusinessMatch(listing, businessName, options);
}

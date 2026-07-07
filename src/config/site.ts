/** Production docs site URL (Vercel custom domain). */
export const DOCS_SITE_URL = "https://docs.blazly.ai";

/** Resolves the public site origin for metadata, sitemap, and canonical URLs. */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_DOCS_SITE_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  return DOCS_SITE_URL;
}

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}

import { DOC_PRODUCTS } from "@/content/docs/generated-data";

export interface DocNavArticle {
  slug: string;
  title: string;
}

export interface DocNavProduct {
  slug: string;
  name: string;
  shortName: string;
  articles: DocNavArticle[];
}

/** Sidebar and home page product order — Blazly SEO first, Local SEO last. */
const PRODUCT_NAV_ORDER = [
  "seo",
  "geo",
  "backlinker",
  "lead-engine",
  "social",
  "local-seo",
] as const;

function toNavProduct(
  product: (typeof DOC_PRODUCTS)[number]
): DocNavProduct {
  return {
    slug: product.slug,
    name: product.name,
    shortName: product.name.replace(/^Blazly\s+/i, ""),
    articles: product.articles.map((article) => ({
      slug: article.slug,
      title: article.title,
    })),
  };
}

export const DOCS_NAV: DocNavProduct[] = PRODUCT_NAV_ORDER.map((slug) => {
  const product = DOC_PRODUCTS.find((entry) => entry.slug === slug);
  if (!product) {
    throw new Error(`Missing docs product for nav slug: ${slug}`);
  }
  return toNavProduct(product);
});

/** Blazly marketing site URL per product docs section */
export const PRODUCT_WEBSITE_URLS: Record<string, string> = {
  "local-seo": "https://www.blazly.ai/products/local-seo",
  geo: "https://www.blazly.ai/generative-engine-optimization",
  backlinker: "https://www.blazly.ai/products/backlinks",
  "lead-engine": "https://www.blazly.ai/lead-engine",
  social: "https://www.blazly.ai/products/social",
  seo: "https://www.blazly.ai/ai-content-operating-system",
};

export const DEFAULT_WEBSITE_URL = "https://www.blazly.ai/";

/** Product app signup URL per docs section */
export const PRODUCT_SIGNUP_URLS: Record<string, string> = {
  "local-seo": "https://localseo.blazly.ai/signup",
  geo: "https://geo.blazly.ai/signup",
  backlinker: "https://backlinker.blazly.ai/signup",
  "lead-engine": "https://chatbot.blazly.ai/signup",
  social: "https://social.blazly.ai/signup",
  seo: "https://seo.blazly.ai/signup",
};

export const DEFAULT_SIGNUP_URL = "https://localseo.blazly.ai/signup";

export function productSlugFromPathname(pathname: string): string | undefined {
  const match = pathname.match(/^\/docs\/([^/]+)/);
  return match?.[1];
}

export function getWebsiteUrlForPathname(pathname: string): string {
  const productSlug = productSlugFromPathname(pathname);
  if (!productSlug) return DEFAULT_WEBSITE_URL;
  return PRODUCT_WEBSITE_URLS[productSlug] ?? DEFAULT_WEBSITE_URL;
}

export function getSignupUrlForPathname(pathname: string): string {
  const productSlug = productSlugFromPathname(pathname);
  if (!productSlug) return DEFAULT_SIGNUP_URL;
  return PRODUCT_SIGNUP_URLS[productSlug] ?? DEFAULT_SIGNUP_URL;
}

export function getProductNav(productSlug: string): DocNavProduct | undefined {
  return DOCS_NAV.find((p) => p.slug === productSlug);
}

export function articlePath(productSlug: string, articleSlug: string): string {
  return `/docs/${productSlug}/${articleSlug}`;
}

export function defaultArticleForProduct(productSlug: string): DocNavArticle | undefined {
  return getProductNav(productSlug)?.articles[0];
}

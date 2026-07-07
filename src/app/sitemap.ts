import type { MetadataRoute } from "next";
import { DOCS_NAV, articlePath } from "@/config/docs-navigation";
import { getSiteUrl } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const lastModified = new Date();

  const docPages: MetadataRoute.Sitemap = DOCS_NAV.flatMap((product) =>
    product.articles.map((article) => ({
      url: `${base}${articlePath(product.slug, article.slug)}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }))
  );

  return [
    {
      url: `${base}/docs`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...docPages,
  ];
}

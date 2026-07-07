import { DOC_PRODUCTS } from "./generated-data";
import type { DocArticle, DocProduct, DocSearchResult } from "./types";

export type { DocBlock, DocArticle, DocProduct, DocSearchResult } from "./types";

export { DOC_PRODUCTS };

export function getProduct(productSlug: string): DocProduct | undefined {
  return DOC_PRODUCTS.find((p) => p.slug === productSlug);
}

export function getArticle(
  productSlug: string,
  articleSlug: string
): (DocArticle & { product: DocProduct }) | undefined {
  const product = getProduct(productSlug);
  if (!product) return undefined;
  const article = product.articles.find((a) => a.slug === articleSlug);
  if (!article) return undefined;
  return { ...article, product };
}

export function getFirstArticle(productSlug: string): DocArticle | undefined {
  return getProduct(productSlug)?.articles[0];
}

export function allArticles(): Array<DocArticle & { product: DocProduct }> {
  return DOC_PRODUCTS.flatMap((product) =>
    product.articles.map((article) => ({ ...article, product }))
  );
}

export function articleHref(productSlug: string, articleSlug: string): string {
  return `/docs/${productSlug}/${articleSlug}`;
}

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);
}

function scoreArticle(
  query: string,
  tokens: string[],
  product: DocProduct,
  article: DocArticle
): number {
  const title = article.title.toLowerCase();
  const productName = product.name.toLowerCase();
  const body = article.searchText.toLowerCase();
  const q = query.toLowerCase();

  let score = 0;

  if (title === q) score += 100;
  if (title.includes(q)) score += 60;
  if (productName.includes(q)) score += 40;

  for (const token of tokens) {
    if (title.includes(token)) score += 25;
    if (productName.includes(token)) score += 15;
    if (body.includes(token)) score += 8;
  }

  return score;
}

function snippetFor(article: DocArticle, tokens: string[]): string {
  if (article.description) return article.description;
  const lower = article.searchText.toLowerCase();
  for (const token of tokens) {
    const idx = lower.indexOf(token);
    if (idx >= 0) {
      const start = Math.max(0, idx - 40);
      return article.searchText.slice(start, start + 120).trim() + "…";
    }
  }
  return article.searchText.slice(0, 120).trim() + "…";
}

export function searchDocs(query: string, limit = 12): DocSearchResult[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return allArticles()
      .slice(0, limit)
      .map((a) => ({
        productSlug: a.product.slug,
        productName: a.product.name.replace(/^Blazly\s+/i, ""),
        articleSlug: a.slug,
        articleTitle: a.title,
        href: articleHref(a.product.slug, a.slug),
        score: 0,
        snippet: a.description || a.title,
      }));
  }

  const tokens = tokenize(trimmed);
  const results: DocSearchResult[] = [];

  for (const product of DOC_PRODUCTS) {
    for (const article of product.articles) {
      const score = scoreArticle(trimmed, tokens, product, article);
      if (score > 0) {
        results.push({
          productSlug: product.slug,
          productName: product.name.replace(/^Blazly\s+/i, ""),
          articleSlug: article.slug,
          articleTitle: article.title,
          href: articleHref(product.slug, article.slug),
          score,
          snippet: snippetFor(article, tokens),
        });
      }
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function bestSearchMatch(query: string): DocSearchResult | undefined {
  return searchDocs(query, 1)[0];
}

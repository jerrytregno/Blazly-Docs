export type DocBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

export interface DocArticle {
  slug: string;
  title: string;
  description: string;
  searchText: string;
  blocks: DocBlock[];
}

export interface DocProduct {
  slug: string;
  name: string;
  articles: DocArticle[];
}

export interface DocSearchResult {
  productSlug: string;
  productName: string;
  articleSlug: string;
  articleTitle: string;
  href: string;
  score: number;
  snippet: string;
}

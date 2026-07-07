import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DOCS_NAV, articlePath } from "@/config/docs-navigation";
import { getArticle } from "@/content/docs";
import { absoluteUrl } from "@/config/site";
import { DocsContentRenderer } from "@/components/docs/docs-content-renderer";

interface PageProps {
  params: Promise<{ productSlug: string; articleSlug: string }>;
}

export function generateStaticParams() {
  return DOCS_NAV.flatMap((product) =>
    product.articles.map((article) => ({
      productSlug: product.slug,
      articleSlug: article.slug,
    }))
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { productSlug, articleSlug } = await params;
  const article = getArticle(productSlug, articleSlug);
  if (!article) return { title: "Documentation" };
  return {
    title: `${article.title} — ${article.product.name}`,
    description: article.description || article.title,
    alternates: {
      canonical: absoluteUrl(articlePath(productSlug, articleSlug)),
    },
  };
}

export default async function DocArticlePage({ params }: PageProps) {
  const { productSlug, articleSlug } = await params;
  const article = getArticle(productSlug, articleSlug);
  if (!article) notFound();

  const flat = DOCS_NAV.flatMap((p) =>
    p.articles.map((a) => ({ product: p, article: a }))
  );
  const index = flat.findIndex(
    (item) => item.product.slug === productSlug && item.article.slug === articleSlug
  );
  const prev = index > 0 ? flat[index - 1] : null;
  const next = index < flat.length - 1 ? flat[index + 1] : null;

  return (
    <>
      <header className="mb-8 border-b border-slate-100 pb-6 dark:border-white/10">
        <p className="text-xs font-medium uppercase tracking-wider text-brand-600 dark:text-violet-400">
          {article.product.name.replace(/^Blazly\s+/i, "")}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {article.title}
        </h1>
        {article.description && (
          <p className="mt-3 text-base leading-relaxed text-slate-500 dark:text-slate-400">
            {article.description}
          </p>
        )}
      </header>

      <DocsContentRenderer blocks={article.blocks} />

      <footer className="mt-12 flex items-center justify-between gap-4 border-t border-slate-100 pt-8 dark:border-white/10">
        {prev ? (
          <Link
            href={articlePath(prev.product.slug, prev.article.slug)}
            className="group flex max-w-[45%] flex-col gap-1 text-sm"
          >
            <span className="flex items-center gap-1 text-slate-400">
              <ChevronLeft className="h-4 w-4" />
              Previous
            </span>
            <span className="font-medium text-slate-700 group-hover:text-brand-600 dark:text-slate-300 dark:group-hover:text-violet-400">
              {prev.article.title}
            </span>
            <span className="text-xs text-slate-400">{prev.product.shortName}</span>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            href={articlePath(next.product.slug, next.article.slug)}
            className="group flex max-w-[45%] flex-col items-end gap-1 text-right text-sm"
          >
            <span className="flex items-center gap-1 text-slate-400">
              Next
              <ChevronRight className="h-4 w-4" />
            </span>
            <span className="font-medium text-slate-700 group-hover:text-brand-600 dark:text-slate-300 dark:group-hover:text-violet-400">
              {next.article.title}
            </span>
            <span className="text-xs text-slate-400">{next.product.shortName}</span>
          </Link>
        ) : null}
      </footer>
    </>
  );
}

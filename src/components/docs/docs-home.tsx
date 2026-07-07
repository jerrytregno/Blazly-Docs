import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { DOCS_NAV, articlePath } from "@/config/docs-navigation";

const PRODUCT_DESCRIPTIONS: Record<string, string> = {
  seo: "AI content operating system — blog writing, keyword discovery, SEO audits, and strategy.",
  geo: "Generative engine optimization — AI visibility, citations, and brand sentiment tracking.",
  backlinker: "Outreach campaigns, guest posts, and email integration for link building.",
  "lead-engine": "AI chatbot, lead scoring, workflows, and team inbox for sales teams.",
  "local-seo": "Google Maps visibility, rank tracking, reviews, and local competitor analysis.",
  social: "Brand repository, post creation, lead intelligence, and social autopilot.",
};

export function DocsHome() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10 lg:py-14">
      <div className="mb-10 max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
          Blazly Help Center
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
          Product documentation
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-400">
          Guides and feature docs for all six Blazly products. Pick a product below
          or use the sidebar to browse articles.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {DOCS_NAV.map((product) => {
          const firstArticle = product.articles[0];
          const href = firstArticle
            ? articlePath(product.slug, firstArticle.slug)
            : `/docs/${product.slug}`;
          const description =
            PRODUCT_DESCRIPTIONS[product.slug] ??
            `Documentation for ${product.shortName}.`;

          return (
            <Link
              key={product.slug}
              href={href}
              className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-200 hover:shadow-md dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-brand-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
                  <BookOpen className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600 dark:text-slate-600 dark:group-hover:text-brand-400" />
              </div>

              <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                {product.shortName}
              </h2>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {description}
              </p>
              <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-500">
                {product.articles.length} articles
              </p>
            </Link>
          );
        })}
      </div>

      <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[0.03]">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Looking for product websites? Visit{" "}
          <a
            href="https://www.blazly.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            blazly.ai
          </a>{" "}
          or open any product card above and use the Website link in the header.
        </p>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { DOCS_NAV, articlePath } from "@/config/docs-navigation";
import { useDocsProduct } from "./docs-product-context";
import { cn } from "@/lib/utils";

export function DocsSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { setActiveProductSlug } = useDocsProduct();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const match = pathname.match(/^\/docs\/([^/]+)/);
    if (match) {
      setExpanded((prev) => ({ ...prev, [match[1]]: true }));
      setActiveProductSlug(match[1]);
    }
  }, [pathname, setActiveProductSlug]);

  const toggle = (slug: string) => {
    setExpanded((prev) => ({ ...prev, [slug]: !prev[slug] }));
    setActiveProductSlug(slug);
  };

  return (
    <nav className="w-full space-y-0.5">
      {DOCS_NAV.map((product) => {
        const isOpen = expanded[product.slug] ?? false;
        const isProductActive = pathname.startsWith(`/docs/${product.slug}`);

        return (
          <div key={product.slug} className="w-full">
            <button
              type="button"
              onClick={() => toggle(product.slug)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors",
                isProductActive
                  ? "text-slate-900 dark:text-slate-100"
                  : "text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200"
              )}
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
              )}
              <span>{product.shortName}</span>
            </button>

            {isOpen && (
              <ul className="mb-1 ml-2 space-y-0.5 border-l border-slate-200 pl-3 dark:border-white/10">
                {product.articles.map((article) => {
                  const href = articlePath(product.slug, article.slug);
                  const active = pathname === href;
                  return (
                    <li key={article.slug}>
                      <Link
                        href={href}
                        onClick={() => {
                          setActiveProductSlug(product.slug);
                          onNavigate?.();
                        }}
                        className={cn(
                          "block w-full rounded-md px-3 py-2 text-sm transition-colors",
                          active
                            ? "bg-brand-50 font-medium text-brand-700 dark:bg-violet-600/20 dark:text-violet-300"
                            : "text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-500 dark:hover:bg-white/5 dark:hover:text-slate-300"
                        )}
                      >
                        {article.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}

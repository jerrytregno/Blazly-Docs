"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { searchDocs } from "@/content/docs";

export function DocsSearchBar({ onOpen }: { onOpen?: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex h-9 w-full max-w-md items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 transition hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:border-white/20 dark:hover:bg-white/[0.07]"
    >
      <Search className="h-4 w-4 shrink-0" />
      <span className="flex-1 text-left">Search for answers</span>
      <kbd className="hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:inline dark:border-white/10 dark:bg-white/5 dark:text-slate-500">
        ⌘K
      </kbd>
    </button>
  );
}

export function DocsSearchDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const results = useMemo(() => searchDocs(query, 12), [query]);

  const go = useCallback(
    (href: string) => {
      router.push(href);
      setQuery("");
      onClose();
    },
    [router, onClose]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter" && results[0]) {
        e.preventDefault();
        go(results[0].href);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, results, go]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-4 pt-[12vh] backdrop-blur-sm dark:bg-black/70">
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#14141c]">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 dark:border-white/10">
          <Search className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documentation..."
            className="h-12 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-white/5 dark:hover:text-slate-300"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <ul className="max-h-80 overflow-y-auto py-2">
          {results.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-slate-500">No results found</li>
          ) : (
            results.map((item) => (
              <li key={`${item.productSlug}-${item.articleSlug}`}>
                <button
                  type="button"
                  onClick={() => go(item.href)}
                  className="w-full px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  <span className="mb-0.5 block text-[11px] font-medium text-brand-600 dark:text-violet-400">
                    {item.productName} › {item.articleTitle}
                  </span>
                  <span className="block text-sm text-slate-700 dark:text-slate-300">
                    {item.articleTitle}
                  </span>
                  {item.snippet && (
                    <span className="mt-0.5 block truncate text-xs text-slate-500">
                      {item.snippet}
                    </span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
      <button type="button" className="absolute inset-0 -z-10" onClick={onClose} aria-label="Close" />
    </div>
  );
}

export function DocsSearchTrigger() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <DocsSearchBar onOpen={() => setOpen(true)} />
      <DocsSearchDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}

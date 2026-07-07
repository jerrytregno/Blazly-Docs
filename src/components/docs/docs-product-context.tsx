"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  getSignupUrlForPathname,
  getWebsiteUrlForPathname,
  productSlugFromPathname,
} from "@/config/docs-navigation";

interface DocsProductContextValue {
  activeProductSlug: string | undefined;
  setActiveProductSlug: (slug: string | undefined) => void;
  websiteUrl: string;
  signupUrl: string;
}

const DocsProductContext = createContext<DocsProductContextValue | null>(null);

export function DocsProductProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [manualProductSlug, setManualProductSlug] = useState<string | undefined>();

  const pathnameProductSlug = productSlugFromPathname(pathname);
  const activeProductSlug = pathnameProductSlug ?? manualProductSlug;

  const websiteUrl = useMemo(() => {
    if (activeProductSlug) {
      return getWebsiteUrlForPathname(`/docs/${activeProductSlug}`);
    }
    return getWebsiteUrlForPathname(pathname);
  }, [activeProductSlug, pathname]);

  const signupUrl = useMemo(() => {
    if (activeProductSlug) {
      return getSignupUrlForPathname(`/docs/${activeProductSlug}`);
    }
    return getSignupUrlForPathname(pathname);
  }, [activeProductSlug, pathname]);

  const setActiveProductSlug = useCallback((slug: string | undefined) => {
    setManualProductSlug(slug);
  }, []);

  const value = useMemo(
    () => ({
      activeProductSlug,
      setActiveProductSlug,
      websiteUrl,
      signupUrl,
    }),
    [activeProductSlug, setActiveProductSlug, websiteUrl, signupUrl]
  );

  return <DocsProductContext.Provider value={value}>{children}</DocsProductContext.Provider>;
}

export function useDocsProduct() {
  const ctx = useContext(DocsProductContext);
  if (!ctx) {
    throw new Error("useDocsProduct must be used within DocsProductProvider");
  }
  return ctx;
}

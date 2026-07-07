"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type DocsTheme = "light" | "dark";

const STORAGE_KEY = "blazly-docs-theme";

interface DocsThemeContextValue {
  theme: DocsTheme;
  setTheme: (theme: DocsTheme) => void;
  toggleTheme: () => void;
}

const DocsThemeContext = createContext<DocsThemeContextValue | null>(null);

function readStoredTheme(): DocsTheme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function DocsThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<DocsTheme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setThemeState(readStoredTheme());
    setReady(true);
  }, []);

  const setTheme = useCallback((next: DocsTheme) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  );

  return (
    <DocsThemeContext.Provider value={value}>
      <div className={ready && theme === "dark" ? "dark" : undefined}>{children}</div>
    </DocsThemeContext.Provider>
  );
}

export function useDocsTheme() {
  const ctx = useContext(DocsThemeContext);
  if (!ctx) {
    throw new Error("useDocsTheme must be used within DocsThemeProvider");
  }
  return ctx;
}

"use client";

import { Moon, Sun } from "lucide-react";
import { useDocsTheme } from "./docs-theme";
import { cn } from "@/lib/utils";

export function DocsThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useDocsTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200",
        className
      )}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

import type { Metadata } from "next";
import { DocsShell } from "@/components/docs/docs-shell";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Blazly help center — guides for Local SEO, GEO, Backlinker, Lead Engine, Social, and SEO.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <DocsShell>{children}</DocsShell>;
}

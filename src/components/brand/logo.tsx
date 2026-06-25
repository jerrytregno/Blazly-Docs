import Link from "next/link";
import { cn } from "@/lib/utils";

/** Blazly Local SEO brand mark (white tile + bolt) */
export const BRAND_LOGO_SRC = "/blazly-local-seo-logo.png";

export function BrandLogo({
  href = "/",
  size = "md",
  theme = "light",
  showTagline = false,
  className,
}: {
  href?: string;
  size?: "xs" | "sm" | "md" | "lg";
  theme?: "light" | "dark";
  showTagline?: boolean;
  className?: string;
}) {
  const markHeight =
    size === "xs" ? 26 : size === "sm" ? 30 : size === "lg" ? 48 : showTagline ? 38 : 34;

  const titleClass =
    size === "lg"
      ? "text-xl font-bold"
      : size === "sm"
        ? "text-sm font-semibold"
        : size === "xs"
          ? "text-sm font-bold"
          : "text-base font-bold";
  const blazlyWithTaglineClass =
    size === "lg"
      ? "text-2xl font-bold"
      : size === "sm"
        ? "text-sm font-bold"
        : size === "xs"
          ? "text-base font-bold leading-none"
          : "text-xl font-bold";
  const localSeoClass =
    size === "lg"
      ? "text-sm font-semibold uppercase tracking-wide"
      : size === "sm"
        ? "text-[10px] font-semibold uppercase tracking-wide"
        : size === "xs"
          ? "text-[9px] font-semibold uppercase tracking-wider"
          : "text-xs font-semibold uppercase tracking-wide";

  const content = (
    <div className={cn("flex items-center", size === "xs" ? "gap-2" : "gap-2.5", className)}>
      <img
        src={BRAND_LOGO_SRC}
        alt="Blazly Local SEO"
        width={markHeight}
        height={markHeight}
        className="shrink-0 rounded-lg object-contain"
        style={{ height: markHeight, width: markHeight }}
        decoding="async"
      />
      <div>
        {!showTagline ? (
          <p
            className={cn(
              titleClass,
              "leading-tight tracking-tight",
              theme === "dark" ? "text-white" : "text-slate-900"
            )}
          >
            Blazly
          </p>
        ) : (
          <p
            className={cn(
              "leading-snug",
              theme === "dark" ? "text-white" : "text-slate-900"
            )}
          >
            <span className={cn("block", blazlyWithTaglineClass)}>Blazly</span>
            <span
              className={cn(
                "block",
                localSeoClass,
                theme === "dark" ? "text-white/90" : "text-slate-500"
              )}
            >
              Local SEO
            </span>
          </p>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex">
        {content}
      </Link>
    );
  }

  return content;
}

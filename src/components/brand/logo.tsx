import Link from "next/link";
import { cn } from "@/lib/utils";

/** Trimmed PNG exported from the official Blazly lightning bolt artwork */
export const BRAND_LOGO_SRC = "/blazly-logo-mark.png";
export const BRAND_LOGO_ASPECT = 434 / 578;

export function BrandLogo({
  href = "/",
  size = "md",
  theme = "light",
  showTagline = false,
  className,
}: {
  href?: string;
  size?: "sm" | "md" | "lg";
  theme?: "light" | "dark";
  showTagline?: boolean;
  className?: string;
}) {
  const markHeight =
    size === "sm" ? 34 : size === "lg" ? 48 : showTagline ? 42 : 38;
  const markWidth = Math.round(markHeight * BRAND_LOGO_ASPECT);
  const titleClass =
    size === "lg" ? "text-xl font-bold" : size === "sm" ? "text-sm font-semibold" : "text-base font-bold";
  const taglineClass =
    size === "lg"
      ? "text-lg font-bold"
      : size === "sm"
        ? "text-sm font-semibold"
        : "text-base font-bold";

  const content = (
    <div className={cn("flex items-center gap-3", className)}>
      <img
        src={BRAND_LOGO_SRC}
        alt="Blazly"
        width={markWidth}
        height={markHeight}
        className="shrink-0 object-contain"
        style={{ height: markHeight, width: markWidth }}
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
              taglineClass,
              "leading-snug",
              theme === "dark" ? "text-white" : "text-slate-900"
            )}
          >
            <span className="block font-bold">Blazly</span>
            <span
              className={cn(
                "block text-xs font-semibold uppercase tracking-wide",
                theme === "dark" ? "text-white/90" : "text-slate-500"
              )}
            >
              Local SEO Platform
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

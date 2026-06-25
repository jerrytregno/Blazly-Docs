import Link from "next/link";
import { cn } from "@/lib/utils";

/** Blazly Local SEO brand mark — https://kommodo.ai/i/oWxwdC81280OzErhStVe */
export const BRAND_LOGO_SRC =
  "https://plain-apac-prod-public.komododecks.com/202606/25/oWxwdC81280OzErhStVe/image.png";

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
    size === "sm" ? 34 : size === "lg" ? 52 : showTagline ? 46 : 38;
  const titleClass =
    size === "lg" ? "text-xl font-bold" : size === "sm" ? "text-sm font-semibold" : "text-base font-bold";
  const blazlyWithTaglineClass =
    size === "lg"
      ? "text-2xl font-bold"
      : size === "sm"
        ? "text-sm font-bold"
        : "text-xl font-bold";
  const localSeoClass =
    size === "lg"
      ? "text-sm font-semibold uppercase tracking-wide"
      : size === "sm"
        ? "text-[10px] font-semibold uppercase tracking-wide"
        : "text-xs font-semibold uppercase tracking-wide";

  const content = (
    <div className={cn("flex items-center gap-3", className)}>
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

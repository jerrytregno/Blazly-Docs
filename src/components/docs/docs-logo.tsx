import Link from "next/link";
import { cn } from "@/lib/utils";

export const DOCS_LOGO_SRC = "/blazly-logo-white.png";

export function DocsLogo({
  href = "/docs",
  size = "sm",
  className,
}: {
  href?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const height = size === "md" ? 36 : 30;
  const titleClass =
    size === "md" ? "text-base font-bold" : "text-sm font-semibold";

  const content = (
    <div className={cn("flex items-center gap-2.5", className)}>
      <img
        src={DOCS_LOGO_SRC}
        alt=""
        width={height}
        height={height}
        className="shrink-0 rounded-lg object-contain"
        style={{ height, width: height }}
        decoding="async"
      />
      <span
        className={cn(
          titleClass,
          "leading-tight tracking-tight text-slate-900 dark:text-white"
        )}
      >
        Blazly
      </span>
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

"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronDown, Info, TrendingDown, TrendingUp } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { Sparkline } from "@/components/dashboard/sparkline";

const ACCENT_STYLES = {
  violet: {
    icon: "bg-violet-100 text-violet-600 ring-violet-200/60",
    hover: "hover:bg-violet-50/50",
    value: "from-violet-600 to-purple-600",
    gauge: "#7c3aed",
  },
  indigo: {
    icon: "bg-indigo-100 text-indigo-600 ring-indigo-200/60",
    hover: "hover:bg-indigo-50/50",
    value: "from-indigo-600 to-blue-600",
    gauge: "#4f46e5",
  },
  sky: {
    icon: "bg-sky-100 text-sky-600 ring-sky-200/60",
    hover: "hover:bg-sky-50/50",
    value: "from-sky-600 to-cyan-600",
    gauge: "#0284c7",
  },
  emerald: {
    icon: "bg-emerald-100 text-emerald-600 ring-emerald-200/60",
    hover: "hover:bg-emerald-50/50",
    value: "from-emerald-600 to-teal-600",
    gauge: "#059669",
  },
  amber: {
    icon: "bg-amber-100 text-amber-600 ring-amber-200/60",
    hover: "hover:bg-amber-50/50",
    value: "from-amber-600 to-orange-600",
    gauge: "#d97706",
  },
} as const;

type MetricAccent = keyof typeof ACCENT_STYLES;

function MetricInfoButton({ label, description }: { label: string; description: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="min-w-0 flex-1">
      <div className="flex items-center gap-1.5">
        <span className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </span>
        <button
          type="button"
          className={cn(
            "shrink-0 rounded-full p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600",
            open && "bg-indigo-50 text-indigo-600"
          )}
          aria-label={`${label} explanation`}
          aria-expanded={open}
          aria-describedby={open ? id : undefined}
          onClick={() => setOpen((prev) => !prev)}
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </div>
      {open && (
        <p
          id={id}
          role="tooltip"
          className="mt-2 rounded-lg border border-indigo-100 bg-indigo-50/60 px-3 py-2 text-xs leading-relaxed text-slate-600"
        >
          {description}
        </p>
      )}
    </div>
  );
}

function MiniAuthorityGauge({ score, color }: { score: number; color: string }) {
  const pct = Math.min(100, Math.max(0, score)) / 100;
  const r = 16;
  const c = 2 * Math.PI * r;
  const offset = c - pct * c;

  return (
    <svg width={40} height={40} className="-rotate-90 shrink-0">
      <circle cx={20} cy={20} r={r} fill="none" stroke="#e2e8f0" strokeWidth={3.5} />
      <circle
        cx={20}
        cy={20}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={3.5}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SeoMetricCell({
  label,
  value,
  trend,
  trendSuffix = "%",
  subLabel,
  subValue,
  subTrend,
  sparkData,
  sparkPositive,
  sparkVariant = "area",
  showAuthorityGauge,
  description,
  icon: Icon,
  accent = "indigo",
  className,
  expandAction,
}: {
  label: string;
  value: string | number;
  trend?: number;
  trendSuffix?: string;
  subLabel?: string;
  subValue?: string;
  subTrend?: "up" | "down";
  sparkData?: number[];
  sparkPositive?: boolean;
  sparkVariant?: "area" | "line";
  showAuthorityGauge?: boolean;
  description?: string;
  icon?: LucideIcon;
  accent?: MetricAccent;
  className?: string;
  expandAction?: {
    buttonLabel: string;
    panel: ReactNode;
  };
}) {
  const [expanded, setExpanded] = useState(false);
  const trendUp = trend !== undefined && trend > 0;
  const trendDown = trend !== undefined && trend < 0;
  const hasChart = sparkData && sparkData.length > 1;
  const numericValue = typeof value === "number" ? value : parseFloat(String(value)) || 0;
  const styles = ACCENT_STYLES[accent];

  return (
    <div
      className={cn(
        "group flex min-h-[132px] min-w-0 flex-col bg-white px-4 py-4 transition-colors sm:min-h-[156px] sm:px-5 sm:py-5",
        styles.hover,
        className
      )}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1",
              styles.icon
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={2.25} />
          </div>
        )}
        {description ? (
          <MetricInfoButton label={label} description={description} />
        ) : (
          <span className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </span>
        )}
      </div>

      <div
        className={cn(
          "mt-4 flex flex-col gap-3 sm:flex-row sm:flex-1 sm:items-end sm:gap-3",
          hasChart && "sm:justify-between"
        )}
      >
        <div className="flex shrink-0 items-end gap-2.5">
          {showAuthorityGauge && (
            <MiniAuthorityGauge score={numericValue} color={styles.gauge} />
          )}
          <div className="flex flex-wrap items-baseline gap-2">
            <span
              className={cn(
                "bg-gradient-to-br bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-[1.75rem]",
                styles.value
              )}
            >
              {value}
            </span>
            {trend !== undefined && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-semibold",
                  trendUp && "bg-emerald-50 text-emerald-700",
                  trendDown && "bg-red-50 text-red-600",
                  trend === 0 && "bg-slate-100 text-slate-500"
                )}
              >
                {trend > 0 ? "+" : ""}
                {trend}
                {trendSuffix}
              </span>
            )}
          </div>
        </div>

        {hasChart && (
          <div className="h-12 min-w-0 w-full rounded-lg bg-slate-50/80 p-1 sm:h-14 sm:max-w-[58%] sm:flex-1">
            <Sparkline
              data={sparkData}
              positive={sparkPositive ?? (trend !== undefined ? trend >= 0 : true)}
              variant={sparkVariant}
              className="h-full w-full"
            />
          </div>
        )}
      </div>

      {subLabel && (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
          <span className="text-slate-500">{subLabel}</span>
          {subValue && (
            <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
              {subTrend === "down" && <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
              {subTrend === "up" && <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
              <span
                className={cn(
                  subTrend === "up" && "text-emerald-600",
                  subTrend === "down" && "text-red-600"
                )}
              >
                {subValue}
              </span>
            </span>
          )}
        </div>
      )}

      {expandAction && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            aria-expanded={expanded}
          >
            {expandAction.buttonLabel}
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")}
            />
          </button>
          {expanded && <div className="mt-2">{expandAction.panel}</div>}
        </div>
      )}
    </div>
  );
}

export function SeoCardHeader({
  scope,
  analyzedAt,
}: {
  scope: string;
  date?: string;
  analyzedAt?: string;
}) {
  return (
    <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 px-5 py-5">
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-200/30 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-6 left-1/3 h-24 w-24 rounded-full bg-indigo-200/25 blur-2xl"
        aria-hidden
      />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-indigo-700 shadow-sm ring-1 ring-indigo-100">
            Local SEO
          </span>
          <p className="mt-2 truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {scope}
          </p>
        </div>
        {analyzedAt && (
          <p className="shrink-0 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200/80">
            Updated {formatDate(analyzedAt)}
          </p>
        )}
      </div>
    </div>
  );
}

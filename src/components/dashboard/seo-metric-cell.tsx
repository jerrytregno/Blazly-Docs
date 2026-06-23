"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Info, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline } from "@/components/dashboard/sparkline";

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
    <div ref={rootRef} className="dashboard-metric-label">
      <div className="flex items-center gap-1.5">
        <span className="truncate">{label}</span>
        <button
          type="button"
          className={cn(
            "shrink-0 rounded-full p-0.5 text-gray-400 transition hover:bg-slate-100 hover:text-indigo-600",
            open && "bg-indigo-50 text-indigo-600"
          )}
          aria-label={`${label} explanation`}
          aria-expanded={open}
          aria-describedby={open ? id : undefined}
          onClick={() => setOpen((prev) => !prev)}
        >
          <Info className="h-4 w-4" />
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

function MiniAuthorityGauge({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score)) / 100;
  const r = 14;
  const c = 2 * Math.PI * r;
  const offset = c - pct * c;

  return (
    <svg width={36} height={36} className="-rotate-90 shrink-0">
      <circle cx={18} cy={18} r={r} fill="none" stroke="#e5e7eb" strokeWidth={4} />
      <circle
        cx={18}
        cy={18}
        r={r}
        fill="none"
        stroke="#f59e0b"
        strokeWidth={4}
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
  className,
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
  className?: string;
}) {
  const trendUp = trend !== undefined && trend > 0;
  const trendDown = trend !== undefined && trend < 0;
  const hasChart = sparkData && sparkData.length > 1;
  const numericValue = typeof value === "number" ? value : parseFloat(String(value)) || 0;

  return (
    <div className={cn("flex min-h-[120px] min-w-0 flex-col px-4 py-4 sm:min-h-[148px] sm:px-6 sm:py-6", className)}>
      {description ? (
        <MetricInfoButton label={label} description={description} />
      ) : (
        <div className="dashboard-metric-label flex items-center gap-1.5">
          <span className="truncate">{label}</span>
        </div>
      )}

      <div
        className={cn(
          "mt-3 flex flex-col gap-3 sm:flex-row sm:flex-1 sm:items-end sm:gap-3",
          hasChart && "sm:justify-between"
        )}
      >
        <div className="flex shrink-0 items-end gap-2">
          {showAuthorityGauge && <MiniAuthorityGauge score={numericValue} />}
          <div className="flex items-baseline gap-2">
            <span className="dashboard-metric-value text-[#4b7bec]">{value}</span>
            {trend !== undefined && (
              <span
                className={cn(
                  "text-sm font-medium",
                  trendUp && "text-emerald-600",
                  trendDown && "text-red-600",
                  trend === 0 && "text-gray-400"
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
          <div className="h-12 min-w-0 w-full sm:h-14 sm:max-w-[58%] sm:flex-1">
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
        <div className="mt-3 flex items-center gap-1.5 text-sm text-gray-500">
          <span>{subLabel}</span>
          {subValue && (
            <span className="inline-flex items-center gap-1 font-medium text-gray-800">
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
    </div>
  );
}

export function SeoCardHeader({
  scope,
  date,
}: {
  scope: string;
  date?: string;
}) {
  return (
    <div className="border-b border-gray-200 px-4 pt-4 pb-3 sm:px-5">
      <span className="rounded-md bg-indigo-100 px-2.5 py-1 text-sm font-semibold text-blue-900">
        SEO
      </span>

      <p className="mt-3 min-w-0 text-sm text-gray-600">
        Scope: <span className="break-all font-medium text-gray-800 sm:break-normal">{scope}</span>
      </p>

      {date && <p className="mt-2 text-sm text-gray-400">{date}</p>}
    </div>
  );
}

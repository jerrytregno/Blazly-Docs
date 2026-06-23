import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline } from "@/components/dashboard/sparkline";

export function MetricCell({
  label,
  value,
  trend,
  trendSuffix = "%",
  subLabel,
  subValue,
  subTrend,
  sparkData,
  sparkPositive,
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
  className?: string;
}) {
  const trendUp = trend !== undefined && trend > 0;
  const trendDown = trend !== undefined && trend < 0;

  return (
    <div className={cn("min-w-0 px-5 py-5", className)}>
      <div className="dashboard-metric-label flex items-center gap-1.5">
        <span>{label}</span>
        <Info className="h-4 w-4 text-gray-400" />
      </div>
      <div className="mt-2 flex items-baseline gap-2.5">
        <span className="dashboard-metric-value text-indigo-600">{value}</span>
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
      {sparkData && sparkData.length > 1 && (
        <div className="mt-3">
          <Sparkline data={sparkData} positive={sparkPositive ?? (trend !== undefined ? trend >= 0 : true)} />
        </div>
      )}
      {subLabel && (
        <div className="mt-3 flex items-center gap-1.5 text-sm text-gray-500">
          <span>{subLabel}</span>
          {subValue && (
            <span
              className={cn(
                "font-medium",
                subTrend === "up" && "text-emerald-600",
                subTrend === "down" && "text-red-600",
                !subTrend && "text-gray-700"
              )}
            >
              {subValue}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

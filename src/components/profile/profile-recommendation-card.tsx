"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProfileImpactLevel, ProfileRecommendation } from "@/types/firestore";

const IMPACT_STYLES: Record<
  ProfileImpactLevel,
  { badge: string; border: string }
> = {
  high: {
    badge: "border-red-200 bg-red-50 text-red-700",
    border: "border-red-100",
  },
  medium: {
    badge: "border-amber-200 bg-amber-50 text-amber-800",
    border: "border-amber-100",
  },
  low: {
    badge: "border-gray-200 bg-gray-50 text-gray-600",
    border: "border-gray-100",
  },
};

export function ProfileRecommendationCard({
  recommendation,
}: {
  recommendation: ProfileRecommendation;
}) {
  const [open, setOpen] = useState(false);
  const styles = IMPACT_STYLES[recommendation.impact];

  return (
    <div
      className={cn(
        "rounded-xl border bg-white transition-shadow",
        styles.border,
        open && "shadow-sm"
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 p-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold text-gray-900">{recommendation.title}</h4>
            <Badge className={cn("text-xs capitalize", styles.badge)}>
              {recommendation.impact} impact
            </Badge>
          </div>
          {!open && (
            <p className="mt-1 line-clamp-2 text-sm text-gray-500">
              {recommendation.description}
            </p>
          )}
        </div>
        <ChevronDown
          className={cn(
            "mt-1 h-5 w-5 shrink-0 text-gray-400 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3">
          <p className="text-sm leading-relaxed text-gray-700">
            {recommendation.description}
          </p>
          {recommendation.action && (
            <p className="mt-3 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-medium text-blue-800">
              Action: {recommendation.action}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

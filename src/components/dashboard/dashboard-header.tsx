"use client";

import {
  ChevronRight,
  ExternalLink,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { normalizeUserWebsite } from "@/lib/seo/maps-place";
import { formatDate } from "@/lib/utils";
import type { BusinessDoc } from "@/types/firestore";

function formatWebsiteUrl(website: string) {
  return website.startsWith("http") ? website : `https://${website}`;
}

export function DashboardHeader({
  business,
  analyzing,
  lastAnalyzedAt,
  canRerunAnalysis = true,
  analysisCooldownMessage,
  onRefresh,
}: {
  business: BusinessDoc | null;
  analyzing: boolean;
  lastAnalyzedAt?: string | null;
  canRerunAnalysis?: boolean;
  analysisCooldownMessage?: string | null;
  onRefresh: () => void;
}) {
  const businessName = business?.name?.trim() || "Your business";
  const userWebsite = normalizeUserWebsite(business?.userWebsite);
  const location = business?.city || business?.address || "—";

  return (
    <div className="space-y-4">
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <span className="font-medium text-slate-900">Dashboard</span>
        <ChevronRight className="h-4 w-4" />
        <span className="truncate">{businessName}</span>
        {userWebsite && (
          <>
            <span className="text-slate-300">·</span>
            <span className="truncate text-slate-400">{userWebsite}</span>
          </>
        )}
      </nav>

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {businessName}
            </h1>
            {userWebsite && (
              <a
                href={formatWebsiteUrl(userWebsite)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-lg font-medium text-indigo-600 transition hover:text-indigo-700 sm:text-xl"
              >
                {userWebsite}
                <ExternalLink className="h-4 w-4 shrink-0" />
              </a>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {location}
            {business?.primaryCategory && (
              <span className="text-slate-400"> · {business.primaryCategory}</span>
            )}
            {lastAnalyzedAt && (
              <span className="text-slate-400"> · Updated {formatDate(lastAnalyzedAt)}</span>
            )}
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <Button
            onClick={onRefresh}
            disabled={analyzing || !canRerunAnalysis}
            className="gap-2"
          >
            {analyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {analyzing ? "Analyzing…" : "Run analysis"}
          </Button>
          {!canRerunAnalysis && analysisCooldownMessage && (
            <p className="max-w-xs text-xs text-amber-700 sm:text-right">
              {analysisCooldownMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

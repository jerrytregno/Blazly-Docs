"use client";

import { cn } from "@/lib/utils";
import type { GeoGridScan } from "@/types/firestore";
import { formatDate } from "@/lib/utils";

function rankColor(rank: number) {
  if (rank <= 3) return "bg-emerald-500 text-white";
  if (rank <= 7) return "bg-amber-500 text-white";
  if (rank <= 12) return "bg-orange-500 text-white";
  return "bg-red-400 text-white";
}

export function GeoGridMap({ scan }: { scan: GeoGridScan | null | undefined }) {
  if (!scan) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500">
        Run analysis to generate your local ranking grid
      </div>
    );
  }

  const size = Math.sqrt(scan.points.length);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 text-sm">
        <div>
          <span className="text-gray-500">Keyword: </span>
          <span className="font-medium text-gray-900">{scan.keyword}</span>
        </div>
        <div>
          <span className="text-gray-500">Avg rank: </span>
          <span className="font-medium text-gray-900">#{scan.averageRank}</span>
        </div>
        <div>
          <span className="text-gray-500">Visibility: </span>
          <span className="font-medium text-emerald-600">{scan.visibilityScore}%</span>
        </div>
        <div className="text-gray-400">Scanned {formatDate(scan.scannedAt)}</div>
      </div>

      <div
        className="mx-auto grid max-w-md gap-1"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {scan.points.map((p) => (
          <div
            key={`${p.row}-${p.col}`}
            className={cn(
              "flex aspect-square items-center justify-center rounded-md text-xs font-bold",
              rankColor(p.rank),
              p.row === Math.floor(size / 2) && p.col === Math.floor(size / 2) && "ring-2 ring-violet-500"
            )}
            title={`Rank #${p.rank}`}
          >
            {p.rank}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-emerald-500" /> Top 3
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-amber-500" /> 4–7
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-orange-500" /> 8–12
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-red-400" /> 13+
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded ring-2 ring-violet-500" /> Your location
        </span>
      </div>
    </div>
  );
}

"use client";

import { Badge } from "@/components/ui/badge";
import type { CitationListing } from "@/types/firestore";
import { cn } from "@/lib/utils";

const statusVariant: Record<CitationListing["status"], "success" | "warning" | "secondary"> = {
  live: "success",
  missing: "warning",
  dead: "warning",
  duplicate: "warning",
};

export function CitationTrackerTable({ listings }: { listings: CitationListing[] }) {
  if (!listings.length) {
    return (
      <p className="text-sm text-gray-500">
        No citation data yet. Refresh your analysis to scan directories.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs text-gray-500">
            <th className="p-3 font-medium">Directory</th>
            <th className="p-3 font-medium">Status</th>
            <th className="p-3 font-medium">NAP Match</th>
            <th className="p-3 font-medium">Authority</th>
            <th className="p-3 font-medium">Value</th>
            <th className="p-3 font-medium">Submit</th>
          </tr>
        </thead>
        <tbody>
          {listings.map((c) => (
            <tr key={c.directory} className="border-b border-gray-100 last:border-0">
              <td className="p-3 font-medium text-gray-900">{c.directory}</td>
              <td className="p-3">
                <Badge variant={statusVariant[c.status]} className="capitalize">
                  {c.status}
                </Badge>
              </td>
              <td className="p-3">
                <span className={cn(c.napMatch ? "text-emerald-600" : "text-amber-600")}>
                  {c.napMatch ? "Match" : "Mismatch"}
                </span>
              </td>
              <td className="p-3 text-gray-600">{c.authority}</td>
              <td className="p-3 text-gray-600">{c.value}</td>
              <td className="p-3">
                {c.submitable && c.status === "missing" ? (
                  <span className="font-medium text-violet-600">Easy submit</span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

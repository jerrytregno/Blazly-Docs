"use client";

import { ExternalLink } from "lucide-react";
import type { CitationListing } from "@/types/firestore";

export function FranchiseListingsTable({
  listings,
  businessName,
  mode = "listed",
  emptyMessage,
}: {
  listings: CitationListing[];
  businessName?: string;
  mode?: "listed" | "missing";
  emptyMessage?: string;
}) {
  if (!listings.length) {
    return (
      <p className="text-sm text-gray-500">
        {emptyMessage ??
          "No listing data yet. Run SEO analysis to scan where your business profile appears."}
      </p>
    );
  }

  const isMissingMode = mode === "missing";

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <th className="px-4 py-3 font-semibold">Platform</th>
            {!isMissingMode && (
              <>
                <th className="px-4 py-3 font-semibold">Business profile</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">NAP</th>
              </>
            )}
            <th className="px-4 py-3 font-semibold">
              {isMissingMode ? "Action" : "View listing"}
            </th>
          </tr>
        </thead>
        <tbody>
          {listings.map((listing) => (
            <tr key={listing.directory} className="border-b border-gray-100 last:border-0">
              <td className="px-4 py-3 font-medium text-gray-900">{listing.directory}</td>
              {!isMissingMode && (
                <>
                  <td className="px-4 py-3 text-gray-600">
                    {listing.profileName ?? businessName ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        listing.status === "live"
                          ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
                          : listing.status === "missing"
                            ? "rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
                            : "rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600"
                      }
                    >
                      {listing.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {listing.napMatch ? "Match" : "Review"}
                  </td>
                </>
              )}
              <td className="px-4 py-3">
                {isMissingMode ? (
                  listing.submitUrl ? (
                    <a
                      href={listing.submitUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700"
                    >
                      Submit listing
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )
                ) : listing.url ? (
                  <a
                    href={listing.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700"
                  >
                    View listing
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
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

"use client";

import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { rankColorClass } from "@/lib/keyword-research/fetch-rankings";
import type { KeywordResearchListing } from "@/types/firestore";

export function RankingList({
  listings,
  yourPosition,
  selectedPlaceId,
  onSelect,
}: {
  listings: KeywordResearchListing[];
  yourPosition?: number;
  selectedPlaceId?: string;
  onSelect: (listing: KeywordResearchListing) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {listings.map((listing) => (
          <button
            key={`${listing.placeId ?? listing.name}-${listing.position}`}
            type="button"
            onClick={() => onSelect(listing)}
            className={cn(
              "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors hover:bg-gray-50",
              listing.isYou && "border-indigo-300 bg-indigo-50/40",
              selectedPlaceId === listing.placeId && "ring-2 ring-indigo-500",
              !listing.isYou && "border-gray-200 bg-white"
            )}
          >
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-sm font-bold",
                rankColorClass(listing.position)
              )}
            >
              #{listing.position}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-gray-900">{listing.name}</p>
                {listing.isYou && (
                  <Badge className="bg-indigo-600 text-white">Your business</Badge>
                )}
                {!listing.isYou && (
                  <Badge variant="secondary">Competitor</Badge>
                )}
              </div>
              <p className="mt-0.5 text-sm text-gray-500">{listing.category}</p>
              <p className="mt-1 text-xs text-gray-400">{listing.address}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {listing.rating || "—"}
                </span>
                <span>{listing.reviews.toLocaleString()} reviews</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <Card
        className={cn(
          "border-2",
          yourPosition
            ? rankColorClass(yourPosition)
            : "border-gray-200 bg-gray-50"
        )}
      >
        <CardContent className="p-4">
          <p className="text-sm font-medium">Your business position</p>
          <p className="mt-1 text-2xl font-bold">
            {yourPosition ? `#${yourPosition}` : "Not in top 10"}
          </p>
          {!yourPosition && (
            <p className="mt-1 text-xs opacity-80">
              Your listing did not appear in the top 10 Maps results for this search.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

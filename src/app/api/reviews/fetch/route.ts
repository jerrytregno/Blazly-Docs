import { NextRequest, NextResponse } from "next/server";
import { parseGoogleMapsPlaceId } from "@/lib/seo/maps-place";
import {
  fetchUnansweredReviewsBatch,
  MAX_UNANSWERED_BATCHES,
  MAX_UNANSWERED_REVIEWS,
} from "@/lib/seo/real-data";
import { regionGl } from "@/lib/seo/search-regions";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      mapsPlaceId,
      searchRegion,
      mode,
      reset,
      nextPageToken,
      existingReviewIds,
      unansweredBatchesLoaded,
    } = body as {
      mapsPlaceId?: string;
      searchRegion?: string;
      mode?: string;
      reset?: boolean;
      nextPageToken?: string;
      existingReviewIds?: string[];
      unansweredBatchesLoaded?: number;
    };

    const placeId = parseGoogleMapsPlaceId(mapsPlaceId);
    if (!placeId) {
      return NextResponse.json(
        { error: "A valid Google Maps link or place ID is required." },
        { status: 400 }
      );
    }

    if (mode !== "unanswered_batch") {
      return NextResponse.json(
        { error: "Unsupported fetch mode. Use unanswered_batch." },
        { status: 400 }
      );
    }

    const priorBatches = reset ? 0 : unansweredBatchesLoaded ?? 0;
    if (!reset && priorBatches >= MAX_UNANSWERED_BATCHES) {
      return NextResponse.json(
        { error: "Maximum of 5 review batches (100 unanswered) already loaded." },
        { status: 400 }
      );
    }

    const gl = regionGl(searchRegion);
    const data = await fetchUnansweredReviewsBatch(placeId, {
      gl,
      nextPageToken: reset ? undefined : nextPageToken,
      existingIds: reset ? [] : existingReviewIds ?? [],
    });

    const newBatchCount = priorBatches + 1;
    const canLoadMore =
      Boolean(data.nextPageToken) && newBatchCount < MAX_UNANSWERED_BATCHES;

    return NextResponse.json({
      reviews: {
        inbox: data.unanswered,
        sentiment: data.sentiment,
        placeId: data.placeId,
        fetchedAt: data.fetchedAt,
        scannedCount: data.scannedCount,
        totalOnGoogle: data.placeReviewCount,
        answeredCount: data.answeredCount,
        nextPageToken: data.nextPageToken,
        unansweredBatchesLoaded: newBatchCount,
        monitoredPlatforms: [
          {
            name: "Google",
            count: data.placeReviewCount ?? data.unanswered.length,
            connected: true,
          },
        ],
      },
      newUnanswered: data.unanswered,
      unansweredCount: data.unanswered.length,
      answeredCount: data.answeredCount,
      placeTitle: data.placeTitle,
      placeRating: data.placeRating,
      canLoadMore,
      unansweredBatchesLoaded: newBatchCount,
    });
  } catch (error) {
    console.error("Review fetch error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch Google reviews",
      },
      { status: 500 }
    );
  }
}

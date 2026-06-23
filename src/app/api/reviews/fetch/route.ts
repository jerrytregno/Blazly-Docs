import { NextRequest, NextResponse } from "next/server";
import { parseGoogleMapsPlaceId } from "@/lib/seo/maps-place";
import { fetchGoogleReviewsChunk } from "@/lib/seo/real-data";
import { regionGl } from "@/lib/seo/search-regions";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mapsPlaceId, searchRegion, nextPageToken, maxPages } = body as {
      mapsPlaceId?: string;
      searchRegion?: string;
      nextPageToken?: string;
      maxPages?: number;
    };

    const placeId = parseGoogleMapsPlaceId(mapsPlaceId);
    if (!placeId) {
      return NextResponse.json(
        { error: "A valid Google Maps link or place ID is required." },
        { status: 400 }
      );
    }

    const gl = regionGl(searchRegion);
    const data = await fetchGoogleReviewsChunk(placeId, {
      gl,
      nextPageToken,
      maxPages: maxPages ?? 25,
      unansweredOnly: false,
    });

    return NextResponse.json({
      reviews: {
        inbox: data.inbox,
        sentiment: data.sentiment,
        placeId: data.placeId,
        fetchedAt: data.fetchedAt,
        scannedCount: data.scannedCount,
        totalOnGoogle: data.placeReviewCount,
        answeredCount: data.answered.length,
        monitoredPlatforms: [
          {
            name: "Google",
            count: data.placeReviewCount ?? data.inbox.length,
            connected: true,
          },
        ],
      },
      reviewsInBatch: data.inbox,
      unansweredInBatch: data.unanswered,
      answeredInBatch: data.answered,
      scannedInBatch: data.scannedCount,
      unansweredCount: data.unanswered.length,
      answeredCount: data.answered.length,
      placeTitle: data.placeTitle,
      placeRating: data.placeRating,
      nextPageToken: data.nextPageToken,
      isComplete: data.isComplete,
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

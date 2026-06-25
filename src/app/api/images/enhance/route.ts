import { NextRequest, NextResponse } from "next/server";
import { enhanceBusinessImage, suggestImageSeo } from "@/lib/gemini-images";
import {
  consumeImageEnhancementSlot,
  getImageEnhancementQuota,
  quotaExceededStatus,
  releaseImageEnhancementSlot,
} from "@/lib/images/enhancement-quota-server";

export const maxDuration = 120;

const MAX_BYTES = 5 * 1024 * 1024;

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId")?.trim();
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const quota = await getImageEnhancementQuota(userId);
    return NextResponse.json({ quota });
  } catch (error) {
    console.error("Image enhance quota GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load quota" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let userId: string | undefined;
  let slotConsumed = false;

  try {
    const body = await request.json();
    const {
      userId: bodyUserId,
      imageBase64,
      mimeType,
      fileName,
      width,
      height,
      businessName,
      prompt,
    } = body as {
      userId?: string;
      imageBase64: string;
      mimeType: string;
      fileName?: string;
      width?: number;
      height?: number;
      businessName?: string;
      prompt?: string;
    };

    userId = bodyUserId?.trim();
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    if (!imageBase64?.trim()) {
      return NextResponse.json({ error: "imageBase64 is required" }, { status: 400 });
    }

    const bytes = Math.ceil((imageBase64.length * 3) / 4);
    if (bytes > MAX_BYTES) {
      return NextResponse.json({ error: "Image exceeds 5 MB limit" }, { status: 400 });
    }

    const reservation = await consumeImageEnhancementSlot(userId);
    if (!reservation.ok) {
      const { error, quota } = quotaExceededStatus(reservation.quota);
      return NextResponse.json({ error, quota }, { status: 429 });
    }
    slotConsumed = true;

    const safeMime = mimeType?.startsWith("image/") ? mimeType : "image/jpeg";

    const [enhanced, seo] = await Promise.all([
      enhanceBusinessImage(imageBase64, safeMime, prompt),
      suggestImageSeo({
        fileName: fileName ?? "business-photo.jpg",
        width: width ?? 0,
        height: height ?? 0,
        businessName,
      }),
    ]);

    return NextResponse.json({
      enhancedImageBase64: enhanced.imageBase64,
      enhancedMimeType: enhanced.mimeType,
      note: enhanced.note,
      seo,
      quota: reservation.quota,
    });
  } catch (error) {
    if (slotConsumed && userId) {
      try {
        await releaseImageEnhancementSlot(userId);
      } catch (releaseError) {
        console.error("Failed to release image enhancement slot:", releaseError);
      }
    }

    console.error("Image enhance error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to enhance image",
      },
      { status: 500 }
    );
  }
}

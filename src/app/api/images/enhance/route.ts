import { NextRequest, NextResponse } from "next/server";
import { enhanceBusinessImage, suggestImageSeo } from "@/lib/gemini-images";

export const maxDuration = 120;

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, mimeType, fileName, width, height, businessName, prompt } = body as {
      imageBase64: string;
      mimeType: string;
      fileName?: string;
      width?: number;
      height?: number;
      businessName?: string;
      prompt?: string;
    };

    if (!imageBase64?.trim()) {
      return NextResponse.json({ error: "imageBase64 is required" }, { status: 400 });
    }

    const bytes = Math.ceil((imageBase64.length * 3) / 4);
    if (bytes > MAX_BYTES) {
      return NextResponse.json({ error: "Image exceeds 5 MB limit" }, { status: 400 });
    }

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
    });
  } catch (error) {
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

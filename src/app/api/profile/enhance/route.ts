import { NextRequest, NextResponse } from "next/server";
import {
  getProfileOptimization,
  updateProfileOptimization,
} from "@/lib/firestore/collections";
import { generateProfileEnhancement } from "@/lib/gemini";

export const maxDuration = 90;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body as { userId: string };

    if (!userId?.trim()) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const doc = await getProfileOptimization(userId.trim());
    if (!doc.snapshot) {
      return NextResponse.json(
        { error: "Run profile analysis first before enhancing." },
        { status: 400 }
      );
    }

    const enhancement = await generateProfileEnhancement({
      snapshot: doc.snapshot,
      fieldAudit: doc.fieldAudit,
      scores: doc.scores,
    });

    await updateProfileOptimization(userId.trim(), { enhancement });

    return NextResponse.json({ enhancement });
  } catch (error) {
    console.error("Profile enhance error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate enhancements",
      },
      { status: 500 }
    );
  }
}

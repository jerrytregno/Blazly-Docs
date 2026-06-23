import { NextRequest, NextResponse } from "next/server";
import {
  generateSeoAudit,
  generateKeywordSuggestions,
  generateStrategistAnswer,
  generateReviewReply,
} from "@/lib/gemini";
import type { LocalBusiness } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body as { action?: string };

    if (action === "keywords") {
      const { businessType, location } = body as {
        businessType: string;
        location: string;
      };
      if (!businessType || !location) {
        return NextResponse.json(
          { error: "businessType and location are required" },
          { status: 400 }
        );
      }
      const keywords = await generateKeywordSuggestions(businessType, location);
      return NextResponse.json({ keywords });
    }

    if (action === "strategist") {
      const { question } = body as { question: string };
      if (!question?.trim()) {
        return NextResponse.json(
          { error: "question is required" },
          { status: 400 }
        );
      }
      const answer = await generateStrategistAnswer(question);
      return NextResponse.json({ answer });
    }

    if (action === "review-reply") {
      const { review, tone, rating, regenerate, previousReply } = body as {
        review?: string;
        tone: string;
        rating?: number;
        regenerate?: boolean;
        previousReply?: string;
      };
      if (!tone) {
        return NextResponse.json({ error: "tone is required" }, { status: 400 });
      }
      const reply = await generateReviewReply(review ?? "", tone, {
        rating,
        regenerate: Boolean(regenerate),
        previousReply,
      });
      return NextResponse.json({ reply });
    }

    const {
      businessName,
      keyword,
      location,
      targetBusiness,
      competitors,
    } = body as {
      businessName: string;
      keyword: string;
      location: string;
      targetBusiness?: LocalBusiness;
      competitors: LocalBusiness[];
    };

    if (!businessName || !keyword || !location) {
      return NextResponse.json(
        { error: "businessName, keyword, and location are required" },
        { status: 400 }
      );
    }

    const audit = await generateSeoAudit({
      businessName,
      keyword,
      location,
      targetBusiness,
      competitors: competitors ?? [],
    });

    return NextResponse.json(audit);
  } catch (error) {
    console.error("AI audit error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate AI audit",
      },
      { status: 500 }
    );
  }
}

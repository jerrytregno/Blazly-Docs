import { NextRequest, NextResponse } from "next/server";
import { revokeUserRefreshTokens } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { idToken } = (await request.json()) as { idToken?: string };

    if (!idToken?.trim()) {
      return NextResponse.json({ error: "idToken is required" }, { status: 400 });
    }

    const revoked = await revokeUserRefreshTokens(idToken.trim());
    if (!revoked) {
      return NextResponse.json(
        {
          error:
            "Server session revocation is not configured. You will be signed out on this device only.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Revoke sessions error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to revoke sessions",
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { signInWalkInWithBarcode } from "@/backend/controllers/walk-in-attendance.controller";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { barcode } = body;
    if (!barcode) {
      return NextResponse.json(
        { success: false, error: "Barcode is required" },
        { status: 400 }
      );
    }

    const result = await signInWalkInWithBarcode(session.user.id, String(barcode));

    return NextResponse.json({
      success: true,
      data: result,
      message: result.message,
    });
  } catch (error: unknown) {
    console.error("Walk-in barcode sign-in error:", error);
    const message = error instanceof Error ? error.message : "Failed to sign in";
    return NextResponse.json(
      { success: false, error: message },
      {
        status:
          message.includes("Invalid") ||
          message.includes("expired") ||
          message.includes("Already signed out") ||
          message.includes("not found")
            ? 400
            : 500,
      }
    );
  }
}

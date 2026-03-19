import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/utils";

/**
 * Proxy to team app's walk-in barcode sign-in.
 * Verifies student session and forwards to team app.
 */
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

    const res = await fetch(`${API_BASE_URL}/api/attendance/walk-in/barcode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: session.user.id,
        barcode: String(barcode).trim(),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data.error || "Failed to sign in" },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: data.data,
      message: data.message || "Signed in successfully",
    });
  } catch (error: unknown) {
    console.error("Walk-in barcode sign-in error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to sign in",
      },
      { status: 500 }
    );
  }
}

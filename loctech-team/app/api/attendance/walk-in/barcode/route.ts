import { NextRequest, NextResponse } from "next/server";
import { signInWalkIn } from "@/backend/controllers/walk-in-attendance.controller";
import { successResponse, errorResponse } from "@/lib/server-helper";

/**
 * Sign in via barcode - used by students.
 * Expects studentId in body (from student app session) or from Authorization.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, barcode } = body;
    if (!studentId) throw new Error("studentId is required");
    if (!barcode) throw new Error("barcode is required");

    const result = await signInWalkIn({
      studentId,
      method: "barcode",
      barcode: String(barcode).trim(),
    });
    return successResponse(result, result.message);
  } catch (error) {
    console.error("Walk-in barcode sign-in error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to sign in",
      (error as Error)?.message?.includes("Invalid") ||
        (error as Error)?.message?.includes("expired")
        ? 400
        : 500
    );
  }
}

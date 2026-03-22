import { NextRequest } from "next/server";
import { signOutWalkIn } from "@/backend/controllers/walk-in-attendance.controller";
import { successResponse, errorResponse } from "@/lib/server-helper";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) throw new Error("Record ID is required");
    await signOutWalkIn({ recordId: id });
    return successResponse(null, "Signed out successfully");
  } catch (error) {
    console.error("Sign out walk-in error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to sign out",
      500
    );
  }
}

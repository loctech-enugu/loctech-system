import { NextRequest, NextResponse } from "next/server";
import {
  createWalkInSession,
  getActiveWalkInSession,
} from "@/backend/controllers/walk-in-attendance.controller";
import { successResponse, errorResponse } from "@/lib/server-helper";

export async function GET() {
  try {
    const session = await getActiveWalkInSession();
    return successResponse(session);
  } catch (error) {
    console.error("Get walk-in session error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to get session",
      500
    );
  }
}

export async function POST() {
  try {
    const result = await createWalkInSession();
    return successResponse(result, "Session created");
  } catch (error) {
    console.error("Create walk-in session error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to create session",
      500
    );
  }
}

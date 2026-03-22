import { NextRequest, NextResponse } from "next/server";
import { searchStudentsForWalkIn } from "@/backend/controllers/walk-in-attendance.controller";
import { successResponse, errorResponse } from "@/lib/server-helper";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";
    if (!q || q.length < 2) {
      return successResponse([]);
    }
    const students = await searchStudentsForWalkIn(q);
    return successResponse(students);
  } catch (error) {
    console.error("Search students error:", error);
    return errorResponse(error instanceof Error ? error.message : "Failed to search students", 500);
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  recordWalkInAttendance,
  getSignedInStudents,
} from "@/backend/controllers/walk-in-attendance.controller";
import { successResponse, errorResponse } from "@/lib/server-helper";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const list = await getSignedInStudents(date ? new Date(date) : undefined);
    return successResponse(list);
  } catch (error) {
    console.error("Get signed-in students error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to fetch signed-in students",
      500
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, date, notes } = body;
    if (!studentId) throw new Error("studentId is required");
    const result = await recordWalkInAttendance({
      studentId,
      date: date ? new Date(date) : undefined,
      notes,
    });
    return successResponse(result, result.message);
  } catch (error) {
    console.error("Record walk-in error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to record walk-in",
      500
    );
  }
}

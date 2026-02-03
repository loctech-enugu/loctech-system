import { NextRequest, NextResponse } from "next/server";
import { errorResponse, successResponse } from "@/lib/server-helper";
import { getClassAttendanceByDate } from "@/backend/controllers/student-attendance.controller";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ classId: string; date: string }> }
) {
  try {
    const { classId, date } = await context.params;

    if (!classId || !date) {
      return NextResponse.json(
        { error: "Class ID and date are required" },
        { status: 400 }
      );
    }

    const records = await getClassAttendanceByDate(classId, date);

    return successResponse(records);
  } catch (error: unknown) {
    console.error(
      "Error in GET /api/attendance/classes/[classId]/students/[date]:",
      error
    );
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch attendance records";
    return errorResponse(
      errorMessage,
      500
    );
  }
}

import { NextResponse } from "next/server";
import { errorResponse, successResponse } from "@/lib/server-helper";
import { getClassAttendanceByDate } from "@/backend/controllers/student-attendance.controller";

/* eslint-disable */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ classId: string; date: string }> }
) {
  try {
    const { classId, date } = await params;

    if (!classId || !date) {
      return NextResponse.json(
        { error: "Class ID and date are required" },
        { status: 400 }
      );
    }

    const records = await getClassAttendanceByDate(classId, date);

    return successResponse(records);
  } catch (error: any) {
    console.error(
      "Error in GET /api/attendance/classes/[classId]/students/[date]:",
      error
    );
    return errorResponse(
      error.message || "Failed to fetch attendance records",
      500
    );
  }
}

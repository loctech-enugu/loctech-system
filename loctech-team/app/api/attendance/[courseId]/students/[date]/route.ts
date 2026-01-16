import { NextResponse } from "next/server";
import { errorResponse, successResponse } from "@/lib/server-helper";
import { getCourseAttendanceByDate } from "@/backend/controllers/student-attendance.controller";

/* eslint-disable */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string; date: string }> }
) {
  try {
    const { courseId, date } = await params;

    if (!courseId || !date) {
      return NextResponse.json(
        { error: "Course ID and date are required" },
        { status: 400 }
      );
    }

    const records = await getCourseAttendanceByDate(courseId, date);

    return successResponse(records);
  } catch (error: any) {
    console.error(
      "Error in GET /api/attendance/[courseId]/students/[date]:",
      error
    );
    return errorResponse(
      error.message || "Failed to fetch attendance records",
      500
    );
  }
}

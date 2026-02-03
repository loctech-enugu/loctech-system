import { NextRequest, NextResponse } from "next/server";
import { getClassAttendanceByDate } from "@/backend/controllers/class-attendance.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ classId: string; date: string }> }
) {
  try {
    const { classId, date } = await params;
    const attendance = await getClassAttendanceByDate(classId, date);

    return NextResponse.json({
      success: true,
      data: attendance,
    });
  } catch (error: unknown) {
    console.error("Error fetching class attendance:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch attendance";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      {
        status: errorMessage.includes("Forbidden")
          ? 403
          : errorMessage.includes("Unauthorized")
            ? 401
            : 500,
      }
    );
  }
}

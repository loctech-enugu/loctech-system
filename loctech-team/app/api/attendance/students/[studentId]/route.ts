import { NextRequest, NextResponse } from "next/server";
import { getStudentAttendanceHistory } from "@/backend/controllers/class-attendance.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");

    const { studentId } = await params;
    const history = await getStudentAttendanceHistory(
      studentId,
      classId || undefined
    );

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error: unknown) {
    console.error("Error fetching student attendance history:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch attendance history";
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

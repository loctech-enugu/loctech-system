import { NextRequest, NextResponse } from "next/server";
import { getStudentAttendanceHistory } from "@/backend/controllers/class-attendance.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");

    const history = await getStudentAttendanceHistory(
      params.studentId,
      classId || undefined
    );

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    console.error("Error fetching student attendance history:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch attendance history",
      },
      {
        status: error.message?.includes("Forbidden")
          ? 403
          : error.message?.includes("Unauthorized")
          ? 401
          : 500,
      }
    );
  }
}

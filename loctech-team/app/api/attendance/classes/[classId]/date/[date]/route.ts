import { NextRequest, NextResponse } from "next/server";
import { getClassAttendanceByDate } from "@/backend/controllers/class-attendance.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: { classId: string; date: string } }
) {
  try {
    const attendance = await getClassAttendanceByDate(params.classId, params.date);

    return NextResponse.json({
      success: true,
      data: attendance,
    });
  } catch (error: any) {
    console.error("Error fetching class attendance:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch attendance",
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

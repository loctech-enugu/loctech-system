import { NextRequest, NextResponse } from "next/server";
import { getAttendanceMonitoring } from "@/backend/controllers/class-attendance.controller";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const minAbsences = searchParams.get("minAbsences");

    // eslint-disable-next-line
    const filters: any = {};
    if (classId) filters.classId = classId;
    if (minAbsences) filters.minAbsences = parseInt(minAbsences, 10);

    const monitoring = await getAttendanceMonitoring(filters);

    return NextResponse.json({
      success: true,
      data: monitoring,
    });
    // eslint-disable-next-line
  } catch (error: any) {
    console.error("Error fetching attendance monitoring:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch attendance monitoring",
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

import { NextRequest, NextResponse } from "next/server";
import { getAttendanceMonitoring } from "@/backend/controllers/class-attendance.controller";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const minAbsences = searchParams.get("minAbsences");

    const filters: { classId?: string; minAbsences?: number } = {};
    if (classId) filters.classId = classId;
    if (minAbsences) filters.minAbsences = parseInt(minAbsences, 10);

    const monitoring = await getAttendanceMonitoring(filters);

    return NextResponse.json({
      success: true,
      data: monitoring,
    });
  } catch (error: unknown) {
    console.error("Error fetching attendance monitoring:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch attendance monitoring";
    return NextResponse.json(
      { success: false, error: message },
      {
        status: message.includes("Forbidden")
          ? 403
          : message.includes("Unauthorized")
            ? 401
            : 500,
      }
    );
  }
}

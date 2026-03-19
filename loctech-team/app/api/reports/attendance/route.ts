import { NextRequest, NextResponse } from "next/server";
import { exportAttendanceCSV } from "@/backend/controllers/reports.controller";
import { errorResponse } from "@/lib/server-helper";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    if (!classId) throw new Error("classId is required");
    const csv = await exportAttendanceCSV({
      classId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="attendance-${classId}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export attendance error:", error);
    return errorResponse(error instanceof Error ? error.message : "Failed to export", 500);
  }
}

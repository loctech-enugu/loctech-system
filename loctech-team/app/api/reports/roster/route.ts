import { NextRequest, NextResponse } from "next/server";
import { exportCourseRosterCSV } from "@/backend/controllers/reports.controller";
import { errorResponse } from "@/lib/server-helper";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    if (!classId) throw new Error("classId is required");
    const csv = await exportCourseRosterCSV(classId);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="roster-${classId}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export roster error:", error);
    return errorResponse(error instanceof Error ? error.message : "Failed to export", 500);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getTodayClassSession } from "@/backend/controllers/class-attendance.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: { classId: string } }
) {
  try {
    const session = await getTodayClassSession(params.classId);

    return NextResponse.json({
      success: true,
      data: session,
      message: "Class session retrieved successfully",
    });
  } catch (error: any) {
    console.error("Error fetching class session:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch class session",
      },
      {
        status: error.message?.includes("Forbidden")
          ? 403
          : error.message?.includes("not found")
          ? 404
          : 500,
      }
    );
  }
}

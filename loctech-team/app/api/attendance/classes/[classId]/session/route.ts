import { NextRequest, NextResponse } from "next/server";
import { getTodayClassSession } from "@/backend/controllers/class-attendance.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const { classId } = await params;
    const session = await getTodayClassSession(classId);

    return NextResponse.json({
      success: true,
      data: session,
      message: "Class session retrieved successfully",
    });
  } catch (error: unknown) {
    console.error("Error fetching class session:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch class session";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      {
        status: errorMessage.includes("Forbidden")
          ? 403
          : errorMessage.includes("not found")
            ? 404
            : 500,
      }
    );
  }
}

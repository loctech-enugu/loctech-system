import { NextRequest, NextResponse } from "next/server";
import { getTodayClassSession } from "@/backend/controllers/class-attendance.controller";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const { classId } = await params;
    const session = await getTodayClassSession(classId);

    return NextResponse.json({
      success: true,
      data: {
        pin: session.pin,
        classId: session.classId,
        className: session.className,
        expiresAt: session.expiresAt,
      },
      message: "Attendance PIN retrieved successfully",
    });
  } catch (error: unknown) {
    console.error("Error fetching attendance PIN:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch attendance PIN";
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

// Keep POST for backward compatibility
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  return GET(req, { params });
}

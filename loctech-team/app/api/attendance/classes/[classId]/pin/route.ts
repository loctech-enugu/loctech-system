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
      data: {
        pin: session.pin,
        classId: session.classId,
        className: session.className,
        expiresAt: session.expiresAt,
      },
      message: "Attendance PIN retrieved successfully",
    });
  } catch (error: any) {
    console.error("Error fetching attendance PIN:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch attendance PIN",
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

// Keep POST for backward compatibility
export async function POST(
  req: NextRequest,
  { params }: { params: { classId: string } }
) {
  return GET(req, { params });
}

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
        barcode: session.barcode,
        secret: session.secret,
        classId: session.classId,
        className: session.className,
        expiresAt: session.expiresAt,
      },
      message: "Attendance barcode retrieved successfully",
    });
  } catch (error: any) {
    console.error("Error fetching attendance barcode:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch attendance barcode",
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

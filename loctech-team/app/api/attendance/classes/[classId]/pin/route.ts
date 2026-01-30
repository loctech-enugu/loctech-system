import { NextRequest, NextResponse } from "next/server";
import { generateAttendancePIN } from "@/backend/controllers/class-attendance.controller";

export async function POST(
  req: NextRequest,
  { params }: { params: { classId: string } }
) {
  try {
    const result = await generateAttendancePIN(params.classId);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Attendance PIN generated successfully",
    });
  } catch (error: any) {
    console.error("Error generating attendance PIN:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate attendance PIN",
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

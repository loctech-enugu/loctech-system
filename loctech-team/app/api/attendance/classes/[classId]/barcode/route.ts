import { NextRequest, NextResponse } from "next/server";
import { generateAttendanceBarcode } from "@/backend/controllers/class-attendance.controller";

export async function POST(
  req: NextRequest,
  { params }: { params: { classId: string } }
) {
  try {
    const result = await generateAttendanceBarcode(params.classId);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Attendance barcode generated successfully",
    });
  } catch (error: any) {
    console.error("Error generating attendance barcode:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate attendance barcode",
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

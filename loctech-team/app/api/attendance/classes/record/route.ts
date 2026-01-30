import { NextRequest, NextResponse } from "next/server";
import { recordClassAttendance } from "@/backend/controllers/class-attendance.controller";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const attendance = await recordClassAttendance({
      studentId: body.studentId,
      classId: body.classId,
      date: new Date(body.date),
      status: body.status,
      method: body.method,
      pin: body.pin,
      barcode: body.barcode,
    });

    return NextResponse.json({
      success: true,
      data: attendance,
      message: "Attendance recorded successfully",
    });
  } catch (error: any) {
    console.error("Error recording attendance:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to record attendance",
      },
      {
        status: error.message?.includes("Forbidden")
          ? 403
          : error.message?.includes("paused") ||
            error.message?.includes("not enrolled") ||
            error.message?.includes("not active") ||
            error.message?.includes("Invalid")
          ? 400
          : 500,
      }
    );
  }
}

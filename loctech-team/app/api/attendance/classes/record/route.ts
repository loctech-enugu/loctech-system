import { NextRequest, NextResponse } from "next/server";
import { recordClassAttendance } from "@/backend/controllers/class-attendance.controller";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Normalize date to ensure consistent format
    // If date is a string like "2024-01-15", parse it properly
    let dateValue: Date;
    if (typeof body.date === "string") {
      // Parse date string and create date at local midnight
      const dateParts = body.date.split("T")[0].split("-");
      dateValue = new Date(
        parseInt(dateParts[0]),
        parseInt(dateParts[1]) - 1,
        parseInt(dateParts[2])
      );
    } else {
      dateValue = new Date(body.date);
    }

    const attendance = await recordClassAttendance({
      studentId: body.studentId,
      classId: body.classId,
      date: dateValue,
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

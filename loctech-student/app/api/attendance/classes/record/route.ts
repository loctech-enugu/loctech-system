import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { recordClassAttendance } from "@/backend/controllers/class-attendance.controller";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Ensure studentId matches the logged-in student
    if (body.studentId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Cannot record attendance for another student",
        },
        { status: 403 }
      );
    }

    // Normalize date
    let dateValue: Date;
    if (typeof body.date === "string") {
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
            error.message?.includes("Invalid") ||
            error.message?.includes("expired") ||
            error.message?.includes("No active session")
            ? 400
            : 500,
      }
    );
  }
}

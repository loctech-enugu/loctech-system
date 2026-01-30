import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { ClassAttendanceModel } from "@/backend/models/class-attendance.model";

export async function GET(req: NextRequest) {
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

    // Only students can access this
    if (session.user.role !== "student") {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
        },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");

    const filter: Record<string, any> = {
      studentId: session.user.id,
    };

    if (classId) {
      filter.classId = classId;
    }

    const attendanceRecords = await ClassAttendanceModel.find(filter)
      .populate("classId", "name schedule")
      .sort({ date: -1, recordedAt: -1 })
      .lean();

    const formattedRecords = attendanceRecords.map((record: any) => ({
      id: String(record._id),
      studentId: String(record.studentId),
      classId: String(record.classId?._id || record.classId),
      date: (record.date as Date)?.toISOString?.() ?? "",
      status: record.status,
      method: record.method,
      recordedAt: (record.recordedAt as Date)?.toISOString?.() ?? "",
      class: record.classId
        ? {
            id: String(record.classId._id),
            name: record.classId.name,
            schedule: record.classId.schedule,
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: formattedRecords,
    });
  } catch (error: any) {
    console.error("Error fetching student attendance:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch attendance",
      },
      { status: 500 }
    );
  }
}

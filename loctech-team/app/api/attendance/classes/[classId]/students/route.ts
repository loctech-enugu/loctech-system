import { NextResponse } from "next/server";
import {
  getClassAttendanceByDateRange,
  recordClassAttendance,
  updateAttendanceById,
} from "@/backend/controllers/class-attendance.controller";
import { errorResponse, successResponse } from "@/lib/server-helper";

export async function GET(
  request: Request,
  context: { params: Promise<{ classId: string }> }
) {
  try {
    const { classId } = await context.params;

    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start") ?? undefined;
    const end = searchParams.get("end") ?? undefined;

    const records = await getClassAttendanceByDateRange(classId, start, end);
    return successResponse(records);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch attendance";
    return errorResponse(errorMessage, 500);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ classId: string }> }
) {
  try {
    const body = await request.json();
    const record = await recordClassAttendance({
      ...body,
      classId: body.classId,
      date: body.date ? new Date(body.date) : new Date(),
    });
    return NextResponse.json({ success: true, data: record });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create attendance";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ classId: string }> }
) {
  try {
    const body = await request.json();
    const id = body.id as string | undefined;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Attendance record id is required" },
        { status: 400 }
      );
    }
    const record = await updateAttendanceById(id, body);
    return NextResponse.json({ success: true, data: record });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update attendance";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

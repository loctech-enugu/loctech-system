import { NextResponse } from "next/server";
import {
  getAllStudentAttendance,
  createAttendance,
  updateAttendance,
} from "@/backend/controllers/student-attendance.controller";
import { errorResponse, successResponse } from "@/lib/server-helper";
/* eslint-disable */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;

    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start") ?? undefined;
    const end = searchParams.get("end") ?? undefined;

    const records = await getAllStudentAttendance(courseId, start, end);
    return successResponse(records);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch attendance";
    return errorResponse(errorMessage, 500);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const body = await request.json();
    const record = await createAttendance(body);
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
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const body = await request.json();
    const record = await updateAttendance(body);
    return NextResponse.json({ success: true, data: record });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update attendance";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

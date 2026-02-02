import { NextResponse } from "next/server";
import { getClassAttendanceByDateRange } from "@/backend/controllers/class-attendance.controller";
import { errorResponse, successResponse } from "@/lib/server-helper";
/* eslint-disable */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const { classId } = await params;

    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start") ?? undefined;
    const end = searchParams.get("end") ?? undefined;

    const records = await getClassAttendanceByDateRange(classId, start, end);
    return successResponse(records);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const body = await request.json();
    const record = await createAttendance(body);
    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const body = await request.json();
    const record = await updateAttendance(body);
    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

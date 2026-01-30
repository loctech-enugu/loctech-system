import { NextResponse } from "next/server";
import { updateAttendanceById } from "@/backend/controllers/student-attendance.controller";
import { errorResponse, successResponse } from "@/lib/server-helper";

/* eslint-disable */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return errorResponse("Attendance ID is required", 400);
    }

    const record = await updateAttendanceById(id, body);
    return successResponse(record, "Attendance updated successfully");
  } catch (error: any) {
    return errorResponse(
      error.message || "Failed to update attendance",
      500
    );
  }
}

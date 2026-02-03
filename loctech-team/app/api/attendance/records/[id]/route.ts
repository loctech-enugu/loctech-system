import { updateAttendanceById } from "@/backend/controllers/class-attendance.controller";
import { errorResponse, successResponse } from "@/lib/server-helper";

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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update attendance";
    return errorResponse(
      errorMessage,
      errorMessage.includes("Forbidden") ? 403 : 500
    );
  }
}

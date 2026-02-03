import { getStudentEnrollments } from "@/backend/controllers/students.controller";
import { errorResponse, successResponse } from "@/lib/server-helper";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const enrollments = await getStudentEnrollments(id);
    return successResponse(enrollments, "Student enrollments fetched successfully");
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to fetch enrollments",
      error instanceof Error && error.message.includes("Forbidden") ? 403 : 500
    );
  }
}

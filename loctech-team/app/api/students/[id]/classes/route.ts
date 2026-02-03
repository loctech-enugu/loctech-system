import { getStudentClasses } from "@/backend/controllers/students.controller";
import { errorResponse, successResponse } from "@/lib/server-helper";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const classes = await getStudentClasses(id);
    return successResponse(classes, "Student classes fetched successfully");
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to fetch classes",
      error instanceof Error && error.message.includes("Forbidden") ? 403 : 500
    );
  }
}

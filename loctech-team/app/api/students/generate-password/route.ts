import { generatePasswordForStudent } from "@/backend/controllers/students.controller";
import { errorResponse, successResponse } from "@/lib/server-helper";

/**
 * ✅ POST /api/students - Create new student
 */
export async function POST() {
  try {
    const student = await generatePasswordForStudent();

    if (!student) {
      return errorResponse("Failed to create student", 400);
    }

    return successResponse({}, "Student Passwords successfully", 201);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Error creating student",
      500
    );
  }
}

import {
  createStudent,
  getAllStudents,
} from "@/backend/controllers/students.controller";
import { errorResponse, successResponse } from "@/lib/server-helper";

/**
 * ✅ GET /api/students - Fetch all students
 */
export async function GET() {
  try {
    const students = await getAllStudents();
    return successResponse(students, "Students fetched successfully");
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to fetch students",
      500
    );
  }
}

/**
 * ✅ POST /api/students - Create new student
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const student = await createStudent(body);

    if (!student) {
      return errorResponse("Failed to create student", 400);
    }

    return successResponse(student, "Student fetched successfully", 201);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Error creating student",
      500
    );
  }
}

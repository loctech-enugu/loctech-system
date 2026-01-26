import { syncCoursesStudents } from "@/backend/controllers/students.controller";
import { errorResponse, successResponse } from "@/lib/server-helper";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";

/**
 * POST /api/students/sync-courses - Sync courses-students bidirectional relationship
 */
export async function POST() {
  try {
    const session = await getServerSession(authConfig);
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    if (session.user.role !== "admin" && session.user.role !== "super_admin") {
      return errorResponse("Access denied", 403);
    }

    const result = await syncCoursesStudents();

    return successResponse(
      result,
      `Sync completed: ${result.coursesFixed} courses fixed, ${result.studentsFixed} students fixed`
    );
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to sync courses-students",
      500
    );
  }
}

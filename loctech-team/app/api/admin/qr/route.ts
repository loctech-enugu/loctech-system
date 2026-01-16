import { authConfig } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/server-helper";
import { getTodaySession } from "@/lib/session";
import { getServerSession } from "next-auth";

export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    if (!session) return errorResponse("Please login", 401);

    if (session.user.role !== "admin" && session.user.role !== "super_admin") {
      return errorResponse("Access denied", 403);
    }

    const todaySession = await getTodaySession();

    return successResponse(todaySession, "Session fetched successfully");
  } catch (error) {
    console.error(error);
    return errorResponse("Internal server error", 500);
  }
}

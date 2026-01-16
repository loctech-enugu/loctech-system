import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/server-helper";
import { NextRequest } from "next/server";
import { generateReportSummary } from "@/backend/controllers/reports.controller";
/* GET /api/reports → List all reports (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session) return errorResponse("Please login", 401);
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start") ?? undefined;
    const end = searchParams.get("end") ?? undefined;
    console.log(start, end);

    if (session.user.role !== "admin" && session.user.role !== "super_admin") {
      return errorResponse("Access denied", 403);
    }

    if (!start || !end) {
      return errorResponse("Start and end date are required", 400);
    }

    const reports = await generateReportSummary(start, end);
    return successResponse(reports, "Staff report records fetched");
  } catch (error) {
    console.error(error);
    return errorResponse("Internal server error", 500);
  }
}

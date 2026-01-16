import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/server-helper";
import {
  createReport,
  getAllReports,
} from "@/backend/controllers/reports.controller";
import { SlackService } from "@/backend/services/slack.service";
import { buildReportSubmissionBlock } from "@/lib/slack-blocks";
import { NextRequest } from "next/server";

/**
 * GET /api/reports → List all reports (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session) return errorResponse("Please login", 401);

    // if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    //   return errorResponse("Access denied", 403);
    // }

    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start") ?? undefined; // e.g. /api/reports?page=2
    const end = searchParams.get("end") ?? undefined; // e.g. /api/reports?limit=20

    const reports = await getAllReports(start, end);
    return successResponse(reports, "Reports fetched successfully");
  } catch (error) {
    console.error(error);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * POST /api/reports → Staff submits daily report
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session) return errorResponse("Please login", 401);

    if (session.user.role === "super_admin") {
      return errorResponse("Only staff can submit reports", 403);
    }

    const body = await req.json();
    const report = await createReport({
      ...body,
      user: session.user.id, // attach logged in user
    });

    if (!report) return errorResponse("Error creating report", 500);

    await SlackService.sendChannelMessage(
      "#daily-reports",
      buildReportSubmissionBlock(
        session.user.name,
        report.title,
        report.summary ?? undefined
      )
    );

    return successResponse(report, "Report submitted successfully");
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  getAllEmailLogs,
  getEmailStatistics,
} from "@/backend/controllers/email-logs.controller";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const stats = searchParams.get("stats");
    const recipientEmail = searchParams.get("recipientEmail");
    const status = searchParams.get("status");
    const templateId = searchParams.get("templateId");
    const limit = searchParams.get("limit");

    // Return statistics if requested
    if (stats === "true") {
      const statistics = await getEmailStatistics();
      return NextResponse.json({
        success: true,
        data: statistics,
      });
    }

    const filters: any = {};
    if (recipientEmail) filters.recipientEmail = recipientEmail;
    if (status) filters.status = status;
    if (templateId) filters.templateId = templateId;
    if (limit) filters.limit = parseInt(limit, 10);

    const logs = await getAllEmailLogs(filters);

    return NextResponse.json({
      success: true,
      data: logs,
    });
  } catch (error: any) {
    console.error("Error fetching email logs:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch email logs",
      },
      {
        status: error.message?.includes("Forbidden")
          ? 403
          : error.message?.includes("Unauthorized")
          ? 401
          : 500,
      }
    );
  }
}

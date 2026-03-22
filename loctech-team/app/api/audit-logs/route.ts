import { NextRequest, NextResponse } from "next/server";
import { getAuditLogs } from "@/backend/controllers/audit-log.controller";
import { successResponse, errorResponse } from "@/lib/server-helper";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") ?? undefined;
    const action = searchParams.get("action") ?? undefined;
    const resource = searchParams.get("resource") ?? undefined;
    const startDate = searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined;
    const endDate = searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : undefined;
    const result = await getAuditLogs({
      userId,
      action,
      resource,
      startDate,
      endDate,
      limit,
      offset,
    });
    return successResponse(result);
  } catch (error) {
    console.error("Get audit logs error:", error);
    return errorResponse(error instanceof Error ? error.message : "Failed to fetch audit logs", 500);
  }
}

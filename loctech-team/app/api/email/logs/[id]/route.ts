import { NextRequest, NextResponse } from "next/server";
import { getEmailLogById } from "@/backend/controllers/email-logs.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const log = await getEmailLogById(params.id);

    if (!log) {
      return NextResponse.json(
        {
          success: false,
          error: "Email log not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: log,
    });
  } catch (error: any) {
    console.error("Error fetching email log:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch email log",
      },
      {
        status: error.message?.includes("Forbidden")
          ? 403
          : error.message?.includes("not found")
          ? 404
          : 500,
      }
    );
  }
}

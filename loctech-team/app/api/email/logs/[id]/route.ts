import { NextRequest, NextResponse } from "next/server";
import { getEmailLogById } from "@/backend/controllers/email-logs.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const log = await getEmailLogById(id);

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
  } catch (error: unknown) {
    console.error("Error fetching email log:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch email log";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      {
        status: errorMessage.includes("Forbidden")
          ? 403
          : errorMessage.includes("not found")
          ? 404
          : 500,
      }
    );
  }
}

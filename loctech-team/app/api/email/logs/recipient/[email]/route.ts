import { NextRequest, NextResponse } from "next/server";
import { getEmailLogsByRecipient } from "@/backend/controllers/email-logs.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const { email } = await params;
    const logs = await getEmailLogsByRecipient(email);

    return NextResponse.json({
      success: true,
      data: logs,
    });
  } catch (error: unknown) {
    console.error("Error fetching email logs by recipient:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch email logs";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      {
        status: errorMessage.includes("Forbidden")
          ? 403
          : errorMessage.includes("Unauthorized")
          ? 401
          : 500,
      }
    );
  }
}

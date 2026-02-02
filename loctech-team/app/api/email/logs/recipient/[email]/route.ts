import { NextRequest, NextResponse } from "next/server";
import { getEmailLogsByRecipient } from "@/backend/controllers/email-logs.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: { email: string } }
) {
  try {
    const logs = await getEmailLogsByRecipient(params.email);

    return NextResponse.json({
      success: true,
      data: logs,
    });
  } catch (error: any) {
    console.error("Error fetching email logs by recipient:", error);
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

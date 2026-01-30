import { NextRequest, NextResponse } from "next/server";
import { sendAbsenceNotification } from "@/backend/controllers/notifications.controller";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await sendAbsenceNotification(params.id);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Notification email sent successfully",
    });
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to send notification",
      },
      {
        status: error.message?.includes("Forbidden")
          ? 403
          : error.message?.includes("not found")
          ? 404
          : error.message?.includes("already sent")
          ? 400
          : 500,
      }
    );
  }
}
